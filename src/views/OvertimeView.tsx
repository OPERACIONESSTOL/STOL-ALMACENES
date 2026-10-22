import React, { useState, useMemo, useEffect } from 'react';
import initialDataJson from '../data/initialOvertimeData.json';
import { OvertimeRecord, BonusRecord, OvertimeDataset, OvertimeFilterState } from '../types/overtime';
import {
  excelSerialToIso,
  isoToExcelSerial,
  formatHours,
  parseOvertimeWorkbook,
  exportOvertimeToExcel,
} from '../utils/overtimeExcel';
import { OvertimeCharts } from '../components/OvertimeCharts';
import { OvertimeMatrix } from '../components/OvertimeMatrix';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';
import { REPORT_MONTHS, ReportModuleHeader, getReportMonthFromDate } from '../components/ReportModuleHeader';
import {
  Clock,
  Calendar,
  Download,
  Filter,
  Search,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Table,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Database,
  ExternalLink,
  X,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  getSavedSheetsConfig,
  saveSheetsConfig,
  syncOvertimeFromGoogleSheets,
  GoogleSheetsConfig,
} from '../services/googleSheetsService';

const INITIAL_DATA: OvertimeDataset = initialDataJson as unknown as OvertimeDataset;
const OVERTIME_STORAGE_KEY = 'stol_overtime_dataset_v1';

const loadOvertimeDataset = (): OvertimeDataset => {
  try {
    const saved = localStorage.getItem(OVERTIME_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as OvertimeDataset;
      if (Array.isArray(parsed.hh) && Array.isArray(parsed.bo)) return parsed;
    }
  } catch (error) {
    console.warn('Could not restore HHEE data:', error);
  }
  return INITIAL_DATA;
};

interface OvertimeViewProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const OvertimeView: React.FC<OvertimeViewProps> = ({ selectedMonth, onSelectMonth }) => {
  const [dataset, setDataset] = useState<OvertimeDataset>(loadOvertimeDataset);
  const [sourceName, setSourceName] = useState<string>(() => {
    try {
      return localStorage.getItem('stol_overtime_source_name') || 'Datos iniciales (sin carga manual)';
    } catch {
      return 'Datos iniciales (sin carga manual)';
    }
  });
  const [activeTab, setActiveTab] = useState<'charts' | 'matrix' | 'table' | 'areas'>('charts');

  // Compute overall min and max dates
  const initialDateRange = useMemo(() => {
    const dates = dataset.hh.map((r) => r.f).filter((f) => typeof f === 'number' && !isNaN(f));
    if (dates.length === 0) return { min: '', max: '' };
    const minF = Math.min(...dates);
    const maxF = Math.max(...dates);
    return {
      min: excelSerialToIso(minF),
      max: excelSerialToIso(maxF),
    };
  }, [dataset]);

  const [filters, setFilters] = useState<OvertimeFilterState>({
    startDate: initialDateRange.min,
    endDate: initialDateRange.max,
    selectedArea: 'TODAS',
    selectedCargo: 'TODOS',
    selectedType: 'ALL',
    selectedWeek: 'ALL',
    searchQuery: '',
  });

  const availableMonths = useMemo(() => {
    const months = new Set(
      dataset.hh
        .map((record) => getReportMonthFromDate(excelSerialToIso(record.f)))
        .filter((month): month is string => Boolean(month))
    );
    return REPORT_MONTHS.filter((month) => months.has(month));
  }, [dataset]);

  const selectedMonthRange = useMemo(() => {
    if (selectedMonth === 'Todos') return initialDateRange;
    const monthRecords = dataset.hh.filter(
      (record) => getReportMonthFromDate(excelSerialToIso(record.f)) === selectedMonth
    );
    if (!monthRecords.length) return { min: '', max: '' };
    const dates = monthRecords.map((record) => excelSerialToIso(record.f));
    return { min: dates.sort()[0], max: dates.sort()[dates.length - 1] };
  }, [dataset, selectedMonth, initialDateRange]);

  useEffect(() => {
    setFilters((previous) => ({
      ...previous,
      startDate: selectedMonthRange.min,
      endDate: selectedMonthRange.max,
    }));
    setCurrentPage(1);
  }, [selectedMonth, selectedMonthRange]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(OVERTIME_STORAGE_KEY, JSON.stringify(dataset));
    } catch (error) {
      console.warn('Could not persist HHEE data:', error);
    }
  }, [dataset]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Unique lists for dropdowns
  const { allAreas, allCargos, allWeeks } = useMemo(() => {
    const areas = [...new Set(dataset.hh.map((r) => r.a))].filter(Boolean).sort();
    const cargos = [...new Set(dataset.hh.map((r) => r.c))].filter(Boolean).sort();
    const weeks = [...new Set(dataset.hh.map((r) => r.w))]
      .filter((w) => typeof w === 'number' && w > 0)
      .sort((a, b) => a - b);
    return { allAreas: areas, allCargos: cargos, allWeeks: weeks };
  }, [dataset]);

  // Filter records
  const filteredRecords = useMemo(() => {
    const startSerial = filters.startDate ? isoToExcelSerial(filters.startDate) : -Infinity;
    const endSerial = filters.endDate ? isoToExcelSerial(filters.endDate) : Infinity;

    return dataset.hh.filter((r) => {
      if (selectedMonth !== 'Todos' && getReportMonthFromDate(excelSerialToIso(r.f)) !== selectedMonth) return false;
      // Date range
      if (r.f < startSerial || r.f > endSerial) return false;

      // Area
      if (filters.selectedArea !== 'TODAS' && r.a !== filters.selectedArea) return false;

      // Cargo
      if (filters.selectedCargo !== 'TODOS' && r.c !== filters.selectedCargo) return false;

      // Type
      if (filters.selectedType === 'REGULAR' && r.x !== 0) return false;
      if (filters.selectedType === 'SPECIAL' && r.x !== 1) return false;

      // Week
      if (filters.selectedWeek !== 'ALL' && String(r.w) !== filters.selectedWeek) return false;

      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const cargoMatch = r.c.toLowerCase().includes(q);
        const areaMatch = r.a.toLowerCase().includes(q);
        const weekMatch = `sem ${r.w}`.includes(q) || `semana ${r.w}`.includes(q);
        const dateMatch = excelSerialToIso(r.f).includes(q);
        if (!cargoMatch && !areaMatch && !weekMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [dataset, filters]);

  // KPIs
  const { totalHours, regularHours, specialHours, totalRecords, totalBonoDays } = useMemo(() => {
    let totH = 0;
    let specH = 0;
    filteredRecords.forEach((r) => {
      totH += r.h;
      if (r.x === 1) specH += r.h;
    });
    const regH = totH - specH;

    // Filter bonus records according to selected area/cargo
    let filteredBono = dataset.bo;
    if (filters.selectedArea !== 'TODAS') {
      filteredBono = filteredBono.filter((b) => b.a === filters.selectedArea);
    }
    if (filters.selectedCargo !== 'TODOS') {
      filteredBono = filteredBono.filter((b) => b.c === filters.selectedCargo);
    }
    const bonoDays = filteredBono.reduce((s, b) => s + b.d, 0);

    return {
      totalHours: totH,
      regularHours: regH,
      specialHours: specH,
      totalRecords: filteredRecords.length,
      totalBonoDays: bonoDays,
    };
  }, [filteredRecords, dataset.bo, filters.selectedArea, filters.selectedCargo]);

  // Pagination for table
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  // Multi-Source Integration State for HHEE Google Sheets
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => getSavedSheetsConfig('overtime'));
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('stol_overtime_last_sheets_sync') || null;
    } catch {
      return null;
    }
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSheetsConfigModal, setShowSheetsConfigModal] = useState<boolean>(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState<string>(sheetsConfig.sheetUrl);
  const [sheetsTabInput, setSheetsTabInput] = useState<string>(sheetsConfig.sheetTab || 'HHEE');
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(sheetsConfig.autoRefreshIntervalSeconds || 60);
  const [autoRefreshActive, setAutoRefreshActive] = useState<boolean>(sheetsConfig.autoRefreshEnabled || false);

  const handleSyncGoogleSheets = async (urlToUse?: string, tabToUse?: string) => {
    const targetUrl = urlToUse !== undefined ? urlToUse : sheetsConfig.sheetUrl;
    const targetTab = tabToUse !== undefined ? tabToUse : (sheetsConfig.sheetTab || 'HHEE');

    if (!targetUrl || !targetUrl.trim()) {
      setShowSheetsConfigModal(true);
      return;
    }

    setIsSyncingSheets(true);
    setSyncError(null);

    try {
      const res = await syncOvertimeFromGoogleSheets(targetUrl, targetTab);
      if (res.success && res.data && res.data.hh && res.data.hh.length > 0) {
        setDataset(res.data);
        const src = `Google Sheets (${targetTab || 'HHEE'})`;
        setSourceName(src);
        setLastSyncTime(res.timestamp);
        try {
          localStorage.setItem('stol_overtime_last_sheets_sync', res.timestamp);
          localStorage.setItem('stol_overtime_source_name', src);
        } catch (e) {}

        const dates = res.data.hh.map((r) => r.f).filter((f) => typeof f === 'number' && !isNaN(f));
        if (dates.length > 0) {
          const minD = excelSerialToIso(Math.min(...dates));
          const maxD = excelSerialToIso(Math.max(...dates));
          setFilters((prev) => ({ ...prev, startDate: minD, endDate: maxD }));
        }
        setCurrentPage(1);
        showToast(
          `Sincronización exitosa: ${res.data.hh.length.toLocaleString('es-PE')} filas HHEE actualizadas.`,
          'success'
        );
      } else {
        const errorMsg = res.error || 'No se obtuvieron registros válidos de la hoja.';
        setSyncError(errorMsg);
        showToast(`Error al sincronizar: ${errorMsg}`, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
      showToast(`Error de conexión: ${msg}`, 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshActive || !sheetsConfig.sheetUrl) return;
    const intervalMs = (autoRefreshSecs || 60) * 1000;
    const timer = setInterval(() => {
      handleSyncGoogleSheets(sheetsConfig.sheetUrl, sheetsConfig.sheetTab);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoRefreshActive, sheetsConfig.sheetUrl, sheetsConfig.sheetTab, autoRefreshSecs]);

  const handleSaveSheetsConfigModal = () => {
    const updated: GoogleSheetsConfig = {
      sheetUrl: sheetsUrlInput.trim(),
      sheetTab: sheetsTabInput.trim() || 'HHEE',
      autoRefreshIntervalSeconds: autoRefreshSecs,
      autoRefreshEnabled: autoRefreshActive,
    };
    setSheetsConfig(updated);
    saveSheetsConfig(updated, 'overtime');
    setShowSheetsConfigModal(false);
    if (updated.sheetUrl) {
      handleSyncGoogleSheets(updated.sheetUrl, updated.sheetTab);
    }
  };

  const handleResetToDefaults = () => {
    try {
      localStorage.removeItem(OVERTIME_STORAGE_KEY);
      localStorage.setItem('stol_overtime_source_name', 'Datos oficiales STOL');
      localStorage.removeItem('stol_overtime_last_sheets_sync');
    } catch (e) {}
    setDataset(INITIAL_DATA);
    setSourceName('Datos oficiales STOL');
    setSyncError(null);
    const dates = INITIAL_DATA.hh.map((r) => r.f).filter((f) => typeof f === 'number' && !isNaN(f));
    if (dates.length > 0) {
      setFilters((prev) => ({
        ...prev,
        startDate: excelSerialToIso(Math.min(...dates)),
        endDate: excelSerialToIso(Math.max(...dates)),
      }));
    }
    showToast('Datos oficiales base de HHEE restaurados.', 'success');
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: initialDateRange.min,
      endDate: initialDateRange.max,
      selectedArea: 'TODAS',
      selectedCargo: 'TODOS',
      selectedType: 'ALL',
      selectedWeek: 'ALL',
      searchQuery: '',
    });
    setCurrentPage(1);
    showToast('Filtros restablecidos a los valores predeterminados.', 'success');
  };

  const handleExport = () => {
    exportOvertimeToExcel(filteredRecords, dataset.bo, `STOL_HHEE_Export_${filters.startDate}_${filters.endDate}.xlsx`);
    showToast('Archivo Excel generado y descargado con éxito.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border border-emerald-500/30'
              : 'bg-rose-950 text-rose-100 border border-rose-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                Módulo Operativo 2026
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-500">
                {sourceName} · {dataset.hh.length.toLocaleString('es-PE')} filas HHEE · {dataset.bo.length} filas BONO
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>HORAS EXTRAS OPERATIVAS (HHEE)</span>
              {filters.startDate && filters.endDate && (
                <span className="text-sm font-semibold text-slate-400 hidden sm:inline-block">
                  · {filters.startDate} al {filters.endDate}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Monitoreo analítico de horas extras ordinarias, dominicales y feriados, incentivos de bono y matriz de
              intensidad por cargos y áreas operativas.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Descargar datos actuales en Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Imprimir reporte"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Global Date Range inputs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Rango de Fecha:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-slate-400">Del</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-slate-400">al</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {(filters.startDate !== initialDateRange.min || filters.endDate !== initialDateRange.max) && (
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: initialDateRange.min,
                    endDate: initialDateRange.max,
                  }))
                }
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                Restablecer fechas
              </button>
            )}
          </div>

          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Conexión en línea vía Google Sheets (solo lectura)</span>
          </div>
        </div>
      </div>

      {/* MULTI-SOURCE SYNCHRONIZATION CONTROL BAR FOR HHEE */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 tracking-tight">
                  Integración Google Sheets HHEE:
                </span>
                {sheetsConfig.sheetUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Enlace Activo ({sheetsConfig.sheetTab || 'HHEE'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Sin URL asignada · Usando base oficial
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Solo Lectura
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>
                  Última sincronización: <b>{lastSyncTime || 'Aún no sincronizado'}</b>
                </span>
                <span>•</span>
                <span>
                  Auto-sync (60s): <b>{autoRefreshActive ? 'Activo' : 'Inactivo'}</b>
                </span>
                <span>•</span>
                <span className="text-slate-600">
                  Registros cargados: <b>{dataset.hh.length.toLocaleString('es-PE')} filas</b>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSyncGoogleSheets()}
              disabled={isSyncingSheets}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Consultar Google Sheets ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Sincronizando...' : 'Sincronizar Sheets'}</span>
            </button>

            <button
              onClick={() => {
                setSheetsUrlInput(sheetsConfig.sheetUrl);
                setSheetsTabInput(sheetsConfig.sheetTab || 'HHEE');
                setShowSheetsConfigModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
              title="Configurar enlace de Google Sheets para HHEE"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Configurar Enlace Sheets</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Restablecer datos oficiales STOL de HHEE"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Error Notice with step-by-step guidance */}
        {syncError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-rose-950">Aviso al conectar con Google Sheets:</span>
              <p className="text-rose-800 leading-relaxed">{syncError}</p>
              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 text-[11px] text-slate-700 space-y-1 mt-1.5">
                <p className="font-bold text-slate-900">Pasos recomendados para publicar tu Google Sheet:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>En tu Google Sheets, abre el menú <strong>Archivo &gt; Compartir &gt; Publicar en la web</strong>.</li>
                  <li>Selecciona la pestaña (ej. <em>HHEE</em>) y en formato elige <strong>Valores separados por comas (.csv)</strong>.</li>
                  <li>Haz clic en <strong>Publicar</strong> y pega aquí el enlace generado.</li>
                  <li>Alternativamente, asegúrate de que el acceso general esté en <strong>"Cualquier persona con el enlace (Lector)"</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: HHEE Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">HHEE Total</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-900 tabular-nums">
            {formatHours(totalHours)} <span className="text-sm font-semibold text-slate-500">h</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Volumen filtrado</span>
            <span className="font-semibold text-slate-600">100%</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
        </div>

        {/* KPI 2: Sin dominicales ni feriados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden group hover:border-slate-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ordinarias</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Lunes a Sáb</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 tabular-nums">
            {formatHours(regularHours)} <span className="text-sm font-semibold text-slate-500">h</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Sin feriado/domingo</span>
            <span className="font-semibold text-slate-700">
              {totalHours > 0 ? ((regularHours / totalHours) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600"></div>
        </div>

        {/* KPI 3: Dominicales o feriados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden group hover:border-orange-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dom / Feriados</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">100% Tarifa</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 tabular-nums">
            {formatHours(specialHours)} <span className="text-sm font-semibold text-slate-500">h</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dominical/Feriado</span>
            <span className="font-semibold text-orange-700">
              {totalHours > 0 ? ((specialHours / totalHours) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
        </div>

        {/* KPI 4: Registros HHEE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden group hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registros HHEE</span>
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {totalRecords.toLocaleString('es-PE')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Promedio por registro</span>
            <span className="font-semibold text-teal-700">
              {totalRecords > 0 ? (totalHours / totalRecords).toFixed(1) : 0} h/reg
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600"></div>
        </div>

        {/* KPI 5: Días de bono */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden group hover:border-indigo-400 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Días de Bono</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 tabular-nums">
            {totalBonoDays.toLocaleString('es-PE')} <span className="text-sm font-semibold text-slate-500">días</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Pestaña BONO</span>
            <span className="font-semibold text-indigo-700">{dataset.bo.length} asignaciones</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600"></div>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Opciones de Filtro Avanzado
            </h3>
            <span className="text-[11px] text-slate-400">
              ({filteredRecords.length} registros seleccionados)
            </span>
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Filter Area */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Área Operativa
            </label>
            <select
              value={filters.selectedArea}
              onChange={(e) => {
                setFilters({ ...filters, selectedArea: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="TODAS">Todas las Áreas ({allAreas.length})</option>
              {allAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Cargo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cargo / Puesto
            </label>
            <select
              value={filters.selectedCargo}
              onChange={(e) => {
                setFilters({ ...filters, selectedCargo: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="TODOS">Todos los Cargos ({allCargos.length})</option>
              {allCargos.map((cargo) => (
                <option key={cargo} value={cargo}>
                  {cargo}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tipo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tipo de Jornada
            </label>
            <select
              value={filters.selectedType}
              onChange={(e) => {
                setFilters({ ...filters, selectedType: e.target.value as any });
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todas las Jornadas</option>
              <option value="REGULAR">Ordinarias (Sin feriado ni domingos)</option>
              <option value="SPECIAL">Dominicales y Feriados</option>
            </select>
          </div>

          {/* Filter Semana */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Semana Operativa
            </label>
            <select
              value={filters.selectedWeek}
              onChange={(e) => {
                setFilters({ ...filters, selectedWeek: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todas las Semanas ({allWeeks.length})</option>
              {allWeeks.map((w) => (
                <option key={w} value={String(w)}>
                  Semana {w}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Búsqueda Rápida
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => {
                  setFilters({ ...filters, searchQuery: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Buscar por cargo, área..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directorial Decision Deck: Interactive Observations Cards */}
      <ExecutiveObservationsSection
        moduleName="overtime"
        observations={getObservationsByModule('overtime')}
        defaultExpanded={true}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Tendencias</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Matriz Cargos vs Áreas</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Detalle de Registros ({filteredRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('areas')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'areas'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Resumen Ejecutivo por Área</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 py-2 hidden sm:block">
          Mostrando: <span className="font-bold text-slate-800">{formatHours(totalHours)} horas extras</span>
        </div>
      </div>

      {/* Tab 1: Charts & Analytics (c1 to c6) */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <OvertimeCharts records={filteredRecords} bonusRecords={dataset.bo} />
          {/* Also include matrix right below the charts just as in the original HTML! */}
          <OvertimeMatrix records={filteredRecords} allAreas={allAreas} />
        </div>
      )}

      {/* Tab 2: Full Screen Matrix View */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <OvertimeMatrix records={filteredRecords} allAreas={allAreas} />
        </div>
      )}

      {/* Tab 3: Detailed Records Table */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Registro Individual de Horas Extras
              </h3>
              <p className="text-xs text-slate-500">
                Detalle pormenorizado de turnos, jornadas ordinarias y servicios dominicales/feriados
              </p>
            </div>

            <div className="text-xs text-slate-600">
              Página <b>{currentPage}</b> de <b>{totalPages}</b> · {filteredRecords.length} registros
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="py-2.5 px-3 text-left">Fecha</th>
                  <th className="py-2.5 px-3 text-center">Semana</th>
                  <th className="py-2.5 px-3 text-left">Área</th>
                  <th className="py-2.5 px-3 text-left">Cargo</th>
                  <th className="py-2.5 px-3 text-center">Tipo Jornada</th>
                  <th className="py-2.5 px-3 text-right">Cantidad Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {excelSerialToIso(r.f)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          Sem {r.w}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{r.a}</td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{r.c}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {r.x === 1 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            Dominical / Feriado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Ordinaria
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 tabular-nums">
                        {formatHours(r.h)} h
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredRecords.length)} a{' '}
              {Math.min(currentPage * pageSize, filteredRecords.length)} de {filteredRecords.length} registros
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Executive Area Breakdown */}
      {activeTab === 'areas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAreas.map((area) => {
            const areaRecords = filteredRecords.filter((r) => r.a === area);
            const areaTotalHours = areaRecords.reduce((s, r) => s + r.h, 0);
            const areaSpecialHours = areaRecords.filter((r) => r.x === 1).reduce((s, r) => s + r.h, 0);
            const areaRegularHours = areaTotalHours - areaSpecialHours;
            const pctOfTotal = totalHours > 0 ? (areaTotalHours / totalHours) * 100 : 0;
            const bonoForArea = dataset.bo.filter((b) => b.a === area).reduce((s, b) => s + b.d, 0);

            return (
              <div
                key={area}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase">{area}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {pctOfTotal.toFixed(1)}% del Total
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-900 my-2 tabular-nums">
                    {formatHours(areaTotalHours)} <span className="text-xs font-normal text-slate-500">horas</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden my-3">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, pctOfTotal)}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Ordinarias</span>
                      <span className="font-bold text-slate-700">{formatHours(areaRegularHours)} h</span>
                    </div>
                    <div>
                      <span className="text-orange-500 block text-[10px] uppercase font-semibold">
                        Dom / Feriados
                      </span>
                      <span className="font-bold text-orange-600">{formatHours(areaSpecialHours)} h</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Registros</span>
                      <span className="font-bold text-slate-700">{areaRecords.length} turnos</span>
                    </div>
                    <div>
                      <span className="text-indigo-500 block text-[10px] uppercase font-semibold">Días Bono</span>
                      <span className="font-bold text-indigo-700">{bonoForArea} días</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, selectedArea: area });
                      setActiveTab('table');
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Ver detalles del área →
                  </button>
                  <span className="text-slate-400">
                    {areaRecords.length > 0 ? (areaTotalHours / areaRecords.length).toFixed(1) : 0} h/reg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      {/* MODAL: CONFIGURAR GOOGLE SHEETS PARA HHEE */}
      {showSheetsConfigModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSheetsConfigModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Conectar Google Sheets · Horas Extras (HHEE)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronización en vivo exclusiva para la pestaña de Horas Extras
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSheetsConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Enlace de Google Sheets (Cualquier formato: público, web o normal):
                </label>
                <input
                  type="url"
                  value={sheetsUrlInput}
                  onChange={(e) => setSheetsUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit o /pubhtml"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Admite enlaces publicados a la web (<code>pubhtml</code> / <code>pub?output=csv</code>) o el enlace de compartir con acceso de lector.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nombre de la Pestaña / Hoja (opcional si usas enlace completo o primera pestaña):
                </label>
                <input
                  type="text"
                  value={sheetsTabInput}
                  onChange={(e) => setSheetsTabInput(e.target.value)}
                  placeholder="HHEE"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Por defecto busca <code>HHEE</code>. Si tu hoja tiene otro nombre (ej. <em>Hoja 1</em>), especifícalo aquí.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-950 block">Columnas esperadas en tu hoja:</span>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Tu hoja debe tener encabezados como: <strong>Fecha</strong>, <strong>Cargo</strong>, <strong>Área</strong>, <strong>Horas</strong> (u <em>HHEE</em>), <strong>Tipo</strong> (Ordinaria / Dominical / Feriado) y <strong>Semana</strong>.
                </p>
              </div>

              {/* Auto Refresh Setting */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Actualización automática periódica
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Consulta automáticamente la hoja cada {autoRefreshSecs} segundos
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoRefreshActive}
                  onChange={(e) => setAutoRefreshActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSheetsUrlInput('');
                  setSheetsTabInput('HHEE');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Limpiar Enlace
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSheetsConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSheetsConfigModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Guardar y Sincronizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
