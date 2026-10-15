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

export async function testEnsoConnection(apiKey: string): Promise<{ success: boolean; message: string; status: number; latencyMs: number }> {
  const start = performance.now();
  try {
    const dummyPayload = {
      chainId: 137,
      fromAddress: '0x000000000000000000000000000000000000dEaD',
      receiver: '0x000000000000000000000000000000000000dEaD',
      spender: '0x000000000000000000000000000000000000dEaD',
      routingStrategy: 'ensowallet-v2',
      shortcuts: [],
    };

    const res = await fetch('/api/enso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(dummyPayload),
    });

    const latencyMs = Math.round(performance.now() - start);
    const text = await res.text();

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'Invalid API Key or unauthorized by Enso Finance',
        status: res.status,
        latencyMs,
      };
    }

    // 200 or 400 with valid Enso JSON error response confirms API endpoint communication
    return {
      success: res.status < 500,
      message: res.ok
        ? 'Connected successfully to Enso Shortcuts API'
        : `Enso responded (${res.status}): ${text.slice(0, 140)}`,
      status: res.status,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Connection failed',
      status: 500,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}

export async function buildEnsoBundle(
  payload: EnsoBundlePayload,
  apiKey: string
): Promise<EnsoBundleResponse> {
  const cleanPayload = {
    ...payload,
    fromAddress: checksumAddressSafe(payload.fromAddress),
    receiver: checksumAddressSafe(payload.receiver || payload.fromAddress),
    spender: checksumAddressSafe(payload.spender || payload.fromAddress),
  };

  const res = await fetch('/api/enso', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(cleanPayload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
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
