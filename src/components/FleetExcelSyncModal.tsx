import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  FileCheck,
  Info,
  Truck,
  Sparkles,
} from 'lucide-react';
import { Equipment, MaintenanceIncident } from '../types/fleet';
import { parseFleetExcelFile } from '../utils/fleetExcel';

interface FleetExcelSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEquipos: Equipment[];
  currentIncidencias: MaintenanceIncident[];
  onDataUpdated: (newEquipos: Equipment[], newIncidencias: MaintenanceIncident[], detectedMonths: string[]) => void;
  onResetToDefaults: () => void;
}

export const FleetExcelSyncModal: React.FC<FleetExcelSyncModalProps> = ({
  isOpen,
  onClose,
  currentEquipos,
  currentIncidencias,
  onDataUpdated,
  onResetToDefaults,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    details?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setFeedback(null);

    try {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Formato no compatible. Por favor sube tu archivo Excel establecido (.xlsx, .xls) o .csv.');
      }

      const result = await parseFleetExcelFile(file);

      // Save to localStorage (v3 clean storage)
      try {
        localStorage.setItem('stol_fleet_equipos_v3', JSON.stringify(result.equipos));
        localStorage.setItem('stol_fleet_incidencias_v3', JSON.stringify(result.incidencias));
        localStorage.removeItem('stol_fleet_equipos_v1');
        localStorage.removeItem('stol_fleet_incidencias_v1');
      } catch (storageErr) {
        console.warn('Could not save to localStorage:', storageErr);
      }

      onDataUpdated(result.equipos, result.incidencias, result.detectedMonths);

      setFeedback({
        type: 'success',
        title: '¡Información Sincronizada con Éxito!',
        message: result.message,
        details: [
          `✅ ${result.equipmentCount} equipos cargados y auditados`,
          `⏱️ Métrica de consumo: Columna «Horas usadas» procesada (fórmulas celestes intactas sin números de odómetro de 17,000h)`,
          `🚜 Relevo Derco (24/09): Soporte activo para HGR-279 a 286 y SGR-017 nueva Backup`,
          `📅 Meses en orden cronológico: ${result.detectedMonths.join(', ')}`,
          `📑 Hojas procesadas: ${result.sheetNames.join(', ')}`,
          `💡 Tus fórmulas originales no fueron alteradas ni modificadas.`,
        ],
      });
    } catch (err: any) {
      console.error('Error processing fleet excel:', err);
      setFeedback({
        type: 'error',
        title: 'Error al procesar el archivo Excel',
        message: err.message || 'No se pudo leer el archivo. Verifica que contenga la información de flota u horómetros.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer los equipos y la bitácora a los datos oficiales originales de STOL?')) {
      onResetToDefaults();
      setFeedback({
        type: 'info',
        title: 'Datos Restablecidos',
        message: 'Se han restaurado los 19 equipos y la bitácora oficial original de STOL.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A2E] via-[#1E293B] to-[#0F172A] p-5 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  FORMATO OFICIAL ESTABLECIDO
                </span>
                <span className="text-xs text-slate-300 font-mono">DATA_DASHBOARD_EJECUTIVO.xlsx</span>
              </div>
              <h2 className="text-lg md:text-xl font-black tracking-tight text-white mt-0.5">
                Subir Formato de Horómetros y Flota
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Notice about Formulas & Celeste cells */}
          <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 text-xs text-sky-950 flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                <span>Tu Formato Establecido es Fijo · Tus Fórmulas y Celdas Celestes Están 100% Protegidas</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <b>¿Cómo se leen las fórmulas?</b> Al guardar tu archivo Excel, Excel almacena internamente el <b>resultado numérico calculado</b> de cada fórmula. La plataforma extrae directamente ese resultado final (por ejemplo, las celdas resaltadas en celeste con sumatorias, promedios o cálculos de horas).
              </p>
              <p className="text-slate-700 leading-relaxed">
                <b>Inmutabilidad:</b> El sistema <b>NUNCA altera, borra ni recalcula tus fórmulas</b>. Tu archivo en tu computadora permanece inalterado con todas sus fórmulas originales activas. No se ofrece ningún formato nuevo para no alterar tu orden de trabajo.
              </p>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-3 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <div className="text-base font-black text-slate-900">
                Arrastra aquí tu archivo Excel o haz clic para examinar
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Formatos compatibles: <b className="text-slate-700">.xlsx, .xls, .csv</b> (e.g. DATA_DASHBOARD_EJECUTIVO.xlsx)
              </div>
            </div>

            <button
              type="button"
              className="mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>Seleccionar Archivo de mi Equipo</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-center gap-3 text-xs font-bold animate-pulse">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Procesando archivo de flota y analizando horómetros...</span>
            </div>
          )}

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`rounded-2xl p-4.5 border-2 text-xs space-y-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-blue-50 border-blue-300 text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {feedback.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
                {feedback.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                <span>{feedback.title}</span>
              </div>
              <p className="leading-relaxed">{feedback.message}</p>
              {feedback.details && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 space-y-1 font-mono text-[11px]">
                  {feedback.details.map((d, idx) => (
                    <div key={idx} className="text-emerald-800">
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Columns & Specs Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-black text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-slate-600" />
                Estructura del Formato Oficial Aceptado
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                Multisábana / 2 Hojas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11.5px]">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Hoja 1: "HOROMETROS" / "FLOTA"
                </div>
                <div className="text-slate-600 space-y-0.5 text-[11px]">
                  <div>• <b>CODIGO:</b> HGR-027, HER-160, NOVATRANS 290...</div>
                  <div>• <b>PROVEEDOR:</b> DERCO o NOVA</div>
                  <div>• <b>TIPO:</b> MONTACARGA, ELEVADOR o BACKUP</div>
                  <div>• <b>MES:</b> Setiembre, Agosto, Julio...</div>
                  <div>• <b>HORAS_USADAS / HORAS_INOPERATIVAS:</b> Números</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Hoja 2: "BITACORA" / "INCIDENCIAS"
                </div>
                <div className="text-slate-600 space-y-0.5 text-[11px]">
                  <div>• <b>FECHA:</b> Día/Mes/Año (ej: 15/09/2026)</div>
                  <div>• <b>CODIGO:</b> Equipo asignado</div>
                  <div>• <b>TIPO:</b> Correctivo, Preventivo, Observación</div>
                  <div>• <b>RESULTADO:</b> Reparado o Pendiente</div>
                  <div>• <b>MOTIVO:</b> Detalle de la avería o reporte</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Restablecer equipos y bitácora a los valores oficiales iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restablecer Datos Iniciales</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer transition-all"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
