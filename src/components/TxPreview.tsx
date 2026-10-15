import React, { useState } from 'react';
import { Send, FileCode, Check, Copy, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';
import { EnsoBundleResponse } from '../types/enso';

interface TxPreviewProps {
  bundleResponse: EnsoBundleResponse | null;
  isBuilding: boolean;
  isSending: boolean;
  onBuildBundle: () => void;
  onSendTx: () => void;
  txHash: string | null;
  walletConnected: boolean;
  canSend: boolean;
  totalCollateral?: number;
  totalDebt?: number;
  netEquity?: number;
  healthFactor?: number;
  collTokenSymbol?: string;
  debtTokenSymbol?: string;
  isZeroCapital?: boolean;
}

export const TxPreview: React.FC<TxPreviewProps> = ({
  bundleResponse,
  isBuilding,
  isSending,
  onBuildBundle,
  onSendTx,
  txHash,
  walletConnected,
  canSend,
  totalCollateral,
  totalDebt,
  netEquity,
  healthFactor,
  collTokenSymbol = 'USDT',
  debtTokenSymbol = 'USDC',
  isZeroCapital = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullData, setShowFullData] = useState(false);

  const tx = bundleResponse?.tx;
  const hasValidTx = !!(tx && tx.data && tx.data.length > 20 && tx.data !== '0x');

  const copyPayload = () => {
    if (!bundleResponse) return;
    navigator.clipboard.writeText(JSON.stringify(bundleResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-4">
      {/* Action Header with Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>Bundle Transaction Preview</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {hasValidTx
              ? `Generated transaction ready (${Math.round(tx.data.length / 2)} bytes)`
              : 'Build bundle to generate executable transaction'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBuildBundle}
            disabled={isBuilding}
            className="px-5 py-2.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>{isBuilding ? 'Building via /api/enso...' : '1. Build Bundle'}</span>
          </button>

          <button
            type="button"
            onClick={onSendTx}
            disabled={!canSend || isSending}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              canSend && !isSending
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 cursor-pointer'
                : 'bg-[#1b1e2c] text-slate-500 cursor-not-allowed border border-[#282d43]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Confirming in Wallet...' : '2. Send Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Position Equity & General Difference Status Bar */}
      {netEquity !== undefined && (
        <div className="bg-[#0b141f] border border-[#1e2a44] rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-200">
              Net Equity Difference (&Delta;):{' '}
              <strong className="text-emerald-300 font-mono">
                +{netEquity.toFixed(4)} {collTokenSymbol}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>
              Total Collateral: <strong className="text-sky-300">{totalCollateral?.toFixed(4)}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Total Debt: <strong className="text-amber-300">{totalDebt?.toFixed(4)}</strong>
            </span>
            {healthFactor !== undefined && (
              <>
                <span>&bull;</span>
                <span>
                  HF: <strong className="text-emerald-400">{healthFactor}</strong>
                </span>
              </>
            )}
            <span>&bull;</span>
            <span className="text-purple-300 font-sans font-semibold">
              {isZeroCapital ? '$0 Upfront Capital' : 'Wallet Funded'}
            </span>
          </div>
        </div>
      )}

      {/* Broadcast Success Banner */}
      {txHash && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-lg p-3 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Transaction broadcasted to Polygon! Hash:{' '}
              <span className="font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
            </span>
          </div>
          <a
            href={`https://polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 shrink-0"
          >
            Polygonscan <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Safety Guard Warning if Data is 0x */}
      {tx && (!tx.data || tx.data.length < 20 || tx.data === '0x') && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-xs text-red-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            Safety Lock: Calldata returned is empty (0x). Transaction sending blocked to protect funds.
          </span>
        </div>
      )}

      {/* Transaction Details Box */}
      {tx ? (
        <div className="bg-[#0a0b12] border border-[#21253a] rounded-lg p-3.5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1c2032]">
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <div>
                Target: <span className="text-purple-300 font-semibold">{tx.to}</span>
              </div>
              {tx.value && (
                <div>
                  Value: <span className="text-slate-200">{tx.value} wei</span>
                </div>
              )}
              <div>
                Data Size:{' '}
                <span className="text-slate-200">{Math.round(tx.data.length / 2)} bytes</span>
              </div>
            </div>
            <button
              type="button"
              onClick={copyPayload}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-sans"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between font-sans">
              <span>Calldata (ABI Encoded Function Call)</span>
              <button
                type="button"
                onClick={() => setShowFullData(!showFullData)}
                className="text-purple-400 hover:text-purple-300 text-[10px]"
              >
                {showFullData ? 'Truncate' : 'View Full Calldata'}
              </button>
            </div>
            <div className="bg-[#06070a] border border-[#171a28] p-2.5 rounded text-[11px] text-slate-300 break-all max-h-36 overflow-y-auto leading-relaxed">
              {showFullData ? tx.data : `${tx.data.slice(0, 180)}... [${tx.data.length - 180} more characters]`}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0b12] border border-[#1c2032] rounded-lg p-6 text-center text-xs text-slate-500 font-mono">
          Bundle not generated yet. Configure parameters above and click "1. Build Bundle".
        </div>
      )}
    </div>
  );
};
