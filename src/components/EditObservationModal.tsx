import React, { useState, useEffect } from 'react';
import { ObservationItem, ObservationPillar } from '../types/performance';
import { X, Check, Trash2, AlertCircle } from 'lucide-react';

interface EditObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  observation: ObservationItem | null;
  onSave: (updated: ObservationItem) => void;
  onDelete?: (id: string) => void;
  supervisorNames: string[];
}

export const EditObservationModal: React.FC<EditObservationModalProps> = ({
  isOpen,
  onClose,
  observation,
  onSave,
  onDelete,
  supervisorNames,
}) => {
  const [formData, setFormData] = useState<ObservationItem | null>(null);

  useEffect(() => {
    if (observation) {
      setFormData({ ...observation });
    } else {
      setFormData({
        id: `obs-${Date.now()}`,
        supervisorName: supervisorNames[0] || 'Pedro Oliva',
        pillar: 'Operaciones',
        deductionPoints: -5.0,
        title: '',
        description: '',
        auditor: 'Karla Bolívar',
        period: 'Semana 41 · Octubre',
      });
    }
  }, [observation, isOpen, supervisorNames]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                {observation ? 'Modificar Observación' : 'Registrar Nueva Observación'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Evidencia de auditoría para sustento de descuentos de calificación
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Supervisor Observado *
              </label>
              <select
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                {supervisorNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Pilar Evaluado (60/20/20) *
              </label>
              <select
                value={formData.pillar}
                onChange={(e) =>
                  setFormData({ ...formData, pillar: e.target.value as ObservationPillar })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="Operaciones">Operaciones (60%)</option>
                <option value="RRHH">RRHH (20%)</option>
                <option value="SIG">SIG (20%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-rose-700 mb-1">
                Puntos de Descuento (ej. -6.8) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.deductionPoints}
                onChange={(e) =>
                  setFormData({ ...formData, deductionPoints: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-50 border border-rose-300 rounded-xl px-3 py-2 text-rose-700 font-black text-sm focus:outline-none focus:border-rose-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                Auditor Evaluador *
              </label>
              <input
                type="text"
                required
                value={formData.auditor}
                onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                placeholder="ej. Karla Bolívar o Makley Villanueva"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Período / Semana Auditada *
            </label>
            <input
              type="text"
              required
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              placeholder="ej. Semana 41 · Octubre"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Título Breve del Hallazgo *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ej. Control de Pallets Observados"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">
              Descripción y Justificación de la Falta *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe detalladamente los hechos observados y la afectación..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {observation && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Eliminar esta observación de la bitácora?')) {
                  onDelete(observation.id);
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
              <span>Guardar Observación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
