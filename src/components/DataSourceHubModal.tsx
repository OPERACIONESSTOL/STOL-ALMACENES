/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Hub Ejecutivo de Fuentes de Datos e Integración Multi-Fuente STOL Logistics
 * Integración de solo lectura: Google Sheets, Excel, Power BI y Supabase.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Database,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  UploadCloud,
  Clock,
  ShieldCheck,
  BookOpen,
  Layers,
  HelpCircle,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  getSavedSheetsConfig,
  saveSheetsConfig,
  GoogleSheetsConfig,
  DEFAULT_DEMO_FLEET_SHEET_URL,
} from '../services/googleSheetsService';
import { downloadFleetExcelTemplate, downloadVolumetryExcelTemplate } from '../services/excelService';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabaseService';
import { OFFICIAL_INDICATORS_CATALOG } from '../data/dataSourcesCatalog';

interface DataSourceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncGoogleSheetsNow?: (url: string, tab: string) => Promise<void>;
  isSyncingSheets?: boolean;
  lastSheetsSyncTime?: string | null;
  sheetsError?: string | null;
  onNavigateToPowerBI?: () => void;
}

export const DataSourceHubModal: React.FC<DataSourceHubModalProps> = ({
  isOpen,
  onClose,
  onSyncGoogleSheetsNow,
  isSyncingSheets,
  lastSheetsSyncTime,
  sheetsError,
  onNavigateToPowerBI,
}) => {
  const [activeTab, setActiveTab] = useState<'SHEETS' | 'EXCEL' | 'POWERBI' | 'SUPABASE' | 'CATALOGO'>('SHEETS');

  // Google Sheets form state
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getSavedSheetsConfig());
  const [sheetsSuccessNotice, setSheetsSuccessNotice] = useState<string | null>(null);

  // Supabase test state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSheetsConfig(getSavedSheetsConfig());
      const sCfg = getSavedSupabaseConfig();
      setSupabaseUrl(sCfg.supabaseUrl);
      setSupabaseAnonKey(sCfg.supabaseAnonKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSheetsConfig = () => {
    saveSheetsConfig(sheetsConfig);
    setSheetsSuccessNotice('Configuración guardada correctamente.');
    setTimeout(() => setSheetsSuccessNotice(null), 3000);
  };

  const handleLoadDemoSheet = () => {
    const demo = {
      ...sheetsConfig,
      sheetUrl: DEFAULT_DEMO_FLEET_SHEET_URL,
      sheetTab: 'Flota_Horometros',
    };
    setSheetsConfig(demo);
    saveSheetsConfig(demo);
    if (onSyncGoogleSheetsNow) {
      onSyncGoogleSheetsNow(demo.sheetUrl, demo.sheetTab);
    }
  };

  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseResult(null);
    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setSupabaseTesting(false);
    setSupabaseResult(res);
    if (res.success) {
      saveSupabaseConfig({
        supabaseUrl,
        supabaseAnonKey,
        isConnected: true,
        lastCheckedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Centro de Integración Multi-Fuente STOL
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Solo Lectura (Read-Only)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Conexión auditada con Google Sheets, Excel local, Power BI Service y base de datos Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('SHEETS')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'SHEETS'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets (Enlace Web)</span>
          </button>

          <button
            onClick={() => setActiveTab('EXCEL')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'EXCEL'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Archivos Excel & Plantillas</span>
          </button>

          <button
            onClick={() => setActiveTab('POWERBI')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'POWERBI'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Power BI Embebido</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPABASE')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'SUPABASE'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Supabase (PostgreSQL)</span>
          </button>

          <button
            onClick={() => setActiveTab('CATALOGO')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'CATALOGO'
                ? 'border-slate-800 text-slate-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-700" />
            <span>Catálogo Oficial de Indicadores</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'SHEETS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Método Oficial Seleccionado: Publicación en la Web de Google Sheets</h4>
                  <p className="mt-1 text-slate-700 leading-relaxed">
                    Permite sincronizar datos directamente en formato CSV/TSV sin requerir credenciales OAuth pesadas ni permisos de escritura.
                    En su Google Sheet corporativo: <b>Archivo &gt; Compartir &gt; Publicar en la web</b>, elija la hoja deseada y formato <b>Valores separados por comas (.csv)</b>.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Enlace de Publicación Web o URL de Google Sheets:
                  </label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv o https://docs.google.com/spreadsheets/d/ID/edit"
                    value={sheetsConfig.sheetUrl}
                    onChange={(e) => setSheetsConfig({ ...sheetsConfig, sheetUrl: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Admite enlaces directos con <code>/pub?output=csv</code> y enlaces estándar de Google Drive compartidos para lectura.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Nombre de la pestaña (opcional si es /pub):
                    </label>
                    <input
                      type="text"
                      placeholder="Flota_Horometros"
                      value={sheetsConfig.sheetTab || ''}
                      onChange={(e) => setSheetsConfig({ ...sheetsConfig, sheetTab: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Intervalo de actualización automática:
                    </label>
                    <select
                      value={sheetsConfig.autoRefreshIntervalSeconds || 60}
                      onChange={(e) =>
                        setSheetsConfig({
                          ...sheetsConfig,
                          autoRefreshIntervalSeconds: Number(e.target.value),
                        })
                      }
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value={30}>Cada 30 segundos</option>
                      <option value={60}>Cada 60 segundos (Recomendado)</option>
                      <option value={120}>Cada 2 minutos</option>
                      <option value={300}>Cada 5 minutos</option>
                    </select>
                  </div>
                </div>

                {/* Auto Refresh Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="auto-refresh-toggle"
                    checked={sheetsConfig.autoRefreshEnabled || false}
                    onChange={(e) =>
                      setSheetsConfig({ ...sheetsConfig, autoRefreshEnabled: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
                  />
                  <label htmlFor="auto-refresh-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Habilitar actualización periódica en segundo plano
                  </label>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Última sincronización: <b>{lastSheetsSyncTime || 'Aún no sincronizado'}</b>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadDemoSheet}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cargar Hoja Demo STOL
                  </button>

                  <button
                    onClick={handleSaveSheetsConfig}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Guardar Configuración
                  </button>

                  {onSyncGoogleSheetsNow && (
                    <button
                      onClick={() => onSyncGoogleSheetsNow(sheetsConfig.sheetUrl, sheetsConfig.sheetTab || '')}
                      disabled={isSyncingSheets || !sheetsConfig.sheetUrl}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSheets ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                    </button>
                  )}
                </div>
              </div>

              {sheetsSuccessNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {sheetsSuccessNotice}
                </div>
              )}

              {sheetsError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <b>Error al sincronizar con Google Sheets:</b>
                    <p className="mt-0.5 text-rose-700">{sheetsError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXCEL LOCAL & PLANTILLAS */}
          {activeTab === 'EXCEL' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Plantillas Oficiales de Excel para Sede y Operaciones</h4>
                  <p className="mt-1 text-slate-700 leading-relaxed">
                    Descargue las plantillas estandarizadas con las columnas y formatos exactos requeridos por la plataforma.
                    Puede alimentar estos archivos en sede e importarlos o subirlos a su Google Drive empresarial.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Truck className="w-4 h-4 text-rose-600" />
                      <span>Plantilla Flota & Horómetros</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Contiene hojas de Horómetros Mensuales (MC y Elevadores), Bitácora de Incidencias con causas y normativas de auditoría.
                    </p>
                    <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                      <div>• Columnas: Código, Proveedor, Mes, Horas Usadas, Límite</div>
                      <div>• Pestaña: Flota_Horometros & Bitacora_Incidencias</div>
                    </div>
                  </div>
                  <button
                    onClick={downloadFleetExcelTemplate}
                    className="mt-4 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Plantilla Flota (.xlsx)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>Plantilla Cubicaje & Volumetría</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Estructura para registrar mediciones físicas con huincha en mesa de recepción, comparación con cotas WMS y cálculo de discrepancias.
                    </p>
                    <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                      <div>• Columnas: SKU, Largo, Ancho, Alto, Vol Real, Vol WMS</div>
                      <div>• Pestaña: Auditoria_Volumetria</div>
                    </div>
                  </div>
                  <button
                    onClick={downloadVolumetryExcelTemplate}
                    className="mt-4 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Plantilla Volumetría (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POWER BI */}
          {activeTab === 'POWERBI' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Visualización Embebida de Power BI Service</h4>
                  <p className="mt-1 text-slate-700 leading-relaxed">
                    La plataforma incorpora un visor interactivo seguro (iframe sandbox) para proyectar informes ejecutivos y tableros semánticos de Power BI sin reescribir medidas DAX en frontend.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-slate-900 text-xs">Módulo dedicado de Power BI</h5>
                    <p className="text-[11px] text-slate-500">
                      Acceda a la vista completa con soporte de pantalla completa, cambio de informes preconfigurados y parámetros de filtro.
                    </p>
                  </div>
                  {onNavigateToPowerBI && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToPowerBI();
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ir al Módulo Power BI</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-800">Requisitos de conexión:</div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                    <li>Informe publicado en el espacio de trabajo de Power BI Service.</li>
                    <li>
                      Enlace de inserción web (<i>Archivo &gt; Insertar informe &gt; Publicar en la web</i> o <i>Sitio web o portal</i>).
                    </li>
                    <li>Solo lectura: no se consumen licencias Pro de escritura en frontend.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPABASE (POSTGRESQL) */}
          {activeTab === 'SUPABASE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-3">
                <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Conector de Solo Lectura para Supabase (PostgreSQL)</h4>
                  <p className="mt-1 text-slate-700 leading-relaxed">
                    Diseñado para consultar telemetría histórica y registros de auditoría mediante la API REST de Supabase con clave pública anónima (anon public key) y políticas de seguridad RLS activas.
                    <b> Prohibida cualquier operación de mutación, borrado o escritura.</b>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    URL del Proyecto Supabase:
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Anon Public Key (Clave pública de lectura):
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nunca ingrese la llave administrativa (service_role secret). Utilice exclusivamente la clave pública con RLS.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    onClick={handleTestSupabase}
                    disabled={supabaseTesting || !supabaseUrl || !supabaseAnonKey}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseTesting ? 'animate-spin' : ''}`} />
                    <span>{supabaseTesting ? 'Verificando...' : 'Probar Conectividad REST'}</span>
                  </button>
                </div>

                {supabaseResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      supabaseResult.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border border-rose-200 text-rose-900'
                    }`}
                  >
                    {supabaseResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-black">{supabaseResult.success ? 'Conexión Exitosa' : 'Fallo de Conexión'}</div>
                      <p className="mt-0.5">{supabaseResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CATÁLOGO DE INDICADORES */}
          {activeTab === 'CATALOGO' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm">Catálogo Oficial de Indicadores & Reglas de Integración</h4>
                  <p className="text-slate-300 text-[11px]">
                    Documentación estricta de fuentes de origen, columnas, fórmulas DAX/WMS y políticas de resolución de discrepancias.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black">
                  Norma STOL 2026
                </span>
              </div>

              <div className="space-y-3">
                {OFFICIAL_INDICATORS_CATALOG.map((ind) => (
                  <div
                    key={ind.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">{ind.nombre}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {ind.modulo}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Fuente: {ind.fuenteOficial}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{ind.descripcion}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-700">Regla de Cálculo: </span>
                        <span className="text-slate-600">{ind.reglaCalculo}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Frecuencia / Unidad: </span>
                        <span className="text-slate-600">
                          {ind.frecuenciaActualizacion} ({ind.unidadMedida})
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Tabla / Archivo: </span>
                        <span className="text-slate-600 font-mono text-[10px]">{ind.archivoOTablaOrigen}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Columnas Requeridas: </span>
                        <span className="text-slate-600">{ind.columnasUtilizadas.join(', ')}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80">
                      <span className="font-black">Política ante Discrepancia: </span>
                      {ind.politicaDiscrepancia}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Integración 100% de Solo Lectura. No se ejecutan mutaciones ni escrituras a las fuentes.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
