import React, { useState, useEffect } from 'react';
import { SupervisorMonthly } from '../types/performance';
import { X, Check, Trash2, UserPlus, UserCheck } from 'lucide-react';

interface EditSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: SupervisorMonthly | null;
  onSave: (updated: SupervisorMonthly) => void;
  onDelete?: (id: string) => void;
}

export const EditSupervisorModal: React.FC<EditSupervisorModalProps> = ({
  isOpen,
  onClose,
  supervisor,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<SupervisorMonthly | null>(null);

  useEffect(() => {
    if (supervisor) {
      setFormData({ ...supervisor });
    } else {
      setFormData({
        id: `sup-${Date.now()}`,
        name: '',
        badge: '',
        directBoss: 'Pedro Morante',
        active: true,
        months: {
          ene: null,
          feb: null,
          mar: null,
          abr: null,
          may: null,
          jun: null,
          jul: null,
          ago: null,
          set: null,
          oct: null,
        },
      });
    }
  }, [supervisor, isOpen]);

  if (!isOpen || !formData) return null;

  const handleMonthChange = (monthKey: keyof SupervisorMonthly['months'], val: string) => {
    const num = val.trim() === '' ? null : parseFloat(val);
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            months: {
              ...prev.months,
              [monthKey]: isNaN(num as number) ? null : num,
            },
          }
        : null
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  const monthsKeys: Array<{ key: keyof SupervisorMonthly['months']; label: string }> = [
    { key: 'ene', label: 'Enero' },
    { key: 'feb', label: 'Febrero' },
    { key: 'mar', label: 'Marzo' },
    { key: 'abr', label: 'Abril' },
    { key: 'may', label: 'Mayo' },
    { key: 'jun', label: 'Junio' },
    { key: 'jul', label: 'Julio' },
    { key: 'ago', label: 'Agosto' },
    { key: 'set', label: 'Setiembre' },
    { key: 'oct', label: 'Octubre' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              {supervisor ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                {supervisor ? 'Modificar Supervisor y Calificaciones' : 'Agregar Nuevo Supervisor'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Actualiza datos generales y calificaciones mensuales (0 - 100%)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* General info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Nombre del Supervisor Operativo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Jaiter Girón"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Jefe Directo</label>
              <input
                type="text"
                value={formData.directBoss}
                onChange={(e) => setFormData({ ...formData, directBoss: e.target.value })}
                placeholder="ej. Pedro Morante o Aldo Bautista"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Distintivo / Badge (Opcional)
              </label>
              <input
                type="text"
                value={formData.badge || ''}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="ej. 1° General, Desde Mayo, Hasta Abril"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>Supervisor Activo en Octubre</span>
              </label>
            </div>
          </div>

          {/* Monthly Grades */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-black text-slate-900 uppercase text-xs">
                Calificaciones Mensuales (%)
              </h4>
              <span className="text-[11px] text-slate-500">
                Deja en blanco para meses donde no estuvo activo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {monthsKeys.map(({ key, label }) => {
                const val = formData.months[key];
                return (
                  <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {label}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="–"
                        value={val !== null && val !== undefined ? val : ''}
                        onChange={(e) => handleMonthChange(key, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-xs text-center focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Grade Override */}
          <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-black text-blue-950 text-xs">Nota Final Oficial Consolidada</div>
              <div className="text-[11px] text-blue-800">
                Si se deja vacío, el sistema calculará automáticamente el promedio aritmético exacto
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Auto"
                value={
                  formData.finalGradeOverride !== null && formData.finalGradeOverride !== undefined
                    ? formData.finalGradeOverride
                    : ''
                }
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setFormData({
                    ...formData,
                    finalGradeOverride: val === '' ? null : parseFloat(val),
                  });
                }}
                className="w-20 bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-center font-black text-slate-900 text-sm focus:outline-none focus:border-blue-600"
              />
              <span className="font-bold text-blue-900">%</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {supervisor && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Estás seguro de eliminar a ${supervisor.name}?`)) {
                  onDelete(supervisor.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
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
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
