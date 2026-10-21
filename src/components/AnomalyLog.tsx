import React, { useState } from 'react';
import { AnomalyEvent } from '../types/telemetry';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  Download,
  Filter,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface AnomalyLogProps {
  anomalies: AnomalyEvent[];
  onClearAnomalies: () => void;
  onResolveAnomaly: (id: string) => void;
}

export const AnomalyLog: React.FC<AnomalyLogProps> = ({
  anomalies,
  onClearAnomalies,
  onResolveAnomaly,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const filtered = anomalies.filter((a) => {
    if (filterSeverity === 'critical') return a.severity === 'critical';
    if (filterSeverity === 'warning') return a.severity === 'warning';
    return true;
  });

  const exportIncidentLog = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Timestamp,Hora,Canal,Valor,Unidad,MediaEsperada,ZScore,Tipo,Severidad\n' +
      anomalies
        .map(
          (a) =>
            `${a.id},${a.timestamp},${a.timeString},"${a.channelName}",${a.value},${a.unit},${a.expectedMean.toFixed(2)},${a.zScore.toFixed(2)},${a.type},${a.severity}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `incidentes_telemetria_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-800/70 text-red-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Registro de Anomalías e Incidentes
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-red-950 text-red-300 border border-red-800">
                {anomalies.length} Registradas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Detección estocástica por desvío estándar Z-Score y ruptura de umbrales en tiempo real
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Criterios Z-Score</span>
          </button>

          {/* Filter dropdown */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <Filter className="w-3 h-3 text-slate-500 ml-1.5" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as 'all' | 'critical' | 'warning')}
              className="bg-transparent text-xs text-slate-300 px-2 py-1 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Todas</option>
              <option value="critical" className="bg-slate-900">Solo Críticas</option>
              <option value="warning" className="bg-slate-900">Solo Advertencias</option>
            </select>
          </div>

          {anomalies.length > 0 && (
            <>
              <button
                onClick={exportIncidentLog}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
                title="Descargar reporte de anomalías en CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar</span>
              </button>
              <button
                onClick={onClearAnomalies}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 px-2.5 py-1 rounded-md border border-slate-700 hover:border-red-800 transition-colors"
                title="Limpiar registro"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Explanation Banner */}
      {showExplanation && (
        <div className="mb-3 p-3 bg-cyan-950/30 border border-cyan-800/60 rounded-lg text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-cyan-300">
            ¿Cómo clasifica SandboxPulse las anomalías en vivo?
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-0.5">
            <li>
              <strong className="text-slate-200">Z-Score |z| &gt; 2.5:</strong> El valor observado
              difiere más de 2.5 desviaciones estándar del promedio histórico reciente (probabilidad &lt; 1%).
            </li>
            <li>
              <strong className="text-slate-200">Ruptura de Umbral Crítico:</strong> La lectura
              supera el límite operativo máximo seguro establecido para el canal.
            </li>
            <li>
              <strong className="text-slate-200">Pico Súbito (Spike):</strong> Gradiente de cambio
              drástico en una ventana de menos de 1 segundo.
            </li>
          </ul>
        </div>
      )}

      {/* Table of anomalies */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
          <CheckCircle className="w-8 h-8 text-emerald-500/50" />
          <span>No se registran anomalías en este momento. El sistema opera dentro de parámetros nominales.</span>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 text-[11px]">
              <tr>
                <th className="py-2 px-3">Hora</th>
                <th className="py-2 px-3">Severidad</th>
                <th className="py-2 px-3">Canal</th>
                <th className="py-2 px-3">Lectura Registrada</th>
                <th className="py-2 px-3">Línea Base (Media)</th>
                <th className="py-2 px-3">Desviación (Z-Score)</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    item.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400">{item.timeString}</td>
                  <td className="py-2 px-3 font-sans">
                    {item.severity === 'critical' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-700">
                        <AlertCircle className="w-3 h-3" /> Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-700">
                        <AlertTriangle className="w-3 h-3" /> Alerta
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-white">{item.channelName}</td>
                  <td className="py-2 px-3 font-bold text-red-400">
                    {item.value} {item.unit}
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {item.expectedMean.toFixed(1)} {item.unit}
                  </td>
                  <td className="py-2 px-3 font-bold text-yellow-400">
                    z = {item.zScore.toFixed(2)}σ
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-400 text-[11px]">
                    {item.type === 'high_threshold'
                      ? 'Límite Superior'
                      : item.type === 'zscore_spike'
                      ? 'Desviación Estadística'
                      : 'Pico Súbito'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {!item.resolved ? (
                      <button
                        onClick={() => onResolveAnomaly(item.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-800 text-slate-300 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 transition-colors"
                      >
                        Resolver
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-sans">Resuelto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
