import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import {
  Upload,
  Plus,
  Box,
  Truck,
  Users,
  Clock,
  X,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Building,
} from 'lucide-react';

interface OperacionesFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule?: (mod: any) => void;
}

export const OperacionesFeedModal: React.FC<OperacionesFeedModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule,
}) => {
  const { lastOperationFeed } = useRole();
  const [selectedFeedType, setSelectedFeedType] = useState<
    'hhee' | 'volumetry' | 'fleet' | 'supervisors'
  >('hhee');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
              Módulo de Carga Operativa
            </span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-blue-200">Sede Almacén Central</span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            ALIMENTACIÓN DE INFORMACIÓN OPERATIVA
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-normal">
            Ingreso de datos en sede para actualización de indicadores visibles por el Directorio.
          </p>
        </div>

        {/* Success Alert */}
        {successToast && (
          <div className="m-5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Body Feed Options */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Selecciona el tipo de información que vas a registrar:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Feed 1: Horas Extras */}
            <div
              onClick={() => setSelectedFeedType('hhee')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedFeedType === 'hhee'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Cargar Excel de HHEE</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Importar archivo <code>.xlsx</code> oficial con hojas <code>HHEE</code> y <code>BONO</code>.
              </p>
            </div>

            {/* Feed 2: Volumetría */}
            <div
              onClick={() => setSelectedFeedType('volumetry')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedFeedType === 'volumetry'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Registrar Cubicaje SKU</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Ingresar medición física (Largo, Ancho, Alto, Peso) y comparar contra el maestro WMS.
              </p>
            </div>

            {/* Feed 3: Flota */}
            <div
              onClick={() => setSelectedFeedType('fleet')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedFeedType === 'fleet'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Reportar Falla de Flota</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Registrar equipo con parada inoperativa, proveedor (NOVATRANS/DERCO) y SLA técnico.
              </p>
            </div>

            {/* Feed 4: Supervisores */}
            <div
              onClick={() => setSelectedFeedType('supervisors')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedFeedType === 'supervisors'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Auditoría Supervisores</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Actualizar evaluación 60/20/20, deducción de notas y planes correctivos de guardia.
              </p>
            </div>
          </div>

          {/* Action trigger */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Ir a la pantalla operativa seleccionada:
              </span>
              <span className="text-[11px] text-slate-500">
                Se abrirá el módulo correspondiente con sus herramientas de edición activas.
              </span>
            </div>

            <button
              onClick={() => {
                if (onNavigateToModule) {
                  onNavigateToModule(selectedFeedType === 'hhee' ? 'overtime' : selectedFeedType);
                }
                showSuccess('Accediendo al módulo de carga operativa...');
              }}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              Abrir Pantalla de Carga →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between text-xs text-slate-500">
          <span>Último registro cargado: <b>{lastOperationFeed}</b></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
