import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileSpreadsheet, RefreshCw, UploadCloud } from 'lucide-react';

export type DataImportSource = 'volumetry' | 'crossdocking' | 'performance' | 'overtime' | 'fleet';

interface ImportRecord {
  importedAt: string;
  fileName: string;
  fileModifiedAt: string | null;
}

interface ManualDataImportPanelProps {
  source: DataImportSource;
  title: string;
  acceptedExtensions: string[];
  instructions: string;
  onImport: (file: File) => Promise<string>;
}

const STALE_AFTER_DAYS = 30;
const IMPORT_STATUS_EVENT = 'stol-import-status-updated';

const useImportFreshness = (source: DataImportSource) => {
  const [record, setRecord] = useState<ImportRecord | null>(null);
  const storageKey = `stol_import_status_${source}`;

  useEffect(() => {
    const loadRecord = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        setRecord(saved ? (JSON.parse(saved) as ImportRecord) : null);
      } catch (error) {
        console.warn(`Could not read import status for ${source}:`, error);
        setRecord(null);
      }
    };
    loadRecord();
    window.addEventListener(IMPORT_STATUS_EVENT, loadRecord);
    return () => window.removeEventListener(IMPORT_STATUS_EVENT, loadRecord);
  }, [source, storageKey]);

  const markImported = (file: File) => {
    const nextRecord: ImportRecord = {
      importedAt: new Date().toISOString(),
      fileName: file.name,
      fileModifiedAt: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    };
    setRecord(nextRecord);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextRecord));
    } catch (error) {
      console.warn(`Could not save import status for ${source}:`, error);
    }
    window.dispatchEvent(new Event(IMPORT_STATUS_EVENT));
  };

  const importedAt = record ? Date.parse(record.importedAt) : 0;
  const fileModifiedAt = record?.fileModifiedAt ? Date.parse(record.fileModifiedAt) : 0;
  const staleAfterMs = STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const isStale =
    !record ||
    !importedAt ||
    Date.now() - importedAt > staleAfterMs ||
    (fileModifiedAt > 0 && Date.now() - fileModifiedAt > staleAfterMs);

  return { record, isStale, markImported };
};

export const recordGoogleSheetsSyncFreshness = (source: DataImportSource, sheetName: string = 'Google Sheets') => {
  const storageKey = `stol_import_status_${source}`;
  const nextRecord: ImportRecord = {
    importedAt: new Date().toISOString(),
    fileName: `Google Sheets (${sheetName})`,
    fileModifiedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextRecord));
  } catch (error) {
    console.warn(`Could not save Google Sheets import status for ${source}:`, error);
  }
  window.dispatchEvent(new Event(IMPORT_STATUS_EVENT));
};

export const DataFreshnessStatus: React.FC<{ source: DataImportSource }> = ({ source }) => {
  const { record, isStale } = useImportFreshness(source);
  const importedDate = record
    ? new Date(record.importedAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  return (
    <div
      role="status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
        isStale ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
      }`}
      title={record ? `${record.fileName}${record.fileModifiedAt ? ` · Archivo modificado ${new Date(record.fileModifiedAt).toLocaleDateString('es-PE')}` : ''}` : 'No hay una carga manual registrada en este navegador'}
    >
      {isStale ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      {isStale ? 'Información por verificar' : `Actualizado: ${importedDate}`}
    </div>
  );
};

export const DataFreshnessOverview: React.FC = () => {
  const sources: Array<{ source: DataImportSource; label: string }> = [
    { source: 'volumetry', label: 'Volumetría' },
    { source: 'crossdocking', label: 'Crossdocking' },
    { source: 'performance', label: 'Supervisores' },
    { source: 'overtime', label: 'Horas extras' },
    { source: 'fleet', label: 'Flota' },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div>
        <h2 className="text-sm font-black text-slate-900">Vigencia de la información</h2>
        <p className="text-[11px] text-slate-500">Revisión por fuente · aviso si no se ha importado o supera 30 días</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
        {sources.map(({ source, label }) => (
          <div key={source} className="min-w-0 border border-slate-100 rounded-lg px-3 py-2 space-y-1.5">
            <div className="text-xs font-bold text-slate-700">{label}</div>
            <DataFreshnessStatus source={source} />
          </div>
        ))}
      </div>
    </section>
  );
};

export const ManualDataImportPanel: React.FC<ManualDataImportPanelProps> = ({
  source,
  title,
  acceptedExtensions,
  instructions,
  onImport,
}) => {
  const { record: importRecord, isStale, markImported } = useImportFreshness(source);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const isSupported = acceptedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension));
    if (!isSupported) {
      setFeedback({ type: 'error', message: `Formato no compatible. Usa: ${acceptedExtensions.join(', ')}.` });
      return;
    }

    setIsImporting(true);
    setFeedback(null);
    try {
      const details = await onImport(file);
      markImported(file);
      setFeedback({ type: 'success', message: details || `Se cargó ${file.name} correctamente.` });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo procesar el archivo. Revisa el formato e inténtalo de nuevo.',
      });
    } finally {
      setIsImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const modifiedDate = importRecord?.fileModifiedAt
    ? new Date(importRecord.fileModifiedAt).toLocaleDateString('es-PE')
    : null;
  const importedDate = importRecord
    ? new Date(importRecord.importedAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">{instructions}</p>
          </div>
        </div>
        <div
          role="status"
          className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-lg text-[11px] font-bold ${
            isStale ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          {isStale ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {isStale ? 'Revisar vigencia' : 'Carga reciente'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void processFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`m-3 min-h-28 border border-dashed rounded-lg flex items-center justify-center gap-3 p-4 text-left cursor-pointer transition-colors ${
            isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedExtensions.join(',')}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void processFile(file);
            }}
            onClick={(event) => event.stopPropagation()}
            className="hidden"
          />
          <div className="w-10 h-10 shrink-0 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center">
            {isImporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              {isImporting ? 'Procesando archivo...' : 'Seleccionar archivo o arrastrarlo aquí'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Formatos: {acceptedExtensions.join(', ')}</div>
          </div>
        </div>

        <div className="px-4 py-3 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-center gap-2">
          {isStale ? (
            <div className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                {!importRecord
                  ? 'No hay una carga manual registrada en este navegador. Verifica la fecha de los datos antes de tomar decisiones.'
                  : `La última carga o modificación del archivo supera ${STALE_AFTER_DAYS} días. Importa una versión reciente.`}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-emerald-900">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                Última carga: <strong>{importedDate}</strong>
                {modifiedDate && <> · Archivo modificado: <strong>{modifiedDate}</strong></>}
              </p>
            </div>
          )}
          {importRecord && <p className="text-[10px] text-slate-500 truncate" title={importRecord.fileName}>{importRecord.fileName}</p>}
          {feedback && (
            <p className={`text-[11px] font-semibold ${feedback.type === 'success' ? 'text-emerald-800' : 'text-rose-700'}`}>
              {feedback.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};