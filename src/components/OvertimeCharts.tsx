import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { OvertimeRecord, BonusRecord } from '../types/overtime';

ChartJS.register(...registerables);

interface OvertimeChartsProps {
  records: OvertimeRecord[];
  bonusRecords: BonusRecord[];
}

const PALETTE = [
  '#1f4e9c', // Navy Blue
  '#e07b39', // Orange
  '#2a9d8f', // Teal
  '#c0392b', // Crimson
  '#8e6bbf', // Purple
  '#d4a017', // Gold
  '#4a90a4', // Steel Cyan
  '#7f8c8d', // Slate
  '#b5527a', // Rose
];

export const OvertimeCharts: React.FC<OvertimeChartsProps> = ({ records, bonusRecords }) => {
  const c1Ref = useRef<HTMLCanvasElement | null>(null);
  const c2Ref = useRef<HTMLCanvasElement | null>(null);
  const c3Ref = useRef<HTMLCanvasElement | null>(null);
  const c4Ref = useRef<HTMLCanvasElement | null>(null);
  const c5Ref = useRef<HTMLCanvasElement | null>(null);
  const c6Ref = useRef<HTMLCanvasElement | null>(null);

  const chartsInstancesRef = useRef<Record<string, ChartJS | null>>({});

  useEffect(() => {
    // Destroy previous charts
    Object.values(chartsInstancesRef.current).forEach((c) => c?.destroy());
    chartsInstancesRef.current = {};

    if (records.length === 0) return;

    // Helper: group & sort
    const grp = (
      rs: OvertimeRecord[] | BonusRecord[],
      k: 'a' | 'c',
      valFn: (r: any) => number
    ): Record<string, number> => {
      const m: Record<string, number> = {};
      rs.forEach((r: any) => {
        m[r[k]] = (m[r[k]] || 0) + valFn(r);
      });
      return m;
    };

    const srt = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1]);

    const totalHours = records.reduce((s, r) => s + r.h, 0);
    const areaSorted = srt(grp(records, 'a', (r) => r.h));

    // Chart 1: Tendencia de HHEE por área
    if (c1Ref.current) {
      chartsInstancesRef.current.c1 = new ChartJS(c1Ref.current, {
        type: 'line',
        data: {
          labels: areaSorted.map((x) => x[0]),
          datasets: [
            {
              label: 'Total HHEE',
              data: areaSorted.map((x) => +x[1].toFixed(1)),
              borderColor: PALETTE[0],
              backgroundColor: PALETTE[0] + '22',
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointBackgroundColor: PALETTE[0],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${((ctx.parsed as any)?.y ?? 0).toLocaleString('es-PE')} horas`,
              },
            },
          },
          scales: {
            x: {
              ticks: { maxRotation: 45, minRotation: 20, font: { size: 10 } },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
          },
        },
      });
    }

    // Chart 2: HHEE domingos o feriados
    const domFeriados = records.filter((r) => r.x === 1);
    const domSorted = srt(grp(domFeriados, 'a', (r) => r.h));
    if (c2Ref.current) {
      chartsInstancesRef.current.c2 = new ChartJS(c2Ref.current, {
        type: 'bar',
        data: {
          labels: domSorted.map((x) => x[0]),
          datasets: [
            {
              label: 'Domingos / Feriados',
              data: domSorted.map((x) => +x[1].toFixed(1)),
              backgroundColor: PALETTE[1],
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${((ctx.parsed as any)?.x ?? 0).toLocaleString('es-PE')} horas`,
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
            y: {
              ticks: { font: { size: 10 } },
              grid: { display: false },
            },
          },
        },
      });
    }

    // Chart 3: HHEE sin feriado ni domingos
    const ordinarias = records.filter((r) => r.x === 0);
    const ordSorted = srt(grp(ordinarias, 'a', (r) => r.h));
    if (c3Ref.current) {
      chartsInstancesRef.current.c3 = new ChartJS(c3Ref.current, {
        type: 'bar',
        data: {
          labels: ordSorted.map((x) => x[0]),
          datasets: [
            {
              label: 'Sin Feriado ni Domingos',
              data: ordSorted.map((x) => +x[1].toFixed(1)),
              backgroundColor: PALETTE[0],
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${((ctx.parsed as any)?.x ?? 0).toLocaleString('es-PE')} horas`,
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
            y: {
              ticks: { font: { size: 10 } },
              grid: { display: false },
            },
          },
        },
      });
    }

    // Chart 4: Tendencia semanal por área (apilado)
    const weeks = [...new Set(records.map((r) => r.w))]
      .filter((w) => typeof w === 'number' && w > 0)
      .sort((a, b) => a - b);

    const weekAreaMap: Record<string, number> = {};
    records.forEach((r) => {
      const key = `${r.a}|${r.w}`;
      weekAreaMap[key] = (weekAreaMap[key] || 0) + r.h;
    });

    if (c4Ref.current) {
      chartsInstancesRef.current.c4 = new ChartJS(c4Ref.current, {
        type: 'line',
        data: {
          labels: weeks.map((w) => `Sem ${w}`),
          datasets: areaSorted.map((ar, idx) => ({
            label: ar[0],
            data: weeks.map((w) => +(weekAreaMap[`${ar[0]}|${w}`] || 0).toFixed(1)),
            borderColor: PALETTE[idx % PALETTE.length],
            backgroundColor: PALETTE[idx % PALETTE.length] + '55',
            fill: true,
            tension: 0.25,
            pointRadius: 2,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { font: { size: 10 } },
              grid: { display: false },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, font: { size: 10 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed as any)?.y ?? 0} h`,
              },
            },
          },
        },
      });
    }

    // Chart 5: Días trabajados – Bono (por área)
    const bonoAreaSorted = srt(grp(bonusRecords, 'a', (r) => r.d));
    if (c5Ref.current) {
      chartsInstancesRef.current.c5 = new ChartJS(c5Ref.current, {
        type: 'bar',
        data: {
          labels: bonoAreaSorted.map((x) => x[0]),
          datasets: [
            {
              label: 'Días de Bono',
              data: bonoAreaSorted.map((x) => +x[1].toFixed(1)),
              backgroundColor: PALETTE[2],
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${((ctx.parsed as any)?.y ?? 0).toLocaleString('es-PE')} días de bono`,
              },
            },
          },
          scales: {
            x: {
              ticks: { maxRotation: 45, minRotation: 20, font: { size: 10 } },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
          },
        },
      });
    }

    // Chart 6: Top 3 áreas con mayor HHEE (% del total)
    const top3 = areaSorted.slice(0, 3);
    const top3Labels = top3.map((x) => x[0]);
    const top3Values = top3.map((x) => (totalHours > 0 ? +((x[1] / totalHours) * 100).toFixed(1) : 0));

    // Also include 'Otras Áreas' to sum 100%
    const otherHours = areaSorted.slice(3).reduce((s, x) => s + x[1], 0);
    const otherPct = totalHours > 0 ? +((otherHours / totalHours) * 100).toFixed(1) : 0;

    const donutLabels = [...top3Labels, 'OTRAS ÁREAS'];
    const donutValues = [...top3Values, otherPct];

    if (c6Ref.current) {
      chartsInstancesRef.current.c6 = new ChartJS(c6Ref.current, {
        type: 'doughnut',
        data: {
          labels: donutLabels,
          datasets: [
            {
              data: donutValues,
              backgroundColor: [PALETTE[0], PALETTE[1], PALETTE[2], '#94a3b8'],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, font: { size: 10 } },
            },
            tooltip: {
              callbacks: {
                label: (c) => `${c.label}: ${c.parsed}% (${((c.parsed * totalHours) / 100).toFixed(1)} h)`,
              },
            },
          },
          cutout: '62%',
        },
      });
    }

    return () => {
      Object.values(chartsInstancesRef.current).forEach((c) => c?.destroy());
      chartsInstancesRef.current = {};
    };
  }, [records, bonusRecords]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Chart 1: Tendencia de HHEE por área */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tendencia de HHEE por Área
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            Curva Global
          </span>
        </div>
        <div className="h-64 relative">
          <canvas ref={c1Ref} />
        </div>
      </div>

      {/* Chart 4: Tendencia semanal por área (apilado) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tendencia Semanal por Área (Apilado)
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            Semana 26 a 39
          </span>
        </div>
        <div className="h-64 relative">
          <canvas ref={c4Ref} />
        </div>
      </div>

      {/* Chart 6: Top 3 áreas con mayor HHEE (% del total) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Top 3 Áreas con Mayor HHEE (% del Total)
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            Concentración
          </span>
        </div>
        <div className="h-64 relative">
          <canvas ref={c6Ref} />
        </div>
      </div>

      {/* Chart 3: HHEE sin feriado ni domingos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            HHEE sin Feriado ni Domingos (Ordinarias)
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Jornada Regular
          </span>
        </div>
        <div className="h-64 relative">
          <canvas ref={c3Ref} />
        </div>
      </div>

      {/* Chart 2: HHEE domingos o feriados */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            HHEE Domingos o Feriados
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
            Tarifa 100%
          </span>
        </div>
        <div className="h-64 relative">
          <canvas ref={c2Ref} />
        </div>
      </div>

      {/* Chart 5: Días trabajados – Bono (por área) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Días Trabajados – Bono (por Área)
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
            Incentivo Bono
          </span>
        </div>
        <div className="h-64 relative">
          <canvas ref={c5Ref} />
        </div>
      </div>
    </div>
  );
};
