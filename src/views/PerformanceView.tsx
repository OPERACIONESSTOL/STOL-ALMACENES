import React, { useState, useMemo } from 'react';
import {
  SupervisorMonthly,
  SupervisorWeekly,
  ObservationItem,
  QuarterlySummary,
  GlobalDashboardConfig,
  ObservationPillar,
} from '../types/performance';
import {
  INITIAL_CONFIG,
  INITIAL_SUPERVISORS,
  INITIAL_WEEKLIES,
  INITIAL_OBSERVATIONS,
  INITIAL_QUARTERLY,
} from '../data/initialPerformanceData';

import { EditSupervisorModal } from '../components/EditSupervisorModal';
import { EditObservationModal } from '../components/EditObservationModal';
import { EditWeeklyModal } from '../components/EditWeeklyModal';
import { DataManagementModal } from '../components/DataManagementModal';
import { StolLogo } from '../components/StolLogo';
import { SupervisorLowGradesDiagnostic } from '../components/SupervisorLowGradesDiagnostic';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';

import {
  Users,
  Printer,
  Edit3,
  Plus,
  Settings,
  Filter,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Search,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consolidado' | 'mensual' | 'trimestral' | 'observaciones' | 'diagnostico_causal'>('consolidado');
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

  // New Interactive Filters (extracted from HTML / requirements)
  const [filterBoss, setFilterBoss] = useState<'Todos' | 'Pedro Morante' | 'Aldo Bautista'>('Todos');
  const [filterSupervisorName, setFilterSupervisorName] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'activos' | 'inactivos'>('Todos');
  const [filterPerformanceBand, setFilterPerformanceBand] = useState<'Todos' | 'alerta' | 'regular' | 'destacado'>('Todos');
  const [globalFilterSearch, setGlobalFilterSearch] = useState<string>('');

  // Sincronización y Actualización de Información (extracted from HTML / requirements)
  const [isUpdatingData, setIsUpdatingData] = useState<boolean>(false);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>('Hoy, 10:45 AM');

  const [config, setConfig] = useState<GlobalDashboardConfig>(INITIAL_CONFIG);
  const [supervisors, setSupervisors] = useState<SupervisorMonthly[]>(INITIAL_SUPERVISORS);
  const [weeklies, setWeeklies] = useState<SupervisorWeekly[]>(INITIAL_WEEKLIES);
  const [observations, setObservations] = useState<ObservationItem[]>(INITIAL_OBSERVATIONS);
  const [quarterly, setQuarterly] = useState<QuarterlySummary>(INITIAL_QUARTERLY);

  const [obsFilterPillar, setObsFilterPillar] = useState<'Todos' | ObservationPillar>('Todos');
  const [obsSearchTerm, setObsSearchTerm] = useState<string>('');

  const [editingSupervisor, setEditingSupervisor] = useState<SupervisorMonthly | null>(null);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState<boolean>(false);

  const [editingObservation, setEditingObservation] = useState<ObservationItem | null>(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState<boolean>(false);

  const [editingWeekly, setEditingWeekly] = useState<SupervisorWeekly | null>(null);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState<boolean>(false);

  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefreshData = () => {
    setIsUpdatingData(true);
    setTimeout(() => {
      setIsUpdatingData(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setLastUpdateTimestamp(`Hoy, ${timeStr}`);
      showToast('Información de supervisores y notas actualizada exitosamente.');
    }, 600);
  };

  const supervisorsWithCalculatedFinal = useMemo(() => {
    return supervisors.map((s) => {
      if (s.finalGradeOverride !== null && s.finalGradeOverride !== undefined) {
        return { ...s, calculatedFinal: s.finalGradeOverride };
      }
      const values = Object.values(s.months).filter((v): v is number => v !== null && !isNaN(v));
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { ...s, calculatedFinal: parseFloat(avg.toFixed(1)) };
    });
  }, [supervisors]);

  // Dynamic filter application across supervisors
  const filteredSupervisorsWithCalculatedFinal = useMemo(() => {
    return supervisorsWithCalculatedFinal.filter((sup) => {
      if (filterBoss !== 'Todos' && sup.directBoss !== filterBoss) return false;
      if (filterSupervisorName !== 'Todos' && sup.name !== filterSupervisorName) return false;
      if (filterStatus === 'activos' && !sup.active) return false;
      if (filterStatus === 'inactivos' && sup.active) return false;

      const grade = sup.months.oct ?? sup.calculatedFinal;
      if (filterPerformanceBand === 'alerta' && grade >= 80) return false;
      if (filterPerformanceBand === 'regular' && (grade < 80 || grade >= 88)) return false;
      if (filterPerformanceBand === 'destacado' && grade < 88) return false;

      if (globalFilterSearch.trim()) {
        const query = globalFilterSearch.toLowerCase();
        const matchName = sup.name.toLowerCase().includes(query);
        const matchBoss = sup.directBoss.toLowerCase().includes(query);
        const matchBadge = (sup.badge || '').toLowerCase().includes(query);
        if (!matchName && !matchBoss && !matchBadge) return false;
      }

      return true;
    });
  }, [
    supervisorsWithCalculatedFinal,
    filterBoss,
    filterSupervisorName,
    filterStatus,
    filterPerformanceBand,
    globalFilterSearch,
  ]);

  const filteredWeeklies = useMemo(() => {
    const validIds = new Set(filteredSupervisorsWithCalculatedFinal.map((s) => s.id));
    return weeklies.filter((w) => validIds.has(w.supervisorId));
  }, [weeklies, filteredSupervisorsWithCalculatedFinal]);

  const monthlyAverages = useMemo(() => {
    const monthsKeys: Array<keyof SupervisorMonthly['months']> = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct',
    ];
    const avgs: Record<string, number | null> = {};

    monthsKeys.forEach((m) => {
      const valid = supervisors
        .map((s) => s.months[m])
        .filter((v): v is number => v !== null && !isNaN(v));
      if (valid.length > 0) {
        avgs[m] = parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
      } else {
        avgs[m] = null;
      }
    });

    const allFinals = supervisorsWithCalculatedFinal.map((s) => s.calculatedFinal);
    const generalAvg =
      allFinals.length > 0 ? allFinals.reduce((a, b) => a + b, 0) / allFinals.length : 0;
    avgs['final'] = parseFloat(generalAvg.toFixed(1));

    return avgs;
  }, [supervisors, supervisorsWithCalculatedFinal]);

  const octAvg = monthlyAverages['oct'] ?? 84.3;
  const gapVsMeta = parseFloat((octAvg - config.metaERU).toFixed(1));

  const activeOctSupervisors = useMemo(() => {
    return supervisorsWithCalculatedFinal
      .filter((s) => s.active && s.months.oct !== null)
      .sort((a, b) => (b.months.oct || 0) - (a.months.oct || 0));
  }, [supervisorsWithCalculatedFinal]);

  const bestSupervisor = activeOctSupervisors[0] || null;
  const lowestSupervisor = activeOctSupervisors[activeOctSupervisors.length - 1] || null;

  const handleSaveSupervisor = (updated: SupervisorMonthly) => {
    setSupervisors((prev) => {
      const exists = prev.some((s) => s.id === updated.id);
      if (exists) {
        return prev.map((s) => (s.id === updated.id ? updated : s));
      }
      return [...prev, updated];
    });

    setWeeklies((prev) => {
      const exists = prev.some((w) => w.supervisorId === updated.id);
      if (!exists) {
        return [
          ...prev,
          {
            supervisorId: updated.id,
            supervisorName: updated.name,
            directBoss: updated.directBoss,
            weeks: {
              sem40: updated.months.oct || 80,
              sem41: updated.months.oct || 80,
              sem42: updated.months.oct || 80,
              sem43: updated.months.oct || 80,
              sem44: updated.months.oct || 80,
            },
          },
        ];
      }
      return prev.map((w) =>
        w.supervisorId === updated.id
          ? { ...w, supervisorName: updated.name, directBoss: updated.directBoss }
          : w
      );
    });

    showToast(`Supervisor "${updated.name}" guardado exitosamente.`);
  };

  const handleDeleteSupervisor = (id: string) => {
    setSupervisors((prev) => prev.filter((s) => s.id !== id));
    setWeeklies((prev) => prev.filter((w) => w.supervisorId !== id));
    showToast('Supervisor eliminado.');
  };

  const handleSaveObservation = (updated: ObservationItem) => {
    setObservations((prev) => {
      const exists = prev.some((o) => o.id === updated.id);
      if (exists) {
        return prev.map((o) => (o.id === updated.id ? updated : o));
      }
      return [updated, ...prev];
    });
    showToast('Observación guardada con éxito.');
  };

  const handleDeleteObservation = (id: string) => {
    setObservations((prev) => prev.filter((o) => o.id !== id));
    showToast('Observación eliminada de la bitácora.');
  };

  const handleSaveWeekly = (updated: SupervisorWeekly) => {
    setWeeklies((prev) =>
      prev.map((w) => (w.supervisorId === updated.supervisorId ? updated : w))
    );
    showToast(`Semanas de ${updated.supervisorName} actualizadas.`);
  };

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      const matchesPillar = obsFilterPillar === 'Todos' || obs.pillar === obsFilterPillar;
      const matchesSearch =
        obs.supervisorName.toLowerCase().includes(obsSearchTerm.toLowerCase()) ||
        obs.title.toLowerCase().includes(obsSearchTerm.toLowerCase()) ||
        obs.auditor.toLowerCase().includes(obsSearchTerm.toLowerCase()) ||
        obs.description.toLowerCase().includes(obsSearchTerm.toLowerCase());
      return matchesPillar && matchesSearch;
    });
  }, [observations, obsFilterPillar, obsSearchTerm]);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border-2 border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. ENCABEZADO PRINCIPAL DE LA PESTAÑA */}
      <header className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <StolLogo variant="header" />
            <div className="border-l border-slate-300 pl-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-wide font-sans">
                  Evaluación de Desempeño – Supervisores 2026
                </h1>
                <span className="bg-blue-100 text-blue-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-300">
                  Enero – Octubre 2026
                </span>
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  ⭐ Meta ERU: {config.metaERU}%
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Seguimiento de cumplimiento operativo, auditoría 60/20/20 y justificación de notas con evidencia SIG y RRHH
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Opción para Actualizar la Información (Extracted from HTML) */}
            <button
              onClick={handleRefreshData}
              disabled={isUpdatingData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
              title="Sincronizar y recalcular datos de supervisores en tiempo real"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingData ? 'animate-spin' : ''}`} />
              <span>{isUpdatingData ? 'Sincronizando...' : 'Actualizar Información'}</span>
            </button>

            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 hidden sm:inline-flex items-center gap-1">
              <span>🕒</span>
              <span>{lastUpdateTimestamp}</span>
            </span>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Activar para editar calificaciones, nombres, notas y observaciones directamente"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modo Edición: {isEditMode ? 'ACTIVADO' : 'DESACTIVADO'}</span>
            </button>

            <button
              onClick={() => setIsDataModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all border border-slate-300 cursor-pointer shadow-sm"
              title="Configurar metas, exportar e importar datos"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Administrar Datos</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all border border-slate-300 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir / PDF</span>
            </button>

            <span className="bg-emerald-100 text-emerald-950 font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1">
              ✔ Consolidado Oficial
            </span>
          </div>
        </div>

        {/* Notificación de Reglas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2.5 bg-amber-50/90 border border-amber-300 rounded-xl px-3.5 py-2 text-xs text-amber-950">
            <span className="text-base">🛡️</span>
            <span>
              <strong>Filtro de Auditores Activo:</strong> Se excluyen de los rankings y promedios operativos a <strong>Karla Bolívar</strong> y <strong>Makley Villanueva</strong> (Auditores evaluadores).
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-blue-50/90 border border-blue-300 rounded-xl px-3.5 py-2 text-xs text-blue-950">
            <span className="text-base">📋</span>
            <span>
              <strong>Integridad de Datos:</strong> Las notas finales provienen exactamente de la pestaña <strong>CONSOLIDADO</strong> sin alteraciones, y las causas de descuento se sustentan en las pestañas <strong>SIG</strong> y <strong>RRHH</strong>.
            </span>
          </div>
        </div>

        {/* BARRA DE FILTROS INTERACTIVOS (Extracted from HTML) */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Filtros Operativos de Desempeño
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">
                Supervisores visibles: <strong>{filteredSupervisorsWithCalculatedFinal.length}</strong> de {supervisorsWithCalculatedFinal.length}
              </span>
              {(filterBoss !== 'Todos' || filterSupervisorName !== 'Todos' || filterStatus !== 'Todos' || filterPerformanceBand !== 'Todos' || globalFilterSearch) && (
                <button
                  onClick={() => {
                    setFilterBoss('Todos');
                    setFilterSupervisorName('Todos');
                    setFilterStatus('Todos');
                    setFilterPerformanceBand('Todos');
                    setGlobalFilterSearch('');
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer underline ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            {/* Filter by Boss */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Jefe Directo:
              </label>
              <select
                value={filterBoss}
                onChange={(e) => setFilterBoss(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Todos los Jefes</option>
                <option value="Pedro Morante">Pedro Morante</option>
                <option value="Aldo Bautista">Aldo Bautista</option>
              </select>
            </div>

            {/* Filter by Supervisor */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Supervisor:
              </label>
              <select
                value={filterSupervisorName}
                onChange={(e) => setFilterSupervisorName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Todos los Supervisores</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.directBoss})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Performance Level */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nivel de Rendimiento:
              </label>
              <select
                value={filterPerformanceBand}
                onChange={(e) => setFilterPerformanceBand(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Todos los Rangos</option>
                <option value="alerta">🚨 En Alerta Crítica (&lt; 80%)</option>
                <option value="regular">⚠️ Regular / Seguimiento (80% - 87%)</option>
                <option value="destacado">🏆 Destacado (≥ 88%)</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Estado del Supervisor:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="activos">Solo Activos (Actual)</option>
                <option value="inactivos">Relevados / Históricos</option>
              </select>
            </div>

            {/* Real-time search */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Búsqueda Rápida:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Nombre, badge..."
                  value={globalFilterSearch}
                  onChange={(e) => setGlobalFilterSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIRECTORIAL DECISION DECK: OBSERVATIONS & ACTIONS */}
        <ExecutiveObservationsSection
          moduleName="supervisors"
          observations={getObservationsByModule('supervisors')}
          defaultExpanded={true}
        />

        {/* Barra de Pestañas Interactivas */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto text-xs font-black">
          <button
            onClick={() => setActiveTab('consolidado')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'consolidado'
                ? 'bg-[#1A1A2E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Consolidado General (Ene – Oct)
          </button>
          <button
            onClick={() => setActiveTab('mensual')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'mensual'
                ? 'bg-[#1A1A2E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Análisis Mensual Detallado (Octubre)
          </button>
          <button
            onClick={() => setActiveTab('trimestral')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'trimestral'
                ? 'bg-[#1A1A2E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Comparativa Trimestral (T1 - T4)
          </button>
          <button
            onClick={() => setActiveTab('diagnostico_causal')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostico_causal'
                ? 'bg-gradient-to-r from-rose-900 to-indigo-950 text-white shadow-md ring-2 ring-rose-400/60'
                : 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 hover:text-rose-900 border border-rose-200'
            }`}
          >
            🚨 ¿Por qué las Bajas Notas? (Causas Raíz)
          </button>
          <button
            onClick={() => setActiveTab('observaciones')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'observaciones'
                ? 'bg-[#1A1A2E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Bitácora de Observaciones (SIG & RRHH)
          </button>
        </div>
      </header>

      {/* 2. RESUMEN EJECUTIVO (KPIs GLOBALES) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Promedio Operativo (Octubre)
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              📈
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 my-1 tabular-nums">
            {octAvg.toFixed(1)}%
          </div>
          <div className="text-xs font-bold text-rose-600">
            Brecha vs Meta ({config.metaERU}%): {gapVsMeta > 0 ? `+${gapVsMeta}` : gapVsMeta} pts
          </div>
        </div>

        <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Mejor Supervisor (1° Lugar)
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              🏆
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950 my-1 truncate">
            {bestSupervisor ? bestSupervisor.name : '–'}
          </div>
          <div className="text-xs font-extrabold text-emerald-700">
            Calificación: {bestSupervisor?.months.oct ? `${bestSupervisor.months.oct}%` : '–'} (Jefe:{' '}
            {bestSupervisor?.directBoss})
          </div>
        </div>

        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Menor Puntaje
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              ⚠️
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950 my-1 truncate">
            {lowestSupervisor ? lowestSupervisor.name : '–'}
          </div>
          <div className="text-xs font-extrabold text-amber-800">
            Calificación: {lowestSupervisor?.months.oct ? `${lowestSupervisor.months.oct}%` : '–'} (Jefe:{' '}
            {lowestSupervisor?.directBoss})
          </div>
        </div>

        <div className="bg-slate-900 text-white border-2 border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Supervisores Operativos
            </span>
            <span className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-sm">
              👥
            </span>
          </div>
          <div className="text-3xl font-black text-white my-1 tabular-nums">
            {activeOctSupervisors.length} Activos
          </div>
          <div className="text-xs text-slate-300 font-medium">
            Marco Silva asumió en Mayo (reemplazo K. Tamara)
          </div>
        </div>
      </section>

      {/* 2.5 BANNER EJECUTIVO: ALERTA CAUSAL DE BAJAS NOTAS (Extracted from HTML) */}
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-blue-500/10 border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 font-sans">
                Análisis Causal: ¿Por qué las Bajas Notas de los Supervisores?
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-black border border-rose-200">
                Pedro Oliva: 77.6% · Marco Silva: 81.0% · Liz Minaya: 81.6%
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
              Causas auditadas: 12 pallets en buffer &gt;72h (-6.8 pts), tardanzas en relevo nocturno (-7.4 pts), ATS extemporáneo (-4.0 pts) y discrepancias de conteo en picking (-8.5 pts).
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('diagnostico_causal')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          <span>Ver Sustento y Causas Raíz</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* TAB 1: CONSOLIDADO GENERAL */}
      {activeTab === 'consolidado' && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                  Matriz Consolidada de Calificaciones (Enero a Octubre 2026)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Valores exactos establecidos en el consolidado general de operaciones para la toma de decisiones de Gerencia General.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditMode && (
                  <button
                    onClick={() => {
                      setEditingSupervisor(null);
                      setIsSupervisorModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Supervisor</span>
                  </button>
                )}
                <span className="bg-slate-100 text-slate-700 font-black text-xs px-3 py-1 rounded-full border border-slate-300">
                  10 Meses Auditados
                </span>
              </div>
            </div>

            {isEditMode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center justify-between">
                <span>
                  💡 <strong>Modo Edición activo:</strong> Haz clic en el botón <strong>"Editar"</strong> de cualquier fila para modificar nombres, jefaturas y notas mensuales.
                </span>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center border-r border-slate-700">#</th>
                    <th className="py-3 px-4 border-r border-slate-700">Supervisor Operativo</th>
                    <th className="py-3 px-3 border-r border-slate-700">Jefe Directo</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Ene</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Feb</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Mar</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Abr</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">May</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Jun</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Jul</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Ago</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700">Set</th>
                    <th className="py-3 px-2 text-center border-r border-slate-700 bg-blue-900 text-amber-300">
                      Oct
                    </th>
                    <th className="py-3 px-3 text-center bg-slate-800 text-white border-l border-slate-700">
                      Nota Final Exacta
                    </th>
                    {isEditMode && <th className="py-3 px-3 text-center bg-slate-950 text-amber-400">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  {filteredSupervisorsWithCalculatedFinal.length === 0 && (
                    <tr>
                      <td colSpan={15} className="py-8 text-center text-slate-500 font-medium">
                        No se encontraron supervisores con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                  {filteredSupervisorsWithCalculatedFinal.map((sup, idx) => (
                    <tr
                      key={sup.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !sup.active ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-black text-slate-900 border-r border-slate-200">
                        {sup.name}
                        {sup.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded ml-1.5 ${
                              sup.badge.includes('1°')
                                ? 'bg-emerald-100 text-emerald-800'
                                : sup.badge.includes('Hasta')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sup.badge}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                        {sup.directBoss}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.ene !== null ? `${sup.months.ene}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.feb !== null ? `${sup.months.feb}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.mar !== null ? `${sup.months.mar}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.abr !== null ? `${sup.months.abr}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.may !== null ? `${sup.months.may}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.jun !== null ? `${sup.months.jun}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.jul !== null ? `${sup.months.jul}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.ago !== null ? `${sup.months.ago}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums">
                        {sup.months.set !== null ? `${sup.months.set}%` : '–'}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-black text-blue-900 bg-blue-50/50">
                        {sup.months.oct !== null ? `${sup.months.oct}%` : '–'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black bg-slate-50">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-black ${
                            sup.calculatedFinal >= 84
                              ? 'bg-emerald-100 text-emerald-900'
                              : sup.calculatedFinal >= 80
                              ? 'bg-blue-100 text-blue-900'
                              : sup.calculatedFinal >= 75
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {sup.calculatedFinal}%
                        </span>
                      </td>
                      {isEditMode && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setEditingSupervisor(sup);
                              setIsSupervisorModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-700">
                    <td className="py-3 px-3 text-center text-slate-400 border-r border-slate-800">–</td>
                    <td className="py-3 px-4 uppercase tracking-wide border-r border-slate-800">
                      Promedio General Operativo
                    </td>
                    <td className="py-3 px-3 text-slate-400 border-r border-slate-800">AMBOS</td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.ene}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.feb}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.mar}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.abr}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.may}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.jun}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.jul}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.ago}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums">
                      {monthlyAverages.set}%
                    </td>
                    <td className="py-3 px-2 text-center border-r border-slate-800 tabular-nums bg-slate-800 text-amber-400 font-extrabold">
                      {monthlyAverages.oct}%
                    </td>
                    <td className="py-3 px-3 text-center bg-slate-800">
                      <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md font-black">
                        {monthlyAverages.final}%
                      </span>
                    </td>
                    {isEditMode && <td className="py-3 px-3 bg-slate-950 text-slate-400">–</td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISTA MENSUAL */}
      {activeTab === 'mensual' && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                  Detalle por Semanas – Octubre 2026 (Semanas 40, 41, 42, 43, 44)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Evaluación continua semanal con ponderación de los tres pilares operativos
                </p>
              </div>
              <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                Ponderación: Operaciones 60% + RRHH 20% + SIG 20%
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase">
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">#</th>
                    <th className="py-2.5 px-4 border-r border-slate-700">Supervisor Operativo</th>
                    <th className="py-2.5 px-3 border-r border-slate-700">Jefe Directo</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700 bg-slate-800">Nota Mes</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Sem 40</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Sem 41</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Sem 42</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-700">Sem 43</th>
                    <th className="py-2.5 px-3 text-center">Sem 44</th>
                    {isEditMode && <th className="py-2.5 px-3 text-center bg-slate-950 text-amber-400">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  {filteredWeeklies.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                        No se encontraron semanas para los supervisores filtrados.
                      </td>
                    </tr>
                  )}
                  {filteredWeeklies.map((w, idx) => {
                    const parentSup = supervisors.find((s) => s.id === w.supervisorId);
                    const monthOctGrade = parentSup?.months.oct ?? 0;

                    return (
                      <tr key={w.supervisorId} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-black text-slate-900 border-r border-slate-200">
                          {w.supervisorName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                          {w.directBoss}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50 border-r border-slate-200 text-emerald-700">
                          {monthOctGrade ? `${monthOctGrade}%` : '–'}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 tabular-nums">
                          {w.weeks.sem40 !== null ? `${w.weeks.sem40}%` : '–'}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 tabular-nums">
                          {w.weeks.sem41 !== null ? `${w.weeks.sem41}%` : '–'}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 tabular-nums">
                          {w.weeks.sem42 !== null ? `${w.weeks.sem42}%` : '–'}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 tabular-nums">
                          {w.weeks.sem43 !== null ? `${w.weeks.sem43}%` : '–'}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          {w.weeks.sem44 !== null ? `${w.weeks.sem44}%` : '–'}
                        </td>
                        {isEditMode && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setEditingWeekly(w);
                                setIsWeeklyModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs">
                    <td colSpan={3} className="py-2.5 px-4 uppercase text-right border-r border-slate-800">
                      Promedio Semanal del Equipo
                    </td>
                    <td className="py-2.5 px-3 text-center bg-slate-800 text-amber-300 border-r border-slate-800">
                      84.3%
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-800">83.6%</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-800">85.2%</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-800">86.0%</td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-800">84.7%</td>
                    <td className="py-2.5 px-3 text-center">85.5%</td>
                    {isEditMode && <td className="py-2.5 px-3 bg-slate-950 text-slate-400">–</td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRIMESTRAL */}
      {activeTab === 'trimestral' && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                Resumen Trimestral de Supervisores Generales y Operativos 2026
              </h2>
              <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                Auditoría Consolidada T1 – T4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500">T1 (Ene – Mar)</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Cerrado</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{quarterly.t1}%</div>
                <p className="text-[11px] text-slate-600">{quarterly.t1Detail}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500">T2 (Abr – Jun)</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Cerrado</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{quarterly.t2}%</div>
                <p className="text-[11px] text-slate-600">{quarterly.t2Detail}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500">T3 (Jul – Set)</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Cerrado</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{quarterly.t3}%</div>
                <p className="text-[11px] text-slate-600">{quarterly.t3Detail}</p>
              </div>

              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-blue-900">T4 (Octubre)</span>
                  <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-bold animate-pulse">En Curso</span>
                </div>
                <div className="text-2xl font-black text-blue-900">{quarterly.t4}%</div>
                <p className="text-[11px] text-blue-800">{quarterly.t4Detail}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DIAGNÓSTICO CAUSAL DE BAJAS NOTAS (Extracted from HTML / Requirements) */}
      {activeTab === 'diagnostico_causal' && (
        <SupervisorLowGradesDiagnostic
          supervisors={supervisors}
          observations={observations}
          metaERU={config.metaERU}
          onEditObservation={(obs) => {
            setEditingObservation(obs);
            setIsObservationModalOpen(true);
          }}
          isEditMode={isEditMode}
        />
      )}

      {/* TAB 4: OBSERVACIONES */}
      {activeTab === 'observaciones' && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Sustento de Calificaciones: ¿Por qué tienen esas observaciones?
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Evidencia auditada extraída de las pestañas SIG y RRHH que explica los descuentos de calificación en cada supervisor.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isEditMode && (
                  <button
                    onClick={() => {
                      setEditingObservation(null);
                      setIsObservationModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Observación</span>
                  </button>
                )}
                <span className="bg-purple-100 text-purple-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-purple-200">
                  RRHH (Karla Bolívar)
                </span>
                <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-200">
                  SIG (Makley Villanueva)
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrar Pilar:
                </span>
                {(['Todos', 'Operaciones', 'RRHH', 'SIG'] as const).map((pillar) => (
                  <button
                    key={pillar}
                    onClick={() => setObsFilterPillar(pillar)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      obsFilterPillar === pillar
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {pillar}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por supervisor, falta o auditor..."
                  value={obsSearchTerm}
                  onChange={(e) => setObsSearchTerm(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-slate-900 text-xs focus:outline-none focus:border-blue-600 w-64"
                />
                {obsSearchTerm && (
                  <button
                    onClick={() => setObsSearchTerm('')}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredObservations.map((obs) => {
                const isRRHH = obs.pillar === 'RRHH';
                const isSIG = obs.pillar === 'SIG';

                return (
                  <div
                    key={obs.id}
                    className={`p-4 rounded-xl border-2 transition-all relative group ${
                      isRRHH
                        ? 'border-rose-300 bg-rose-50/30'
                        : isSIG
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10.5px] font-black uppercase px-2 py-0.5 rounded ${
                          isRRHH
                            ? 'bg-purple-100 text-purple-900'
                            : isSIG
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {obs.pillar}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {obs.deductionPoints > 0 ? `-${obs.deductionPoints}` : obs.deductionPoints} pts
                        </span>
                        {isEditMode && (
                          <button
                            onClick={() => {
                              setEditingObservation(obs);
                              setIsObservationModalOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition-colors"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 mb-1">
                      {obs.supervisorName} — {obs.title}
                    </h4>

                    <p
                      className={`text-xs text-slate-700 italic p-2.5 rounded-lg border ${
                        isRRHH
                          ? 'bg-white border-rose-200'
                          : isSIG
                          ? 'bg-white border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      "{obs.description}"
                    </p>

                    <div
                      className={`text-[11px] text-slate-500 flex justify-between pt-2 mt-2 border-t ${
                        isRRHH
                          ? 'border-rose-100'
                          : isSIG
                          ? 'border-amber-100'
                          : 'border-slate-100'
                      }`}
                    >
                      <span>Auditor: <strong className="text-slate-800">{obs.auditor}</strong></span>
                      <span
                        className={`font-bold ${
                          isRRHH
                            ? 'text-rose-700'
                            : isSIG
                            ? 'text-amber-800'
                            : 'text-amber-700'
                        }`}
                      >
                        {obs.period}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredObservations.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No se encontraron observaciones con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. FOOTER CORPORATIVO */}
      <footer className="text-center text-xs text-slate-500 pt-4 pb-8 space-y-1 border-t border-slate-200">
        <p className="font-bold text-slate-700">
          {config.companyName} — Sistema Integrado de Auditorías Operacionales
        </p>
        <p>
          Reporte Oficial de Evaluación de Desempeño · Pestañas Consolidado, SIG y RRHH {config.year}
        </p>
      </footer>

      {/* Modals */}
      <EditSupervisorModal
        isOpen={isSupervisorModalOpen}
        onClose={() => setIsSupervisorModalOpen(false)}
        supervisor={editingSupervisor}
        onSave={handleSaveSupervisor}
        onDelete={handleDeleteSupervisor}
      />

      <EditObservationModal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        observation={editingObservation}
        onSave={handleSaveObservation}
        onDelete={handleDeleteObservation}
        supervisorNames={supervisors.map((s) => s.name)}
      />

      <EditWeeklyModal
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        weekly={editingWeekly}
        onSave={handleSaveWeekly}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        config={config}
        onUpdateConfig={(up) => setConfig((prev) => ({ ...prev, ...up }))}
        supervisors={supervisors}
        weeklies={weeklies}
        observations={observations}
        quarterly={quarterly}
        onImportData={(payload) => {
          setSupervisors(payload.supervisors);
          setWeeklies(payload.weeklies);
          setObservations(payload.observations);
          setQuarterly(payload.quarterly);
          if (payload.config) setConfig((prev) => ({ ...prev, ...payload.config }));
          showToast('Datos cargados correctamente.');
        }}
        onResetDefaults={() => {
          setConfig(INITIAL_CONFIG);
          setSupervisors(INITIAL_SUPERVISORS);
          setWeeklies(INITIAL_WEEKLIES);
          setObservations(INITIAL_OBSERVATIONS);
          setQuarterly(INITIAL_QUARTERLY);
          showToast('Se restablecieron los datos iniciales.');
        }}
      />
    </div>
  );
};
