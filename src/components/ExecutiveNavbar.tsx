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
  Database,
  BarChart3,
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
  onOpenDataSources?: () => void;
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
  onOpenDataSources,
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
      case 'powerbi':
        return {
          title: 'Inteligencia de Negocios · Informes Corporativos Power BI',
          subtitle: 'Visualización Segura de Modelos Semánticos DAX y Tableros Ejecutivos Centralizados',
        };
    }
  };

  const { title, subtitle } = getModuleTitle();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        {/* Main Nav Strip */}
        <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
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
                {role === 'DIRECTORIO' ? (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Directorio · Solo Lectura
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
                    <Layers className="w-3 h-3 text-blue-600" />
                    Operaciones · Alimentación en Sede
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">{subtitle}</p>
            </div>
          </div>

          {/* Right: Operational Controls & Dropdown Menu */}
          <div className="flex items-center gap-2 flex-wrap">
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
                title="Alimentar datos operativos en sede (Google Sheets, Mediciones, Flota)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cargar Datos en Sede</span>
              </button>
            )}

            {/* Global Search Bar */}
            <div className="relative hidden xl:block">
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
              <span className="hidden 2xl:inline">Sincronizar</span>
            </button>

            {/* Print / PDF Action */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>

            {/* USER PROFILE & MODE SWITCHER DROPDOWN MENU */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm border border-slate-700"
                title="Menú de Usuario, Modo de Visualización y Enlaces"
              >
                <div className={`w-2 h-2 rounded-full ${role === 'DIRECTORIO' ? 'bg-amber-400' : 'bg-cyan-400'} animate-pulse`} />
                <span className="text-slate-300 font-medium hidden sm:inline">Modo:</span>
                <span className="font-black text-white">
                  {role === 'DIRECTORIO' ? 'Directorio' : 'Operaciones'}
                </span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {/* FLOATING DROPDOWN CONTENT */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                  {/* User Profile Header */}
                  <div className="pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        ST
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-xs text-slate-900 truncate">cd.stol.008@gmail.com</div>
                        <div className="text-[10px] text-slate-500 font-medium">STOL Logística S.A.C. · Intranet</div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector Section */}
                  <div className="py-3 border-b border-slate-100 space-y-2">
                    <div className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                      Seleccionar Modo de Plataforma:
                    </div>

                    <div className="space-y-1.5">
                      {/* Modo Directorio */}
                      <button
                        onClick={() => {
                          setRole('DIRECTORIO');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          role === 'DIRECTORIO'
                            ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900">Modo Directorio</span>
                            {role === 'DIRECTORIO' && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                            Supervisión ejecutiva, solo lectura, acceso al Dossier de Directorio y acuerdos.
                          </p>
                        </div>
                      </button>

                      {/* Modo Operaciones */}
                      <button
                        onClick={() => {
                          setRole('OPERACIONES');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          role === 'OPERACIONES'
                            ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-blue-600 text-white font-bold shrink-0 mt-0.5">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900">Modo Operaciones</span>
                            {role === 'OPERACIONES' && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                            Registro operativo en sede y alimentación de datos en línea.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Navigation Links in Dropdown */}
                  <div className="pt-2.5 space-y-1">
                    {/* Public Website Button */}
                    {onSwitchToWebsite && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onSwitchToWebsite();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-blue-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <span className="block font-black text-slate-900">Página Web Pública</span>
                            <span className="block text-[10px] text-slate-500 font-normal">Portal comercial y de clientes</span>
                          </div>
                        </div>
                        <span className="text-blue-600 text-xs font-bold">Ir →</span>
                      </button>
                    )}

                    {/* Data Sources Button */}
                    {onOpenDataSources && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenDataSources();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <span className="block font-black text-slate-900">Fuentes de Datos</span>
                            <span className="block text-[10px] text-slate-500 font-normal">Google Sheets, Power BI, Supabase</span>
                          </div>
                        </div>
                        <span className="text-emerald-600 text-xs font-bold">Ver →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
