import React, { useState, useMemo } from 'react';
import {
  ExecutiveObservation,
  ExecutiveObservationsCard,
  ObservationSeverity,
} from './ExecutiveObservationsCard';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
} from 'lucide-react';

interface ExecutiveObservationsSectionProps {
  moduleName: string;
  observations: ExecutiveObservation[];
  onNavigateModule?: (targetModule: any) => void;
  defaultExpanded?: boolean;
}

export const ExecutiveObservationsSection: React.FC<ExecutiveObservationsSectionProps> = ({
  moduleName,
  observations,
  onNavigateModule,
  defaultExpanded = true,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | ObservationSeverity>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Counts by severity
  const counts = useMemo(() => {
    return {
      all: observations.length,
      critico: observations.filter((o) => o.severity === 'CRITICO').length,
      alerta: observations.filter((o) => o.severity === 'ALERTA').length,
      seguimiento: observations.filter((o) => o.severity === 'SEGUIMIENTO').length,
      oportunidad: observations.filter((o) => o.severity === 'OPORTUNIDAD').length,
    };
  }, [observations]);

  // Filtered observations
  const filtered = useMemo(() => {
    if (severityFilter === 'ALL') return observations;
    return observations.filter((o) => o.severity === severityFilter);
  }, [observations, severityFilter]);

  if (observations.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 relative overflow-hidden transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-900/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                Observaciones de Auditoría & Decisiones de Directorio
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                {counts.all} Hallazgos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diagnóstico de causas raíz, desvíos operativos e instrucciones directivas para la Gerencia General
            </p>
          </div>
        </div>

        {/* Toggle Collapse & Quick stats */}
        <div className="flex items-center gap-2">
          {counts.critico > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-black bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              {counts.critico} Críticos
            </span>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Contraer' : 'Expandir'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Severity filter pill bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Filtrar por:</span>
              <button
                onClick={() => setSeverityFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  severityFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({counts.all})
              </button>

              {counts.critico > 0 && (
                <button
                  onClick={() => setSeverityFilter('CRITICO')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    severityFilter === 'CRITICO'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Críticos ({counts.critico})
                </button>
              )}

              {counts.alerta > 0 && (
                <button
                  onClick={() => setSeverityFilter('ALERTA')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    severityFilter === 'ALERTA'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Atención ({counts.alerta})
                </button>
              )}

              {counts.seguimiento > 0 && (
                <button
                  onClick={() => setSeverityFilter('SEGUIMIENTO')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    severityFilter === 'SEGUIMIENTO'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  Seguimiento ({counts.seguimiento})
                </button>
              )}

              {counts.oportunidad > 0 && (
                <button
                  onClick={() => setSeverityFilter('OPORTUNIDAD')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    severityFilter === 'OPORTUNIDAD'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Oportunidad ({counts.oportunidad})
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              Haz clic en cualquier tarjeta para ver la auditoría y el checklist directivo.
            </div>
          </div>

          {/* Grid of Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((obs) => (
              <ExecutiveObservationsCard
                key={obs.id}
                observation={obs}
                onActionClick={() => {
                  if (onNavigateModule) onNavigateModule(obs.module);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
