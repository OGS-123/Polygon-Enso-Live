import React from 'react';
import { Wallet, Key, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WalletState } from '../utils/web3';

interface HeaderProps {
  walletState: WalletState;
  onConnectWallet: () => void;
  onSwitchPolygon: () => void;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  activeTab: 'builder' | 'inspector' | 'export';
  setActiveTab: (tab: 'builder' | 'inspector' | 'export') => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  onConnectWallet,
  onSwitchPolygon,
  hasApiKey,
  onOpenApiKeyModal,
  activeTab,
  setActiveTab,
}) => {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b border-[#1f2233] bg-[#0c0d14]/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-sm shadow-purple-900/50">
            Ω
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-tight">
              Polygon Enso Live
            </span>
            <span className="text-[11px] text-slate-400 block font-normal">
              DeFi Flashloans &amp; Shortcuts Engine
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#141622] border border-[#23273c] rounded-lg">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'builder'
                ? 'bg-[#262b42] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flashloan Builder
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'bg-[#262b42] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bundle Inspector
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-[#262b42] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Script &amp; cURL Export
          </button>
        </nav>

        {/* Zone 3: Actions & Wallet */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Enso API Key Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              hasApiKey
                ? 'bg-[#141b2a] border-emerald-800/60 text-emerald-300 hover:bg-[#1a2337]'
                : 'bg-[#201726] border-purple-800/60 text-purple-300 hover:bg-[#2c1d37]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasApiKey ? 'Enso Key Active' : 'Set Enso Key'}
            </span>
          </button>

          {/* Network Switcher (if connected to non-polygon) */}
          {walletState.isConnected && !walletState.isPolygon && (
            <button
              onClick={onSwitchPolygon}
              className="px-2.5 py-1.5 text-xs font-medium rounded bg-amber-950/60 border border-amber-700/60 text-amber-200 hover:bg-amber-900/60 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Switch to Polygon</span>
            </button>
          )}

          {/* Connected Network Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141622] border border-[#23273c] rounded text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Polygon PoS (137)</span>
          </div>

          {/* Connect Wallet Button */}
          {walletState.isConnected && walletState.address ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171a28] border border-[#262b42] rounded-lg">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {walletState.polBalance} POL
                </span>
                <span className="text-xs font-medium text-purple-200 font-mono">
                  {formatAddress(walletState.address)}
                </span>
              </div>
              <button
                onClick={onConnectWallet}
                title="Change or refresh wallet"
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
