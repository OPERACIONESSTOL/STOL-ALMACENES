import React, { useState } from 'react';
import {
  CodeSandboxConfig,
  MetricChannel,
  TelemetryReading,
} from '../types/telemetry';
import {
  X,
  Code2,
  Globe,
  Copy,
  Check,
  Send,
  RefreshCw,
  Server,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CodeSandboxConfig;
  onUpdateConfig: (updated: Partial<CodeSandboxConfig>) => void;
  onManualPayloadIngest: (payload: Record<string, number>) => void;
  channels: MetricChannel[];
  onTestConnection: () => Promise<void>;
}

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onManualPayloadIngest,
  channels,
  onTestConnection,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'code' | 'manual'>('url');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [manualJsonText, setManualJsonText] = useState<string>(() => {
    // Build initial sample from current channels
    const initial: Record<string, number> = {};
    channels.forEach((ch) => {
      initial[ch.id] = (ch.minRange + ch.warnThreshold) / 2;
    });
    return JSON.stringify(initial, null, 2);
  });
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleManualSend = () => {
    try {
      setManualError(null);
      const parsed = JSON.parse(manualJsonText);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('El JSON debe ser un objeto con pares clave:valor numéricos.');
      }
      onManualPayloadIngest(parsed);
      setManualSuccess(true);
      setTimeout(() => setManualSuccess(false), 2000);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : 'Error al parsear JSON');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    await onTestConnection();
    setTesting(false);
  };

  // Node.js / Express code snippet for CodeSandbox
  const nodeSnippet = `// === Código para tu servidor en CodeSandbox (Node.js / Express) ===
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); // Permitir peticiones cross-origin
app.use(express.json());

// Endpoint de telemetría en tiempo real
app.get('/api/metrics', (req, res) => {
  const data = {
    timestamp: Date.now(),
${channels
  .map(
    (ch) =>
      `    ${ch.id}: Number((${ch.minRange} + Math.random() * ${ch.maxRange - ch.minRange}).toFixed(${ch.decimals})), // ${ch.name} (${ch.unit})`
  )
  .join('\n')}
  };

  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Servidor de telemetría listo en puerto \${PORT}\`);
});
`;

  // React / Client code snippet for CodeSandbox
  const reactSnippet = `// === Código para tu componente en CodeSandbox (React / Vite) ===
// Envía datos en tiempo real mediante postMessage al dashboard padre:
import { useEffect } from 'react';

export default function TelemetrySender() {
  useEffect(() => {
    const interval = setInterval(() => {
      const payload = {
        type: 'SANDBOX_PULSE_DATA',
        data: {
          timestamp: Date.now(),
${channels.map((ch) => `          ${ch.id}: ${(ch.minRange + (ch.maxRange - ch.minRange) * 0.5).toFixed(1)},`).join('\n')}
        }
      };
      
      // Enviar a la ventana superior
      window.parent.postMessage(payload, '*');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Transmitiendo telemetría hacia SandboxPulse...</div>;
}
`;

  // Python FastAPI snippet
  const pythonSnippet = `# === Código para CodeSandbox (Python FastAPI) ===
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time, random

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/metrics")
def get_telemetry():
    return {
        "timestamp": int(time.time() * 1000),
${channels.map((ch) => `        "${ch.id}": round(random.uniform(${ch.minRange}, ${ch.maxRange}), ${ch.decimals}),`).join('\n')}
    }
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Conexión con tu Aplicativo CodeSandbox
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  Sincronización en Vivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Conecta tu sandbox mediante polling HTTP, iframe postMessage o simulador de payload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Endpoint URL / Polling</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Generador de Código para CodeSandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inyector Manual JSON</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: URL / Polling Configuration */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-800/60 rounded-xl space-y-1.5">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Server className="w-4 h-4" />
                  ¿Cómo funciona la conexión con tu CodeSandbox?
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Cuando ejecutas un servidor o app en CodeSandbox, este te provee una URL pública de
                  previsualización (por ejemplo <code>https://tu-id.csb.app</code> o con una ruta como{' '}
                  <code>/api/metrics</code> o <code>/data.json</code>). Ingresa esa URL a continuación y
                  SandboxPulse consultará las mediciones en tiempo real periódicamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL del Endpoint en CodeSandbox:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://xxxxxx.csb.app/api/metrics"
                    value={config.sandboxUrl}
                    onChange={(e) => onUpdateConfig({ sandboxUrl: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={handleTest}
                    disabled={testing || !config.sandboxUrl}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>Probar Ping</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ejemplo: <code>https://n9z6m.csb.app/api/metrics</code> o cualquier URL que retorne JSON.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Intervalo de Consulta (Polling):
                  </label>
                  <select
                    value={config.pollIntervalMs}
                    onChange={(e) => onUpdateConfig({ pollIntervalMs: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  >
                    <option value={250}>250 ms (Alta frecuencia)</option>
                    <option value={500}>500 ms (2 lecturas/seg)</option>
                    <option value={1000}>1000 ms (1 segundo - Recomendado)</option>
                    <option value={2000}>2000 ms (2 segundos)</option>
                    <option value={5000}>5000 ms (5 segundos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modo de Ingesta Activo:
                  </label>
                  <select
                    value={config.mode}
                    onChange={(e) =>
                      onUpdateConfig({ mode: e.target.value as CodeSandboxConfig['mode'] })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="codesandbox_poll">Sondeo HTTP a CodeSandbox</option>
                    <option value="codesandbox_postmessage">Escucha postMessage (Iframe)</option>
                    <option value="simulator">Simulador Físico Local (Generador Automático)</option>
                  </select>
                </div>
              </div>

              {/* Status and Diagnostics */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="font-semibold text-slate-300 text-xs flex items-center justify-between">
                  <span>Diagnóstico de Conexión:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      config.status === 'connected'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : config.status === 'error'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-slate-500">Paquetes Recibidos</div>
                    <div className="text-cyan-400 font-bold">{config.totalPacketsReceived}</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-slate-500">Última Latencia</div>
                    <div className="text-slate-200">
                      {config.lastPingMs ? `${config.lastPingMs} ms` : '---'}
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-slate-500">CORS / Formato</div>
                    <div className="text-emerald-400 font-medium">JSON habilitado</div>
                  </div>
                </div>

                {config.errorMessage && (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{config.errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Ready-to-use Code Generator for CodeSandbox */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300">
                  Copia y pega este código en tu proyecto de CodeSandbox para emitir las variables
                  esperadas con un solo clic:
                </p>
              </div>

              {/* Node / Express snippet */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Opción A: Node.js / Express (server.js en CodeSandbox)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(nodeSnippet, 'node')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                  >
                    {copiedSnippet === 'node' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-52 leading-relaxed">
                  {nodeSnippet}
                </pre>
              </div>

              {/* React postMessage snippet */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Opción B: React / Vite (App.tsx en CodeSandbox mediante postMessage)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(reactSnippet, 'react')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                  >
                    {copiedSnippet === 'react' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
                  {reactSnippet}
                </pre>
              </div>

              {/* Python snippet */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Opción C: Python FastAPI (main.py en CodeSandbox)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(pythonSnippet, 'python')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                  >
                    {copiedSnippet === 'python' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-amber-200 overflow-x-auto max-h-48 leading-relaxed">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Manual JSON Payload Ingest */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Pega directamente cualquier objeto JSON emitido por tu CodeSandbox para inyectarlo de
                inmediato en el gráfico y registrar mediciones reales al instante:
              </p>

              <div>
                <textarea
                  rows={8}
                  value={manualJsonText}
                  onChange={(e) => setManualJsonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {manualError && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              {manualSuccess && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Muestra inyectada y graficada con éxito en los canales de medición!</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleManualSend}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Inyectar Muestra al Flujo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Estado actual:{' '}
            <strong className="text-white capitalize font-mono">
              {config.mode.replace('_', ' ')}
            </strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
