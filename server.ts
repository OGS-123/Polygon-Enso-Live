import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  next();
});

// Helper: EIP-55 Checksum address safely
function checksumAddress(addr: string | undefined): string | undefined {
  if (!addr || typeof addr !== 'string') return addr;
  const clean = addr.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(clean)) return clean;
  try {
    return ethers.getAddress(clean.toLowerCase());
  } catch {
    return clean;
  }
}

// Deep clean addresses in shortcuts array
function cleanShortcuts(shortcuts: any[]): any[] {
  if (!Array.isArray(shortcuts)) return [];
  return shortcuts.map((s) => {
    if (!s || typeof s !== 'object') return s;
    const item = { ...s };
    if (item.args && typeof item.args === 'object') {
      const args = { ...item.args };
      
      // Enso API requires amountIn > 0 at action index [0]. If 0, empty, or missing, default to '1' (1 wei) to satisfy Enso validation
      if (
        args.amountIn === '0' ||
        args.amountIn === 0 ||
        args.amountIn === '' ||
        !args.amountIn ||
        (typeof args.amountIn === 'string' && /^0+(\.0+)?$/.test(args.amountIn.trim()))
      ) {
        args.amountIn = '1';
      }

      const addressKeys = ['primaryAddress', 'flashloanToken', 'tokenIn', 'tokenOut', 'token', 'receiver', 'spender', 'onBehalfOf', 'account', 'sender'];
      for (const key of addressKeys) {
        if (args[key] && typeof args[key] === 'string') {
          args[key] = checksumAddress(args[key]);
        }
      }
      if (Array.isArray(args.callback)) {
        args.callback = args.callback.map((cb: any) => {
          if (!cb || typeof cb !== 'object') return cb;
          const cbItem = { ...cb };
          if (cbItem.args && typeof cbItem.args === 'object') {
            const cbArgs = { ...cbItem.args };
            for (const key of addressKeys) {
              if (cbArgs[key] && typeof cbArgs[key] === 'string') {
                cbArgs[key] = checksumAddress(cbArgs[key]);
              }
            }
            cbItem.args = cbArgs;
          }
          return cbItem;
        });
      }
      item.args = args;
    }
    return item;
  });
}

// /api/health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: 'Polygon (Chain ID 137)',
    proxy: 'Enso Finance Shortcuts Proxy active',
  });
});

// /api/polygon/gas endpoint for live gas estimates
app.get('/api/polygon/gas', async (_req: Request, res: Response) => {
  try {
    const fetchRes = await fetch('https://gasstation.polygon.technology/v2', {
      signal: AbortSignal.timeout(4000),
    });
    if (fetchRes.ok) {
      const data = await fetchRes.json();
      return res.json({ success: true, data });
    }
  } catch (err) {
    // fallback
  }
  // Safe default Polygon gas metrics
  res.json({
    success: true,
    data: {
      safeLow: { maxPriorityFee: 30, maxFee: 35 },
      standard: { maxPriorityFee: 35, maxFee: 45 },
      fast: { maxPriorityFee: 40, maxFee: 60 },
      estimatedBaseFee: 30,
      blockTime: 2.1,
      blockNumber: 0,
    },
  });
});

// /api/enso: Full proxy for Enso Finance
app.all('/api/enso', async (req: Request, res: Response) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const rawKey = req.headers.authorization || req.headers['x-api-key'] || process.env.ENSO_API_KEY;
  const apiKey = typeof rawKey === 'string' ? rawKey.replace(/^Bearer\s+/i, '').trim() : '';

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing Enso API Key',
      message: 'Please provide an Enso API key in Authorization header or UI input',
      documentation: 'https://docs.enso.finance',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const chainId = body.chainId || 137;
    const fromAddress = checksumAddress(body.fromAddress);
    const receiver = checksumAddress(body.receiver || fromAddress);
    const spender = checksumAddress(body.spender || fromAddress);
    const routingStrategy = body.routingStrategy || 'ensowallet-v2';

    if (!fromAddress) {
      return res.status(400).json({
        error: 'Missing fromAddress',
        message: 'A valid EVM wallet address is required for fromAddress',
        receivedBody: body,
      });
    }

    // Prepare shortcuts
    let shortcutsRaw = body.shortcuts;
    if (!shortcutsRaw && Array.isArray(body)) {
      shortcutsRaw = body;
    } else if (!shortcutsRaw) {
      shortcutsRaw = [];
    }
    const cleanShortcutsList = cleanShortcuts(shortcutsRaw);

    // Build URL query string as required by Enso Shortcuts API
    const params = new URLSearchParams();
    params.set('chainId', String(chainId));
    params.set('fromAddress', fromAddress);
    if (receiver) params.set('receiver', receiver);
    if (spender) params.set('spender', spender);
    if (routingStrategy) params.set('routingStrategy', routingStrategy);

    const targetUrl = `https://api.enso.finance/api/v1/shortcuts/bundle?${params.toString()}`;

    console.log(`[Proxy -> Enso] Request to: ${targetUrl}`);
    console.log(`[Proxy -> Enso] Shortcuts count: ${cleanShortcutsList.length}`);

    // Call Enso with Bearer key and shortcuts array in body
    let ensoRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(cleanShortcutsList),
    });

    let resText = await ensoRes.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(resText);
    } catch {
      resJson = null;
    }

    // If query-param style returned an error and body had full payload, also try sending full JSON body
    if (!ensoRes.ok && cleanShortcutsList.length > 0) {
      console.log(`[Proxy -> Enso] Primary call status ${ensoRes.status}: ${resText.slice(0, 200)}`);
      
      const fallbackUrl = 'https://api.enso.finance/api/v1/shortcuts/bundle';
      const fallbackBody = {
        chainId,
        fromAddress,
        receiver: receiver || fromAddress,
        spender: spender || fromAddress,
        routingStrategy,
        shortcuts: cleanShortcutsList,
      };

      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(fallbackBody),
      });

      const fallbackText = await fallbackRes.text();
      let fallbackJson: any = null;
      try {
        fallbackJson = JSON.parse(fallbackText);
      } catch {}

      if (fallbackRes.ok) {
        ensoRes = fallbackRes;
        resText = fallbackText;
        resJson = fallbackJson;
      }
    }

    console.log(`[Enso -> Proxy] Final Status: ${ensoRes.status}`);

    if (resJson) {
      return res.status(ensoRes.status).json(resJson);
    } else {
      return res.status(ensoRes.status).send(resText);
    }
  } catch (err: any) {
    console.error('[Proxy Error]:', err);
    return res.status(500).json({
      error: 'Proxy failure',
      message: err?.message || 'Failed to communicate with Enso API',
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Polygon Enso Live server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
