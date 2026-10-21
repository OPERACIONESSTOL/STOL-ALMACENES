import React, { useState, useMemo } from 'react';
import {
  LogisticsProcess,
  ProcessTelemetryData,
  DailyVolumeRecord,
} from '../types/volumeTelemetry';
import {
  INITIAL_PROCESS_TELEMETRY,
  DAILY_VOLUME_HISTORY,
  VOLUME_TELEMETRY_SUMMARY,
} from '../data/initialVolumeTelemetryData';
import {
  TrendingUp,
  Box,
  Layers,
  Calendar,
  Filter,
  BarChart2,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Activity,
  Maximize2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';

export const TelemetryView: React.FC = () => {
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<string>('Todos');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [activeTab, setActiveTab] = useState<'procesos' | 'tendencia' | 'comparativa'>('procesos');

  const processes = INITIAL_PROCESS_TELEMETRY;
  const summary = VOLUME_TELEMETRY_SUMMARY;

  // Filtered process list
  const filteredProcesses = useMemo(() => {
    if (selectedProcessFilter === 'Todos') return processes;
    return processes.filter((p) => p.proceso === selectedProcessFilter);
  }, [processes, selectedProcessFilter]);

  // Total calculated based on filter
  const currentTotalM3 = useMemo(() => {
    return filteredProcesses.reduce((s, p) => s + p.volumenRealM3, 0);
  }, [filteredProcesses]);

  const currentMetaM3 = useMemo(() => {
    return filteredProcesses.reduce((s, p) => s + p.metaVolumenM3, 0);
  }, [filteredProcesses]);

  const currentCapacidadM3 = useMemo(() => {
    return filteredProcesses.reduce((s, p) => s + p.capacidadOperativaM3, 0);
  }, [filteredProcesses]);

  const compliancePct = currentMetaM3 > 0 ? ((currentTotalM3 / currentMetaM3) * 100).toFixed(1) : '100.0';
  const capacityUtilizationPct = currentCapacidadM3 > 0 ? ((currentTotalM3 / currentCapacidadM3) * 100).toFixed(1) : '0.0';

  // Format currency/numbers
  const fmt = (n: number, d = 1) =>
    (n || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

  const handleExportTelemetryCSV = () => {
    const headers = [
      'Proceso',
      'Volumen_Real_m3',
      'Meta_Volumen_m3',
      'Capacidad_m3',
      'Cumplimiento_pct',
      'Utilizacion_Capacidad_pct',
      'Cajas_Procesadas',
      'Pallets_Equivalentes',
      'Promedio_Diario_m3',
      'Variacion_Vs_Anterior_pct',
      'Estado',
    ];

    const rows = processes.map((p) => [
      `"${p.proceso}"`,
      p.volumenRealM3,
      p.metaVolumenM3,
      p.capacidadOperativaM3,
      p.cumplimientoPct,
      p.utilizacionCapacidadPct,
      p.cajasProcesadas,
      p.palletsEquivalentes,
      p.promedioDiarioM3,
      p.variacionPeriodoAnteriorPct,
      `"${p.estado}"`,
    ]);

    const csvStr = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvStr));
    dl.setAttribute('download', `telemetria_volumenes_stol_${Date.now()}.csv`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  return (
    <div className="space-y-6 text-[#1A1A2E] font-sans">
      {/* 1. TOP HEADER & METRICS BANNER */}
      <header className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-5 md:p-6 text-white border-2 border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                TELEMETRÍA DE VOLÚMENES OPERATIVOS
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                7 Procesos Logísticos en Monitoreo
              </span>
              <span className="text-slate-400 text-xs">Período Oficial: Octubre 2026</span>
            </div>

            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white font-sans">
              Seguimiento y Control de Volúmenes de Mercadería (m³)
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-normal">
              Flujo continuo de cubicaje acumulado por proceso operativo: Recepción, Almacenamiento, Despacho,
              Cross Docking, Picking, Ecommerce e Importados con control contra capacidad operativa.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportTelemetryCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar Reporte (CSV)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SIX VIVID EXECUTIVE VOLUME KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Volumen Procesado */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-blue-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-100">
            <span>Volumen Período</span>
            <span>📦</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{fmt(currentTotalM3, 1)}</div>
            <div className="text-[11px] font-bold text-blue-100 mt-0.5">m³ procesados</div>
          </div>
          <div className="pt-2 border-t border-blue-400/30 text-[10.5px] text-blue-100 font-medium flex items-center justify-between">
            <span>Meta: {fmt(currentMetaM3, 0)} m³</span>
            <span className="font-bold">{compliancePct}%</span>
          </div>
        </div>

        {/* KPI 2: Promedio Diario */}
        <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-cyan-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-cyan-100">
            <span>Promedio Diario</span>
            <span>⚡</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{summary.promedioDiarioM3}</div>
            <div className="text-[11px] font-bold text-cyan-100 mt-0.5">m³ / día laboral</div>
          </div>
          <div className="pt-2 border-t border-cyan-400/30 text-[10.5px] text-cyan-100 font-medium">
            Velocidad de despacho óptima
          </div>
        </div>

        {/* KPI 3: Variación vs Mes Anterior */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-emerald-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-100">
            <span>Variación Mensual</span>
            <span>📈</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">+{summary.variacionVsMesAnteriorPct}%</div>
            <div className="text-[11px] font-bold text-emerald-100 mt-0.5">vs Setiembre 2026</div>
          </div>
          <div className="pt-2 border-t border-emerald-400/30 text-[10.5px] text-emerald-100 font-medium">
            Tendencia en crecimiento
          </div>
        </div>

        {/* KPI 4: Utilización Capacidad */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-purple-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-200">
            <span>Uso de Capacidad</span>
            <span>🏭</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{capacityUtilizationPct}%</div>
            <div className="text-[11px] font-bold text-purple-200 mt-0.5">Ocupación Operativa</div>
          </div>
          <div className="pt-2 border-t border-purple-400/30 text-[10.5px] text-purple-200 font-medium">
            Límite Seguro: 85.0%
          </div>
        </div>

        {/* KPI 5: Crecimiento Anual */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-amber-300/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-100">
            <span>Interanual 25-26</span>
            <span>📊</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">+{summary.crecimientoInteranualPct}%</div>
            <div className="text-[11px] font-bold text-amber-100 mt-0.5">54,820 m³ acumulados</div>
          </div>
          <div className="pt-2 border-t border-amber-400/30 text-[10.5px] text-amber-100 font-medium">
            vs 49,910 m³ en 2025
          </div>
        </div>

        {/* KPI 6: Alertas Operativas */}
        <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-rose-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-rose-100">
            <span>Cuellos de Botella</span>
            <span>⚠️</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{summary.desviacionesCriticasCount}</div>
            <div className="text-[11px] font-bold text-rose-100 mt-0.5">Ecommerce (91.8% cap)</div>
          </div>
          <div className="pt-2 border-t border-rose-400/30 text-[10.5px] text-rose-100 font-medium">
            Requiere expansión de staging
          </div>
        </div>
      </section>

      {/* DIRECTORIAL OBSERVATIONS & DECISIONS FOR TELEMETRY */}
      <ExecutiveObservationsSection
        moduleName="telemetry"
        observations={getObservationsByModule('telemetry')}
        defaultExpanded={true}
      />

      {/* 3. PROCESS COMPARISON BARS: REAL VS META VS CAPACIDAD */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              Comparativa por Proceso Logístico: Volumen Real vs. Meta vs. Capacidad (m³)
            </h2>
            <p className="text-xs text-slate-500">
              Línea vertical oscura = Capacidad operativa máxima del proceso · Línea punteada = Meta mensual
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {['Todos', 'Recepción', 'Almacenamiento', 'Despacho', 'Cross Docking', 'Picking', 'Ecommerce'].map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProcessFilter(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedProcessFilter === p
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredProcesses.map((p) => {
            const maxAxis = p.capacidadOperativaM3 * 1.15;
            const realPct = Math.min(100, (p.volumenRealM3 / maxAxis) * 100);
            const metaPct = Math.min(100, (p.metaVolumenM3 / maxAxis) * 100);
            const capPct = Math.min(100, (p.capacidadOperativaM3 / maxAxis) * 100);

            const isAlert = p.utilizacionCapacidadPct >= 90;

            return (
              <div key={p.proceso} className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="font-black text-slate-900 text-sm">{p.proceso}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isAlert
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : p.cumplimientoPct >= 100
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-500">
                      Cajas: <strong className="text-slate-800">{p.cajasProcesadas.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-500">
                      Pallets: <strong className="text-slate-800">{p.palletsEquivalentes}</strong>
                    </span>
                    <span className="text-slate-500">
                      Cumplimiento: <strong className="text-blue-900 font-black">{p.cumplimientoPct}%</strong>
                    </span>
                    <span className="bg-slate-200 text-slate-900 font-bold px-2 py-0.5 rounded">
                      {fmt(p.volumenRealM3, 1)} / {fmt(p.metaVolumenM3, 0)} m³
                    </span>
                  </div>
                </div>

                {/* Progress bar with markers */}
                <div className="h-6 bg-slate-200/80 rounded-lg relative overflow-visible border border-slate-300 p-0.5">
                  <div
                    className="h-full rounded-md shadow-xs flex items-center justify-end pr-2 text-[10px] font-black text-white transition-all duration-500"
                    style={{
                      width: `${Math.max(6, realPct)}%`,
                      backgroundColor: isAlert ? '#ef4444' : p.color,
                    }}
                  >
                    {realPct > 20 ? `${fmt(p.volumenRealM3, 1)} m³` : ''}
                  </div>

                  {/* Meta marker */}
                  <div
                    className="absolute -top-1 -bottom-1 w-[2px] bg-amber-600 z-10"
                    style={{ left: `${metaPct}%` }}
                    title={`Meta: ${p.metaVolumenM3} m³`}
                  >
                    <div className="absolute -top-3.5 -left-4 text-[8px] font-black bg-amber-600 text-white px-1 rounded">
                      Meta
                    </div>
                  </div>

                  {/* Capacity marker */}
                  <div
                    className="absolute -top-1 -bottom-1 w-[3px] bg-slate-900 z-10 shadow-sm"
                    style={{ left: `${capPct}%` }}
                    title={`Capacidad: ${p.capacidadOperativaM3} m³`}
                  >
                    <div className="absolute -bottom-3.5 -left-4 text-[8px] font-black bg-slate-900 text-white px-1 rounded">
                      Cap. Max
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[10.5px] text-slate-500 font-medium pt-1">
                  <span>
                    Promedio diario: <strong>{p.promedioDiarioM3} m³/día</strong>
                  </span>
                  <span>
                    Capacidad utilizada:{' '}
                    <strong className={isAlert ? 'text-rose-600 font-black' : 'text-slate-800'}>
                      {p.utilizacionCapacidadPct}%
                    </strong>{' '}
                    ({fmt(p.capacidadOperativaM3 - p.volumenRealM3, 1)} m³ holgura)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. DAILY TELEMETRY TIMELINE */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              Telemetría Diaria de Volumen Operativo (Octubre 2026)
            </h3>
            <p className="text-xs text-slate-500">
              Registros consolidados de cubicaje diario procesado en patio y centro de distribución
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-900 font-bold px-3 py-1 rounded-xl border border-blue-200">
            Total Días: {DAILY_VOLUME_HISTORY.length} Registros
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-2">Día</th>
                <th className="py-2.5 px-3 text-right">Volumen Total</th>
                <th className="py-2.5 px-3 text-right">Meta Diaria</th>
                <th className="py-2.5 px-2 text-center">Cumplimiento</th>
                <th className="py-2.5 px-3 text-right">Recepción</th>
                <th className="py-2.5 px-3 text-right">Almacén</th>
                <th className="py-2.5 px-3 text-right">Despacho</th>
                <th className="py-2.5 px-3 text-right">CrossDock</th>
                <th className="py-2.5 px-3 text-right">Picking</th>
                <th className="py-2.5 px-3 text-right">Cajas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
              {DAILY_VOLUME_HISTORY.map((d) => {
                const dayCumpl = Math.round((d.volumenTotalM3 / d.metaDiariaM3) * 100);

                return (
                  <tr key={d.fecha} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2 px-3 text-slate-600">{d.fecha}</td>
                    <td className="py-2 px-2 font-sans font-bold text-slate-900">{d.diaSemana}</td>
                    <td className="py-2 px-3 text-right font-black text-slate-900">
                      {fmt(d.volumenTotalM3, 1)} m³
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">{fmt(d.metaDiariaM3, 0)} m³</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dayCumpl >= 100
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {dayCumpl}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-blue-700">{fmt(d.porProceso.Recepción, 1)}</td>
                    <td className="py-2 px-3 text-right text-cyan-700">{fmt(d.porProceso.Almacenamiento, 1)}</td>
                    <td className="py-2 px-3 text-right text-purple-700">{fmt(d.porProceso.Despacho, 1)}</td>
                    <td className="py-2 px-3 text-right text-amber-700">{fmt(d.porProceso['Cross Docking'], 1)}</td>
                    <td className="py-2 px-3 text-right text-emerald-700">{fmt(d.porProceso.Picking, 1)}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{d.cajasTotales.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
