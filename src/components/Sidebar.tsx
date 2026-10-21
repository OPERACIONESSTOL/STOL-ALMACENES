import React from 'react';
import { StolLogo } from './StolLogo';
import {
  LayoutDashboard,
  Box,
  Users,
  Truck,
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  Clock,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  Globe,
} from 'lucide-react';

export type AppModule =
  | 'overview'
  | 'volumetry'
  | 'crossdocking'
  | 'supervisors'
  | 'overtime'
  | 'fleet'
  | 'telemetry';

interface NavItem {
  id: AppModule;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  discrepanciesCount: number;
  anomaliesCount: number;
  inoperativityHours: number;
  onSwitchToWebsite?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  discrepanciesCount,
  anomaliesCount,
  inoperativityHours,
  onSwitchToWebsite,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'Dirección & Estrategia',
      items: [
        {
          id: 'overview',
          label: 'Panel Ejecutivo',
          sublabel: 'Decisiones Directorio & Gerencia',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
          badge: 'Estratégico',
          badgeColor: 'bg-blue-900/80 text-blue-200 border border-blue-700/80',
        },
      ],
    },
    {
      title: 'Operaciones & Productividad',
      items: [
        {
          id: 'supervisors',
          label: 'Desempeño Supervisores',
          sublabel: 'Auditoría 60/20/20 · Meta 98%',
          icon: <Users className="w-4 h-4 shrink-0" />,
          badge: '98% Meta',
          badgeColor: 'bg-indigo-900/80 text-indigo-200 border border-indigo-700/80',
        },
        {
          id: 'overtime',
          label: 'Horas Extras (HHEE)',
          sublabel: '14.1k h · Dominicales & Bono',
          icon: <Clock className="w-4 h-4 shrink-0" />,
          badge: 'HHEE',
          badgeColor: 'bg-orange-950 text-orange-300 border border-orange-800',
        },
        {
          id: 'volumetry',
          label: 'Mediciones & Volumetría',
          sublabel: '473.9 m³ · SKUs & Discrepancias',
          icon: <Box className="w-4 h-4 shrink-0" />,
          badge: discrepanciesCount > 0 ? `${discrepanciesCount} alertas` : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-black',
        },
        {
          id: 'crossdocking',
          label: 'Evolución de Volúmenes',
          sublabel: 'Áreas STOL · Crossdocking B2:D6',
          icon: <TrendingUp className="w-4 h-4 shrink-0" />,
          badge: '249.4k m³',
          badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
        },
      ],
    },
    {
      title: 'Activos & Mantenimiento',
      items: [
        {
          id: 'fleet',
          label: 'Horómetros & Flota',
          sublabel: '19 Equipos · NOVATRANS & DERCO',
          icon: <Truck className="w-4 h-4 shrink-0" />,
          badge: `${inoperativityHours}h Inop`,
          badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800',
        },
      ],
    },
    {
      title: 'Monitoreo en Tiempo Real',
      items: [
        {
          id: 'telemetry',
          label: 'Telemetría en Vivo',
          sublabel: 'Osciloscopio & Sensores IoT',
          icon: <Activity className="w-4 h-4 shrink-0" />,
          badge: 'En Vivo',
          badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#0b1120] text-slate-200 border-r border-slate-800/90 flex flex-col justify-between transition-all duration-300 select-none z-30 shrink-0 h-screen sticky top-0 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            {isCollapsed ? <StolLogo variant="collapsed" /> : <StolLogo variant="sidebar" />}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pt-1 pb-1 text-[9.5px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{sec.title}</span>
                  <span className="text-[9px] font-mono text-slate-400">0{secIdx + 1}</span>
                </div>
              )}

              <div className="space-y-1">
                {sec.items.map((item) => {
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectModule(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-950/40 ring-1 ring-blue-400/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-700/80'
                        }`}
                      >
                        {item.icon}
                      </div>

                      {!isCollapsed && (
                        <div className="flex-1 text-left truncate">
                          <div className="truncate leading-tight text-[12px]">{item.label}</div>
                          <div
                            className={`text-[9.5px] truncate font-normal ${
                              isActive ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {item.sublabel}
                          </div>
                        </div>
                      )}

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            item.badgeColor || 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isCollapsed && item.badge && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 absolute top-2 right-2 ring-2 ring-slate-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Intranet Scalability Note for upcoming tabs */}
          {!isCollapsed && (
            <div className="pt-3 border-t border-slate-800/70 px-2">
              <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 text-[10.5px] text-slate-400">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[10px] uppercase mb-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Intranet STOL Escalable</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Estructura jerárquica lista para incorporar nuevos módulos operativos y de gestión.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Public Website & Operational Status */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-950/80 space-y-2">
        {onSwitchToWebsite && (
          <button
            onClick={onSwitchToWebsite}
            className={`w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-bold transition-all cursor-pointer ${
              isCollapsed ? 'p-2' : ''
            }`}
            title="Ir a la Página Web Pública de STOL"
          >
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Ver Página Web Pública</span>}
          </button>
        )}

        {!isCollapsed ? (
          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="font-bold text-slate-200 block text-[11px] leading-tight">Intranet Activa</span>
                <span className="text-[9.5px] text-slate-400">Modo Directorio & Gerencia</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-cyan-300">
              v2026.4
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="Intranet STOL: Conectada">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-950" />
          </div>
        )}
      </div>
    </aside>
  );
};
