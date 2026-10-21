import React, { useState, useMemo } from 'react';
import { ObservationItem, SupervisorMonthly } from '../types/performance';
import {
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Users,
  Box,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Sparkles,
  ChevronRight,
  FileText,
  Target,
  ArrowDownRight,
  UserCheck,
} from 'lucide-react';

interface SupervisorLowGradesDiagnosticProps {
  supervisors: SupervisorMonthly[];
  observations: ObservationItem[];
  metaERU: number;
  onEditObservation?: (obs: ObservationItem) => void;
  isEditMode?: boolean;
}

export const SupervisorLowGradesDiagnostic: React.FC<SupervisorLowGradesDiagnosticProps> = ({
  supervisors,
  observations,
  metaERU = 98.0,
  onEditObservation,
  isEditMode = false,
}) => {
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('Todos');
  const [selectedPillar, setSelectedPillar] = useState<'Todos' | 'Operaciones' | 'RRHH' | 'SIG'>('Todos');
  const [selectedSeverity, setSelectedSeverity] = useState<'Todos' | 'Alta' | 'Media' | 'Baja'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate penalties per supervisor
  const supervisorPenalties = useMemo(() => {
    return supervisors.map((sup) => {
      const supObs = observations.filter(
        (o) => o.supervisorName.toLowerCase() === sup.name.toLowerCase()
      );

      const opsPoints = supObs
        .filter((o) => o.pillar === 'Operaciones')
        .reduce((sum, o) => sum + Math.abs(o.deductionPoints), 0);

      const rrhhPoints = supObs
        .filter((o) => o.pillar === 'RRHH')
        .reduce((sum, o) => sum + Math.abs(o.deductionPoints), 0);

      const sigPoints = supObs
        .filter((o) => o.pillar === 'SIG')
        .reduce((sum, o) => sum + Math.abs(o.deductionPoints), 0);

      const totalDeductions = opsPoints + rrhhPoints + sigPoints;
      const currentGrade = sup.months.oct ?? sup.finalGradeOverride ?? 80;
      const gapVsMeta = parseFloat((metaERU - currentGrade).toFixed(1));

      return {
        ...sup,
        currentGrade,
        gapVsMeta,
        opsPoints: parseFloat(opsPoints.toFixed(1)),
        rrhhPoints: parseFloat(rrhhPoints.toFixed(1)),
        sigPoints: parseFloat(sigPoints.toFixed(1)),
        totalDeductions: parseFloat(totalDeductions.toFixed(1)),
        observationsCount: supObs.length,
      };
    });
  }, [supervisors, observations, metaERU]);

  // Totals for top cards
  const totalStats = useMemo(() => {
    const totalOps = observations
      .filter((o) => o.pillar === 'Operaciones')
      .reduce((sum, o) => sum + Math.abs(o.deductionPoints), 0);

    const totalRrhh = observations
      .filter((o) => o.pillar === 'RRHH')
      .reduce((sum, o) => sum + Math.abs(o.deductionPoints), 0);

    const totalSig = observations
      .filter((o) => o.pillar === 'SIG')
      .reduce((sum, o) => sum + Math.abs(o.deductionPoints), 0);

    const totalAll = totalOps + totalRrhh + totalSig;

    return {
      totalOps: totalOps.toFixed(1),
      totalRrhh: totalRrhh.toFixed(1),
      totalSig: totalSig.toFixed(1),
      totalAll: totalAll.toFixed(1),
      opsPct: totalAll > 0 ? Math.round((totalOps / totalAll) * 100) : 60,
      rrhhPct: totalAll > 0 ? Math.round((totalRrhh / totalAll) * 100) : 20,
      sigPct: totalAll > 0 ? Math.round((totalSig / totalAll) * 100) : 20,
    };
  }, [observations]);

  // Filter observations
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Supervisor filter
      if (selectedSupervisor !== 'Todos' && obs.supervisorName !== selectedSupervisor) {
        return false;
      }
      // Pillar filter
      if (selectedPillar !== 'Todos' && obs.pillar !== selectedPillar) {
        return false;
      }
      // Severity filter: Alta (>5), Media (3-5), Baja (<3)
      const absPoints = Math.abs(obs.deductionPoints);
      if (selectedSeverity === 'Alta' && absPoints < 5.0) return false;
      if (selectedSeverity === 'Media' && (absPoints < 3.0 || absPoints >= 5.0)) return false;
      if (selectedSeverity === 'Baja' && absPoints >= 3.0) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = obs.title.toLowerCase().includes(query);
        const matchDesc = obs.description.toLowerCase().includes(query);
        const matchSup = obs.supervisorName.toLowerCase().includes(query);
        const matchAuditor = obs.auditor.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchSup && !matchAuditor) {
          return false;
        }
      }

      return true;
    });
  }, [observations, selectedSupervisor, selectedPillar, selectedSeverity, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner: Diagnóstico Causal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-white font-sans">
                  Diagnóstico Causal: ¿Por qué las Bajas Notas de los Supervisores?
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                  Alerta de Brecha
                </span>
              </div>
              <p className="text-xs text-slate-300 font-normal mt-0.5">
                Auditoría detallada de las causas de penalización extraídas de las pestañas <strong>CONSOLIDADO</strong>, <strong>SIG</strong> y <strong>RRHH</strong> frente a la meta esperada del <strong>{metaERU}%</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-bold">Meta Esperada:</span>
            <span className="font-black text-amber-400 text-sm">{metaERU}%</span>
          </div>
        </div>

        {/* 3 Pillars Impact Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-300 font-black flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-blue-400" /> Operaciones (60%)
              </span>
              <span className="text-rose-400 font-black">-{totalStats.totalOps} pts</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-tight">
              Pallets observados en buffer &gt;72h, desajustes de conteo en picking y saturación de muelles.
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalStats.opsPct}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-black flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" /> Recursos Humanos (20%)
              </span>
              <span className="text-rose-400 font-black">-{totalStats.totalRrhh} pts</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-tight">
              Tardanzas en relevo nocturno, falta de reemplazo oportuno de transpaleteros y biométrico.
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${totalStats.rrhhPct}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-black flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Seguridad - SIG (20%)
              </span>
              <span className="text-rose-400 font-black">-{totalStats.totalSig} pts</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-tight">
              Firmas extemporáneas de formato ATS en estiba en altura y despeje de pasillos/extintores.
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalStats.sigPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Controls (Extracted from HTML / Requirements) */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Opciones de Filtro – Causa Raíz de Calificaciones
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-bold">
            Mostrando <strong>{filteredObservations.length}</strong> de {observations.length} causas registradas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Supervisor filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Supervisor Evaluado:
            </label>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los Supervisores</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.months.oct ?? s.finalGradeOverride}% - Jefe: {s.directBoss})
                </option>
              ))}
            </select>
          </div>

          {/* Pillar filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Pilar de Descuento:
            </label>
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los Pilares (60/20/20)</option>
              <option value="Operaciones">Operaciones (Ponderación 60%)</option>
              <option value="RRHH">Recursos Humanos (Ponderación 20%)</option>
              <option value="SIG">Seguridad SIG (Ponderación 20%)</option>
            </select>
          </div>

          {/* Severity filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Severidad del Descuento:
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todas las Severidades</option>
              <option value="Alta">Alta Severidad (&gt;= 5.0 pts)</option>
              <option value="Media">Severidad Media (3.0 a 4.9 pts)</option>
              <option value="Baja">Severidad Leve (&lt; 3.0 pts)</option>
            </select>
          </div>

          {/* Search box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Búsqueda por Palabras Clave:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Pallet, ATS, tardanza, picking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Quick Reset */}
        {(selectedSupervisor !== 'Todos' || selectedPillar !== 'Todos' || selectedSeverity !== 'Todos' || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSelectedSupervisor('Todos');
                setSelectedPillar('Todos');
                setSelectedSeverity('Todos');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* 3. Per-Supervisor Deep Dive Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
          Detalle Ejecutivo por Supervisor: Origen de las Calificaciones
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {supervisorPenalties
            .filter((s) => s.active)
            .sort((a, b) => a.currentGrade - b.currentGrade) // lowest grades first!
            .map((sup) => {
              const isCritical = sup.currentGrade < 80;
              const isWarning = sup.currentGrade >= 80 && sup.currentGrade < 85;

              return (
                <div
                  key={sup.id}
                  className={`bg-white rounded-2xl border-2 shadow-sm p-4 space-y-3 transition-all ${
                    isCritical
                      ? 'border-rose-400 bg-rose-50/15'
                      : isWarning
                      ? 'border-amber-400 bg-amber-50/15'
                      : 'border-slate-300'
                  }`}
                >
                  {/* Supervisor Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 font-sans">
                          {sup.name}
                        </span>
                        {sup.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-black bg-slate-100 text-slate-700 border border-slate-300">
                            {sup.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Jefe Directo: <strong>{sup.directBoss}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900 tabular-nums">
                        {sup.currentGrade}%
                      </div>
                      <div className="text-[11px] font-extrabold text-rose-600">
                        Brecha: -{sup.gapVsMeta} pts vs 98%
                      </div>
                    </div>
                  </div>

                  {/* Penalty Pillar Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="text-[10px] font-bold text-blue-800">Operaciones (60%)</div>
                      <div className="text-sm font-black text-blue-950">
                        {sup.opsPoints > 0 ? `-${sup.opsPoints} pts` : '0.0 pts'}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="text-[10px] font-bold text-purple-800">RRHH (20%)</div>
                      <div className="text-sm font-black text-purple-950">
                        {sup.rrhhPoints > 0 ? `-${sup.rrhhPoints} pts` : '0.0 pts'}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-800">SIG (20%)</div>
                      <div className="text-sm font-black text-amber-950">
                        {sup.sigPoints > 0 ? `-${sup.sigPoints} pts` : '0.0 pts'}
                      </div>
                    </div>
                  </div>

                  {/* Why this grade? (Specific reasons) */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-black uppercase text-slate-600 flex items-center justify-between">
                      <span>Causas Raíz Detectadas ({sup.observationsCount}):</span>
                      {isCritical && (
                        <span className="text-rose-600 font-extrabold">🚨 Prioridad Inmediata</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {observations
                        .filter((o) => o.supervisorName.toLowerCase() === sup.name.toLowerCase())
                        .map((obs) => (
                          <div
                            key={obs.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1 hover:border-slate-400 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                  obs.pillar === 'Operaciones'
                                    ? 'bg-blue-100 text-blue-900'
                                    : obs.pillar === 'RRHH'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {obs.pillar}
                              </span>
                              <span className="font-black text-rose-600">
                                {obs.deductionPoints > 0 ? `-${obs.deductionPoints}` : obs.deductionPoints} pts
                              </span>
                            </div>
                            <div className="font-bold text-slate-900">{obs.title}</div>
                            <p className="text-[11.5px] text-slate-600 leading-snug">
                              {obs.description}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                              <span>Auditor: <strong className="text-slate-700">{obs.auditor}</strong></span>
                              <span className="font-bold text-slate-600">{obs.period}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. Filtered Observational Log Table */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Bitácora Detallada de Evidencias y Descuentos
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Registro auditado que sustenta legal y operativamente la calificación mensual de cada supervisor
            </p>
          </div>
          <span className="text-xs bg-slate-100 px-3 py-1 rounded-xl text-slate-700 font-bold border border-slate-200">
            Total Descuento Acumulado: -{totalStats.totalAll} pts
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase">
                <th className="py-2.5 px-3">Supervisor</th>
                <th className="py-2.5 px-3">Pilar</th>
                <th className="py-2.5 px-2 text-center">Descuento</th>
                <th className="py-2.5 px-4">Motivo / Causa de la Baja Nota</th>
                <th className="py-2.5 px-3">Auditor</th>
                <th className="py-2.5 px-3">Período</th>
                {isEditMode && <th className="py-2.5 px-3 text-center bg-slate-950 text-amber-400">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredObservations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {obs.supervisorName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        obs.pillar === 'Operaciones'
                          ? 'bg-blue-100 text-blue-900'
                          : obs.pillar === 'RRHH'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {obs.pillar}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-rose-600 tabular-nums">
                    {obs.deductionPoints > 0 ? `-${obs.deductionPoints}` : obs.deductionPoints} pts
                  </td>
                  <td className="py-2.5 px-4 text-xs">
                    <strong className="text-slate-900 block mb-0.5">{obs.title}</strong>
                    <span className="text-slate-600">{obs.description}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-semibold">
                    {obs.auditor}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-bold text-[11px]">
                    {obs.period}
                  </td>
                  {isEditMode && (
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onEditObservation && onEditObservation(obs)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
