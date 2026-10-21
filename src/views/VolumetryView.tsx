import React, { useState, useMemo, useEffect } from 'react';
import {
  SkuMeasurement,
  ProcessVolumeDistribution,
  UserVolumeDistribution,
} from '../types/volumetry';
import {
  INITIAL_SKU_MEASUREMENTS,
  PROCESS_DISTRIBUTIONS,
  USER_DISTRIBUTIONS,
  DAILY_VOLUMETRY_PROGRESS,
} from '../data/initialVolumetryData';
import {
  Box,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Download,
  Plus,
  Scale,
  Maximize2,
  TrendingUp,
  User,
  ArrowUpDown,
  Sparkles,
  Info,
  Cloud,
  RefreshCw,
  FileSpreadsheet,
  Table,
  BarChart3,
  ShieldAlert,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';
import { VolumetryCharts } from '../components/VolumetryCharts';
import { VolumetrySyncPanel } from '../components/VolumetrySyncPanel';
import { DataFreshnessStatus } from '../components/ManualDataImportPanel';
import {
  fetchAndParseSkuMasterFromUrl,
  exportMeasurementsToFullExcel,
  downloadOfficialSkuMasterTemplate,
} from '../utils/skuMasterExcel';

const LOCAL_STORAGE_KEY_MEASUREMENTS = 'stol_sku_measurements_v1';
const LOCAL_STORAGE_KEY_URL = 'stol_sku_public_url_v1';
const LOCAL_STORAGE_KEY_LAST_SYNC = 'stol_sku_last_sync_v1';
const LOCAL_STORAGE_KEY_INTERVAL = 'stol_sku_sync_interval_v1';

export const VolumetryView: React.FC = () => {
  // Load saved measurements from localStorage or fall back to initial
  const [measurements, setMeasurements] = useState<SkuMeasurement[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MEASUREMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved measurements', e);
    }
    return INITIAL_SKU_MEASUREMENTS;
  });

  // Public Folder URL
  const [onlineUrl, setOnlineUrl] = useState<string>(() => {
    return (
      localStorage.getItem(LOCAL_STORAGE_KEY_URL) ||
      'https://onedrive.live.com/download?cid=STOL_CORP&resid=MAESTRO_SKU_PUBLIC.xlsx'
    );
  });

  // Last Sync Time string
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_LAST_SYNC);
  });

  // Sync Interval in minutes
  const [syncInterval, setSyncInterval] = useState<number>(() => {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY_INTERVAL);
    return val ? parseInt(val, 10) : 15;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncBannerMessage, setSyncBannerMessage] = useState<string | null>(null);

  // Active Sub-tab
  const [activeTab, setActiveTab] = useState<'charts' | 'matrix' | 'sync' | 'governance'>('charts');

  // Filters for Matrix tab
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<string>('Todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Todos');
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>('');

  // Quick Single SKU Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSku, setNewSku] = useState<{
    sku: string;
    descripcion: string;
    categoria: string;
    usuario: string;
    proceso: SkuMeasurement['proceso'];
    largoCm: number;
    anchoCm: number;
    altoCm: number;
    pesoKg: number;
    masterLargoCm: number;
    masterAnchoCm: number;
    masterAltoCm: number;
    masterPesoKg: number;
  }>({
    sku: '',
    descripcion: '',
    categoria: 'General',
    usuario: 'Carlos Ramos (Rampa)',
    proceso: 'Recepción',
    largoCm: 40,
    anchoCm: 30,
    altoCm: 25,
    pesoKg: 10,
    masterLargoCm: 40,
    masterAnchoCm: 30,
    masterAltoCm: 25,
    masterPesoKg: 10,
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MEASUREMENTS, JSON.stringify(measurements));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [measurements]);

  // Save URL changes
  const handleSaveOnlineUrl = (url: string) => {
    setOnlineUrl(url);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_URL, url);
    } catch (e) {}
  };

  // Save Interval changes
  const handleSetSyncInterval = (mins: number) => {
    setSyncInterval(mins);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_INTERVAL, mins.toString());
    } catch (e) {}
  };

  // Perform Online Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncBannerMessage(null);

    try {
      const result = await fetchAndParseSkuMasterFromUrl(onlineUrl);
      if (!result.success || result.measurements.length === 0) {
        throw new Error(result.errorMessage || 'No se pudo leer un maestro SKU válido. Los datos no se actualizaron.');
      }

      setMeasurements(result.measurements);
      const timeStr = `Hoy a las ${new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      setLastSyncTime(timeStr);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_LAST_SYNC, timeStr);
      } catch (e) {}

      setSyncBannerMessage(
        `Sincronización confirmada: se actualizaron ${result.totalRowsParsed} SKUs desde el archivo vinculado.`
      );
    } catch (err: any) {
      setSyncBannerMessage(`Sin cambios: ${err?.message || 'no se pudo verificar el archivo vinculado.'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncBannerMessage(null), 6000);
    }
  };

  // Data loaded from file or simulation
  const handleDataLoaded = (newItems: SkuMeasurement[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setMeasurements(newItems);
    } else {
      // Merge by SKU
      const existingMap = new Map(measurements.map((m) => [m.sku, m]));
      newItems.forEach((item) => {
        existingMap.set(item.sku, item);
      });
      setMeasurements(Array.from(existingMap.values()));
    }

    const timeStr = `Hoy a las ${new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    setLastSyncTime(timeStr);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_SYNC, timeStr);
    } catch (e) {}
  };

  // Calculate real-time overall KPIs based on loaded measurements
  const totalVolumeM3 = useMemo(() => {
    return parseFloat(measurements.reduce((acc, m) => acc + m.volumenM3, 0).toFixed(2));
  }, [measurements]);

  const totalCatalogSkus = 1200;
  const measuredSkusCount = measurements.length;
  const pendingSkusCount = Math.max(0, totalCatalogSkus - measuredSkusCount);
  const progressPct = ((measuredSkusCount / totalCatalogSkus) * 100).toFixed(1);

  const criticalDiscrepancies = useMemo(
    () => measurements.filter((m) => m.estado === 'Discrepancia Crítica').length,
    [measurements]
  );

  const minorVariations = useMemo(
    () => measurements.filter((m) => m.estado === 'Variación Menor').length,
    [measurements]
  );

  const conformesCount = useMemo(
    () => measurements.filter((m) => m.estado === 'Conforme').length,
    [measurements]
  );

  // Estimated Freight Impact: Extra m3 caused by critical discrepancies
  const freightImpactSoles = useMemo(() => {
    const extraM3 = measurements
      .filter((m) => m.estado === 'Discrepancia Crítica')
      .reduce((acc, m) => acc + Math.max(0, m.volumenM3 - m.masterVolumenM3), 0);
    // Average freight cost: ~S/ 320 per m3 in secondary transport
    return Math.round(extraM3 * 320 * 18); // scaled to monthly volume
  }, [measurements]);

  // Filtered table for Matrix tab
  const filteredList = useMemo(() => {
    return measurements.filter((item) => {
      const matchProcess =
        selectedProcessFilter === 'Todos' || item.proceso === selectedProcessFilter;
      const matchStatus =
        selectedStatusFilter === 'Todos' || item.estado === selectedStatusFilter;
      const matchSearch =
        item.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
        item.usuario.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
        item.categoria.toLowerCase().includes(skuSearchQuery.toLowerCase());

      return matchProcess && matchStatus && matchSearch;
    });
  }, [measurements, selectedProcessFilter, selectedStatusFilter, skuSearchQuery]);

  const handleCreateMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.sku.trim()) return;

    const actualVol = (newSku.largoCm * newSku.anchoCm * newSku.altoCm) / 1000000;
    const masterVol = (newSku.masterLargoCm * newSku.masterAnchoCm * newSku.masterAltoCm) / 1000000;
    const diffPct = masterVol > 0 ? Math.abs((actualVol - masterVol) / masterVol) * 100 : 0;

    let status: SkuMeasurement['estado'] = 'Conforme';
    if (diffPct > 15) {
      status = 'Discrepancia Crítica';
    } else if (diffPct > 5) {
      status = 'Variación Menor';
    }

    const created: SkuMeasurement = {
      id: `MED-${Date.now().toString().slice(-4)}`,
      sku: newSku.sku.toUpperCase(),
      descripcion: newSku.descripcion || 'Producto sin descripción detallada',
      categoria: newSku.categoria,
      usuario: newSku.usuario,
      proceso: newSku.proceso,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].slice(0, 5),
      timestamp: Date.now(),
      largoCm: newSku.largoCm,
      anchoCm: newSku.anchoCm,
      altoCm: newSku.altoCm,
      pesoKg: newSku.pesoKg,
      volumenM3: parseFloat(actualVol.toFixed(4)),
      masterLargoCm: newSku.masterLargoCm,
      masterAnchoCm: newSku.masterAnchoCm,
      masterAltoCm: newSku.masterAltoCm,
      masterPesoKg: newSku.masterPesoKg,
      masterVolumenM3: parseFloat(masterVol.toFixed(4)),
      variacionVolPct: parseFloat(diffPct.toFixed(1)),
      estado: status,
      notasAuditoria:
        diffPct > 5 ? 'Medición registrada físicamente con variación sobre el maestro WMS.' : undefined,
    };

    setMeasurements([created, ...measurements]);
    setShowAddModal(false);
    setNewSku({
      sku: '',
      descripcion: '',
      categoria: 'General',
      usuario: 'Carlos Ramos (Rampa)',
      proceso: 'Recepción',
      largoCm: 40,
      anchoCm: 30,
      altoCm: 25,
      pesoKg: 10,
      masterLargoCm: 40,
      masterAnchoCm: 30,
      masterAltoCm: 25,
      masterPesoKg: 10,
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'SKU',
      'Descripcion',
      'Categoria',
      'Usuario',
      'Proceso',
      'Fecha',
      'Largo_cm',
      'Ancho_cm',
      'Alto_cm',
      'Peso_kg',
      'Vol_Real_m3',
      'Master_Vol_m3',
      'Variacion_pct',
      'Estado',
    ];

    const rows = measurements.map((m) => [
      m.id,
      `"${m.sku}"`,
      `"${m.descripcion}"`,
      `"${m.categoria}"`,
      `"${m.usuario}"`,
      `"${m.proceso}"`,
      m.fecha,
      m.largoCm,
      m.anchoCm,
      m.altoCm,
      m.pesoKg,
      m.volumenM3,
      m.masterVolumenM3,
      m.variacionVolPct,
      `"${m.estado}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `volumetria_mediciones_stol_${Date.now()}.csv`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  return (
    <div className="space-y-6 text-[#1A1A2E] font-sans">
      {/* 1. TOP MODULE HEADER WITH ONLINE SYNC STATUS STRIP */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                Pilar 1 · Logística & Operaciones
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {measurements.length} SKUs Registrados
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Control Volumétrico, Cubicaje & Maestro de SKUs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Operaciones alimenta las mediciones físicas desde la carpeta pública corporativa · El Directorio
              supervisa discrepancias de cubicaje y toma decisiones estratégicas de transporte y almacenaje.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DataFreshnessStatus source="volumetry" />
            {/* Sync Status Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Sincronización en Línea</div>
                <div className="font-mono text-slate-700 font-bold text-[11px] truncate max-w-[200px]">
                  {lastSyncTime || 'Conectado a Carpeta'}
                </div>
              </div>
            </div>

            {/* Quick Trigger Sync Button */}
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isSyncing
                  ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar en Línea'}</span>
            </button>

            {/* Export Full Excel */}
            <button
              onClick={() => exportMeasurementsToFullExcel(measurements)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Sync Success / Alert Toast */}
        {syncBannerMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{syncBannerMessage}</span>
            </div>
            <button
              onClick={() => setSyncBannerMessage(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* NAVIGATION SUB-TABS */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'charts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tablero de Gráficas & Analítica (Directorio)</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Maestro de SKUs & Auditoría WMS</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded-full text-[10px]">
              {measurements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sync'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sincronización en Línea & Carga de Maestro</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'governance'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Decisiones Estratégicas para Directorio</span>
          </button>
        </div>
      </div>

      {/* 2. TOP EXECUTIVE VOLUMETRY KPI STRIP (Always visible for quick oversight) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Volumen Total */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Volumen Total Medido
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
              {totalVolumeM3.toFixed(1)} <span className="text-base font-bold text-slate-500">m³</span>
            </div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs mes anterior
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Registrado en <strong>{measurements.length.toLocaleString()}</strong> SKUs activos
          </div>
        </div>

        {/* KPI 2: Avance Catálogo SKUs */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Avance Catálogo SKUs
            </span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-200">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
              {progressPct}%
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">
              {measuredSkusCount} medidos de {totalCatalogSkus} SKUs
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <strong>{pendingSkusCount}</strong> SKUs pendientes de cubicaje en rampa
          </div>
        </div>

        {/* KPI 3: Discrepancias Críticas con WMS */}
        <div className="bg-rose-50/70 border-2 border-rose-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-rose-900 tracking-wider">
              Discrepancias WMS (&gt;15%)
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl border border-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono text-rose-950 tracking-tight">
              {criticalDiscrepancies} <span className="text-sm font-bold text-rose-800">SKUs</span>
            </div>
            <div className="text-xs font-bold text-rose-800 mt-0.5">
              Requieren actualización de ficha técnica
            </div>
          </div>
          <div className="pt-2 border-t border-rose-200 text-[11px] text-rose-900 font-medium">
            Riesgo de subfacturación y colapso de racks
          </div>
        </div>

        {/* KPI 4: Impacto Financiero en Fletes */}
        <div className="bg-slate-900 text-white border-2 border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
              Sobrecosto Estimado Fletes
            </span>
            <div className="p-2 bg-slate-800 text-amber-400 rounded-xl border border-slate-700">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black font-mono text-amber-400 tracking-tight">
              S/ {freightImpactSoles.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-slate-300 mt-0.5">
              Por aire transportado no cubicado
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-medium">
            Recuperable mediante refacturación comercial
          </div>
        </div>
      </section>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: CHARTS & ANALYTICS */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Executive Directorial Observations Section */}
          <ExecutiveObservationsSection
            moduleName="volumetry"
            observations={getObservationsByModule('volumetry')}
            defaultExpanded={true}
          />

          {/* Full Chart.js Visualizations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Visualizaciones Analíticas de Volumetría & Desviaciones
                </h3>
                <p className="text-xs text-slate-500">
                  Gráficas generadas automáticamente a partir de las mediciones del Maestro de SKUs cargado
                </p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-xl border border-blue-200">
                Gráficas Interactivas en Vivo
              </span>
            </div>

            <VolumetryCharts measurements={measurements} />
          </div>
        </div>
      )}

      {/* TAB 2: SKU MASTER TABLE & AUDIT */}
      {activeTab === 'matrix' && (
        <section className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                Auditoría Dimensional: Físico Real vs. Maestro WMS
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa de largo, ancho, alto y peso medido físicamente en rampa frente a la ficha técnica
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Nueva Medición</span>
              </button>
              <button
                onClick={() => exportMeasurementsToFullExcel(measurements)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Exportar Excel Completo</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar SKU, descripción o analista..."
                value={skuSearchQuery}
                onChange={(e) => setSkuSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Proceso:
              </span>
              {['Todos', 'Recepción', 'Almacenamiento', 'Despacho', 'Cross-Docking', 'Auditoría'].map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedProcessFilter(p)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedProcessFilter === p
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-black text-slate-600">Estado:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-bold"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Conforme">Conforme (0 - 5%)</option>
                <option value="Discrepancia Crítica">Discrepancia Crítica (&gt;15%)</option>
                <option value="Variación Menor">Variación Menor (5-15%)</option>
                <option value="Pendiente Validación">Pendiente Validación</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-3">Código SKU</th>
                  <th className="py-2.5 px-3">Descripción / Categoría</th>
                  <th className="py-2.5 px-2">Proceso / Usuario</th>
                  <th className="py-2.5 px-3 text-center">Físico Real (L x An x Al)</th>
                  <th className="py-2.5 px-3 text-center">Maestro WMS</th>
                  <th className="py-2.5 px-2 text-right">Volumen Real</th>
                  <th className="py-2.5 px-2 text-center">Diferencia</th>
                  <th className="py-2.5 px-3 text-center">Estado Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {filteredList.map((m) => (
                  <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-black text-blue-900 whitespace-nowrap">
                      {m.sku}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{m.descripcion}</div>
                      <div className="text-[10.5px] text-slate-500">{m.categoria}</div>
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{m.proceso}</div>
                      <div className="text-[10px] text-slate-500">{m.usuario}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center whitespace-nowrap">
                      {m.largoCm} x {m.anchoCm} x {m.altoCm} cm
                      <div className="text-[10px] text-slate-400 font-bold">{m.pesoKg} kg</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center text-slate-500 whitespace-nowrap">
                      {m.masterLargoCm} x {m.masterAnchoCm} x {m.masterAltoCm} cm
                      <div className="text-[10px] text-slate-400">{m.masterPesoKg} kg</div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                      {m.volumenM3} m³
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap font-mono font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10.5px] ${
                          m.variacionVolPct > 15
                            ? 'bg-rose-100 text-rose-800 font-black'
                            : m.variacionVolPct > 5
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {m.variacionVolPct > 0 ? `+${m.variacionVolPct}%` : '0.0%'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          m.estado === 'Discrepancia Crítica'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : m.estado === 'Variación Menor'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : m.estado === 'Pendiente Validación'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Mostrando <strong>{filteredList.length}</strong> de <strong>{measurements.length}</strong> SKUs
            </span>
            <span>
              Conformes: <strong className="text-emerald-700">{conformesCount}</strong> | Críticos:{' '}
              <strong className="text-rose-700">{criticalDiscrepancies}</strong>
            </span>
          </div>
        </section>
      )}

      {/* TAB 3: ONLINE SYNC & EXCEL UPLOAD */}
      {activeTab === 'sync' && (
        <VolumetrySyncPanel
          onDataLoaded={handleDataLoaded}
          currentCount={measurements.length}
          lastSyncTime={lastSyncTime}
          onlineUrl={onlineUrl}
          onSaveOnlineUrl={handleSaveOnlineUrl}
          syncInterval={syncInterval}
          onSetSyncInterval={handleSetSyncInterval}
          isSyncing={isSyncing}
          onTriggerSync={handleTriggerSync}
        />
      )}

      {/* TAB 4: STRATEGIC DECISIONS FOR THE BOARD */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Gobernanza & Decisiones de Directorio</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Plan Director: Optimización de Almacenaje y Recuperación de Fletes
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Como los miembros del Directorio visitan la sede operativa como máximo 2 veces al año, estas
              tarjetas jerárquicas sintetizan los puntos de decisión clave que requieren aprobación ejecutiva,
              respaldadas por las mediciones físicas registradas en rampa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Fletes */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-black uppercase">
                  Acción Comercial Inmediata
                </span>
                <span className="text-xs font-mono font-bold text-rose-600">
                  Impacto: S/ {freightImpactSoles.toLocaleString()}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                1. Refacturación Retroactiva por Sobre-Cubicaje en Rampa
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se detectaron <strong>{criticalDiscrepancies} SKUs</strong> con más de 15% de exceso volumétrico
                frente a lo declarado por los clientes. El transporte secundario está pagando fletes por volumen
                real pero cobrando tarifas teóricas subestimadas.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Propuesta para Aprobación del Directorio:</div>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                  <li>Autorizar a Gerencia Comercial la emisión de adendas tarifarias con base en el cubicaje auditado.</li>
                  <li>Establecer cláusula de tolerancia máxima del 5% en nuevos contratos 2027.</li>
                </ul>
              </div>
            </div>

            {/* Card 2: Racks */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-black uppercase">
                  Capacidad de Almacén
                </span>
                <span className="text-xs font-mono font-bold text-amber-700">
                  Ocupación Racks: 94.2%
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                2. Desbloqueo de Altura Útil en Racks Selectivos
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El desvío en dimensiones de empaque secundario hace que pallets que deberían ocupar niveles de
                1.40 m requieran niveles de 1.80 m, generando falsos cuellos de botella en la nave 2.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Propuesta para Aprobación del Directorio:</div>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                  <li>Obligar a que el WMS actualice automáticamente las alturas de ubicación con la medición física.</li>
                  <li>Reordenar el layout de las zonas de alta rotación para liberar 120 posiciones de pallet.</li>
                </ul>
              </div>
            </div>

            {/* Card 3: Estación Móvil */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10.5px] font-black uppercase">
                  Inversión en Activos
                </span>
                <span className="text-xs font-mono font-bold text-blue-700">
                  Inversión: USD 6,800
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                3. Adquisición de Báscula Dimensional Móvil para Rampa
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Actualmente solo se cuenta con 1 báscula fija en nave 1, lo que retrasa la catalogación del 29.8%
                restante del catálogo de SKUs (358 ítems pendientes).
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Retorno de Inversión (ROI):</div>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                  <li>Recuperación estimada en 2.4 meses mediante corrección de tarifas de almacenaje.</li>
                  <li>Acelera el barrido de 100% de productos antes de la campaña navideña.</li>
                </ul>
              </div>
            </div>

            {/* Card 4: Calidad y Embalaje */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-black uppercase">
                  Eficiencia de Empaque
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  Ahorro Cartón: 12%
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                4. Incorporación de Nuevos Calibres de Cartón Corrugado
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se detectó un 12% de "aire muerto" en paquetería de despacho por falta de tamaños intermedios de
                cajas de embalaje en la línea de empaque.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Acuerdo Recomendado:</div>
                <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                  <li>Licitación de 2 medidas adicionales de cajas estándar (C-15 y C-25).</li>
                  <li>Capacitación de 100% de empacadores en selección óptima de caja por algoritmo de volumen.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: REGISTRAR NUEVA MEDICIÓN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Registrar Medición Física de SKU
                </h3>
                <p className="text-xs text-slate-500">
                  Ingresa las dimensiones reales para validar contra el maestro de volumetría
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeasurement} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. SKU-REC-1120"
                    value={newSku.sku}
                    onChange={(e) => setNewSku({ ...newSku, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoría</label>
                  <input
                    type="text"
                    value={newSku.categoria}
                    onChange={(e) => setNewSku({ ...newSku, categoria: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Descripción de Producto</label>
                <input
                  type="text"
                  placeholder="ej. Caja Master Filtros de Aceite"
                  value={newSku.descripcion}
                  onChange={(e) => setNewSku({ ...newSku, descripcion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Proceso Logístico</label>
                  <select
                    value={newSku.proceso}
                    onChange={(e) =>
                      setNewSku({ ...newSku, proceso: e.target.value as SkuMeasurement['proceso'] })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    <option value="Recepción">Recepción</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Cross-Docking">Cross-Docking</option>
                    <option value="Despacho">Despacho</option>
                    <option value="Auditoría">Auditoría</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Usuario / Analista</label>
                  <input
                    type="text"
                    value={newSku.usuario}
                    onChange={(e) => setNewSku({ ...newSku, usuario: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Physical Dimensions */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <span className="font-black text-blue-950 text-xs block">
                  Medición Física Real (Báscula y Flexómetro)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Largo (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.largoCm}
                      onChange={(e) =>
                        setNewSku({ ...newSku, largoCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Ancho (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.anchoCm}
                      onChange={(e) =>
                        setNewSku({ ...newSku, anchoCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Alto (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.altoCm}
                      onChange={(e) =>
                        setNewSku({ ...newSku, altoCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.pesoKg}
                      onChange={(e) =>
                        setNewSku({ ...newSku, pesoKg: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Master Dimensions */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 text-xs block">
                  Valor Maestro de Referencia (WMS / ERP)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">M. Largo</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.masterLargoCm}
                      onChange={(e) =>
                        setNewSku({ ...newSku, masterLargoCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">M. Ancho</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.masterAnchoCm}
                      onChange={(e) =>
                        setNewSku({ ...newSku, masterAnchoCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">M. Alto</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.masterAltoCm}
                      onChange={(e) =>
                        setNewSku({ ...newSku, masterAltoCm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">M. Peso</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSku.masterPesoKg}
                      onChange={(e) =>
                        setNewSku({ ...newSku, masterPesoKg: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black"
                >
                  Guardar & Validar Discrepancia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
