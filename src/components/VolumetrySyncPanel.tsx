import React, { useState, useRef } from 'react';
import {
  Cloud,
  UploadCloud,
  RefreshCw,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Link2,
  FolderOpen,
  Info,
  Clock,
  Database,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  parseSkuMasterFile,
  fetchAndParseSkuMasterFromUrl,
  downloadOfficialSkuMasterTemplate,
  ParseSkuMasterResult,
} from '../utils/skuMasterExcel';
import { SkuMeasurement } from '../types/volumetry';

interface VolumetrySyncPanelProps {
  onDataLoaded: (newMeasurements: SkuMeasurement[], mode: 'replace' | 'merge') => void;
  currentCount: number;
  lastSyncTime: string | null;
  onlineUrl: string;
  onSaveOnlineUrl: (url: string) => void;
  syncInterval: number; // in minutes (0 = manual)
  onSetSyncInterval: (intervalMinutes: number) => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const VolumetrySyncPanel: React.FC<VolumetrySyncPanelProps> = ({
  onDataLoaded,
  currentCount,
  lastSyncTime,
  onlineUrl,
  onSaveOnlineUrl,
  syncInterval,
  onSetSyncInterval,
  isSyncing,
  onTriggerSync,
}) => {
  const [localUrl, setLocalUrl] = useState(onlineUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [loadMode, setLoadMode] = useState<'replace' | 'merge'>('replace');
  const [fileLoading, setFileLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOnlineUrl(localUrl);
    setFeedback({
      type: 'info',
      message: 'Enlace a carpeta pública guardado exitosamente.',
      details: 'Ahora puede presionar "Sincronizar en Línea Ahora" para probar la conexión.',
    });
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv|xlsm)$/i)) {
      setFeedback({
        type: 'error',
        message: 'Formato no soportado',
        details: 'Por favor suba un archivo en formato Excel (.xlsx, .xls) o CSV.',
      });
      return;
    }

    setFileLoading(true);
    setFeedback(null);

    try {
      const result: ParseSkuMasterResult = await parseSkuMasterFile(file);

      if (result.success && result.measurements.length > 0) {
        onDataLoaded(result.measurements, loadMode);
        setFeedback({
          type: 'success',
          message: `¡Carga exitosa! Se procesaron ${result.totalRowsParsed} registros de SKUs.`,
          details: `Hoja: "${result.sheetName}" • Volumen: ${result.totalVolumeM3} m³ • Conformes: ${result.conformeCount} • Discrepancias Críticas: ${result.criticalDiscrepanciesCount}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'No se pudieron extraer datos del archivo',
          details: result.errorMessage || 'Verifique que la hoja contenga las columnas de SKU y dimensiones.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Error al procesar el archivo',
        details: err?.message || 'Ocurrió un error inesperado al leer el Excel.',
      });
    } finally {
      setFileLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Quick simulation of new incoming daily SKUs from operations for demonstration
  const handleSimulateDailyBatch = () => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].slice(0, 5);
    const mockDailyBatch: SkuMeasurement[] = [
      {
        id: `MED-NEW-${Date.now().toString().slice(-4)}`,
        sku: `SKU-OP-NUEVO-${Math.floor(1000 + Math.random() * 9000)}`,
        descripcion: 'Caja Transmisiones Automáticas reforzadas (Lote Día)',
        categoria: 'Repuestos Automotrices',
        usuario: 'Carlos Ramos (Rampa 2)',
        proceso: 'Recepción',
        fecha: today,
        hora: nowTime,
        timestamp: Date.now(),
        largoCm: 55.0,
        anchoCm: 45.0,
        altoCm: 40.0,
        pesoKg: 32.5,
        volumenM3: 0.099,
        masterLargoCm: 50.0,
        masterAnchoCm: 42.0,
        masterAltoCm: 38.0,
        masterPesoKg: 30.0,
        masterVolumenM3: 0.0798,
        variacionVolPct: 24.1,
        estado: 'Discrepancia Crítica',
        notasAuditoria: 'Medición física en rampa detecta sobre-dimensión no reportada por cliente.',
      },
      {
        id: `MED-NEW-${(Date.now() + 1).toString().slice(-4)}`,
        sku: `SKU-OP-ECO-${Math.floor(1000 + Math.random() * 9000)}`,
        descripcion: 'Empaque Doble Aceite Sintético 5W-30 (Lote Día)',
        categoria: 'Líquidos e Insumos',
        usuario: 'Andrea Mendoza',
        proceso: 'Almacenamiento',
        fecha: today,
        hora: nowTime,
        timestamp: Date.now() - 15000,
        largoCm: 38.0,
        anchoCm: 28.0,
        altoCm: 32.0,
        pesoKg: 14.8,
        volumenM3: 0.0341,
        masterLargoCm: 38.0,
        masterAnchoCm: 28.0,
        masterAltoCm: 32.0,
        masterPesoKg: 14.5,
        masterVolumenM3: 0.0341,
        variacionVolPct: 0.0,
        estado: 'Conforme',
      },
      {
        id: `MED-NEW-${(Date.now() + 2).toString().slice(-4)}`,
        sku: `SKU-OP-FERR-${Math.floor(1000 + Math.random() * 9000)}`,
        descripcion: 'Caja Pernos Galvanizados de Alta Resistencia',
        categoria: 'Ferretería & Maquinaria',
        usuario: 'Luis Paredes',
        proceso: 'Despacho',
        fecha: today,
        hora: nowTime,
        timestamp: Date.now() - 30000,
        largoCm: 30.0,
        anchoCm: 22.0,
        altoCm: 18.0,
        pesoKg: 18.0,
        volumenM3: 0.0119,
        masterLargoCm: 28.0,
        masterAnchoCm: 20.0,
        masterAltoCm: 16.0,
        masterPesoKg: 17.0,
        masterVolumenM3: 0.009,
        variacionVolPct: 32.2,
        estado: 'Discrepancia Crítica',
        notasAuditoria: 'Caja reforzada con tiras metálicas distorsiona volumen de cubicaje.',
      },
    ];

    onDataLoaded(mockDailyBatch, 'merge');
    setFeedback({
      type: 'success',
      message: '¡Sincronización simulada completada!',
      details: `Se agregaron 3 nuevas mediciones del día ${today} registradas por operaciones en rampa.`,
    });
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold">
              <Cloud className="w-3.5 h-3.5" />
              <span>Gestión del Maestro SKU & Sincronización en Línea</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Alimentación Operativa & Visualización Directiva
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              El equipo de operaciones sube o actualiza el archivo Excel del Maestro de SKUs desde una carpeta
              pública de la empresa (SharePoint, OneDrive, Servidor de Red o carga directa). Los indicadores,
              gráficas y auditorías se actualizan inmediatamente para la revisión del Directorio.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadOfficialSkuMasterTemplate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Descargar Plantilla Oficial Excel</span>
            </button>

            <button
              onClick={handleSimulateDailyBatch}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simular Llegada de Mediciones del Día</span>
            </button>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-blue-50 border-blue-300 text-blue-950'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs">{feedback.message}</h4>
            {feedback.details && <p className="text-xs opacity-90">{feedback.details}</p>}
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* TWO COLUMNS: 1. ONLINE PUBLIC FOLDER SYNC | 2. MANUAL EXCEL UPLOAD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: ONLINE PUBLIC FOLDER / URL CONNECTION */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  1. Sincronización en Línea (Carpeta Pública Empresarial)
                </h3>
                <p className="text-xs text-slate-500">
                  Enlace directo a archivo de red, SharePoint, OneDrive o Google Drive compartido
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Enlace Activo
            </span>
          </div>

          <form onSubmit={handleSaveUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL o Vínculo Compartido del Archivo Maestro (Excel / CSV)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="ej. https://sharepoint.empresa.com/operaciones/Maestro_SKUs.xlsx"
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Guardar Vínculo
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: En SharePoint u OneDrive utilice la opción <em>"Copiar vínculo público / directo"</em> o exportar como web para que se pueda descargar automáticamente.
              </p>
            </div>

            {/* Sync Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Frecuencia de Auto-Sincronización
                </span>
                <select
                  value={syncInterval}
                  onChange={(e) => onSetSyncInterval(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                >
                  <option value={0}>Manual (Sólo cuando presione sincronizar)</option>
                  <option value={5}>Cada 5 minutos</option>
                  <option value={15}>Cada 15 minutos (Recomendado)</option>
                  <option value={30}>Cada 30 minutos</option>
                  <option value={60}>Cada 1 hora</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Última Sincronización
                </span>
                <div className="font-mono text-xs font-bold text-slate-800">
                  {lastSyncTime || 'Sincronizado al iniciar sesión'}
                </div>
                <div className="text-[10.5px] text-slate-500">
                  Base activa: <strong>{currentCount.toLocaleString()}</strong> SKUs cargados
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onTriggerSync}
                disabled={isSyncing}
                className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isSyncing
                    ? 'bg-blue-300 text-blue-900 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando con Carpeta Pública...' : 'Sincronizar en Línea Ahora'}</span>
              </button>
            </div>
          </form>

          {/* Quick Explanatory Cards */}
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">¿Cómo funciona la actualización para el Directorio?</div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                El área de operaciones en almacén mantiene su hoja de Excel habitual guardada en la carpeta compartida.
                Cada vez que se sincroniza, la Intranet lee el archivo sin modificarlo, calcula automáticamente las
                desviaciones volumétricas y actualiza las gráficas y semáforos que el Directorio revisa para la toma de decisiones.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: MANUAL DRAG & DROP / FILE SELECTOR */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  2. Carga Directa de Archivo Excel
                </h3>
                <p className="text-xs text-slate-500">Arrastre su archivo .xlsx o .csv desde la carpeta</p>
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setLoadMode('replace')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-center transition-all ${
                  loadMode === 'replace'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Reemplazar Todo el Maestro
              </button>
              <button
                type="button"
                onClick={() => setLoadMode('merge')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-center transition-all ${
                  loadMode === 'merge'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Anexar / Actualizar SKUs
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/80 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.xlsm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                {fileLoading ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  {fileLoading
                    ? 'Analizando y extrayendo SKUs...'
                    : 'Haga clic para seleccionar o arrastre el archivo aquí'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Formatos compatibles: .xlsx, .xls, .xlsm, .csv
                </p>
              </div>

              <div className="px-3 py-1 rounded-full bg-slate-100 text-[10.5px] font-mono text-slate-600 font-bold border border-slate-200">
                Detecta automáticamente hojas de "MAESTRO" y "SKU"
              </div>
            </div>
          </div>

          {/* Validation guarantees */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Validación Automática de Integridad Dimensional</span>
            </div>
            <p>
              Calcula m³ físicos, m³ teóricos de WMS, porcentaje de desviación y clasificación
              de discrepancias en tiempo real sin requerir fórmulas en el Excel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
