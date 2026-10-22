import React from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';
import { BonusRecord, OvertimeDataset } from '../types/overtime';

interface AuditBonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: OvertimeDataset;
  filteredBono: BonusRecord[];
}

export const AuditBonoModal: React.FC<AuditBonoModalProps> = ({
  isOpen,
  onClose,
  dataset,
  filteredBono,
}) => {
  if (!isOpen) return null;

  const totalRawBonoDays = dataset.bo.reduce((s, b) => s + b.d, 0);
  const totalFilteredBonoDays = filteredBono.reduce((s, b) => s + b.d, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Auditoría de Cálculo de Bonos</h3>
              <p className="text-xs text-slate-500">Desglose comparativo entre datos brutos e integrados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase text-slate-500">Total Bruto (Data Base)</span>
            <div className="text-2xl font-black text-slate-900">{totalRawBonoDays.toLocaleString('es-PE')}</div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <span className="text-xs font-bold uppercase text-indigo-600">Total Filtrado / Escalar</span>
            <div className="text-2xl font-black text-indigo-700">{totalFilteredBonoDays.toLocaleString('es-PE')}</div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            La diferencia puede deberse a que el cálculo aplica un factor de escala (ratio) cuando los registros de HHEE no cubren el 100% del rango de fechas esperado para el área o cargo, o si el registro de bono no tiene fechas explícitas (<code>del</code>/<code>al</code>).
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-slate-700">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Área</th>
                <th className="p-2 text-left">Cargo</th>
                <th className="p-2 text-right">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBono.map((b, i) => (
                <tr key={i}>
                  <td className="p-2">{b.a}</td>
                  <td className="p-2">{b.c}</td>
                  <td className="p-2 text-right font-mono">{b.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
