import React, { useState } from 'react';
import { StolLogo } from './StolLogo';
import {
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Printer,
  Download,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Menu,
  ShieldCheck,
  Building,
  Target,
  FileSpreadsheet,
  Plus,
  Briefcase,
  Layers,
  Sparkles,
  Globe,
} from 'lucide-react';
import { AppModule } from './Sidebar';
import { useRole } from '../context/RoleContext';
import { BoardPackModal } from './BoardPackModal';
import { OperacionesFeedModal } from './OperacionesFeedModal';

interface ExecutiveNavbarProps {
  activeModule: AppModule;
  selectedMonth: string;
  onChangeMonth: (m: string) => void;
  selectedProcess: string;
  onChangeProcess: (p: string) => void;
  searchTerm: string;
  onChangeSearch: (s: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenMobileMenu?: () => void;
  discrepanciesCount: number;
  onSwitchToWebsite?: () => void;
}

export const ExecutiveNavbar: React.FC<ExecutiveNavbarProps> = ({
  activeModule,
  selectedMonth,
  onChangeMonth,
  selectedProcess,
  onChangeProcess,
  searchTerm,
  onChangeSearch,
  onRefresh,
  isRefreshing,
  onOpenMobileMenu,
  discrepanciesCount,
  onSwitchToWebsite,
}) => {
  const { role, setRole, toggleRole, lastOperationFeed, boardAgreements } = useRole();
  const [isOpenBoardPack, setIsOpenBoardPack] = useState(false);
  const [isOpenFeedModal, setIsOpenFeedModal] = useState(false);

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'overview':
        return {
          title: 'Panel Ejecutivo de Directorio',
          subtitle: 'Visión Integral y Control Operativo para Directorio y Gerencia General',
        };
      case 'volumetry':
        return {
          title: 'Mediciones & Control de Volumetría',
          subtitle: 'Cubicaje de Cajas, SKUs, Auditoría de Dimensiones y Validación WMS vs Real',
        };
      case 'crossdocking':
        return {
          title: 'Evolución de Volúmenes Declarados por Área',
          subtitle: 'Supervisión de Recepciones y Cubicaje · Área Crossdocking (Resumen B2:D6)',
        };
      case 'supervisors':
        return {
          title: 'Evaluación de Desempeño – Supervisores 2026',
          subtitle: 'Auditoría 60/20/20 (Operaciones 60%, SIG 20%, RRHH 20%) · Meta 98%',
        };
      case 'overtime':
        return {
          title: 'Horas Extras Operativas (HHEE) & Bono',
          subtitle: 'Jornadas Ordinarias, Dominicales y Feriados, Incentivos y Matriz Cargos vs Áreas',
        };
      case 'fleet':
        return {
          title: 'Control de Horómetros e Inoperatividades de Flota',
          subtitle: '19 Unidades Auditadas (NOVATRANS y DERCO) · Límites 300h y 375h',
        };
      case 'telemetry':
        return {
          title: 'Telemetría de Volúmenes Operativos',
          subtitle: 'Seguimiento en m³, Metas, Capacidad de Procesos y Tendencias Históricas',
        };
    }
  };

  const { title, subtitle } = getModuleTitle();

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        {/* Main Nav Strip */}
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Logo & Titles */}
          <div className="flex items-center gap-3">
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <StolLogo variant="header" />
            </div>

            <div className="border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-sans">
                  {title}
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">{subtitle}</p>
            </div>
          </div>

          {/* Right: Operational Controls & Role Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* SWITCH TO PUBLIC WEBSITE */}
            {onSwitchToWebsite && (
              <button
                onClick={onSwitchToWebsite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer shadow-xs hover:border-blue-400"
                title="Ver la Página Web Comercial y Pública de STOL"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Página Web Pública</span>
              </button>
            )}

            {/* PERSPECTIVE SWITCHER: DIRECTORIO VS OPERACIONES */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setRole('DIRECTORIO')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'DIRECTORIO'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Directorio: Orientado a supervisión remota, riesgos y toma de decisiones"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Directorio</span>
              </button>

              <button
                onClick={() => setRole('OPERACIONES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'OPERACIONES'
                    ? 'bg-blue-700 text-white shadow-sm ring-1 ring-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Operaciones: Orientado a alimentación y carga de información en sede"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-300" />
                <span>Operaciones</span>
              </button>
            </div>

            {/* Role Action Button */}
            {role === 'DIRECTORIO' ? (
              <button
                onClick={() => setIsOpenBoardPack(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
                title="Abrir Dossier Semestral de Directorio y Acuerdos de Sesión"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Dossier Directorio</span>
                {boardAgreements.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                    {boardAgreements.length}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsOpenFeedModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                title="Alimentar datos operativos en sede (Excel HHEE, Mediciones, Flota)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cargar Datos en Sede</span>
              </button>
            )}

            {/* Global Search Bar */}
            <div className="relative hidden lg:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar en la Intranet..."
                value={searchTerm}
                onChange={(e) => onChangeSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 transition-all"
              />
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => onChangeMonth(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-bold text-slate-900 text-xs"
              >
                <option value="Octubre">Octubre 2026</option>
                <option value="Setiembre">Setiembre 2026</option>
                <option value="Agosto">Agosto 2026</option>
                <option value="Julio">Julio 2026</option>
                <option value="Todos">Consolidado Anual</option>
              </select>
            </div>

            {/* Refresh Action */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              title="Sincronizar y actualizar información"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">Sincronizar</span>
            </button>

            {/* Print / PDF Action */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Executive Duality Sub-Strip: Explaining Feeder vs Board Observer */}
        <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 py-1.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] gap-2">
          <div className="flex items-center gap-2">
            {role === 'DIRECTORIO' ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MODO DIRECTORIO ACTIVO:</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-cyan-400">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>MODO OPERACIONES ACTIVO:</span>
              </span>
            )}
            <span className="text-slate-300">
              {role === 'DIRECTORIO'
                ? 'Información alimentada por el equipo de operaciones en sede para control y toma de decisiones remotas (Supervisión Semestral).'
                : 'Pantalla habilitada para que Jefaturas y Auditores alimenten datos de planta, mediciones, horas extras y horómetros.'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[10.5px]">
            <span>Última carga en sede: <b className="text-slate-200">{lastOperationFeed}</b></span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">
              Frecuencia Directorio: <b className="text-slate-200">2 veces/año (Presencial)</b>
            </span>
          </div>
        </div>
      </header>

      {/* Board Pack Modal */}
      <BoardPackModal isOpen={isOpenBoardPack} onClose={() => setIsOpenBoardPack(false)} />

      {/* Operaciones Feed Modal */}
      <OperacionesFeedModal
        isOpen={isOpenFeedModal}
        onClose={() => setIsOpenFeedModal(false)}
      />
    </>
  );
};
