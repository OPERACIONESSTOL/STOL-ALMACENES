/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogoProvider } from './context/LogoContext';
import { RoleProvider } from './context/RoleContext';
import { Sidebar, AppModule } from './components/Sidebar';
import { ExecutiveNavbar } from './components/ExecutiveNavbar';
import { ExecutiveOverviewView } from './views/ExecutiveOverviewView';
import { VolumetryView } from './views/VolumetryView';
import { CrossdockingView } from './views/CrossdockingView';
import { PerformanceView } from './views/PerformanceView';
import { FleetView } from './views/FleetView';
import { TelemetryView } from './views/TelemetryView';
import { OvertimeView } from './views/OvertimeView';
import { PublicWebsiteView } from './views/PublicWebsiteView';

export default function App() {
  const [portalMode, setPortalMode] = useState<'website' | 'intranet'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'intranet') return 'intranet';
      const saved = localStorage.getItem('stol_portal_mode');
      if (saved === 'intranet' || saved === 'website') return saved;
    } catch (e) {}
    return 'website';
  });

  const handleEnterIntranet = () => {
    setPortalMode('intranet');
    try {
      localStorage.setItem('stol_portal_mode', 'intranet');
    } catch (e) {}
  };

  const handleSwitchToWebsite = () => {
    setPortalMode('website');
    try {
      localStorage.setItem('stol_portal_mode', 'website');
    } catch (e) {}
  };

  if (portalMode === 'website') {
    return <PublicWebsiteView onEnterIntranet={handleEnterIntranet} />;
  }

  return (
    <RoleProvider>
      <LogoProvider>
        <MainAppLayout onSwitchToWebsite={handleSwitchToWebsite} />
      </LogoProvider>
    </RoleProvider>
  );
}

interface MainAppLayoutProps {
  onSwitchToWebsite: () => void;
}

function MainAppLayout({ onSwitchToWebsite }: MainAppLayoutProps) {
  const [activeModule, setActiveModule] = useState<AppModule>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Global filters
  const [selectedMonth, setSelectedMonth] = useState<string>('Octubre');
  const [selectedProcess, setSelectedProcess] = useState<string>('Todos');
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F7] text-[#1A1A2E] font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. Desktop Executive Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          discrepanciesCount={3}
          anomaliesCount={0}
          inoperativityHours={24.5}
          onSwitchToWebsite={onSwitchToWebsite}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-[#0f172a] h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              activeModule={activeModule}
              onSelectModule={(mod) => {
                setActiveModule(mod);
                setIsMobileMenuOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileMenuOpen(false)}
              discrepanciesCount={3}
              anomaliesCount={0}
              inoperativityHours={24.5}
              onSwitchToWebsite={() => {
                setIsMobileMenuOpen(false);
                onSwitchToWebsite();
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Executive Top Navigation Bar */}
        <ExecutiveNavbar
          activeModule={activeModule}
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          selectedProcess={selectedProcess}
          onChangeProcess={setSelectedProcess}
          searchTerm={globalSearchTerm}
          onChangeSearch={setGlobalSearchTerm}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          discrepanciesCount={3}
          onSwitchToWebsite={onSwitchToWebsite}
        />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* View 1: Panel Ejecutivo Principal (Resumen Directorio & Gerencia) */}
            {activeModule === 'overview' && (
              <div className="animate-in fade-in duration-200">
                <ExecutiveOverviewView
                  onNavigate={(mod) => setActiveModule(mod)}
                  supervisorOctAvg={84.3}
                  bestSupervisorName="Jaiter Girón"
                  bestSupervisorGrade={88.1}
                  lowestSupervisorName="Pedro Oliva"
                  lowestSupervisorGrade={77.6}
                  metaERU={98.0}
                  totalFleetUnits={19}
                  fleetInoperativityHours={24.5}
                  fleetAvailabilityPct="98.5"
                  excessMontacargasCount={0}
                  excessElevadoresCount={0}
                  topInopEquipmentCode="KGR-241"
                  totalVolumeM3={473.9}
                  totalBoxesMeasured={3695}
                  measuredSkusCount={842}
                  totalCatalogSkus={1200}
                  volumetryDiscrepanciesCount={3}
                />
              </div>
            )}

            {/* View 2: Módulo de Mediciones y Control de Volumetría */}
            {activeModule === 'volumetry' && (
              <div className="animate-in fade-in duration-200">
                <VolumetryView />
              </div>
            )}

            {/* View 2.5: Módulo de Evolución de Volúmenes por Área (Crossdocking B2:D6) */}
            {activeModule === 'crossdocking' && (
              <div className="animate-in fade-in duration-200">
                <CrossdockingView />
              </div>
            )}

            {/* View 3: Módulo de Desempeño de Supervisores (60/20/20) */}
            {activeModule === 'supervisors' && (
              <div className="animate-in fade-in duration-200">
                <PerformanceView />
              </div>
            )}

            {/* View 4: Módulo de Horas Extras Operativas (HHEE & Bono) */}
            {activeModule === 'overtime' && (
              <div className="animate-in fade-in duration-200">
                <OvertimeView />
              </div>
            )}

            {/* View 5: Módulo de Horómetros y Flota (19 Equipos) */}
            {activeModule === 'fleet' && (
              <div className="animate-in fade-in duration-200">
                <FleetView />
              </div>
            )}

            {/* View 6: Módulo de Telemetría RT & CodeSandbox */}
            {activeModule === 'telemetry' && (
              <div className="animate-in fade-in duration-200 bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-800 shadow-xl">
                <TelemetryView />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
