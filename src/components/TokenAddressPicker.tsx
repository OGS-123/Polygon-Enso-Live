import React from 'react';
import { Layers, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { POLYGON_TOKENS, POLYGON_PROTOCOLS } from '../constants/tokens';
import { isValidAddress, checksumAddressSafe } from '../utils/web3';

interface TokenAddressPickerProps {
  flashToken: string;
  setFlashToken: (val: string) => void;
  collToken: string;
  setCollToken: (val: string) => void;
  aavePool: string;
  setAavePool: (val: string) => void;
  uniPool: string;
  setUniPool: (val: string) => void;
  walletAddress: string;
  setWalletAddress: (val: string) => void;
  connectedWallet?: string | null;
}

export const TokenAddressPicker: React.FC<TokenAddressPickerProps> = ({
  flashToken,
  setFlashToken,
  collToken,
  setCollToken,
  aavePool,
  setAavePool,
  uniPool,
  setUniPool,
  walletAddress,
  setWalletAddress,
  connectedWallet,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Polygon Contract Addresses</h2>
        </div>
        <span className="text-[11px] text-slate-400">All addresses EIP-55 checksummed</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Flashloan Token */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300">
              Flashloan Token (tokenIn)
            </label>
            <div className="flex gap-1">
              {POLYGON_TOKENS.slice(0, 3).map((t) => (
                <button
                  key={t.symbol}
                  type="button"
                  onClick={() => setFlashToken(t.address)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    flashToken.toLowerCase() === t.address.toLowerCase()
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1d2e] text-slate-400 hover:text-white'
                  }`}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={flashToken}
              onChange={(e) => setFlashToken(e.target.value)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-8"
              placeholder="0x..."
            />
            <button
              type="button"
              onClick={() => copyToClipboard(flashToken, 'ft')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              {copiedKey === 'ft' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collateral Token */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300">
              Collateral Token (tokenOut)
            </label>
            <div className="flex gap-1">
              {POLYGON_TOKENS.slice(0, 3).map((t) => (
                <button
                  key={t.symbol}
                  type="button"
                  onClick={() => setCollToken(t.address)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    collToken.toLowerCase() === t.address.toLowerCase()
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1d2e] text-slate-400 hover:text-white'
                  }`}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={collToken}
              onChange={(e) => setCollToken(e.target.value)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-8"
              placeholder="0x..."
            />
            <button
              type="button"
              onClick={() => copyToClipboard(collToken, 'ct')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              {copiedKey === 'ct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Aave V3 Pool */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300">
              Aave V3 Pool (Polygon)
            </label>
            <button
              type="button"
              onClick={() => setAavePool(POLYGON_PROTOCOLS.aaveV3Pool.address)}
              className="text-[10px] text-purple-400 hover:text-purple-300"
            >
              Reset Default
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={aavePool}
              onChange={(e) => setAavePool(e.target.value)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-8"
              placeholder="0x..."
            />
            <button
              type="button"
              onClick={() => copyToClipboard(aavePool, 'aave')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              {copiedKey === 'aave' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Uniswap V3 Pool */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300">
              Uniswap V3 Pool (Flashloan Provider)
            </label>
            <button
              type="button"
              onClick={() => setUniPool(POLYGON_PROTOCOLS.uniswapV3UsdcUsdtPool.address)}
              className="text-[10px] text-purple-400 hover:text-purple-300"
            >
              USDC.e/USDT (0.05%)
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={uniPool}
              onChange={(e) => setUniPool(e.target.value)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-8"
              placeholder="0x..."
            />
            <button
              type="button"
              onClick={() => copyToClipboard(uniPool, 'uni')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              {copiedKey === 'uni' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Receiver / Wallet Address */}
        <div className="space-y-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Signer &amp; Receiver Address (fromAddress / receiver / spender)</span>
              {walletAddress && isValidAddress(walletAddress) && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </label>
            {connectedWallet && (
              <button
                type="button"
                onClick={() => setWalletAddress(connectedWallet)}
                className="text-[10px] text-purple-400 hover:text-purple-300"
              >
                Use Connected Wallet
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className={`w-full bg-[#0a0b12] border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none pr-8 ${
                walletAddress && !isValidAddress(walletAddress)
                  ? 'border-amber-600 focus:border-amber-500'
                  : 'border-[#262a3f] focus:border-purple-500'
              }`}
              placeholder="0x..."
            />
            <button
              type="button"
              onClick={() => copyToClipboard(walletAddress, 'wallet')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              {copiedKey === 'wallet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {walletAddress && !isValidAddress(walletAddress) && (
            <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Please enter a valid 42-character EVM address</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
