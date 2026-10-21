import React, { useState, useMemo } from 'react';
import { Equipment, MaintenanceIncident } from '../types/fleet';
import { FLEET_EQUIPOS, FLEET_INCIDENCIAS } from '../data/initialFleetData';
import {
  Printer,
  Search,
  Truck,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Zap,
  CheckCircle2,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Filter,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  Film,
  Play,
  X,
  ExternalLink,
} from 'lucide-react';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';
import { FleetReceptionUploader } from '../components/FleetReceptionUploader';
import { FleetExcelSyncModal } from '../components/FleetExcelSyncModal';
import { DataFreshnessStatus } from '../components/ManualDataImportPanel';
import { sortMonthsChronologically, getMonthChronologicalIndex } from '../utils/fleetExcel';

export const FleetView: React.FC = () => {
  const [fleetTab, setFleetTab] = useState<'AUDITORIA' | 'RECEPCION'>('AUDITORIA');
  const [receptionEquipCode, setReceptionEquipCode] = useState<string | null>(null);

  // Persistent fleet equipment state (loaded from user's Excel or default)
  const [equipos, setEquipos] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem('stol_fleet_equipos_v3');
      if (saved) {
        const parsed: Equipment[] = JSON.parse(saved);
        // Cleanse check: if any equipment has > 2000 hours, ignore corrupted previous cache
        const hasCrazyOdometer = parsed.some((e) =>
          Object.values(e.meses || {}).some((m) => m.horas_usadas > 2000)
        );
        if (!hasCrazyOdometer && parsed.length >= 19) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved fleet equipos', e);
    }
    return FLEET_EQUIPOS;
  });

  // Persistent maintenance incidents / bitácora state
  const [incidencias, setIncidencias] = useState<MaintenanceIncident[]>(() => {
    try {
      const saved = localStorage.getItem('stol_fleet_incidencias_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved fleet incidencias', e);
    }
    return FLEET_INCIDENCIAS;
  });

  // Available months list strictly sorted chronologically
  const [availableMonths, setAvailableMonths] = useState<string[]>(() => {
    const months = new Set<string>(['Julio', 'Agosto', 'Setiembre', 'Octubre']);
    try {
      const saved = localStorage.getItem('stol_fleet_equipos_v3');
      if (saved) {
        const parsed: Equipment[] = JSON.parse(saved);
        parsed.forEach((eq) => {
          Object.keys(eq.meses || {}).forEach((m) => months.add(m));
        });
      }
    } catch {
      // ignore
    }
    return sortMonthsChronologically(Array.from(months));
  });

  const [activeMonth, setActiveMonth] = useState<string>('Setiembre');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [lastUploadNotice, setLastUploadNotice] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<'ALL' | 'MONTACARGA' | 'ELEVADOR' | 'EXCESO'>('ALL');
  const [incTypeFilter, setIncTypeFilter] = useState<'ALL' | 'CORRECTIVO' | 'PREVENTIVO'>('ALL');
  const [incSearchText, setIncSearchText] = useState<string>('');

  // Advanced Calendar & Timeline Filters (Requested by user)
  const [dateFilterMode, setDateFilterMode] = useState<
    'MES' | 'DIARIO' | 'SEMANAL' | 'TRIMESTRAL' | 'ANUAL' | 'RANGO'
  >('MES');
  const [dercoRelevoFilter, setDercoRelevoFilter] = useState<'ALL' | 'PRE_24' | 'POST_24'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-24');
  const [selectedWeek, setSelectedWeek] = useState<string>('SEM_39');
  const [selectedQuarter, setSelectedQuarter] = useState<'T1' | 'T2' | 'T3' | 'T4'>('T3');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-30');
  const [showCalendarPanel, setShowCalendarPanel] = useState<boolean>(false);

  const handleDataUpdated = (
    newEquipos: Equipment[],
    newIncidencias: MaintenanceIncident[],
    detectedMonths: string[]
  ) => {
    setEquipos(newEquipos);
    setIncidencias(newIncidencias);
    if (detectedMonths && detectedMonths.length > 0) {
      const sorted = sortMonthsChronologically(detectedMonths);
      setAvailableMonths(sorted);
      if (!sorted.includes(activeMonth)) {
        setActiveMonth(sorted[sorted.length - 1] || 'Setiembre');
      }
    }
    setLastUploadNotice(
      `¡Formato establecido cargado con éxito! Se sincronizaron ${newEquipos.length} equipos con la columna «Horas usadas» (fórmulas respetadas).`
    );
  };

  const handleResetToDefaults = () => {
    try {
      localStorage.removeItem('stol_fleet_equipos_v3');
      localStorage.removeItem('stol_fleet_incidencias_v3');
      localStorage.removeItem('stol_fleet_equipos_v1');
      localStorage.removeItem('stol_fleet_incidencias_v1');
    } catch (e) {
      console.warn(e);
    }
    setEquipos(FLEET_EQUIPOS);
    setIncidencias(FLEET_INCIDENCIAS);
    const defMonths = sortMonthsChronologically(['Julio', 'Agosto', 'Setiembre', 'Octubre']);
    setAvailableMonths(defMonths);
    setActiveMonth('Setiembre');
    setDercoRelevoFilter('ALL');
    setDateFilterMode('MES');
    setLastUploadNotice('Se restauraron los datos oficiales de flota y bitácora.');
  };

  const fmt = (n: number, d = 1) =>
    (n || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

  // Compute month equipments with Derco fleet replacement timeline (24/09)
  const monthEquipos = useMemo(() => {
    if (!Array.isArray(equipos)) return [];

    return equipos
      .filter((e) => {
        if (!e) return false;

        // 1. Derco Relevo Timeline Filter (Hito 24/09)
        // Before 24/09: Old units present, HGR-279 to 286 do NOT appear.
        // After 24/09: Old units left sede (do NOT appear), HGR-279 to 286 appear!
        if (dercoRelevoFilter === 'PRE_24') {
          // Hide new units that entered on 24/09
          if (e.fechaIngresoSede === '2026-09-24') return false;
        } else if (dercoRelevoFilter === 'POST_24') {
          // Hide old units that left sede on 24/09
          if (e.fechaSalidaSede === '2026-09-24') return false;
        }

        // 2. Filter by month (when in MES mode)
        if (dateFilterMode === 'MES') {
          const mIdx = getMonthChronologicalIndex(activeMonth);
          // For months before September (e.g. Julio=7, Agosto=8): new units did not enter yet
          if (mIdx < 9 && e.fechaIngresoSede === '2026-09-24') {
            return false;
          }
          // For months after September (e.g. Octubre=10, Noviembre=11): old units left sede
          if (mIdx > 9 && e.fechaSalidaSede === '2026-09-24') {
            return false;
          }
        }

        // 3. Filter by Exact Date (DIARIO mode)
        if (dateFilterMode === 'DIARIO') {
          if (selectedDate < '2026-09-24' && e.fechaIngresoSede === '2026-09-24') return false;
          if (selectedDate >= '2026-09-24' && e.fechaSalidaSede === '2026-09-24') return false;
        }

        // 4. Filter by Date Range (RANGO mode)
        if (dateFilterMode === 'RANGO') {
          if (customEndDate < '2026-09-24' && e.fechaIngresoSede === '2026-09-24') return false;
          if (customStartDate >= '2026-09-24' && e.fechaSalidaSede === '2026-09-24') return false;
        }

        // 5. Filter by Week (SEMANAL mode)
        if (dateFilterMode === 'SEMANAL') {
          // Weeks 36-38 are before 24/09
          if (['SEM_36', 'SEM_37', 'SEM_38'].includes(selectedWeek) && e.fechaIngresoSede === '2026-09-24') {
            return false;
          }
          // Weeks 39-40 are after 24/09
          if (['SEM_39', 'SEM_40'].includes(selectedWeek) && dercoRelevoFilter === 'POST_24' && e.fechaSalidaSede === '2026-09-24') {
            return false;
          }
        }

        return true;
      })
      .map((e) => {
        const mesesObj = e?.meses || {};
        let activeM = activeMonth;
        if (dateFilterMode === 'TRIMESTRAL') {
          activeM = selectedQuarter === 'T4' ? 'Octubre' : 'Setiembre';
        }

        const m = mesesObj[activeM] || { horas_usadas: 0, horas_inoperativas: 0 };

        // Dynamic role for SGR-017 (Passed to be the new backup on 24/09 replacing HGR-027)
        let dynamicTipo = e?.tipo || 'MONTACARGA';
        if (e.codigo === 'SGR-017') {
          const isBeforeChange =
            (dateFilterMode === 'MES' && getMonthChronologicalIndex(activeMonth) < 9) ||
            dercoRelevoFilter === 'PRE_24' ||
            (dateFilterMode === 'DIARIO' && selectedDate < '2026-09-24');

          dynamicTipo = isBeforeChange ? 'MONTACARGA' : 'BACKUP';
        }

        return {
          ...e,
          codigo: e?.codigo || 'EQ',
          proveedor: e?.proveedor || 'DERCO',
          tipo: dynamicTipo,
          limite: typeof e?.limite === 'number' ? e.limite : 300,
          horas_usadas: Number(m.horas_usadas) || 0,
          horas_inoperativas: Number(m.horas_inoperativas) || 0,
        };
      });
  }, [
    equipos,
    activeMonth,
    dateFilterMode,
    dercoRelevoFilter,
    selectedDate,
    selectedWeek,
    selectedQuarter,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  // Providers breakdown
  const novaEqs = useMemo(() => monthEquipos.filter((e) => e.proveedor === 'NOVA'), [monthEquipos]);
  const dercoEqs = useMemo(() => monthEquipos.filter((e) => e.proveedor === 'DERCO'), [monthEquipos]);

  const novaExcesos = useMemo(
    () => novaEqs.filter((e) => e.horas_usadas > e.limite).length,
    [novaEqs]
  );
  const dercoExcesos = useMemo(
    () => dercoEqs.filter((e) => e.horas_usadas > e.limite).length,
    [dercoEqs]
  );

  const novaInop = useMemo(
    () => novaEqs.reduce((s, e) => s + e.horas_inoperativas, 0),
    [novaEqs]
  );
  const dercoInop = useMemo(
    () => dercoEqs.reduce((s, e) => s + e.horas_inoperativas, 0),
    [dercoEqs]
  );

  // Overall KPIs
  const totalEquipos = monthEquipos.length;
  const excesoMont = useMemo(
    () => monthEquipos.filter((e) => e.tipo === 'MONTACARGA' && e.horas_usadas > e.limite).length,
    [monthEquipos]
  );
  const excesoElev = useMemo(
    () => monthEquipos.filter((e) => e.tipo === 'ELEVADOR' && e.horas_usadas > e.limite).length,
    [monthEquipos]
  );
  const totalInop = useMemo(
    () => monthEquipos.reduce((s, e) => s + e.horas_inoperativas, 0),
    [monthEquipos]
  );
  const totalHorasUsadas = useMemo(
    () => monthEquipos.reduce((s, e) => s + e.horas_usadas, 0),
    [monthEquipos]
  );

  const dispPct = useMemo(() => {
    const total = totalHorasUsadas + totalInop;
    if (total <= 0) return '100.0';
    return ((totalHorasUsadas / total) * 100).toFixed(1);
  }, [totalHorasUsadas, totalInop]);

  const topInop = useMemo(() => {
    return monthEquipos.reduce(
      (a: (typeof monthEquipos)[0] | null, b) =>
        b.horas_inoperativas > (a ? a.horas_inoperativas : -1) ? b : a,
      null
    );
  }, [monthEquipos]);

  const monthIncidencias = useMemo(() => {
    return incidencias.filter((i) => i.mes === activeMonth);
  }, [incidencias, activeMonth]);

  // Filtered chart items
  const chartItems = useMemo(() => {
    let list = monthEquipos.filter((e) => e.horas_usadas > 0 || e.horas_inoperativas > 0);
    if (chartFilter === 'MONTACARGA') list = list.filter((e) => e.tipo === 'MONTACARGA');
    else if (chartFilter === 'ELEVADOR') list = list.filter((e) => e.tipo === 'ELEVADOR');
    else if (chartFilter === 'EXCESO') list = list.filter((e) => e.horas_usadas > e.limite);

    return list.sort((a, b) => {
      const pctB = b.limite > 0 ? b.horas_usadas / b.limite : 0;
      const pctA = a.limite > 0 ? a.horas_usadas / a.limite : 0;
      return pctB - pctA;
    });
  }, [monthEquipos, chartFilter]);

  // Filtered incidencias
  const filteredIncidencias = useMemo(() => {
    let list = monthIncidencias;
    if (incTypeFilter === 'CORRECTIVO') {
      list = list.filter((i) => i.tipo_mant.toUpperCase().includes('CORRECTIVO'));
    } else if (incTypeFilter === 'PREVENTIVO') {
      list = list.filter((i) => i.tipo_mant.toUpperCase().includes('PREVENTIVO'));
    }

    if (incSearchText.trim()) {
      const q = incSearchText.toLowerCase();
      list = list.filter(
        (i) =>
          i.codigo.toLowerCase().includes(q) ||
          i.motivo.toLowerCase().includes(q) ||
          i.tipo_mant.toLowerCase().includes(q) ||
          i.resultado.toLowerCase().includes(q) ||
          i.proveedor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [monthIncidencias, incTypeFilter, incSearchText]);

  const bitacoraTotalHoras = useMemo(
    () => filteredIncidencias.reduce((s, i) => s + (i.horas || 0), 0),
    [filteredIncidencias]
  );

  return (
    <div className="space-y-6 pb-12 font-sans text-[#1A1A2E]">
      {/* 1. TOP EXECUTIVE HERO BANNER */}
      <header className="bg-gradient-to-r from-[#1A1A2E] via-[#1E293B] to-[#0F172A] rounded-2xl border-2 border-slate-700/80 shadow-xl p-5 md:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Truck className="w-4 h-4 text-amber-400" />
                SECCIÓN EJECUTIVA · FLOTA DE MONTACARGAS Y ELEVADORES STOL
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                19 Equipos Auditados
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                Límites Contractuales: 300h / 375h
              </span>
            </div>

            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm font-sans">
              Control de Operatividad de Flota, Inoperatividades y Horómetros
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-normal">
              Auditoría mensual de consumo de horómetros por equipo, detección inmediata de excesos sobre
              el límite contractual pactado con proveedores (NOVATRANS y DERCO), y bitácora consolidada
              de fallas mecánicas e inoperatividades.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto shrink-0">
            {/* Month Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/80 shadow-inner w-full lg:w-auto overflow-x-auto">
              <span className="text-[11px] font-black text-slate-400 uppercase px-2 shrink-0">
                📅 MES:
              </span>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMonth(m)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeMonth === m
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              <DataFreshnessStatus source="fleet" />
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 shadow-inner">
                <span className="text-emerald-400 font-bold">📊 DATA_DASHBOARD_EJECUTIVO.xlsx</span>
                <span className="text-slate-600">|</span>
                <span className="text-[10.5px] text-slate-300">Oficial Auditoría</span>
              </div>

              {/* Botón principal para subir el formato establecido de flota y horómetros */}
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer border border-emerald-400/50"
                title="Subir mi archivo Excel con el formato establecido de Flota y Horómetros"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>Subir mi Formato Establecido (.xlsx)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-slate-600"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Notification Notice */}
      {lastUploadNotice && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastUploadNotice}</span>
          </div>
          <button
            onClick={() => setLastUploadNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFleetTab('AUDITORIA');
              setReceptionEquipCode(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              fleetTab === 'AUDITORIA'
                ? 'bg-[#1A1A2E] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>1. Auditoría de Horómetros, Límites Contractuales & Bitácora</span>
          </button>

          <button
            onClick={() => {
              setFleetTab('RECEPCION');
              setReceptionEquipCode(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              fleetTab === 'RECEPCION'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>2. Fotos de Recepción & Actas de Equipos</span>
            <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              Subida Activa
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick upload format button in sub-navigation */}
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Subir mi archivo Excel con el formato establecido"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Subir mi Formato (.xlsx)</span>
          </button>

          {fleetTab === 'AUDITORIA' ? (
            <button
              onClick={() => {
                setFleetTab('RECEPCION');
                setReceptionEquipCode(null);
              }}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              <span>Subir Fotos de Recepción</span>
            </button>
          ) : (
            <button
              onClick={() => setFleetTab('AUDITORIA')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Truck className="w-3.5 h-3.5 text-slate-600" />
              <span>Volver a Auditoría</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CALENDAR & OPERATIONAL TIMELINE FILTERS */}
      <section className="bg-white border-2 border-slate-300 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-amber-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Filtros Operacionales de Calendario & Relevo de Flota</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  Cronológico
                </span>
              </h2>
              <p className="text-[11.5px] text-slate-500">
                Filtra por mes cronológico, fecha diaria, semanal, trimestral, o visualiza el relevo Derco del 24/09
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Auditoría: <b className="text-slate-900">{monthEquipos.length} equipos visibles</b>
            </span>

            <button
              onClick={() => setShowCalendarPanel(!showCalendarPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showCalendarPanel
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCalendarPanel ? 'Ocultar Calendario' : 'Abrir Calendario'}</span>
              {showCalendarPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Row 1: Meses Cronológicos + Hito Derco 24/09 */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Chronological Month Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Mes:
            </span>
            {availableMonths.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setActiveMonth(m);
                  setDateFilterMode('MES');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeMonth === m && dateFilterMode === 'MES'
                    ? 'bg-[#1A1A2E] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Derco Relevo 24/09 Quick Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full lg:w-auto">
            <span className="text-[10.5px] font-black text-slate-500 uppercase px-2">
              🚜 Relevo Derco (24/09):
            </span>
            <button
              onClick={() => setDercoRelevoFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                dercoRelevoFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Mostrar todos los equipos del mes (incluye notas de ingreso y salida)"
            >
              Mes Completo
            </button>
            <button
              onClick={() => setDercoRelevoFilter('PRE_24')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                dercoRelevoFilter === 'PRE_24'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
              title="Hasta el 23/09: Flota saliente (HGR-073, 131, etc. y HGR-027 Backup)"
            >
              <span>🟡 Hasta 23/09 (Flota Anterior)</span>
            </button>
            <button
              onClick={() => setDercoRelevoFilter('POST_24')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                dercoRelevoFilter === 'POST_24'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Desde el 24/09: Flota renovada (HGR-279 a HGR-286 y SGR-017 Backup)"
            >
              <span>🟢 Desde 24/09 (Flota Renovada)</span>
            </button>
          </div>
        </div>

        {/* Relevo Derco Context Notice Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11.5px] text-slate-700 flex items-start gap-2">
          <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <b>Relevo Operacional de Sede:</b> El <b>24/09</b> salieron de sede 8 montacargas Derco y el backup <b>HGR-027</b>. Ingresaron los 8 nuevos montacargas <b>HGR-279 al HGR-286</b> y <b>SGR-017 pasó a ser la nueva Backup</b>. Al filtrar por fecha o presionar los botones superiores, los equipos que salieron o los que aún no ingresaban se ocultan automáticamente.
          </div>
        </div>

        {/* Expanded Calendar Panel (Diario, Semanal, Mensual, Trimestral, Anual, Rango) */}
        {showCalendarPanel && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3.5 border-2 border-slate-800 animate-fade-in shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  CALENDARIO MULTITEMPORAL
                </span>
                <span className="text-xs text-slate-300">
                  Selecciona la periodicidad de búsqueda solicitada
                </span>
              </div>

              {/* Mode Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                {(['MES', 'DIARIO', 'SEMANAL', 'TRIMESTRAL', 'ANUAL', 'RANGO'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDateFilterMode(mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dateFilterMode === mode
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {mode === 'MES' ? 'Mensual' : mode === 'DIARIO' ? 'Diario' : mode === 'SEMANAL' ? 'Semanal' : mode === 'TRIMESTRAL' ? 'Trimestral' : mode === 'ANUAL' ? 'Anual' : 'Rango'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-controls based on mode */}
            {dateFilterMode === 'DIARIO' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold">Fecha de Registro:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">Atajos rápidos:</span>
                  <button
                    onClick={() => setSelectedDate('2026-09-20')}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    20/09 (Flota Antigua)
                  </button>
                  <button
                    onClick={() => setSelectedDate('2026-09-24')}
                    className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    24/09 (Día de Relevo)
                  </button>
                  <button
                    onClick={() => setSelectedDate('2026-09-28')}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    28/09 (Flota Renovada)
                  </button>
                </div>
              </div>
            )}

            {dateFilterMode === 'SEMANAL' && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-300 font-bold mr-1">Semanas Operacionales:</span>
                {[
                  { id: 'SEM_36', label: 'Sem 36 (01 - 07 Set)' },
                  { id: 'SEM_37', label: 'Sem 37 (08 - 14 Set)' },
                  { id: 'SEM_38', label: 'Sem 38 (15 - 21 Set)' },
                  { id: 'SEM_39', label: 'Sem 39 (22 - 28 Set · Relevo)' },
                  { id: 'SEM_40', label: 'Sem 40 (29 Set - 05 Oct)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedWeek(s.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedWeek === s.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {dateFilterMode === 'TRIMESTRAL' && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-300 font-bold mr-1">Trimestre:</span>
                {[
                  { id: 'T1', label: 'T1 (Ene - Mar)' },
                  { id: 'T2', label: 'T2 (Abr - Jun)' },
                  { id: 'T3', label: 'T3 (Jul - Set · Relevo Derco)' },
                  { id: 'T4', label: 'T4 (Oct - Dic · Flota Renovada)' },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuarter(q.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedQuarter === q.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {dateFilterMode === 'ANUAL' && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-300 font-bold mr-1">Año Contratado:</span>
                {[2025, 2026].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

            {dateFilterMode === 'RANGO' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold">Desde:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold">Hasta:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {fleetTab === 'RECEPCION' ? (
        <FleetReceptionUploader
          selectedEquipmentCode={receptionEquipCode}
          onClearEquipmentFilter={() => setReceptionEquipCode(null)}
        />
      ) : (
        <>
          {/* EXCEL SYNC CALLOUT BANNER IN AUDITORIA TAB */}
          <section className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 md:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                    FORMATO ESTABLECIDO DISPONIBLE
                  </span>
                  <span className="text-xs text-emerald-300 font-mono">
                    DATA_DASHBOARD_EJECUTIVO.xlsx
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-black text-white">
                  Actualización de Flota, Horómetros y Bitácora con tu Archivo Excel
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Carga el archivo con tu formato establecido para actualizar los {totalEquipos} equipos ({novaEqs.length} Novatrans, {dercoEqs.length} Derco),
                  horas consumidas de horómetro, excesos contractuales (300h / 375h) y bitácora de fallas mecánicas.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-slate-950" />
                <span>Subir mi Formato Establecido (.xlsx)</span>
              </button>
            </div>
          </section>

          {/* 2. FLEET PROVIDERS CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flota NOVATRANS */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-2 border-blue-500/40 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-black tracking-wider uppercase text-blue-300">
                PROVEEDOR PRINCIPAL · CONTRATO STOL
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                FLOTA NOVATRANS
              </h2>
              <p className="text-xs text-slate-300">
                Operaciones principales de almacén y despacho (Límite 300h)
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/40 text-blue-300 text-xl font-black">
              🚜
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/80">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Unidades</div>
              <div className="text-xl font-black font-mono text-white mt-0.5">{novaEqs.length}</div>
              <div className="text-[9.5px] text-blue-300 font-semibold">Equipos</div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Con Exceso</div>
              <div
                className={`text-xl font-black font-mono mt-0.5 ${
                  novaExcesos > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {novaExcesos}
              </div>
              <div className="text-[9.5px] text-slate-400 font-medium">Sobre Límite</div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Inoperatividad</div>
              <div
                className={`text-xl font-black font-mono mt-0.5 ${
                  novaInop > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {fmt(novaInop, 1)} h
              </div>
              <div className="text-[9.5px] text-slate-400 font-medium">En {activeMonth}</div>
            </div>
          </div>
        </div>

        {/* Flota DERCO */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 border-2 border-amber-500/40 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-black tracking-wider uppercase text-amber-300">
                PROVEEDOR ESTRATÉGICO · CONTRATO STOL
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">FLOTA DERCO</h2>
              <p className="text-xs text-slate-300">
                Equipos de elevación y apoyo para racks altos (300h / 375h)
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-400/40 text-amber-300 text-xl font-black">
              ⚡
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/80">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Unidades</div>
              <div className="text-xl font-black font-mono text-white mt-0.5">{dercoEqs.length}</div>
              <div className="text-[9.5px] text-amber-300 font-semibold">Equipos</div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Con Exceso</div>
              <div
                className={`text-xl font-black font-mono mt-0.5 ${
                  dercoExcesos > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {dercoExcesos}
              </div>
              <div className="text-[9.5px] text-slate-400 font-medium">Sobre Límite</div>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Inoperatividad</div>
              <div
                className={`text-xl font-black font-mono mt-0.5 ${
                  dercoInop > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {fmt(dercoInop, 1)} h
              </div>
              <div className="text-[9.5px] text-slate-400 font-medium">En {activeMonth}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIX VIVID EXECUTIVE GRADIENT KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1 */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-blue-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-100">
            <span>Flota Total</span>
            <span>🚚</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{totalEquipos}</div>
            <div className="text-[11px] font-bold text-blue-100 mt-0.5">Equipos Activos</div>
          </div>
          <div className="pt-2 border-t border-blue-400/30 text-[10.5px] text-blue-100 font-medium flex items-center justify-between">
            <span>NOVATRANS: {novaEqs.length}</span>
            <span>DERCO: {dercoEqs.length}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-amber-300/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-100">
            <span>Exceso Montacargas</span>
            <span>⚠️</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{excesoMont}</div>
            <div className="text-[11px] font-bold text-amber-100 mt-0.5">
              {excesoMont === 1 ? '1 Unidad > 300 h' : `${excesoMont} Unidades > 300 h`}
            </div>
          </div>
          <div className="pt-2 border-t border-amber-400/30 text-[10.5px] text-amber-100 font-medium truncate">
            {excesoMont > 0 ? '⚠️ Alerta sobrecosto' : '✅ Consumo dentro de norma'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-orange-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-orange-100">
            <span>Exceso Elevadores</span>
            <span>🔥</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{excesoElev}</div>
            <div className="text-[11px] font-bold text-orange-100 mt-0.5">
              {excesoElev === 1 ? '1 Unidad > 375 h' : `${excesoElev} Unidades > 375 h`}
            </div>
          </div>
          <div className="pt-2 border-t border-orange-400/30 text-[10.5px] text-orange-100 font-medium truncate">
            {excesoElev > 0 ? '⚠️ Límite contractual superado' : '✅ Consumo en rango'}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-rose-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-rose-100">
            <span>Inoperatividad</span>
            <span>🔧</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{fmt(totalInop, 1)}</div>
            <div className="text-[11px] font-bold text-rose-100 mt-0.5">
              Horas de Parada ({activeMonth})
            </div>
          </div>
          <div className="pt-2 border-t border-rose-400/30 text-[10.5px] text-rose-100 font-medium truncate">
            {monthIncidencias.length} fallas registradas
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-purple-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-200">
            <span>Mayor Parada</span>
            <span>🛡️</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black font-mono tracking-tight truncate">
              {topInop && topInop.horas_inoperativas > 0 ? topInop.codigo : 'Ninguno'}
            </div>
            <div className="text-[11px] font-bold text-purple-200 mt-0.5">
              {topInop && topInop.horas_inoperativas > 0
                ? `${fmt(topInop.horas_inoperativas, 1)} h inoperativo`
                : 'Sin fallas críticas'}
            </div>
          </div>
          <div className="pt-2 border-t border-purple-400/30 text-[10.5px] text-purple-200 font-medium truncate">
            Proveedor: {topInop ? (topInop.proveedor === 'NOVA' ? 'NOVATRANS' : 'DERCO') : 'Flota 100% OK'}
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border-2 border-emerald-400/40">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-100">
            <span>Disponibilidad</span>
            <span>⚡</span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono tracking-tight">{dispPct}%</div>
            <div className="text-[11px] font-bold text-emerald-100 mt-0.5">Operatividad Global</div>
          </div>
          <div className="pt-2 border-t border-emerald-400/30 text-[10.5px] text-emerald-100 font-medium truncate">
            {fmt(totalHorasUsadas, 0)} h productivas
          </div>
        </div>
      </section>

      {/* DIRECTORIAL OBSERVATIONS & DECISIONS FOR FLEET */}
      <ExecutiveObservationsSection
        moduleName="fleet"
        observations={getObservationsByModule('fleet')}
        defaultExpanded={true}
      />

      {/* 4. MAIN WORKSPACE: CHART & INCIDENCIAS BITÁCORA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hours Used vs Limits Bar Chart */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  📊 Horas Usadas vs. Límite Contractual por Equipo ({activeMonth})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Línea vertical = límite contractual (300h montacargas / 375h elevadores)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setChartFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({totalEquipos})
                </button>
                <button
                  onClick={() => setChartFilter('MONTACARGA')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartFilter === 'MONTACARGA'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Montacargas
                </button>
                <button
                  onClick={() => setChartFilter('ELEVADOR')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartFilter === 'ELEVADOR'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Elevadores
                </button>
                <button
                  onClick={() => setChartFilter('EXCESO')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartFilter === 'EXCESO'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exceso ({excesoMont + excesoElev})
                </button>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-2 mt-4">
              {chartItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No se encontraron equipos bajo el filtro seleccionado en {activeMonth}.
                </div>
              ) : (
                chartItems.map((e) => {
                  const maxScale = Math.max(e.limite * 1.35, e.horas_usadas * 1.05);
                  const pct = Math.min(100, (e.horas_usadas / maxScale) * 100);
                  const limitPct = Math.min(100, (e.limite / maxScale) * 100);
                  const over = e.horas_usadas > e.limite;
                  const ratioConsumo = e.limite > 0 ? (e.horas_usadas / e.limite) * 100 : 0;
                  const excesoHoras = Math.max(0, e.horas_usadas - e.limite);
                  const isNova = e.proveedor === 'NOVA';

                  const barGradient = over
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600'
                    : ratioConsumo > 80
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600';

                  const badgeRatio = over
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : ratioConsumo > 80
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800';

                  return (
                    <div key={e.codigo} className="group flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between text-[11.5px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-xs">{e.codigo}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase ${
                              isNova ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {e.proveedor}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{e.tipo}</span>
                          {e.esBackupNuevo && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                              🛡️ Backup
                            </span>
                          )}
                          {e.fechaSalidaSede && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              🔴 Salió 24/09
                            </span>
                          )}
                          {e.fechaIngresoSede && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🟢 Ingresó 24/09
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {over && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-200">
                              +{fmt(excesoHoras, 1)}h Exceso
                            </span>
                          )}
                          <span className="font-mono font-black text-slate-900">
                            {fmt(e.horas_usadas, 1)} / {e.limite} h
                          </span>
                          <span className={`text-[10.5px] font-black px-1.5 py-0.2 rounded ${badgeRatio}`}>
                            {ratioConsumo.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-6 bg-slate-100 rounded-lg relative overflow-visible border border-slate-200 p-0.5">
                        <div
                          className={`h-full rounded-md transition-all duration-500 shadow-xs flex items-center justify-end pr-2 text-[10px] font-black text-white ${barGradient}`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        >
                          {pct > 25 ? `${ratioConsumo.toFixed(0)}%` : ''}
                        </div>
                        <div
                          className="absolute -top-1 -bottom-1 w-[3px] bg-slate-900 z-10 rounded-full shadow-sm"
                          style={{ left: `${limitPct}%` }}
                          title={`Límite: ${e.limite} h`}
                        >
                          <div className="absolute -top-3.5 -left-3 text-[8px] font-black bg-slate-900 text-white px-1 py-0.2 rounded">
                            {e.limite}h
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600" />
              En Rango (&lt;80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600" />
              Uso Óptimo (80%-100%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-r from-amber-500 to-red-600" />
              Supera Límite (&gt;100%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-slate-900 rounded-sm" />
              Límite Contractual (300h / 375h)
            </span>
          </div>
        </div>

        {/* Right: Incidencias Bitácora */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30 text-amber-600">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Bitácora de Incidencias ({activeMonth})
                  </h2>
                  <p className="text-xs text-slate-500">Fallas mecánicas, mantenimientos y paradas</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                {filteredIncidencias.length} reg.
              </span>
            </div>

            <div className="flex gap-2 my-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={incSearchText}
                  onChange={(e) => setIncSearchText(e.target.value)}
                  placeholder="Buscar por equipo, falla, tipo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                {(['ALL', 'CORRECTIVO', 'PREVENTIVO'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setIncTypeFilter(t)}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      incTypeFilter === t
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t === 'ALL' ? 'Todos' : t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[460px] overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#1A1A2E] text-white text-[10.5px] uppercase tracking-wider font-black">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-2">Equipo</th>
                    <th className="py-2.5 px-2">Tipo / Falla</th>
                    <th className="py-2.5 px-3 text-right">Inop.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredIncidencias.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-400">
                        No se registraron incidencias en este mes con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidencias.map((r, idx) => {
                      const isCorrectivo = r.tipo_mant.toUpperCase().includes('CORRECTIVO');
                      const isReparado = r.resultado.toUpperCase().includes('REPARADO');
                      const isNova = r.proveedor === 'NOVA';

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono text-slate-600">
                            {r.fecha}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            <div className="font-mono font-black text-slate-900 text-xs">
                              {r.codigo}
                            </div>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isNova ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {r.proveedor}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                  isCorrectivo
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {r.tipo_mant}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  isReparado
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}
                              >
                                {r.resultado}
                              </span>
                            </div>
                            <div
                              className="text-[10.5px] text-slate-600 truncate max-w-[200px] mt-0.5"
                              title={r.motivo}
                            >
                              {r.motivo}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs ${
                                r.horas > 4 ? 'bg-red-100 text-red-800 font-black' : 'text-slate-900'
                              }`}
                            >
                              {fmt(r.horas, 1)} h
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total horas inoperativas en bitácora:</span>
            <b className="font-mono text-slate-900 font-black text-sm">
              {fmt(bitacoraTotalHoras, 1)} h
            </b>
          </div>
        </div>
      </section>

      {/* 5. INDIVIDUAL FLEET STATUS BREAKDOWN */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              📑 Detalle Individual de Estatus por Equipo ({activeMonth})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Estado de horómetro, consumo contractual y paradas agrupado por proveedor
            </p>
          </div>
          <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Operativo
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> Exceso
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" /> Inoperatividad
          </div>
        </div>

        {/* Flota NOVATRANS Grid */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between bg-blue-50/80 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-950">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              FLOTA NOVATRANS · {novaEqs.length} Equipos Auditados
            </div>
            <span className="text-xs font-bold text-blue-800">Límite 300h (Montacargas)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {novaEqs.map((e) => {
              const over = e.horas_usadas > e.limite;
              const conIncidencia = e.horas_inoperativas > 0;
              const pct = Math.min(100, e.limite > 0 ? (e.horas_usadas / e.limite) * 100 : 0);

              let cardBorder = 'border-slate-200 hover:border-blue-400';
              let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              let badgeText = 'OPERATIVO';

              if (conIncidencia && over) {
                cardBorder = 'border-red-300 bg-red-50/30';
                badgeBg = 'bg-red-600 text-white';
                badgeText = 'EXCESO + INOP';
              } else if (conIncidencia) {
                cardBorder = 'border-rose-300 bg-rose-50/20';
                badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
                badgeText = 'CON INCIDENCIA';
              } else if (over) {
                cardBorder = 'border-amber-300 bg-amber-50/20';
                badgeBg = 'bg-amber-500 text-slate-950 font-black';
                badgeText = 'EXCESO HORÓMETRO';
              }

              const barColor = over
                ? 'bg-gradient-to-r from-amber-500 to-red-600'
                : pct > 80
                ? 'bg-blue-600'
                : 'bg-emerald-500';

              return (
                <div
                  key={e.codigo}
                  className={`bg-white border-2 rounded-xl p-3.5 shadow-xs transition-all flex flex-col justify-between ${cardBorder}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div>
                        <div className="font-mono font-black text-base text-slate-900">
                          {e.codigo}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">{e.tipo}</div>
                      </div>
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeBg}`}
                      >
                        {badgeText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>Consumo:</span>
                      <b className="font-mono font-bold text-slate-900">
                        {fmt(e.horas_usadas, 0)} / {e.limite} h ({pct.toFixed(0)}%)
                      </b>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-semibold text-slate-600">
                    <span>Inoperatividad:</span>
                    <b
                      className={`font-mono ${
                        conIncidencia ? 'text-red-600 font-black' : 'text-slate-500'
                      }`}
                    >
                      {fmt(e.horas_inoperativas, 1)} h
                    </b>
                  </div>

                  <button
                    onClick={() => {
                      setReceptionEquipCode(e.codigo);
                      setFleetTab('RECEPCION');
                    }}
                    className="w-full mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50/80 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fotos de Recepción</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flota DERCO Grid */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between bg-amber-50/80 px-4 py-2.5 rounded-xl border border-amber-200 text-amber-950">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <span className="w-3 h-3 rounded-full bg-amber-600" />
              FLOTA DERCO · {dercoEqs.length} Equipos Auditados
            </div>
            <span className="text-xs font-bold text-amber-800">
              Límite 300h (Montacargas) / 375h (Elevadores)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {dercoEqs.map((e) => {
              const over = e.horas_usadas > e.limite;
              const conIncidencia = e.horas_inoperativas > 0;
              const pct = Math.min(100, e.limite > 0 ? (e.horas_usadas / e.limite) * 100 : 0);

              let cardBorder = 'border-slate-200 hover:border-amber-400';
              let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              let badgeText = 'OPERATIVO';

              if (conIncidencia && over) {
                cardBorder = 'border-red-300 bg-red-50/30';
                badgeBg = 'bg-red-600 text-white';
                badgeText = 'EXCESO + INOP';
              } else if (conIncidencia) {
                cardBorder = 'border-rose-300 bg-rose-50/20';
                badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
                badgeText = 'CON INCIDENCIA';
              } else if (over) {
                cardBorder = 'border-amber-300 bg-amber-50/20';
                badgeBg = 'bg-amber-500 text-slate-950 font-black';
                badgeText = 'EXCESO HORÓMETRO';
              }

              const barColor = over
                ? 'bg-gradient-to-r from-amber-500 to-red-600'
                : pct > 80
                ? 'bg-blue-600'
                : 'bg-emerald-500';

              return (
                <div
                  key={e.codigo}
                  className={`bg-white border-2 rounded-xl p-3.5 shadow-xs transition-all flex flex-col justify-between ${cardBorder}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div>
                        <div className="font-mono font-black text-base text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{e.codigo}</span>
                          {e.esBackupNuevo && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                              🛡️ Backup
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500">{e.tipo}</span>
                          {e.fechaSalidaSede && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              🔴 Salió 24/09
                            </span>
                          )}
                          {e.fechaIngresoSede && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🟢 Ingresó 24/09
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeBg}`}
                      >
                        {badgeText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>Consumo:</span>
                      <b className="font-mono font-bold text-slate-900">
                        {fmt(e.horas_usadas, 0)} / {e.limite} h ({pct.toFixed(0)}%)
                      </b>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-semibold text-slate-600">
                    <span>Inoperatividad:</span>
                    <b
                      className={`font-mono ${
                        conIncidencia ? 'text-red-600 font-black' : 'text-slate-500'
                      }`}
                    >
                      {fmt(e.horas_inoperativas, 1)} h
                    </b>
                  </div>

                  <button
                    onClick={() => {
                      setReceptionEquipCode(e.codigo);
                      setFleetTab('RECEPCION');
                    }}
                    className="w-full mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50/80 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>Fotos de Recepción</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
        </>
      )}

      {/* 6. EXECUTIVE FOOTER */}
      <footer className="text-center text-xs text-slate-500 font-medium py-3 border-t border-slate-200">
        Plataforma Integral de Auditorías Operacionales STOL · Módulo de Flota de Montacargas y
        Elevadores (Datos consolidados de Bitácora y Horómetros)
      </footer>

      {/* MODAL PARA SUBIR FORMATO ESTABLECIDO */}
      <FleetExcelSyncModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        currentEquipos={equipos}
        currentIncidencias={incidencias}
        onDataUpdated={handleDataUpdated}
        onResetToDefaults={handleResetToDefaults}
      />
    </div>
  );
};
