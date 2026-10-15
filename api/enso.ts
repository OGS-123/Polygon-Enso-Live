import { ethers } from 'ethers';

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

      const addressKeys = [
        'primaryAddress',
        'flashloanToken',
        'tokenIn',
        'tokenOut',
        'token',
        'receiver',
        'spender',
        'onBehalfOf',
        'account',
        'sender',
      ];
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

export default async function handler(req: any, res: any) {
  // CORS Headers for Vercel Serverless
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const rawKey =
    req.headers.authorization ||
    req.headers['x-api-key'] ||
    process.env.ENSO_API_KEY;
  const apiKey =
    typeof rawKey === 'string' ? rawKey.replace(/^Bearer\s+/i, '').trim() : '';

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

    if (!body || Object.keys(body).length === 0) {
      if (req.text) {
        const raw = await req.text();
        try {
          body = JSON.parse(raw);
        } catch {
          body = {};
        }
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

    // Fallback if needed
    if (!ensoRes.ok && cleanShortcutsList.length > 0) {
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

    if (resJson) {
      return res.status(ensoRes.status).json(resJson);
    } else {
      return res.status(ensoRes.status).send(resText);
    }
  } catch (err: any) {
    return res.status(500).json({
      error: 'Proxy failure',
      message: err?.message || 'Failed to communicate with Enso API',
    });
  }
}
