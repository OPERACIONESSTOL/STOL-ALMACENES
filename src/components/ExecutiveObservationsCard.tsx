import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  User,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  Target,
  Building,
  Plus,
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

export type ObservationSeverity = 'CRITICO' | 'ALERTA' | 'SEGUIMIENTO' | 'OPORTUNIDAD';

export interface ExecutiveObservation {
  id: string;
  module: string;
  title: string;
  category: string;
  severity: ObservationSeverity;
  impactLabel: string;
  impactValue: string;
  finding: string; // Hallazgo u observacion
  rootCause: string; // Causa raiz
  boardDecision: string; // Decision de Directorio / Recomendacion
  responsible: string; // Area o persona responsable
  auditor?: string; // Auditor o fuente
  actionChecklist?: string[];
  metricsDetail?: { label: string; value: string }[];
  dateOrPeriod?: string;
}

interface ExecutiveObservationsCardProps {
  observation: ExecutiveObservation;
  onActionClick?: (obs: ExecutiveObservation) => void;
}

export const ExecutiveObservationsCard: React.FC<ExecutiveObservationsCardProps> = ({
  observation,
  onActionClick,
}) => {
  const { role, addBoardAgreement } = useRole();
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [agreementSuccess, setAgreementSuccess] = useState<boolean>(false);

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleRegisterDirectorialAgreement = () => {
    addBoardAgreement({
      observationId: observation.id,
      title: `Mandato: ${observation.title}`,
      agreementText: observation.boardDecision,
      approvedBy: 'Sesión de Directorio STOL',
      priority: observation.severity === 'CRITICO' ? 'ALTA' : 'ESTRATEGICA',
      deadline: '15 Nov 2026',
      status: 'EN_CURSO',
    });
    setAgreementSuccess(true);
    setTimeout(() => setAgreementSuccess(false), 3000);
  };

  const severityBadge = (sev: ObservationSeverity) => {
    switch (sev) {
      case 'CRITICO':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-600',
          border: 'border-l-rose-500',
          tag: 'Crítico',
        };
      case 'ALERTA':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-600',
          border: 'border-l-amber-500',
          tag: 'Atención',
        };
      case 'SEGUIMIENTO':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-600',
          border: 'border-l-blue-500',
          tag: 'En Seguimiento',
        };
      case 'OPORTUNIDAD':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-600',
          border: 'border-l-emerald-500',
          tag: 'Oportunidad',
        };
    }
  };

  const style = severityBadge(observation.severity);

  return (
    <>
      <div
        onClick={() => setIsOpenModal(true)}
        className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer border-l-4 ${style.border} flex flex-col justify-between group hover:border-slate-300 relative overflow-hidden`}
      >
        <div>
          {/* Top category & severity badges */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${style.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`}></span>
                {style.tag}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {observation.category}
              </span>
            </div>

            {observation.impactValue && (
              <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {observation.impactValue}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1.5">
            {observation.title}
          </h4>

          {/* Finding summary */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
            {observation.finding}
          </p>

          {/* Directorial Decision Box */}
          <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 text-[11px] text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                <Target className="w-3 h-3 text-blue-600" />
                Decisión para Directorio:
              </span>
              <span className="text-[9.5px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Sesión Semestral
              </span>
            </div>
            <div className="text-slate-600 line-clamp-2 font-medium">
              {observation.boardDecision}
            </div>
          </div>
        </div>

        {/* Card Footer: Clear Operational Feeder Attribution */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <Building className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">
              Alimentado en sede: <b>{observation.responsible}</b>
            </span>
          </div>

          <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Ver decisión</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Interactive Modal Details */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${style.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                  {style.tag} · {observation.severity}
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Módulo: {observation.module} · {observation.category}
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Alimentado por Operaciones en Sede
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {observation.title}
              </h2>
            </div>

            {/* Metrics highlight */}
            {observation.metricsDetail && observation.metricsDetail.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
                {observation.metricsDetail.map((m, i) => (
                  <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      {m.label}
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Success toast inside modal */}
            {agreementSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡Acuerdo de Directorio registrado en el Libro de Actas de la Intranet!</span>
              </div>
            )}

            {/* Body sections */}
            <div className="space-y-4 my-5 text-xs text-slate-700">
              {/* Finding */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80">
                <h4 className="font-bold text-amber-950 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Hallazgo Registrado en Sede por el Área Operativa
                </h4>
                <p className="text-slate-800 leading-relaxed font-normal">
                  {observation.finding}
                </p>
              </div>

              {/* Root cause */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  Diagnóstico y Causa Raíz
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {observation.rootCause}
                </p>
              </div>

              {/* Board Decision with Board Action button */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-blue-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-700" />
                    Propuesta de Decisión para Directorio & Gerencia General
                  </h4>

                  <button
                    onClick={handleRegisterDirectorialAgreement}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] transition-colors cursor-pointer shadow-xs"
                    title="Asentar esta instrucción como Acuerdo Oficial del Directorio"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Asentar como Acuerdo de Directorio</span>
                  </button>
                </div>
                <p className="text-slate-900 leading-relaxed font-medium">
                  {observation.boardDecision}
                </p>
              </div>

              {/* Action checklist */}
              {observation.actionChecklist && observation.actionChecklist.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Instrucciones de Cumplimiento para el Equipo en Sede
                  </h4>
                  <div className="space-y-1.5">
                    {observation.actionChecklist.map((act, idx) => {
                      const isDone = !!checkedItems[idx];
                      return (
                        <label
                          key={idx}
                          className="flex items-start gap-2 text-slate-200 text-xs cursor-pointer select-none hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleCheck(idx)}
                            className="mt-0.5 rounded text-blue-500 focus:ring-0 cursor-pointer"
                          />
                          <span className={isDone ? 'line-through text-slate-400' : ''}>
                            {act}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
              <div className="flex items-center gap-3">
                <span>Alimentado por: <b className="text-slate-800">{observation.responsible}</b></span>
                {observation.auditor && (
                  <span>Auditor: <b className="text-slate-800">{observation.auditor}</b></span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                {onActionClick && (
                  <button
                    onClick={() => {
                      setIsOpenModal(false);
                      onActionClick(observation);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Ir al Detalle del Módulo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
