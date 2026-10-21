import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Box,
  Users,
  Truck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ArrowRight,
  Database,
  Target,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppModule } from '../components/Sidebar';
import { StolLogo } from '../components/StolLogo';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';

interface ExecutiveOverviewViewProps {
  onNavigate: (module: AppModule) => void;
  // Metrics from supervisors
  supervisorOctAvg: number;
  bestSupervisorName: string;
  bestSupervisorGrade: number;
  lowestSupervisorName: string;
  lowestSupervisorGrade: number;
  metaERU: number;
  // Metrics from fleet
  totalFleetUnits: number;
  fleetInoperativityHours: number;
  fleetAvailabilityPct: string;
  excessMontacargasCount: number;
  excessElevadoresCount: number;
  topInopEquipmentCode: string;
  // Metrics from volumetry
  totalVolumeM3: number;
  totalBoxesMeasured: number;
  measuredSkusCount: number;
  totalCatalogSkus: number;
  volumetryDiscrepanciesCount: number;
}

export const ExecutiveOverviewView: React.FC<ExecutiveOverviewViewProps> = ({
  onNavigate,
  supervisorOctAvg,
  bestSupervisorName,
  bestSupervisorGrade,
  lowestSupervisorName,
  lowestSupervisorGrade,
  metaERU,
  totalFleetUnits,
  fleetInoperativityHours,
  fleetAvailabilityPct,
  excessMontacargasCount,
  excessElevadoresCount,
  topInopEquipmentCode,
  totalVolumeM3,
  totalBoxesMeasured,
  measuredSkusCount,
  totalCatalogSkus,
  volumetryDiscrepanciesCount,
}) => {
  const gapSupervisors = parseFloat((supervisorOctAvg - metaERU).toFixed(1));
  const skuProgressPct = Math.round((measuredSkusCount / (totalCatalogSkus || 1)) * 100);

  return (
    <div className="space-y-6 text-[#1A1A2E] font-sans">
      {/* 1. DIRECTORS HERO BANNER */}
      <section className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white border-2 border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                DASHBOARD EJECUTIVO · DIRECTORIO & GERENCIA
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Operación en Tiempo Real
              </span>
              <span className="text-slate-400 text-xs">Corte Oficial: Octubre 2026</span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Official STOL Logo Badge */}
              <StolLogo variant="badge" />

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
                  Consolidado de Gestión y Control Logístico STOL
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal mt-0.5">
                  Monitoreo centralizado de los 3 pilares estratégicos: <strong>Volumetría y Cubicaje WMS</strong>,{' '}
                  <strong>Evaluación de Desempeño Operacional (60/20/20)</strong> y <strong>Control de Horómetros de Flota</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick source status */}
          <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-4 shrink-0 text-xs space-y-2 w-full lg:w-80 shadow-lg">
            <div className="font-bold text-slate-300 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" /> Estado de Fuentes
              </span>
              <span className="text-emerald-400 text-[10px] font-mono font-bold">100% OPERATIVAS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-950 p-2 rounded-lg">
                <div className="text-slate-400">WMS & Volumetría</div>
                <div className="text-cyan-300 font-bold">Sincronizado</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg">
                <div className="text-slate-400">Auditoría SIG/RRHH</div>
                <div className="text-emerald-300 font-bold">Actualizado</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg">
                <div className="text-slate-400">Flota Horómetros</div>
                <div className="text-amber-300 font-bold">19 Equipos</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg">
                <div className="text-slate-400">Telemetría RT</div>
                <div className="text-cyan-400 font-bold">En Línea</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP EXECUTIVE SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Pillar 1: Volumetría */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Pilar 1 · Volumetría & Cubicaje
                  </h3>
                  <div className="text-sm font-bold text-slate-900">Gestión de Espacios y SKUs</div>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-900 font-black px-2.5 py-0.5 rounded-full">
                {skuProgressPct}% Avance
              </span>
            </div>

            <div className="my-3 space-y-1">
              <div className="text-3xl font-black font-mono text-slate-900">
                {totalVolumeM3.toFixed(1)} <span className="text-base text-slate-500 font-sans font-bold">m³</span>
              </div>
              <div className="text-xs text-slate-600">
                Volumen total medido en <strong>{totalBoxesMeasured.toLocaleString()}</strong> cajas
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-slate-500 text-[10px]">SKUs Auditados</div>
                <div className="font-bold text-slate-900">{measuredSkusCount} / {totalCatalogSkus}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-slate-500 text-[10px]">Discrepancias WMS</div>
                <div className={`font-bold ${volumetryDiscrepanciesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {volumetryDiscrepanciesCount} detectadas
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('volumetry')}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>SKUs &amp; Cubicaje</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('crossdocking')}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-xs"
            >
              <span>Crossdocking B2:D6</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pillar 2: Supervisores */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Pilar 2 · Desempeño Operativo
                  </h3>
                  <div className="text-sm font-bold text-slate-900">Auditoría 60/20/20 Supervisores</div>
                </div>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 font-black px-2.5 py-0.5 rounded-full">
                Meta {metaERU}%
              </span>
            </div>

            <div className="my-3 space-y-1">
              <div className="text-3xl font-black font-mono text-slate-900">
                {supervisorOctAvg.toFixed(1)}%
              </div>
              <div className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                Brecha vs Meta ({metaERU}%): {gapSupervisors > 0 ? `+${gapSupervisors}` : gapSupervisors} pts
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-100">
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <div className="text-emerald-800 text-[10px]">1° Lugar (Octubre)</div>
                <div className="font-bold text-emerald-950 truncate">{bestSupervisorName} ({bestSupervisorGrade}%)</div>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                <div className="text-amber-800 text-[10px]">Menor Puntaje</div>
                <div className="font-bold text-amber-950 truncate">{lowestSupervisorName} ({lowestSupervisorGrade}%)</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('supervisors')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Ver Evaluación de Supervisores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 3: Horómetros & Flota */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Pilar 3 · Horómetros & Flota
                  </h3>
                  <div className="text-sm font-bold text-slate-900">Disponibilidad de Montacargas</div>
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-950 font-black px-2.5 py-0.5 rounded-full">
                {fleetAvailabilityPct}% Disp.
              </span>
            </div>

            <div className="my-3 space-y-1">
              <div className="text-3xl font-black font-mono text-slate-900">
                {totalFleetUnits} <span className="text-base text-slate-500 font-sans font-bold">Equipos</span>
              </div>
              <div className="text-xs text-slate-600">
                Flota dividida en <strong>7 NOVATRANS</strong> y <strong>12 DERCO</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-slate-500 text-[10px]">Inoperatividad Paradas</div>
                <div className="font-bold text-rose-600">{fleetInoperativityHours} horas</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-slate-500 text-[10px]">Sobre Límite Contrato</div>
                <div className="font-bold text-slate-900">{excessMontacargasCount + excessElevadoresCount} unidades</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('fleet')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Auditar Flota & Horómetros</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 4: Horas Extras Operativas (HHEE) */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-400 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Pilar 4 · Horas Extras (HHEE)
                  </h3>
                  <div className="text-sm font-bold text-slate-900">Jornadas & Bono Operativo</div>
                </div>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-950 font-black px-2.5 py-0.5 rounded-full">
                4,322 Turnos
              </span>
            </div>

            <div className="my-3 space-y-1">
              <div className="text-3xl font-black font-mono text-slate-900">
                14,128.6 <span className="text-base text-slate-500 font-sans font-bold">h</span>
              </div>
              <div className="text-xs text-slate-600">
                <strong>8,202.6 h</strong> ordinarias · <strong>5,926.1 h</strong> dom/feriados
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-slate-500 text-[10px]">Días de Bono</div>
                <div className="font-bold text-indigo-700">2,879 días</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <div className="text-slate-500 text-[10px]">Área con Mayor HHEE</div>
                <div className="font-bold text-slate-900 truncate">PICKING (31.7%)</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('overtime')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Analizar Horas Extras (HHEE)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2.5 HIERARCHICAL EXECUTIVE OBSERVATIONS & DIRECTORIAL DECISION DECK */}
      <ExecutiveObservationsSection
        moduleName="overview"
        observations={getObservationsByModule('overview')}
        onNavigateModule={onNavigate}
        defaultExpanded={true}
      />

      {/* 3. PRIORITY ALERTS & BOARD DECISION MATRIX */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Matriz de Desviaciones Críticas para Atención del Directorio
              </h2>
              <p className="text-xs text-slate-500">
                Puntos de control que impactan costos contractuales, capacidad de almacenamiento y disciplina operativa
              </p>
            </div>
          </div>
          <span className="bg-rose-100 text-rose-900 text-xs font-black px-3 py-1 rounded-full border border-rose-300">
            3 Desviaciones Prioritarias
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Alert 1 */}
          <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black uppercase text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                Volumetría WMS
              </span>
              <span className="font-black text-amber-900 font-mono">+45.7% Discrepancia</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">SKU-ALM-8820 · Repuestos Filtros</h4>
            <p className="text-slate-700 leading-relaxed">
              El empaque secundario físico mide 0.152 m³ frente a los 0.104 m³ registrados en el maestro del WMS.
              Riesgo de subfacturación de almacenaje y ocupación de posiciones no aptas.
            </p>
            <div className="pt-2 border-t border-amber-200/80 text-[11px] text-slate-500 flex justify-between">
              <span>Proceso: Almacenamiento</span>
              <button
                onClick={() => onNavigate('volumetry')}
                className="font-bold text-blue-700 hover:underline"
              >
                Revisar ficha &rarr;
              </button>
            </div>
          </div>

          {/* Alert 2 */}
          <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black uppercase text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                RRHH & Disciplina
              </span>
              <span className="font-black text-rose-700 font-mono">-7.4 pts Descuento</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Pedro Oliva · Relevo Turno Noche</h4>
            <p className="text-slate-700 leading-relaxed">
              Tardanzas acumuladas y falta de operarios en relevo sin preaviso.
              Evaluación en 77.6% (la más baja del período) frente a la meta del 98%.
            </p>
            <div className="pt-2 border-t border-rose-200/80 text-[11px] text-slate-500 flex justify-between">
              <span>Auditor: Karla Bolívar</span>
              <button
                onClick={() => onNavigate('supervisors')}
                className="font-bold text-blue-700 hover:underline"
              >
                Ver bitácora &rarr;
              </button>
            </div>
          </div>

          {/* Alert 3 */}
          <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black uppercase text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                Mantenimiento Flota
              </span>
              <span className="font-black text-blue-900 font-mono">13.5 h Inoperativo</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Montacargas KGR-241 (DERCO)</h4>
            <p className="text-slate-700 leading-relaxed">
              Falla de válvula y fuga de gas al conectar balón GLP.
              Requiere validar cumplimiento del SLA de reparación con el proveedor DERCO.
            </p>
            <div className="pt-2 border-t border-blue-200/80 text-[11px] text-slate-500 flex justify-between">
              <span>Estado: En auditoría</span>
              <button
                onClick={() => onNavigate('fleet')}
                className="font-bold text-blue-700 hover:underline"
              >
                Bitácora flota &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXECUTIVE ACTION BAR */}
      <section className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white flex flex-wrap items-center justify-between gap-4 border border-blue-800/60 shadow-lg">
        <div className="space-y-1">
          <div className="text-sm font-bold flex items-center gap-2">
            <span>¿Deseas profundizar en el flujo continuo de cubicaje y telemetría de volúmenes?</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <p className="text-xs text-slate-300">
            Monitorea el flujo en m³, metas operativas y ocupación de capacidad en los 7 procesos del centro de distribución.
          </p>
        </div>

        <button
          onClick={() => onNavigate('telemetry')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Activity className="w-4 h-4" />
          <span>Abrir Telemetría de Volúmenes (m³)</span>
        </button>
      </section>
    </div>
  );
};
