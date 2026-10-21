import React, { useMemo, useState } from 'react';
import { OvertimeRecord } from '../types/overtime';
import { formatHours } from '../utils/overtimeExcel';
import { Table, Search, Download, ArrowUpDown } from 'lucide-react';

interface OvertimeMatrixProps {
  records: OvertimeRecord[];
  allAreas: string[];
}

export const OvertimeMatrix: React.FC<OvertimeMatrixProps> = ({ records, allAreas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Compute cargo and area matrix
  const { cargos, areas, matrix, cargoTotals, areaTotals, grandTotal, maxVal } = useMemo(() => {
    const areaMap: Record<string, number> = {};
    const cargoMap: Record<string, number> = {};
    const cellMap: Record<string, number> = {};
    let total = 0;

    records.forEach((r) => {
      total += r.h;
      areaMap[r.a] = (areaMap[r.a] || 0) + r.h;
      cargoMap[r.c] = (cargoMap[r.c] || 0) + r.h;
      const key = `${r.c}|${r.a}`;
      cellMap[key] = (cellMap[key] || 0) + r.h;
    });

    // Areas sorted descending by total hours
    const sortedAreas = Object.keys(areaMap).sort((a, b) => areaMap[b] - areaMap[a]);

    // Cargos sorted descending or ascending
    let sortedCargos = Object.keys(cargoMap).sort((a, b) => {
      return sortOrder === 'desc' ? cargoMap[b] - cargoMap[a] : cargoMap[a] - cargoMap[b];
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      sortedCargos = sortedCargos.filter((c) => c.toLowerCase().includes(q));
    }

    const max = Math.max(...Object.values(cellMap), 1);

    return {
      cargos: sortedCargos,
      areas: sortedAreas,
      matrix: cellMap,
      cargoTotals: cargoMap,
      areaTotals: areaMap,
      grandTotal: total,
      maxVal: max,
    };
  }, [records, searchTerm, sortOrder]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Matriz HHEE: Cargos vs Áreas (Horas Extras)
            </h3>
            <p className="text-xs text-slate-500">
              Distribución matricial interactiva y mapa de calor de intensidad de horas extras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search cargo */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cargo..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-36 sm:w-48"
            />
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Alternar orden"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}</span>
          </button>
        </div>
      </div>

      {/* Heatmap Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200">
              <th className="py-2.5 px-3 text-left font-bold text-slate-800 uppercase tracking-wider sticky left-0 bg-slate-100 z-10 min-w-[160px]">
                Cargo / Rol
              </th>
              {areas.map((area) => (
                <th
                  key={area}
                  className="py-2.5 px-3 text-right font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[105px]"
                >
                  {area}
                </th>
              ))}
              <th className="py-2.5 px-3 text-right font-black text-blue-900 uppercase tracking-wider bg-blue-50/70 min-w-[110px]">
                Total Cargo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargos.length === 0 ? (
              <tr>
                <td colSpan={areas.length + 2} className="py-8 text-center text-slate-400 italic">
                  No hay cargos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              cargos.map((cargo) => {
                const total = cargoTotals[cargo] || 0;
                return (
                  <tr key={cargo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 z-10 whitespace-nowrap">
                      {cargo}
                    </td>
                    {areas.map((area) => {
                      const val = matrix[`${cargo}|${area}`] || 0;
                      // Heatmap alpha intensity up to 0.45
                      const intensity = val > 0 ? Math.min(0.55, 0.08 + (val / maxVal) * 0.45) : 0;
                      const bgColor = val > 0 ? `rgba(31, 78, 156, ${intensity.toFixed(2)})` : 'transparent';
                      const textColor = intensity > 0.35 ? '#1e3a8a' : '#1e293b';

                      return (
                        <td
                          key={area}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className={`py-2 px-3 text-right tabular-nums transition-colors ${
                            val > 0 ? 'font-medium' : 'text-slate-300'
                          }`}
                        >
                          {val > 0 ? formatHours(val) : '—'}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 bg-blue-50/40 tabular-nums">
                      {formatHours(total)} h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
              <td className="py-3 px-3 text-left uppercase tracking-wider sticky left-0 bg-slate-900 z-10">
                Total General
              </td>
              {areas.map((area) => (
                <td key={area} className="py-3 px-3 text-right tabular-nums text-cyan-300 font-bold whitespace-nowrap">
                  {formatHours(areaTotals[area] || 0)} h
                </td>
              ))}
              <td className="py-3 px-3 text-right tabular-nums text-amber-300 font-black text-sm whitespace-nowrap bg-slate-950">
                {formatHours(grandTotal)} h
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend & Note */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Intensidad de Horas:</span>
          <div className="flex items-center gap-1">
            <span className="w-4 h-3 rounded bg-blue-50 border border-slate-200 inline-block"></span>
            <span className="text-[11px]">Baja</span>
            <span className="w-4 h-3 rounded bg-blue-200 inline-block ml-1"></span>
            <span className="text-[11px]">Media</span>
            <span className="w-4 h-3 rounded bg-blue-600 inline-block ml-1"></span>
            <span className="text-[11px] font-semibold text-blue-900">Alta</span>
          </div>
        </div>
        <div>
          <span>Total Cargos: <b>{cargos.length}</b> | Total Áreas: <b>{areas.length}</b></span>
        </div>
      </div>
    </div>
  );
};
