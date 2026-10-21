import React, { useState } from 'react';
import {
  MetricChannel,
  TelemetryReading,
  ChannelStats,
} from '../types/telemetry';
import {
  computePearsonCorrelations,
  computeHistogram,
} from '../utils/statistics';
import {
  BarChart3,
  GitCompare,
  Calculator,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface AnalyticsPanelProps {
  channels: MetricChannel[];
  statsMap: Record<string, ChannelStats>;
  history: TelemetryReading[];
  selectedChannelId: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  channels,
  statsMap,
  history,
  selectedChannelId,
}) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'correlation' | 'distribution'>('kpi');

  const selectedChannel =
    channels.find((c) => c.id === selectedChannelId) || channels[0] || null;

  const correlations = computePearsonCorrelations(channels, history, 60);

  // Compute histogram for the currently selected channel
  const selectedValues = history
    .slice(-80)
    .map((r) => Number(r[selectedChannel?.id || '']))
    .filter((v) => !isNaN(v));

  const histogramBins = computeHistogram(selectedValues, 7);
  const maxBinCount = Math.max(1, ...histogramBins.map((b) => b.count));

  // Overall Health Score calculation
  const totalChannels = channels.length || 1;
  const criticalCount = Object.values(statsMap).filter((s) => s.status === 'critical').length;
  const warningCount = Object.values(statsMap).filter((s) => s.status === 'warning').length;
  const healthScore = Math.max(
    0,
    Math.round(100 - (criticalCount * 30 + warningCount * 12) / totalChannels)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Top Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Motor Analítico y Estadístico en Vivo
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                Ventana RT (80s)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Cálculo estocástico, correlaciones cruzadas y distribución de probabilidad
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'kpi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> KPIs & Medias Móviles
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'correlation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" /> Correlación Pearson
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'distribution'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Distribución / Histograma
          </button>
        </div>
      </div>

      {/* Tab 1: KPIs & Detailed Moving Averages */}
      {activeTab === 'kpi' && (
        <div className="space-y-4">
          {/* Health Index Hero Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 border-r border-slate-800/80 pr-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg font-mono border ${
                  healthScore >= 90
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80'
                    : healthScore >= 70
                    ? 'bg-amber-950/80 text-amber-400 border-amber-700/80'
                    : 'bg-red-950/80 text-red-400 border-red-700/80'
                }`}
              >
                {healthScore}%
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Índice de Estabilidad</div>
                <div className="text-[11px] text-slate-400">
                  {healthScore >= 90
                    ? 'Óptimo sin desvíos'
                    : healthScore >= 70
                    ? 'Desviación moderada'
                    : 'Parámetros críticos'}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-[11px] text-slate-400">Canal Seleccionado</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedChannel?.color }}
                />
                {selectedChannel?.name}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-[11px] text-slate-400">Media Móvil Simple (SMA-10)</div>
              <div className="text-sm font-bold text-cyan-300 font-mono">
                {selectedChannel && statsMap[selectedChannel.id]
                  ? `${statsMap[selectedChannel.id].sma.toFixed(selectedChannel.decimals)} ${selectedChannel.unit}`
                  : '---'}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-[11px] text-slate-400">Media Móvil Exponencial (EMA-12)</div>
              <div className="text-sm font-bold text-purple-300 font-mono">
                {selectedChannel && statsMap[selectedChannel.id]
                  ? `${statsMap[selectedChannel.id].ema.toFixed(selectedChannel.decimals)} ${selectedChannel.unit}`
                  : '---'}
              </div>
            </div>
          </div>

          {/* Table of all channels' statistical breakdown */}
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Parámetro / Canal</th>
                  <th className="py-2.5 px-3">Actual</th>
                  <th className="py-2.5 px-3">Promedio (μ)</th>
                  <th className="py-2.5 px-3">Mediana</th>
                  <th className="py-2.5 px-3">Mín - Máx</th>
                  <th className="py-2.5 px-3">Desv. Estándar (σ)</th>
                  <th className="py-2.5 px-3">Varianza (σ²)</th>
                  <th className="py-2.5 px-3">Tasa (dx/dt)</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {channels.map((ch) => {
                  const s = statsMap[ch.id];
                  if (!s) return null;
                  return (
                    <tr
                      key={ch.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        ch.id === selectedChannelId ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-medium text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span>{ch.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: ch.color }}>
                        {s.current.toFixed(ch.decimals)} {ch.unit}
                      </td>
                      <td className="py-2.5 px-3">{s.mean.toFixed(ch.decimals)}</td>
                      <td className="py-2.5 px-3">{s.median.toFixed(ch.decimals)}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {s.min.toFixed(ch.decimals)} - {s.max.toFixed(ch.decimals)}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400">{s.stdDev.toFixed(ch.decimals)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{s.variance.toFixed(ch.decimals)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            s.rateOfChange > 0
                              ? 'text-emerald-400'
                              : s.rateOfChange < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {s.rateOfChange > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : s.rateOfChange < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          {s.rateOfChange.toFixed(2)}/s
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold ${
                            s.status === 'critical'
                              ? 'bg-red-950 text-red-400 border border-red-700'
                              : s.status === 'warning'
                              ? 'bg-amber-950 text-amber-400 border border-amber-700'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {s.status === 'critical'
                            ? 'Crítico'
                            : s.status === 'warning'
                            ? 'Alerta'
                            : 'Nominal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pearson Correlation Matrix */}
      {activeTab === 'correlation' && (
        <div>
          <div className="mb-3 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              El coeficiente de correlación de Pearson (r) evalúa la relación lineal entre variables
              en tiempo real: <strong>+1.0</strong> (dependencia directa), <strong>-1.0</strong> (inversa),{' '}
              <strong>0.0</strong> (variables independientes).
            </span>
          </div>

          {correlations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Recopilando suficientes muestras en vivo para calcular correlaciones cruzadas...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {correlations.map((pair, idx) => {
                const r = pair.coefficient;
                const isStrongPositive = r > 0.6;
                const isStrongNegative = r < -0.6;
                const isModerate = Math.abs(r) >= 0.3 && Math.abs(r) <= 0.6;

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {pair.channelA} <span className="text-slate-500">↔</span> {pair.channelB}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isStrongPositive
                          ? 'Correlación directa muy alta'
                          : isStrongNegative
                          ? 'Correlación inversa muy fuerte'
                          : isModerate
                          ? 'Correlación moderada'
                          : 'Comportamiento independiente'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold font-mono ${
                          isStrongPositive
                            ? 'text-emerald-400'
                            : isStrongNegative
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {r > 0 ? `+${r.toFixed(3)}` : r.toFixed(3)}
                      </div>
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isStrongPositive
                              ? 'bg-emerald-500'
                              : isStrongNegative
                              ? 'bg-rose-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.abs(r) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Distribution Histogram */}
      {activeTab === 'distribution' && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span>
              Histograma de Frecuencias de Muestreo para{' '}
              <strong className="text-cyan-300 font-mono">{selectedChannel?.name}</strong> (Últimas 80 muestras):
            </span>
            <span className="font-mono text-slate-500">N = {selectedValues.length} muestras</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
              {histogramBins.map((bin, i) => {
                const heightPct = (bin.count / maxBinCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bin.count}
                    </div>
                    <div
                      className="w-full bg-cyan-600/70 hover:bg-cyan-500 rounded-t transition-all group-hover:shadow-md group-hover:shadow-cyan-500/30"
                      style={{
                        height: `${Math.max(6, heightPct)}%`,
                        backgroundColor: selectedChannel?.color || '#06b6d4',
                      }}
                      title={`${bin.min.toFixed(1)} - ${bin.max.toFixed(1)} ${selectedChannel?.unit}: ${bin.count} ocurrencias`}
                    />
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[60px] text-center">
                      {bin.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-[11px] text-slate-500 mt-2 font-mono">
              Rango de Mediciones ({selectedChannel?.unit})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
