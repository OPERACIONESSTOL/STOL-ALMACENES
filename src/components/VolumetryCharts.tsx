import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { SkuMeasurement } from '../types/volumetry';
import {
  TrendingUp,
  PieChart as PieIcon,
  AlertTriangle,
  Scale,
  Layers,
  UserCheck,
} from 'lucide-react';

ChartJS.register(...registerables);

interface VolumetryChartsProps {
  measurements: SkuMeasurement[];
}

const PALETTE = [
  '#1e40af', // Blue 800
  '#0284c7', // Sky 600
  '#0d9488', // Teal 600
  '#e11d48', // Rose 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#475569', // Slate 600
  '#059669', // Emerald 600
  '#c026d3', // Fuchsia 600
];

export const VolumetryCharts: React.FC<VolumetryChartsProps> = ({ measurements }) => {
  const chart1Ref = useRef<HTMLCanvasElement | null>(null);
  const chart2Ref = useRef<HTMLCanvasElement | null>(null);
  const chart3Ref = useRef<HTMLCanvasElement | null>(null);
  const chart4Ref = useRef<HTMLCanvasElement | null>(null);
  const chart5Ref = useRef<HTMLCanvasElement | null>(null);
  const chart6Ref = useRef<HTMLCanvasElement | null>(null);

  const chartInstancesRef = useRef<Record<string, ChartJS | null>>({});

  useEffect(() => {
    // Clean up previous instances
    Object.values(chartInstancesRef.current).forEach((c) => c?.destroy());
    chartInstancesRef.current = {};

    if (!measurements || measurements.length === 0) return;

    // --- CHART 1: Evolución Temporal de Volumen (m³) y SKUs Medidos ---
    if (chart1Ref.current) {
      // Group by date
      const dateMap: Record<string, { m3: number; count: number }> = {};
      measurements.forEach((m) => {
        const d = m.fecha || 'Sin fecha';
        if (!dateMap[d]) dateMap[d] = { m3: 0, count: 0 };
        dateMap[d].m3 += m.volumenM3;
        dateMap[d].count += 1;
      });

      const sortedDates = Object.keys(dateMap).sort();
      const labels = sortedDates.map((d) => {
        // Format YYYY-MM-DD to DD/MM
        const p = d.split('-');
        return p.length === 3 ? `${p[2]}/${p[1]}` : d;
      });
      const dataM3 = sortedDates.map((d) => parseFloat(dateMap[d].m3.toFixed(2)));
      const dataCount = sortedDates.map((d) => dateMap[d].count);

      chartInstancesRef.current['c1'] = new ChartJS(chart1Ref.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Volumen Total (m³)',
              data: dataM3,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.35,
              yAxisID: 'yM3',
              pointBackgroundColor: '#1d4ed8',
              pointRadius: 4,
            },
            {
              type: 'bar',
              label: 'SKUs Medidos',
              data: dataCount,
              backgroundColor: 'rgba(148, 163, 184, 0.45)',
              hoverBackgroundColor: 'rgba(71, 85, 105, 0.7)',
              borderRadius: 6,
              yAxisID: 'yCount',
              barPercentage: 0.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = (ctx.parsed as any)?.y ?? 0;
                  return ctx.datasetIndex === 0
                    ? `Volumen: ${val.toLocaleString('es-PE')} m³`
                    : `SKUs Medidos: ${val} productos`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: 'bold' } },
            },
            yM3: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'Volumen (m³)', font: { size: 10 } },
              ticks: { font: { size: 10 } },
              grid: { color: 'rgba(226, 232, 240, 0.6)' },
            },
            yCount: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'Cant. SKUs', font: { size: 10 } },
              grid: { display: false },
              ticks: { font: { size: 10 } },
            },
          },
        },
      });
    }

    // --- CHART 2: Semáforo de Discrepancias vs Maestro WMS ---
    if (chart2Ref.current) {
      const conformes = measurements.filter((m) => m.estado === 'Conforme').length;
      const menores = measurements.filter((m) => m.estado === 'Variación Menor').length;
      const criticas = measurements.filter((m) => m.estado === 'Discrepancia Crítica').length;
      const pendientes = measurements.filter((m) => m.estado === 'Pendiente Validación').length;

      chartInstancesRef.current['c2'] = new ChartJS(chart2Ref.current, {
        type: 'doughnut',
        data: {
          labels: [
            'Conforme (0 - 5%)',
            'Variación Menor (5.1 - 15%)',
            'Discrepancia Crítica (> 15%)',
            ...(pendientes > 0 ? ['Pendiente Validación'] : []),
          ],
          datasets: [
            {
              data: [
                conformes,
                menores,
                criticas,
                ...(pendientes > 0 ? [pendientes] : []),
              ],
              backgroundColor: [
                '#10b981', // Conforme (Emerald)
                '#f59e0b', // Menor (Amber)
                '#e11d48', // Crítica (Rose)
                '#64748b', // Pendiente (Slate)
              ],
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
              labels: { boxWidth: 12, font: { size: 11, weight: 'bold' }, padding: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed ?? 0;
                  const pct = ((val / measurements.length) * 100).toFixed(1);
                  return ` ${ctx.label}: ${val} SKUs (${pct}%)`;
                },
              },
            },
          },
          cutout: '62%',
        },
      });
    }

    // --- CHART 3: Distribución Volumétrica por Categoría ---
    if (chart3Ref.current) {
      const catMap: Record<string, number> = {};
      measurements.forEach((m) => {
        const cat = m.categoria || 'Sin Categoría';
        catMap[cat] = (catMap[cat] || 0) + m.volumenM3;
      });

      const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
      const topCats = sortedCats.slice(0, 6);
      const otherM3 = sortedCats.slice(6).reduce((acc, curr) => acc + curr[1], 0);

      const labels = topCats.map((c) => c[0]);
      const values = topCats.map((c) => parseFloat(c[1].toFixed(2)));
      if (otherM3 > 0) {
        labels.push('Otras Categorías');
        values.push(parseFloat(otherM3.toFixed(2)));
      }

      chartInstancesRef.current['c3'] = new ChartJS(chart3Ref.current, {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: PALETTE.slice(0, labels.length),
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
              labels: { boxWidth: 12, font: { size: 10, weight: 'bold' }, padding: 8 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = (ctx.parsed as number) || 0;
                  const total = values.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                  return ` ${ctx.label}: ${val} m³ (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    // --- CHART 4: Volumen Medido por Proceso Logístico ---
    if (chart4Ref.current) {
      const procMap: Record<string, { m3: number; skus: number }> = {};
      measurements.forEach((m) => {
        const proc = m.proceso || 'Otros';
        if (!procMap[proc]) procMap[proc] = { m3: 0, skus: 0 };
        procMap[proc].m3 += m.volumenM3;
        procMap[proc].skus += 1;
      });

      const procs = Object.keys(procMap);
      const m3Data = procs.map((p) => parseFloat(procMap[p].m3.toFixed(2)));

      chartInstancesRef.current['c4'] = new ChartJS(chart4Ref.current, {
        type: 'bar',
        data: {
          labels: procs,
          datasets: [
            {
              label: 'Volumen Medido (m³)',
              data: m3Data,
              backgroundColor: [
                '#1e40af', // Recepción
                '#0284c7', // Almacenamiento
                '#0d9488', // Despacho
                '#d97706', // Cross-docking
                '#7c3aed', // Auditoría
              ],
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.05)',
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
                label: (ctx) => {
                  const p = procs[ctx.dataIndex];
                  const m3 = (ctx.parsed as any)?.y ?? 0;
                  const skus = procMap[p]?.skus || 0;
                  return `Volumen: ${m3} m³ (${skus} SKUs)`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: 'bold' } },
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: 'rgba(226, 232, 240, 0.6)' },
              title: { display: true, text: 'Volumen Total (m³)', font: { size: 10 } },
            },
          },
        },
      });
    }

    // --- CHART 5: Top 10 SKUs con Mayor Discrepancia Dimensional (%) ---
    if (chart5Ref.current) {
      // Sort by absolute variation percentage descending
      const topDiscrepancies = [...measurements]
        .sort((a, b) => b.variacionVolPct - a.variacionVolPct)
        .slice(0, 10);

      const labels = topDiscrepancies.map((m) => m.sku);
      const diffValues = topDiscrepancies.map((m) => m.variacionVolPct);
      const bgColors = topDiscrepancies.map((m) =>
        m.variacionVolPct > 15 ? '#e11d48' : m.variacionVolPct > 5 ? '#f59e0b' : '#10b981'
      );

      chartInstancesRef.current['c5'] = new ChartJS(chart5Ref.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Desviación vs WMS (%)',
              data: diffValues,
              backgroundColor: bgColors,
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
                title: (items) => {
                  const idx = items[0].dataIndex;
                  const skuItem = topDiscrepancies[idx];
                  return `${skuItem.sku} - ${skuItem.descripcion}`;
                },
                label: (ctx) => {
                  const idx = ctx.dataIndex;
                  const m = topDiscrepancies[idx];
                  const diff = (ctx.parsed as any)?.x ?? 0;
                  return [
                    `Desviación: +${diff}%`,
                    `Físico: ${m.largoCm}x${m.anchoCm}x${m.altoCm} cm (${m.volumenM3} m³)`,
                    `Maestro WMS: ${m.masterLargoCm}x${m.masterAnchoCm}x${m.masterAltoCm} cm (${m.masterVolumenM3} m³)`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (val) => `${val}%`,
                font: { size: 10 },
              },
              grid: { color: 'rgba(226, 232, 240, 0.6)' },
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: 'bold' } },
            },
          },
        },
      });
    }

    // --- CHART 6: Rendimiento y Mediciones por Auditor / Operador ---
    if (chart6Ref.current) {
      const userMap: Record<string, { count: number; criticas: number }> = {};
      measurements.forEach((m) => {
        const u = m.usuario || 'Sin asignar';
        if (!userMap[u]) userMap[u] = { count: 0, criticas: 0 };
        userMap[u].count += 1;
        if (m.estado === 'Discrepancia Crítica') {
          userMap[u].criticas += 1;
        }
      });

      const users = Object.keys(userMap).sort((a, b) => userMap[b].count - userMap[a].count);
      const counts = users.map((u) => userMap[u].count);
      const criticasData = users.map((u) => userMap[u].criticas);

      chartInstancesRef.current['c6'] = new ChartJS(chart6Ref.current, {
        type: 'bar',
        data: {
          labels: users,
          datasets: [
            {
              label: 'Mediciones Realizadas',
              data: counts,
              backgroundColor: '#1e40af',
              borderRadius: 6,
            },
            {
              label: 'Discrepancias Detectadas',
              data: criticasData,
              backgroundColor: '#e11d48',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = (ctx.parsed as any)?.y ?? 0;
                  return `${ctx.dataset.label}: ${val}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: 'bold' } },
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              grid: { color: 'rgba(226, 232, 240, 0.6)' },
            },
          },
        },
      });
    }

    return () => {
      Object.values(chartInstancesRef.current).forEach((c) => c?.destroy());
      chartInstancesRef.current = {};
    };
  }, [measurements]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Chart 1: Evolución Temporal */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Evolución de Cubicaje Diario
              </h4>
              <p className="text-[10px] text-slate-500">Volumen m³ y SKUs cubicados</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
            Línea & Barras
          </span>
        </div>
        <div className="h-60 mt-3 relative">
          <canvas ref={chart1Ref} />
        </div>
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
          <span>Fuente: Maestro de SKUs</span>
          <span className="font-bold text-slate-700">Doble Eje (m³ / Cantidad)</span>
        </div>
      </div>

      {/* Chart 2: Semáforo Discrepancias */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Conformidad vs Maestro WMS
              </h4>
              <p className="text-[10px] text-slate-500">Semáforo de tolerancia dimensional</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
            Auditoría
          </span>
        </div>
        <div className="h-60 mt-3 relative">
          <canvas ref={chart2Ref} />
        </div>
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
          <span>Tolerancia WMS: 5%</span>
          <span className="font-bold text-rose-600">&gt;15% Requiere Acción</span>
        </div>
      </div>

      {/* Chart 3: Distribución por Categoría */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Volumen por Categoría
              </h4>
              <p className="text-[10px] text-slate-500">Concentración de espacio útil (m³)</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
            Familias
          </span>
        </div>
        <div className="h-60 mt-3 relative">
          <canvas ref={chart3Ref} />
        </div>
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
          <span>Top categorías</span>
          <span className="font-bold text-slate-700">Participación m³</span>
        </div>
      </div>

      {/* Chart 4: Volumen por Proceso */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Cubicaje por Proceso Operativo
              </h4>
              <p className="text-[10px] text-slate-500">Punto de control de entrada y salida</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
            Flujo
          </span>
        </div>
        <div className="h-60 mt-3 relative">
          <canvas ref={chart4Ref} />
        </div>
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
          <span>Recepción vs Despacho</span>
          <span className="font-bold text-slate-700">100% de datos</span>
        </div>
      </div>

      {/* Chart 5: Top 10 Desviaciones Críticas */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Top 10 Desviaciones (% vs WMS)
              </h4>
              <p className="text-[10px] text-slate-500">Mayor riesgo de distorsión en fletes</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
            Críticos
          </span>
        </div>
        <div className="h-60 mt-3 relative">
          <canvas ref={chart5Ref} />
        </div>
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
          <span>Ordenado por % diferencia</span>
          <span className="font-bold text-rose-700">Actualizar Ficha Técnica</span>
        </div>
      </div>

      {/* Chart 6: Eficiencia por Operario */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-50 text-cyan-700 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">
                Rendimiento por Operario / Auditor
              </h4>
              <p className="text-[10px] text-slate-500">Mediciones vs Discrepancias halladas</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">
            Productividad
          </span>
        </div>
        <div className="h-60 mt-3 relative">
          <canvas ref={chart6Ref} />
        </div>
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
          <span>Eficiencia Operativa</span>
          <span className="font-bold text-blue-700">Barrido Diario</span>
        </div>
      </div>
    </div>
  );
};
