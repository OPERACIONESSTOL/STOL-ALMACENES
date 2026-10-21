import React, { useState } from 'react';
import {
  SupervisorMonthly,
  SupervisorWeekly,
  ObservationItem,
  QuarterlySummary,
  GlobalDashboardConfig,
} from '../types/performance';
import { X, Download, RotateCcw, Target, FileText } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GlobalDashboardConfig;
  onUpdateConfig: (cfg: Partial<GlobalDashboardConfig>) => void;
  supervisors: SupervisorMonthly[];
  weeklies: SupervisorWeekly[];
  observations: ObservationItem[];
  quarterly: QuarterlySummary;
  onResetDefaults: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  supervisors,
  weeklies,
  observations,
  quarterly,
  onResetDefaults,
}) => {
  const [metaInput, setMetaInput] = useState<number>(config.metaERU);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backup = {
      config,
      supervisors,
      weeklies,
      observations,
      quarterly,
      exportDate: new Date().toISOString(),
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', jsonStr);
    dl.setAttribute('download', `evaluacion_supervisores_stol_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Supervisor', 'Jefe Directo', 'Distintivo', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nota Final'];
    const rows = supervisors.map((s) => [
      s.id,
      `"${s.name}"`,
      `"${s.directBoss}"`,
      `"${s.badge || ''}"`,
      s.months.ene ?? '',
      s.months.feb ?? '',
      s.months.mar ?? '',
      s.months.abr ?? '',
      s.months.may ?? '',
      s.months.jun ?? '',
      s.months.jul ?? '',
      s.months.ago ?? '',
      s.months.set ?? '',
      s.months.oct ?? '',
      s.finalGradeOverride ?? '',
    ]);

    const csvStr = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvStr));
    dl.setAttribute('download', `consolidado_supervisores_2026_${Date.now()}.csv`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  const handleSaveMeta = () => {
    onUpdateConfig({ metaERU: metaInput });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Administración de Datos & Configuración
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Metas institucionales, copia de seguridad y exportación de reportes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Target Meta ERU Config */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-black text-amber-950 text-xs">Meta Institucional ERU (%)</div>
              <div className="text-[11px] text-amber-800">
                Límite estándar de cumplimiento operacional para cálculo de brechas
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={metaInput}
                onChange={(e) => setMetaInput(parseFloat(e.target.value) || 0)}
                className="w-20 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-center font-black text-slate-900 text-sm focus:outline-none focus:border-amber-600"
              />
              <span className="font-black text-amber-950">%</span>
              <button
                onClick={handleSaveMeta}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h4 className="font-black text-slate-900 uppercase text-xs mb-2">
              Descargar y Respaldar Reporte
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Exportar Matriz a CSV (Excel)</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Exportar Base Completa (JSON)</span>
              </button>
            </div>
          </div>

          {/* Reset Defaults */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <div>
              <div className="font-black text-rose-900 text-xs">Restablecer Valores Iniciales</div>
              <div className="text-[11px] text-slate-500">
                Regresa todas las notas y observaciones al estado inicial de fábrica
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('¿Restablecer todas las notas y observaciones a los valores oficiales iniciales?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Datos</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
