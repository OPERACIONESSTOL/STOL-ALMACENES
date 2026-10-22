/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Power BI Interactive Report Viewer for STOL Logistics Platform
 * Allows embedding and viewing corporate Power BI reports securely via iframe sandbox.
 * Complies with read-only requirement.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Settings,
  Sparkles,
  Layers,
  Database,
  Truck,
  Box,
  Users,
} from 'lucide-react';

interface ReportPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultUrl: string;
  icon: 'fleet' | 'volumetry' | 'supervisors';
}

const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'fleet-report',
    title: 'Disponibilidad de Flota & Horómetros',
    category: 'Mantenimiento & Flota',
    description: 'Indicadores MTBF, MTTR, ranking de consumo de horas por montacargas y elevadores NOVATRANS/DERCO.',
    defaultUrl:
      'https://app.powerbi.com/view?r=eyJrIjoiMDY0OWY4MGYtM2U4Zi00OTljLTgzNGUtYTMxNjQyMGM0Y2FiIiwidCI6ImY2MTBjMGI3LWJkMjQtNGIzOS04MTBiLTNkYzI4MGFmYjU5MCIsImMiOjF9',
    icon: 'fleet',
  },
  {
    id: 'volumetry-report',
    title: 'Cubicaje y Discrepancias Volumétricas',
    category: 'Almacenamiento & Cubicaje',
    description: 'Análisis de dispersión de m³, bultos auditados vs WMS y reliquidación de fletes por diferencias de cotas.',
    defaultUrl:
      'https://app.powerbi.com/view?r=eyJrIjoiNjY4YjUzMmEtOTkyYy00ZjkyLWIwNDQtYzYwNjI2YmE2MDk0IiwidCI6ImY2MTBjMGI3LWJkMjQtNGIzOS04MTBiLTNkYzI4MGFmYjU5MCIsImMiOjF9',
    icon: 'volumetry',
  },
  {
    id: 'productivity-report',
    title: 'Productividad de Supervisores y HHEE',
    category: 'Operaciones & Personas',
    description: 'Matriz 60/20/20, cumplimiento de meta 98%, horas extras ordinarias y dominicales.',
    defaultUrl:
      'https://app.powerbi.com/view?r=eyJrIjoiOGJjODhhNDgtYTIyZS00MjNkLTg0ZTctMTYyNjQ4MTAyYWMwIiwidCI6ImY2MTBjMGI3LWJkMjQtNGIzOS04MTBiLTNkYzI4MGFmYjU5MCIsImMiOjF9',
    icon: 'supervisors',
  },
];

const STORAGE_KEY_POWERBI_URLS = 'stol_powerbi_custom_urls_v1';

export const PowerBIView: React.FC = () => {
  const [activeReportId, setActiveReportId] = useState<string>('fleet-report');
  const [customUrls, setCustomUrls] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POWERBI_URLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading Power BI URLs', e);
    }
    return {};
  });

  const [inputUrl, setInputUrl] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentReport = REPORT_PRESETS.find((r) => r.id === activeReportId) || REPORT_PRESETS[0];
  const activeUrl = customUrls[currentReport.id] || currentReport.defaultUrl;

  useEffect(() => {
    setInputUrl(activeUrl);
  }, [activeReportId, activeUrl]);

  const handleSaveUrl = () => {
    const updated = {
      ...customUrls,
      [currentReport.id]: inputUrl.trim(),
    };
    setCustomUrls(updated);
    try {
      localStorage.setItem(STORAGE_KEY_POWERBI_URLS, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setIsEditingUrl(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleResetUrl = () => {
    const updated = { ...customUrls };
    delete updated[currentReport.id];
    setCustomUrls(updated);
    try {
      localStorage.setItem(STORAGE_KEY_POWERBI_URLS, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setInputUrl(currentReport.defaultUrl);
    setIsEditingUrl(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Error attempting fullscreen', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-blue-950 p-5 rounded-2xl border border-amber-500/30 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black tracking-tight">Power BI Service · Visualizador Ejecutivo</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
                Embebido Interactivo Seguro
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Acceso a modelos semánticos y tableros oficiales de Power BI sin alterar medidas DAX corporativas.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Guía de Conexión</span>
          </button>

          <button
            onClick={() => setIsEditingUrl(!isEditingUrl)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Configurar Enlace</span>
          </button>

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-sm"
            title="Recargar visualizador"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recargar</span>
          </button>
        </div>
      </div>

      {/* Guide Panel Collapsible */}
      {showInstructions && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs space-y-2">
          <div className="flex items-center justify-between text-white font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ¿Cómo obtener el enlace seguro de inserción en Power BI?
            </span>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Abra su informe en Power BI Service (app.powerbi.com).</li>
            <li>Haga clic en <b>Archivo &gt; Insertar informe &gt; Publicar en la web (público)</b> o <b>Sitio web o portal</b>.</li>
            <li>Copie el enlace de inserción que inicia con <code>https://app.powerbi.com/view?r=...</code> o <code>https://app.powerbi.com/reportEmbed?...</code>.</li>
            <li>Pegue el enlace en el botón <b>Configurar Enlace</b> de esta vista.</li>
            <li>
              <b>Regla de negocio:</b> Las métricas calculadas en DAX dentro de Power BI se conservan intactas en este visor para evitar divergencias de cálculo entre plataformas.
            </li>
          </ol>
        </div>
      )}

      {/* URL Edit Bar */}
      {isEditingUrl && (
        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900">
              Vincular Enlace Power BI para: <span className="text-blue-600">{currentReport.title}</span>
            </h4>
            <button
              onClick={handleResetUrl}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
            >
              Restaurar URL oficial por defecto
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://app.powerbi.com/view?r=..."
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer transition-colors"
            >
              Aplicar Enlace
            </button>
          </div>
        </div>
      )}

      {/* Report Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {REPORT_PRESETS.map((rep) => {
          const isSelected = rep.id === activeReportId;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveReportId(rep.id)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                isSelected
                  ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {rep.icon === 'fleet' && <Truck className="w-5 h-5" />}
                {rep.icon === 'volumetry' && <Box className="w-5 h-5" />}
                {rep.icon === 'supervisors' && <Users className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  {rep.category}
                </span>
                <h4 className="text-xs font-black text-slate-900 truncate">{rep.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{rep.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Embedded Container */}
      <div
        ref={containerRef}
        className={`bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[640px]'
        }`}
      >
        {/* Top Control Bar inside iframe header */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white">{currentReport.title}</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Visor Embebido Interactivo de Solo Lectura
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* The Power BI Iframe */}
        <div className="flex-1 w-full bg-slate-900 relative">
          <iframe
            key={iframeKey}
            title={currentReport.title}
            src={activeUrl}
            className="w-full h-full min-h-[600px] border-0"
            allowFullScreen={true}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>

        {/* Footer info inside iframe view */}
        <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Origen Oficial: Power BI Service (Tenant STOL Corporativo) · Modelo Semántico Unificado
            </span>
          </div>
          <div>
            <span>Frecuencia: Programada 4 veces/día vía Gateway Corporativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
