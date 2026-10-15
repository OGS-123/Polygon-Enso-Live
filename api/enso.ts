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
      
      if ((item.protocol === 'uniswap-v3' || item.protocol === 'aave-v3') && item.action === 'flashloan') {
        // Enso requires tokenIn, amountIn to be arrays
        const rawToken = args.tokenIn || args.flashloanToken || args.primaryAddress;
        if (Array.isArray(rawToken)) {
          args.tokenIn = rawToken.map((t: any) => checksumAddress(String(t)));
        } else if (rawToken && typeof rawToken === 'string') {
          args.tokenIn = [checksumAddress(rawToken)];
        } else {
          args.tokenIn = [checksumAddress('0xc2132D05D31c914a87C6611C10748AEb04B58e8F')];
        }

        const rawAmount = args.amountIn || args.flashloanAmount;
        if (Array.isArray(rawAmount)) {
          args.amountIn = rawAmount.map((a: any) => {
            const s = String(a).trim();
            return (!s || s === '0' || /^0+(\.0+)?$/.test(s)) ? (args.flashloanAmount ? String(args.flashloanAmount) : '1') : s;
          });
        } else if (rawAmount !== undefined && rawAmount !== null) {
          const s = String(rawAmount).trim();
          const amt = (!s || s === '0' || /^0+(\.0+)?$/.test(s)) ? (args.flashloanAmount ? String(args.flashloanAmount) : '1') : s;
          args.amountIn = [amt];
        } else {
          args.amountIn = [args.flashloanAmount ? String(args.flashloanAmount) : '1'];
        }

        while (args.amountIn.length < args.tokenIn.length) {
          args.amountIn.push(args.amountIn[0] || '1');
        }

        // Enso rule: "provide either amountIn or tokenId for tokenIn, not both".
        // For ERC20 flashloans, amountIn is required and tokenId must NOT be sent.
        if (args.amountIn && args.amountIn.length > 0) {
          delete args.tokenId;
        }

        // If receiver was passed for a flashloan that has callbacks, strip it
        // so the executing Enso Wallet contract retains the flashloaned tokens for the callback deposits
        if (args.receiver && args.callback && Array.isArray(args.callback) && args.callback.length > 0) {
          delete args.receiver;
        }

        if (item.protocol === 'aave-v3') {
          args.primaryAddress = checksumAddress(args.primaryAddress || '0x794a61358d6845594f94DC1db02A00b6d43b35c2');
        } else {
          // uniswap-v3: ensure primaryAddress contains borrowed token
          const currentPool = (args.primaryAddress || '').toLowerCase();
          const borrowedToken = (args.tokenIn[0] || '').toLowerCase();
          if (
            currentPool === '0x45dda9cb7c25131df268515131f647d726f50608' &&
            borrowedToken === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
          ) {
            args.primaryAddress = checksumAddress('0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D');
          } else if (!args.primaryAddress) {
            args.primaryAddress = checksumAddress('0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D');
          } else {
            args.primaryAddress = checksumAddress(args.primaryAddress);
          }

          if (args.tokenOut && typeof args.tokenOut === 'string') {
            args.tokenOut = checksumAddress(args.tokenOut);
          } else if (!args.tokenOut && args.tokenIn && args.tokenIn[0]) {
            args.tokenOut = args.tokenIn[0];
          }

          if (!args.amountOut && args.amountIn && args.amountIn[0]) {
            args.amountOut = args.amountIn[0];
          }
        }
      } else {
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

        // If non-Aave and non-flashloan shortcut has identical tokenIn and tokenOut, remove them to prevent router error
        if (
          item.protocol !== 'aave-v3' &&
          args.tokenIn &&
          args.tokenOut &&
          typeof args.tokenIn === 'string' &&
          typeof args.tokenOut === 'string' &&
          args.tokenIn.toLowerCase() === args.tokenOut.toLowerCase()
        ) {
          delete args.tokenIn;
          delete args.tokenOut;
        }

        if (args.tokenIn && typeof args.tokenIn === 'string') {
          args.tokenIn = checksumAddress(args.tokenIn);
        }
        if (args.tokenOut && typeof args.tokenOut === 'string') {
          args.tokenOut = checksumAddress(args.tokenOut);
        }
      }

      const addressKeys = [
        'primaryAddress',
        'flashloanToken',
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

            // If callback route has identical tokenIn and tokenOut, convert to balance check to prevent DEX route failure
            if (
              cbItem.protocol === 'enso' &&
              cbItem.action === 'route' &&
              cbArgs.tokenIn &&
              cbArgs.tokenOut &&
              typeof cbArgs.tokenIn === 'string' &&
              typeof cbArgs.tokenOut === 'string' &&
              cbArgs.tokenIn.toLowerCase() === cbArgs.tokenOut.toLowerCase()
            ) {
              cbItem.action = 'balance';
              cbItem.args = { token: checksumAddress(cbArgs.tokenIn) };
              return cbItem;
            }

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

    const hasFlashloan = cleanShortcutsList.length > 0 && cleanShortcutsList[0]?.action === 'flashloan';
    const ENSO_ROUTER = '0xC914A663837Eb21c5a650716E015659686597E55';

    // For zero-capital / flashloans, receiver and spender must be Enso Router (0xC914A663837Eb21c5a650716E015659686597E55)
    // to prevent Enso from attempting upfront ERC20 transferFrom on the user's empty wallet
    let receiver = checksumAddress(body.receiver);
    let spender = checksumAddress(body.spender);

    if (hasFlashloan) {
      if (!receiver || receiver.toLowerCase() === fromAddress.toLowerCase()) {
        receiver = ENSO_ROUTER;
      }
      if (!spender || spender.toLowerCase() === fromAddress.toLowerCase()) {
        spender = ENSO_ROUTER;
      }
    } else {
      receiver = receiver || fromAddress;
      spender = spender || fromAddress;
    }

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
      const fallbackBody: any = {
        chainId,
        fromAddress,
        receiver,
        spender,
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
