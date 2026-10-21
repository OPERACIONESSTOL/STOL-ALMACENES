import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { CrossdockingDailyRecord, CrossdockingSummary } from '../types/crossdocking';
import { TrendingUp, PieChart as PieIcon, Layers, Calendar, BarChart3, Clock } from 'lucide-react';

ChartJS.register(...registerables);

interface CrossdockingChartsProps {
  summary: CrossdockingSummary;
  records: CrossdockingDailyRecord[];
}

export const CrossdockingCharts: React.FC<CrossdockingChartsProps> = ({ summary, records }) => {
  const evolutionChartRef = useRef<HTMLCanvasElement | null>(null);
  const compositionChartRef = useRef<HTMLCanvasElement | null>(null);
  const lpnChartRef = useRef<HTMLCanvasElement | null>(null);

  const evolutionInstanceRef = useRef<ChartJS | null>(null);
  const compositionInstanceRef = useRef<ChartJS | null>(null);
  const lpnInstanceRef = useRef<ChartJS | null>(null);

  // 1. Evolution Chart
  useEffect(() => {
    if (!evolutionChartRef.current) return;
    if (evolutionInstanceRef.current) evolutionInstanceRef.current.destroy();

    const parseTime = (str: string) => {
      const parts = String(str).split(/[\/\-\.]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        return new Date(y, m, d).getTime();
      }
      return 0;
    };

    const sortedRecords = [...records].sort((a, b) => parseTime(a.fecha) - parseTime(b.fecha));
    const labels = sortedRecords.map((r) => r.fecha);
    const m3Prog = sortedRecords.map((r) => r.m3Prog);
    const m3RecbPtio = sortedRecords.map((r) => r.m3RecbPtio);
    const m3RecbNve = sortedRecords.map((r) => r.m3RecbNve);

    const ctx = evolutionChartRef.current.getContext('2d');
    if (!ctx) return;

    evolutionInstanceRef.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'M3 Programado',
            data: m3Prog,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2.5,
            pointBackgroundColor: '#f59e0b',
            pointRadius: 4,
            tension: 0.25,
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: 'M3 Recibido Patio',
            data: m3RecbPtio,
            backgroundColor: 'rgba(37, 99, 235, 0.85)',
            borderColor: '#2563eb',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: 'M3 Recibido Nave',
            data: m3RecbNve,
            backgroundColor: 'rgba(14, 165, 233, 0.75)',
            borderColor: '#0ea5e9',
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'system-ui', size: 11, weight: 'bold' },
            },
          },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${Number(item.raw).toLocaleString('es-PE')} m³`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10, weight: 'bold' } },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 10 },
              callback: (val) => `${Number(val).toLocaleString()} m³`,
            },
          },
        },
      },
    });

    return () => {
      evolutionInstanceRef.current?.destroy();
    };
  }, [records]);

  // 2. Composition Donut Chart (Exact B2:D6)
  useEffect(() => {
    if (!compositionChartRef.current) return;
    if (compositionInstanceRef.current) compositionInstanceRef.current.destroy();

    const ctx = compositionChartRef.current.getContext('2d');
    if (!ctx) return;

    compositionInstanceRef.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vol Regular', 'Vol Extraordinario', 'Vol Dom Fer', 'Reprocesos'],
        datasets: [
          {
            data: [
              summary.volRegular,
              summary.volExtraordinario,
              summary.volDomFer,
              summary.reprocesos,
            ],
            backgroundColor: ['#2563eb', '#f59e0b', '#8b5cf6', '#ef4444'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'system-ui', size: 11, weight: 'bold' },
            },
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const total =
                  summary.volRegular +
                  summary.volExtraordinario +
                  summary.volDomFer +
                  summary.reprocesos;
                const val = Number(item.raw);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${item.label}: ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })} m³ (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      compositionInstanceRef.current?.destroy();
    };
  }, [summary]);

  // 3. LPNs & Suppliers Chart
  useEffect(() => {
    if (!lpnChartRef.current) return;
    if (lpnInstanceRef.current) lpnInstanceRef.current.destroy();

    const parseTime = (str: string) => {
      const parts = String(str).split(/[\/\-\.]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        return new Date(y, m, d).getTime();
      }
      return 0;
    };

    const sortedRecords = [...records].sort((a, b) => parseTime(a.fecha) - parseTime(b.fecha));
    const labels = sortedRecords.map((r) => r.fecha);
    const totalLpns = sortedRecords.map((r) => r.lpnPtio + r.lpnNve);
    const tardanzas = sortedRecords.map((r) => r.provTardanza);

    const ctx = lpnChartRef.current.getContext('2d');
    if (!ctx) return;

    lpnInstanceRef.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Total LPNs Recibidos',
            data: totalLpns,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderRadius: 6,
            yAxisID: 'yLpn',
          },
          {
            type: 'line',
            label: 'Proveedores con Tardanza',
            data: tardanzas,
            borderColor: '#ef4444',
            backgroundColor: '#ef4444',
            borderWidth: 2,
            pointRadius: 4,
            yAxisID: 'yProv',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'system-ui', size: 11, weight: 'bold' },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10, weight: 'bold' } },
          },
          yLpn: {
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 10 } },
            title: { display: true, text: 'LPNs', font: { size: 10, weight: 'bold' } },
          },
          yProv: {
            position: 'right',
            grid: { display: false },
            ticks: { font: { size: 10 }, stepSize: 1 },
            title: { display: true, text: 'Prov. Tardanza', font: { size: 10, weight: 'bold' } },
          },
        },
      },
    });

    return () => {
      lpnInstanceRef.current?.destroy();
    };
  }, [records]);

  const totalVolumenSummary =
    summary.volRegular + summary.volExtraordinario + summary.volDomFer + summary.reprocesos;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Chart 1: Evolución Temporal */}
      <div className="lg:col-span-8 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Evolución Diaria de Volúmenes (Crossdocking)
              </h3>
              <p className="text-xs text-slate-500">M3 Programado vs M3 Recibido en Patio y Nave</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {records.length} Días Auditados
          </span>
        </div>

        <div className="h-[280px] w-full mt-4">
          <canvas ref={evolutionChartRef} />
        </div>
      </div>

      {/* Chart 2: Composición del Volumen B2:D6 */}
      <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Composición Declarada (B2:D6)</h3>
              <p className="text-xs text-slate-500">Proporción por tipo de servicio</p>
            </div>
          </div>
        </div>

        <div className="h-[210px] w-full mt-3 relative">
          <canvas ref={compositionChartRef} />
        </div>

        <div className="pt-3 border-t border-slate-100 mt-2 text-center">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Total Volumen Declarado
          </div>
          <div className="text-lg font-black font-mono text-slate-900">
            {totalVolumenSummary.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            m³
          </div>
        </div>
      </div>

      {/* Chart 3: LPNs y Proveedores */}
      <div className="lg:col-span-12 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Flujo Operativo de LPNs &amp; Puntualidad de Proveedores
              </h3>
              <p className="text-xs text-slate-500">Unidades de bultos / paletas procesadas vs entregas con retraso</p>
            </div>
          </div>
        </div>

        <div className="h-[200px] w-full mt-4">
          <canvas ref={lpnChartRef} />
        </div>
      </div>
    </div>
  );
};
