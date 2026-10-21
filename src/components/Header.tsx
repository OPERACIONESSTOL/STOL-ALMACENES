import React from 'react';
import {
  Activity,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Code2,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
} from 'lucide-react';
import { PresetDataset, CodeSandboxConfig } from '../types/telemetry';
import { PRESET_DATASETS } from '../services/simulator';

interface HeaderProps {
  currentPreset: PresetDataset;
  onSelectPreset: (preset: PresetDataset) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  sampleRate: number;
  onChangeSampleRate: (rate: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  csbConfig: CodeSandboxConfig;
  onOpenCsbModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenEmbedModal: () => void;
  onInjectRandomAnomaly: () => void;
  onExportData: (format: 'csv' | 'json') => void;
  totalPackets: number;
  activeAnomaliesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPreset,
  onSelectPreset,
  isStreaming,
  onToggleStreaming,
  sampleRate,
  onChangeSampleRate,
  soundEnabled,
  onToggleSound,
  csbConfig,
  onOpenCsbModal,
  onOpenSettingsModal,
  onOpenEmbedModal,
  onInjectRandomAnomaly,
  onExportData,
  totalPackets,
  activeAnomaliesCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      {/* Top Banner & Title Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                SandboxPulse
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono">
                  v2.4 RT
                </span>
              </h1>
              {/* Connection status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  csbConfig.status === 'connected'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : csbConfig.status === 'connecting'
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800 animate-pulse'
                    : isStreaming
                    ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStreaming ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span>
                  {csbConfig.status === 'connected'
                    ? 'CodeSandbox Conectado'
                    : isStreaming
                    ? 'Transmisión en Vivo'
                    : 'En Pausa'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Analítica y telemetría de mediciones en tiempo real sincronizado con CodeSandbox
            </p>
          </div>
        </div>

        {/* Action Controls & CodeSandbox Bridge Button */}
        <div className="flex items-center flex-wrap gap-2">
          {/* CodeSandbox Connection Pill */}
          <button
            onClick={onOpenCsbModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              csbConfig.status === 'connected'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/60 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800/90 text-cyan-300 border-cyan-700/60 hover:bg-cyan-950/50 hover:border-cyan-500 shadow-sm shadow-cyan-900/20'
            }`}
            title="Conectar o configurar flujo desde CodeSandbox"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Conexión CodeSandbox</span>
            <span className="sm:hidden">CodeSandbox</span>
            {csbConfig.status === 'connected' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* Embedded CodeSandbox Viewer Tab */}
          <button
            onClick={onOpenEmbedModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors"
            title="Ver visor integrado de CodeSandbox o generar código fuente"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Visor Sandbox & SDK</span>
          </button>

          {/* Preset Selector */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <select
              value={currentPreset.id}
              onChange={(e) => {
                const found = PRESET_DATASETS.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="bg-transparent text-xs text-slate-200 px-2 py-1 outline-none cursor-pointer font-medium"
              title="Seleccionar flujo de mediciones preconfigurado"
            >
              {PRESET_DATASETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stream Rate Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Freq:</span>
            <select
              value={sampleRate}
              onChange={(e) => onChangeSampleRate(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-mono outline-none cursor-pointer text-xs"
              title="Frecuencia de captura en tiempo real"
            >
              <option value={250} className="bg-slate-900 text-slate-100">250 ms</option>
              <option value={500} className="bg-slate-900 text-slate-100">500 ms</option>
              <option value={1000} className="bg-slate-900 text-slate-100">1.0 seg</option>
              <option value={2000} className="bg-slate-900 text-slate-100">2.0 seg</option>
              <option value={5000} className="bg-slate-900 text-slate-100">5.0 seg</option>
            </select>
          </div>

          {/* Play / Pause Button */}
          <button
            onClick={onToggleStreaming}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isStreaming
                ? 'bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
            }`}
            title={isStreaming ? 'Pausar adquisición de datos' : 'Reanudar adquisición de datos'}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reanudar</span>
              </>
            )}
          </button>

          {/* Anomaly Test Injector */}
          <button
            onClick={onInjectRandomAnomaly}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 text-red-300 border border-red-800/70 hover:bg-red-900/60 transition-colors"
            title="Genera un pico anómalo para comprobar el algoritmo de detección y alarmas"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden lg:inline">Simular Anomalía</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:text-cyan-300'
                : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Silenciar alertas audibles' : 'Activar alertas audibles'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Channel thresholds & settings */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors"
            title="Configurar canales, umbrales y alertas"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Export Dropdown / Button */}
          <div className="relative group">
            <button
              onClick={() => onExportData('csv')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors"
              title="Descargar lecturas capturadas en formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Status Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500">Dataset Activo:</span>
            <span className="font-semibold text-slate-200">{currentPreset.name}</span>
          </span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500">Paquetes Ingeridos:</span>
            <span className="font-mono text-cyan-400 font-semibold">{totalPackets.toLocaleString()}</span>
          </span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500">Canales Monitoreados:</span>
            <span className="font-mono text-slate-200 font-semibold">{currentPreset.channels.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeAnomaliesCount > 0 ? (
            <div className="flex items-center gap-1.5 text-red-400 font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>{activeAnomaliesCount} {activeAnomaliesCount === 1 ? 'anomalía detectada' : 'anomalías detectadas'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Todos los parámetros dentro del umbral normal</span>
              <span className="sm:hidden">Normal</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
