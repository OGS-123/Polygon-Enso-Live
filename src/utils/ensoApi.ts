import { ethers } from 'ethers';
import { EnsoBundlePayload, EnsoBundleResponse } from '../types/enso';
import { checksumAddressSafe } from './web3';

export function toTokenWei(amount: number | string, decimals: number = 6): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) return '0';
  try {
    // Round to avoid floating point issues
    const fixedStr = num.toFixed(Math.min(decimals, 8));
    return ethers.parseUnits(fixedStr, decimals).toString();
  } catch {
    return Math.floor(num * Math.pow(10, decimals)).toString();
  }
}

export function fromTokenWei(amountWei: string | bigint, decimals: number = 6): string {
  try {
    return ethers.formatUnits(amountWei, decimals);
  } catch {
    return '0';
  }
}

export type GatewayMode = 'auto' | 'direct' | 'proxy';

export function getGatewayMode(): GatewayMode {
  if (typeof window !== 'undefined') {
    const mode = localStorage.getItem('enso_gateway_mode') as GatewayMode;
    if (mode === 'direct' || mode === 'proxy' || mode === 'auto') return mode;
  }
  return 'auto';
}

export function setGatewayMode(mode: GatewayMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('enso_gateway_mode', mode);
  }
}

export function getProxyUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('enso_proxy_url') || '/api/enso';
  }
  return '/api/enso';
}

export function setProxyUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim() && url.trim() !== '/api/enso') {
      localStorage.setItem('enso_proxy_url', url.trim());
    } else {
      localStorage.removeItem('enso_proxy_url');
    }
  }
}

// Sanitize shortcuts: strip zero amountIn and checksum addresses
export function cleanShortcuts(shortcuts: any[]): any[] {
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
          args[key] = checksumAddressSafe(args[key]) || args[key];
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
                cbArgs[key] = checksumAddressSafe(cbArgs[key]) || cbArgs[key];
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

// Direct Enso API call implementation
async function callDirectEnsoApi(
  payload: EnsoBundlePayload,
  apiKey: string
): Promise<{ ok: boolean; status: number; text: string; json: any }> {
  const chainId = payload.chainId || 137;
  const fromAddress = checksumAddressSafe(payload.fromAddress) || payload.fromAddress;
  const receiver = checksumAddressSafe(payload.receiver || fromAddress) || fromAddress;
  const spender = checksumAddressSafe(payload.spender || fromAddress) || fromAddress;
  const routingStrategy = payload.routingStrategy || 'ensowallet-v2';

  const params = new URLSearchParams();
  params.set('chainId', String(chainId));
  params.set('fromAddress', fromAddress);
  if (receiver) params.set('receiver', receiver);
  if (spender) params.set('spender', spender);
  if (routingStrategy) params.set('routingStrategy', routingStrategy);

  const directUrl = `https://api.enso.finance/api/v1/shortcuts/bundle?${params.toString()}`;

  const cleanShortcutsList = cleanShortcuts(payload.shortcuts || []);

  // Call query-param style first with shortcuts array in body
  let res = await fetch(directUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(cleanShortcutsList),
  });

  let text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  // If query-param style was not ok, try full body payload
  if (!res.ok && cleanShortcutsList.length > 0) {
    const fallbackRes = await fetch('https://api.enso.finance/api/v1/shortcuts/bundle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId,
        fromAddress,
        receiver,
        spender,
        routingStrategy,
        shortcuts: cleanShortcutsList,
      }),
    });

    const fallbackText = await fallbackRes.text();
    let fallbackJson: any = null;
    try {
      fallbackJson = JSON.parse(fallbackText);
    } catch {}

    if (fallbackRes.ok) {
      return { ok: true, status: fallbackRes.status, text: fallbackText, json: fallbackJson };
    }
  }

  return { ok: res.ok, status: res.status, text, json };
}

export async function testEnsoConnection(apiKey: string): Promise<{
  success: boolean;
  message: string;
  status: number;
  latencyMs: number;
  gatewayUsed: string;
}> {
  const start = performance.now();
  const gatewayMode = getGatewayMode();
  const proxyUrl = getProxyUrl();

  const dummyPayload: EnsoBundlePayload = {
    chainId: 137,
    fromAddress: '0x000000000000000000000000000000000000dEaD',
    receiver: '0x000000000000000000000000000000000000dEaD',
    spender: '0x000000000000000000000000000000000000dEaD',
    routingStrategy: 'ensowallet-v2',
    shortcuts: [],
  };

  // If direct mode selected, test Enso directly
  if (gatewayMode === 'direct') {
    const directRes = await callDirectEnsoApi(dummyPayload, apiKey);
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: directRes.status < 500,
      message: directRes.ok
        ? 'Direct connection to Enso API successful'
        : `Enso responded (${directRes.status}): ${directRes.text.slice(0, 140)}`,
      status: directRes.status,
      latencyMs,
      gatewayUsed: 'Direct Enso API',
    };
  }

  // Otherwise test proxy
  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(dummyPayload),
    });

    const latencyMs = Math.round(performance.now() - start);
    const text = await res.text();

    if (res.status === 404 && gatewayMode === 'auto') {
      // Auto-fallback to direct API
      const directRes = await callDirectEnsoApi(dummyPayload, apiKey);
      const totalLatency = Math.round(performance.now() - start);
      return {
        success: directRes.status < 500,
        message: directRes.ok
          ? 'Proxy 404 bypassed. Direct Enso API connection active & verified!'
          : `Direct Enso responded (${directRes.status}): ${directRes.text.slice(0, 140)}`,
        status: directRes.status,
        latencyMs: totalLatency,
        gatewayUsed: 'Direct Fallback (Auto)',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'Invalid API Key or unauthorized by Enso Finance',
        status: res.status,
        latencyMs,
        gatewayUsed: proxyUrl,
      };
    }

    return {
      success: res.status < 500,
      message: res.ok
        ? 'Connected successfully to Enso Shortcuts API'
        : `Enso responded (${res.status}): ${text.slice(0, 140)}`,
      status: res.status,
      latencyMs,
      gatewayUsed: proxyUrl,
    };
  } catch (err: any) {
    if (gatewayMode === 'auto') {
      try {
        const directRes = await callDirectEnsoApi(dummyPayload, apiKey);
        return {
          success: directRes.status < 500,
          message: directRes.ok
            ? 'Proxy unavailable. Direct Enso connection succeeded!'
            : `Direct Enso responded (${directRes.status}): ${directRes.text.slice(0, 140)}`,
          status: directRes.status,
          latencyMs: Math.round(performance.now() - start),
          gatewayUsed: 'Direct Fallback (Auto)',
        };
      } catch (directErr: any) {
        return {
          success: false,
          message: directErr?.message || 'Connection failed',
          status: 500,
          latencyMs: Math.round(performance.now() - start),
          gatewayUsed: 'Direct Fallback (Auto)',
        };
      }
    }

    return {
      success: false,
      message: err?.message || 'Connection failed',
      status: 500,
      latencyMs: Math.round(performance.now() - start),
      gatewayUsed: proxyUrl,
    };
  }
}

export async function buildEnsoBundle(
  payload: EnsoBundlePayload,
  apiKey: string
): Promise<EnsoBundleResponse> {
  const cleanPayload: EnsoBundlePayload = {
    ...payload,
    fromAddress: checksumAddressSafe(payload.fromAddress) || payload.fromAddress,
    receiver: checksumAddressSafe(payload.receiver || payload.fromAddress) || payload.fromAddress,
    spender: checksumAddressSafe(payload.spender || payload.fromAddress) || payload.fromAddress,
    shortcuts: cleanShortcuts(payload.shortcuts || []),
  };

  const gatewayMode = getGatewayMode();
  const proxyUrl = getProxyUrl();

  // If direct mode selected
  if (gatewayMode === 'direct') {
    const directRes = await callDirectEnsoApi(cleanPayload, apiKey);
    if (!directRes.ok) {
      let errMsg = directRes.json?.message || directRes.json?.error || directRes.text || `Enso API Error (Status ${directRes.status})`;
      if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
      else if (typeof errMsg === 'object') errMsg = JSON.stringify(errMsg);
      throw new Error(String(errMsg));
    }
    return directRes.json as EnsoBundleResponse;
  }

  // Try proxy first
  let res: Response | null = null;
  let text = '';
  let json: any = null;

  try {
    res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(cleanPayload),
    });

    text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  } catch (netErr: any) {
    if (gatewayMode === 'auto') {
      console.warn('Proxy fetch failed, falling back to direct Enso API:', netErr);
      const directRes = await callDirectEnsoApi(cleanPayload, apiKey);
      if (!directRes.ok) {
        let errMsg = directRes.json?.message || directRes.json?.error || directRes.text || `Enso API Error (Status ${directRes.status})`;
        if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
        else if (typeof errMsg === 'object') errMsg = JSON.stringify(errMsg);
        throw new Error(String(errMsg));
      }
      return directRes.json as EnsoBundleResponse;
    }
    throw netErr;
  }

  // If proxy returned 404 (e.g. Vercel static hosting issue), auto-fallback to direct Enso API
  if (res.status === 404 && gatewayMode === 'auto') {
    console.log('Proxy returned 404. Attempting automatic fallback to Direct Enso API...');
    const directRes = await callDirectEnsoApi(cleanPayload, apiKey);
    if (!directRes.ok) {
      let errMsg = directRes.json?.message || directRes.json?.error || directRes.text || `Enso API Error (Status ${directRes.status})`;
      if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
      else if (typeof errMsg === 'object') errMsg = JSON.stringify(errMsg);
      throw new Error(String(errMsg));
    }
    return directRes.json as EnsoBundleResponse;
  }

  if (!res.ok) {
    let errMsg = json?.message || json?.error || text || `Enso API Error (Status ${res.status})`;
    if (Array.isArray(errMsg)) {
      errMsg = errMsg.join(', ');
    } else if (typeof errMsg === 'object') {
      errMsg = JSON.stringify(errMsg);
    }
    throw new Error(String(errMsg));
  }

  return json as EnsoBundleResponse;
}

export function generateCurlSnippet(payload: EnsoBundlePayload, apiKey: string): string {
  const host = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return `curl -X POST "${host}/api/enso" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_ENSO_API_KEY'}" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}

export function generateDirectCurlSnippet(payload: EnsoBundlePayload, apiKey: string): string {
  const chainId = payload.chainId || 137;
  const fromAddress = payload.fromAddress;
  return `curl -X POST "https://api.enso.finance/api/v1/shortcuts/bundle?chainId=${chainId}&fromAddress=${fromAddress}&routingStrategy=ensowallet-v2" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_ENSO_API_KEY'}" \\
  -d '${JSON.stringify(payload.shortcuts, null, 2)}'`;
}

export function generateNodeFallbackScript(payload: EnsoBundlePayload, apiKey: string): string {
  return `/**
 * Polygon Enso Live - Direct Execution Script
 * Requirements: npm install ethers
 */
import { ethers } from "ethers";

const ENSO_API_KEY = process.env.ENSO_API_KEY || "${apiKey || 'YOUR_ENSO_API_KEY'}";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // your polygon wallet private key
const RPC_URL = process.env.POLYGON_RPC || "https://polygon-rpc.com";

const bundlePayload = ${JSON.stringify(payload, null, 2)};

async function main() {
  if (!PRIVATE_KEY) {
    console.error("Please export PRIVATE_KEY=0x...");
    process.exit(1);
  }

  console.log("1. Requesting bundle transaction from Enso Shortcuts API...");
  const ensoRes = await fetch("https://api.enso.finance/api/v1/shortcuts/bundle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${ENSO_API_KEY}\`,
    },
    body: JSON.stringify(bundlePayload),
  });

  if (!ensoRes.ok) {
    const errorText = await ensoRes.text();
    throw new Error(\`Enso error (\${ensoRes.status}): \${errorText}\`);
  }

  const { tx } = await ensoRes.json();
  if (!tx || !tx.data || tx.data.length < 10) {
    throw new Error("Invalid transaction returned by Enso: " + JSON.stringify(tx));
  }

  console.log("2. Bundle built successfully!");
  console.log("   Target Contract:", tx.to);
  console.log("   Data Length:", tx.data.length, "bytes");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("3. Sending transaction from", wallet.address);
  const transaction = await wallet.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value || 0,
    gasLimit: tx.gas || 2500000,
  });

  console.log("4. Broadcasted! Tx Hash:", transaction.hash);
  console.log("   View on Polygonscan: https://polygonscan.com/tx/" + transaction.hash);

  const receipt = await transaction.wait(1);
  console.log("5. Confirmed in block", receipt.blockNumber, "Status:", receipt.status === 1 ? "SUCCESS" : "REVERTED");
}

main().catch(console.error);
`;
}
