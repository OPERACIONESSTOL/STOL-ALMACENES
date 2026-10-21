import React, { useState } from 'react';
import { X, ExternalLink, Play, Radio, CheckCircle, Terminal, Eye } from 'lucide-react';

interface CodeSandboxEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  sandboxUrl: string;
  onSetSandboxUrl: (url: string) => void;
  receivedPacketsCount: number;
}

export const CodeSandboxEmbedModal: React.FC<CodeSandboxEmbedModalProps> = ({
  isOpen,
  onClose,
  sandboxUrl,
  onSetSandboxUrl,
  receivedPacketsCount,
}) => {
  const [inputUrl, setInputUrl] = useState<string>(sandboxUrl || 'https://codesandbox.io/embed/new');
  const [activeIframeUrl, setActiveIframeUrl] = useState<string>(sandboxUrl || 'https://codesandbox.io/embed/new');

  if (!isOpen) return null;

  // Format embed url if user enters codesandbox.io/s/xxx or /p/sandbox/xxx
  const formatEmbedUrl = (raw: string) => {
    let clean = raw.trim();
    if (!clean) return 'https://codesandbox.io/embed/new';

    // If already an embed or csb.app url
    if (clean.includes('codesandbox.io/embed/') || clean.includes('.csb.app')) {
      return clean;
    }

    // If sandbox URL like https://codesandbox.io/s/m7j48x or /p/sandbox/m7j48x
    const sMatch = clean.match(/codesandbox\.io\/(?:s|p\/sandbox)\/([a-zA-Z0-9_-]+)/);
    if (sMatch && sMatch[1]) {
      return `https://codesandbox.io/embed/${sMatch[1]}?fontsize=13&hidenavigation=1&theme=dark`;
    }

    // Default return
    return clean;
  };

  const handleApplyUrl = () => {
    const formatted = formatEmbedUrl(inputUrl);
    setActiveIframeUrl(formatted);
    onSetSandboxUrl(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Visor Integrado de CodeSandbox & Receptor postMessage
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  Escucha Activa
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Visualiza tu sandbox aquí; las mediciones emitidas vía window.parent.postMessage se capturan automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Input Bar */}
        <div className="px-5 py-2.5 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[260px] flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-mono text-[11px]">URL Sandbox:</span>
            <input
              type="text"
              placeholder="https://codesandbox.io/s/... o https://xxxx.csb.app"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyUrl();
              }}
              className="flex-1 bg-transparent text-white font-mono outline-none placeholder-slate-600 text-xs"
            />
          </div>

          <button
            onClick={handleApplyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Cargar en Visor</span>
          </button>

          <a
            href={activeIframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Abrir en pestaña</span>
          </a>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Paquetes Capturados: {receivedPacketsCount}</span>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 bg-slate-950 relative">
          <iframe
            src={activeIframeUrl}
            title="CodeSandbox Embed"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Bridge postMessage activo en SandboxPulse. Para enviar datos desde tu sandbox usa:{' '}
              <code className="text-cyan-300 font-mono">window.parent.postMessage({'type: "SANDBOX_PULSE_DATA", data: {...}'}, "*")</code>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
