import React, { useState } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, X, ExternalLink, Zap, Globe, Shield, RefreshCw } from 'lucide-react';
import { testEnsoConnection, getGatewayMode, setGatewayMode, getProxyUrl, setProxyUrl, GatewayMode } from '../utils/ensoApi';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  onLog: (level: 'info' | 'success' | 'warn' | 'error', message: string, data?: any) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  onLog,
}) => {
  const [inputVal, setInputVal] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [gatewayMode, setGatewayModeState] = useState<GatewayMode>(getGatewayMode());
  const [proxyUrlVal, setProxyUrlVal] = useState<string>(getProxyUrl());
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
    gatewayUsed?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const clean = inputVal.trim();
    onSaveKey(clean);
    setGatewayMode(gatewayMode);
    setProxyUrl(proxyUrlVal);
    onLog('success', `API Key saved (Length: ${clean.length} chars, Gateway: ${gatewayMode})`);
    setTestResult(null);
    onClose();
  };

  const handleTest = async () => {
    const keyToTest = inputVal.trim() || apiKey;
    if (!keyToTest) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Please enter an Enso API key to test.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    onLog('info', `Testing connection to Enso API via ${gatewayMode} gateway...`);

    // Temporarily save current gateway selection for test
    setGatewayMode(gatewayMode);
    setProxyUrl(proxyUrlVal);

    const res = await testEnsoConnection(keyToTest);
    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs,
      gatewayUsed: res.gatewayUsed,
    });

    if (res.success) {
      onLog('success', `Enso API test passed (${res.latencyMs}ms via ${res.gatewayUsed}): ${res.message}`);
    } else {
      onLog('warn', `Enso API test returned status ${res.status}: ${res.message}`);
    }
  };

  const handleClear = () => {
    setInputVal('');
    onSaveKey('');
    setTestResult(null);
    onLog('info', 'API Key cleared.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12141f] border border-[#2a2e45] rounded-xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#212538] pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Enso Finance API &amp; Gateway Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2335] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="text-xs text-slate-300 space-y-1">
          <p>
            Your API Key is stored locally in your browser’s <code className="text-purple-300">localStorage (enso_key)</code>.
          </p>
          <div className="flex items-center gap-2 text-slate-400 pt-1">
            <span>Need an Enso key?</span>
            <a
              href="https://docs.enso.finance"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 font-medium"
            >
              Get one from Enso Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex justify-between">
            <span>ENSO_API_KEY</span>
            {inputVal && (
              <span className="text-[11px] text-slate-400 font-mono">
                {inputVal.length} characters
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Paste your 36-char Enso API key..."
              className="w-full bg-[#0a0b12] border border-[#2b3048] rounded-lg px-3.5 py-2.5 text-xs font-mono text-purple-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* API Gateway Mode Selector (Prevents 404 Vercel / Static issues) */}
        <div className="bg-[#0a0b14] border border-[#1f2338] rounded-lg p-3 space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Connection Gateway Mode</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setGatewayModeState('auto')}
              className={`p-2 rounded text-left border transition-all ${
                gatewayMode === 'auto'
                  ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold'
                  : 'bg-[#121422] border-[#22273c] text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-[11px] font-semibold">Auto-Resilient</div>
              <div className="text-[9px] opacity-75">Proxy with Direct Fallback</div>
            </button>

            <button
              type="button"
              onClick={() => setGatewayModeState('direct')}
              className={`p-2 rounded text-left border transition-all ${
                gatewayMode === 'direct'
                  ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold'
                  : 'bg-[#121422] border-[#22273c] text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-[11px] font-semibold">Direct Enso API</div>
              <div className="text-[9px] opacity-75">Browser CORS directly</div>
            </button>

            <button
              type="button"
              onClick={() => setGatewayModeState('proxy')}
              className={`p-2 rounded text-left border transition-all ${
                gatewayMode === 'proxy'
                  ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold'
                  : 'bg-[#121422] border-[#22273c] text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-[11px] font-semibold">Server Proxy</div>
              <div className="text-[9px] opacity-75">/api/enso endpoint</div>
            </button>
          </div>

          <div className="text-[10px] text-slate-400">
            {gatewayMode === 'auto' && 'Recommended: Attempts serverless proxy first, automatically falls back to Direct Enso API if 404 is received.'}
            {gatewayMode === 'direct' && 'Connects directly to https://api.enso.finance/api/v1/shortcuts/bundle via browser CORS. Perfect for Vercel/Netlify static deployments.'}
            {gatewayMode === 'proxy' && 'Sends all bundle requests strictly through local Express/Vercel serverless proxy (/api/enso).'}
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold flex items-center gap-2">
                <span>{testResult.success ? 'Connection Verified' : 'Check Warning / Response'}</span>
                {testResult.gatewayUsed && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-300 font-mono">
                    {testResult.gatewayUsed}
                  </span>
                )}
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">{testResult.message}</div>
              {testResult.latencyMs !== undefined && (
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Roundtrip Latency: {testResult.latencyMs}ms
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#212538]">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            Clear Key
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !inputVal.trim()}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#1f2438] hover:bg-[#282e47] text-white border border-[#313854] disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>{isTesting ? 'Testing...' : 'Test Enso API'}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
