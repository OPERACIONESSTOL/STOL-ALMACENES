import React, { useState, useEffect } from 'react';
import { SupervisorWeekly } from '../types/performance';
import { X, Check, Calendar } from 'lucide-react';

interface EditWeeklyModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekly: SupervisorWeekly | null;
  onSave: (updated: SupervisorWeekly) => void;
}

export const EditWeeklyModal: React.FC<EditWeeklyModalProps> = ({
  isOpen,
  onClose,
  weekly,
  onSave,
}) => {
  const [formData, setFormData] = useState<SupervisorWeekly | null>(null);

  useEffect(() => {
    if (weekly) {
      setFormData({ ...weekly });
    }
  }, [weekly, isOpen]);

  if (!isOpen || !formData) return null;

  const handleWeekChange = (key: keyof SupervisorWeekly['weeks'], val: string) => {
    const num = val.trim() === '' ? null : parseFloat(val);
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            weeks: {
              ...prev.weeks,
              [key]: isNaN(num as number) ? null : num,
            },
          }
        : null
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const weekKeys: Array<{ key: keyof SupervisorWeekly['weeks']; label: string }> = [
    { key: 'sem40', label: 'Semana 40' },
    { key: 'sem41', label: 'Semana 41' },
    { key: 'sem42', label: 'Semana 42' },
    { key: 'sem43', label: 'Semana 43' },
    { key: 'sem44', label: 'Semana 44' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Editar Semanas – {formData.supervisorName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Octubre 2026 (Ponderación 60% Operaciones + 20% RRHH + 20% SIG)
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="space-y-3">
            {weekKeys.map(({ key, label }) => {
              const val = formData.weeks[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200"
                >
                  <span className="font-black text-slate-700 text-xs">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={val !== null && val !== undefined ? val : ''}
                      onChange={(e) => handleWeekChange(key, e.target.value)}
                      className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-center font-black text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-colors"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Guardar Semanas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
