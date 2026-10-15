import React, { useState } from 'react';
import { Download, Copy, Check, Terminal, Code2, FileText } from 'lucide-react';
import { EnsoBundlePayload } from '../types/enso';
import { generateCurlSnippet, generateNodeFallbackScript } from '../utils/ensoApi';

interface ExportModalProps {
  payload: EnsoBundlePayload;
  apiKey: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ payload, apiKey }) => {
  const [activeExport, setActiveExport] = useState<'node' | 'curl' | 'json'>('node');
  const [copied, setCopied] = useState(false);

  const nodeScript = generateNodeFallbackScript(payload, apiKey);
  const curlScript = generateCurlSnippet(payload, apiKey);
  const jsonPayload = JSON.stringify(payload, null, 2);

  const currentContent =
    activeExport === 'node' ? nodeScript : activeExport === 'curl' ? curlScript : jsonPayload;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeExport === 'node'
        ? 'run-bundle.ts'
        : activeExport === 'curl'
        ? 'send-bundle.sh'
        : 'enso-bundle.json';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            <span>Developer Export &amp; Fallback Scripts</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Export ready-to-run automation for servers, cronjobs, or bots
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented export selector */}
          <div className="flex items-center gap-1 bg-[#0a0b12] p-1 rounded-lg border border-[#21253a]">
            <button
              onClick={() => setActiveExport('node')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeExport === 'node' ? 'bg-[#23273e] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node.js Script
            </button>
            <button
              onClick={() => setActiveExport('curl')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeExport === 'curl' ? 'bg-[#23273e] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL Command
            </button>
            <button
              onClick={() => setActiveExport('json')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeExport === 'json' ? 'bg-[#23273e] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw JSON
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium rounded bg-[#1c1f2f] hover:bg-[#25293f] border border-[#2c324c] text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs font-medium rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <pre className="bg-[#07080d] border border-[#1b1e2e] rounded-lg p-3 text-xs font-mono text-purple-200 overflow-x-auto max-h-80 leading-relaxed">
          {currentContent}
        </pre>
      </div>
    </div>
  );
};
