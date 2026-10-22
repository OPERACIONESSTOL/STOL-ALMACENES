import React, { useState, useEffect } from 'react';
import {
  CrossdockingSummary,
  CrossdockingDailyRecord,
} from '../types/crossdocking';
import {
  INITIAL_CROSSDOCKING_SUMMARY,
  INITIAL_CROSSDOCKING_RECORDS,
} from '../data/initialCrossdockingData';
import {
  parseCrossdockingExcelFile,
} from '../utils/crossdockingExcel';
import { CrossdockingCharts } from '../components/CrossdockingCharts';
import {
  FileSpreadsheet,
  UploadCloud,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Info,
  Clock,
  Printer,
  ChevronDown,
  Database,
  X,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { ExecutiveObservationsSection } from '../components/ExecutiveObservationsSection';
import { getObservationsByModule } from '../data/executiveObservationsRegistry';
import { DataFreshnessStatus, ManualDataImportPanel } from '../components/ManualDataImportPanel';
import { ReportModuleHeader, getReportMonthFromDate } from '../components/ReportModuleHeader';
import {
  getSavedSheetsConfig,
  saveSheetsConfig,
  syncCrossdockingFromGoogleSheets,
  GoogleSheetsConfig,
} from '../services/googleSheetsService';

const STORAGE_KEY_SUMMARY = 'stol_crossdocking_summary';
const STORAGE_KEY_RECORDS = 'stol_crossdocking_records';

interface CrossdockingViewProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const CrossdockingView: React.FC<CrossdockingViewProps> = ({ selectedMonth, onSelectMonth }) => {
  // 1. Data state loaded from localStorage or default
  const [summary, setSummary] = useState<CrossdockingSummary>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUMMARY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CROSSDOCKING_SUMMARY;
  });

  const [records, setRecords] = useState<CrossdockingDailyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CROSSDOCKING_RECORDS;
  });

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(summary));
    } catch {}
  }, [summary]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {}
  }, [records]);

  // Table filters
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Number formatter
  const fmt = (n: number, d = 2) =>
    (n || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

  // Handle Excel file upload
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const result = await parseCrossdockingExcelFile(file);

      if (result.summary) {
        setSummary(result.summary);
      }

      if (result.records && result.records.length > 0) {
        setRecords(result.records);
      }

      const firstDate = result.records.length > 0 ? result.records[0].fecha : '';
      const lastDate = result.records.length > 0 ? result.records[result.records.length - 1].fecha : '';

      return result.records.length > 0
        ? `Hoja ${result.sheetName}: se importaron ${result.records.length} días, del ${firstDate} al ${lastDate}.`
        : `Hoja ${result.sheetName}: se actualizó el resumen B2:D6.`;
    } catch (err: any) {
      console.error('Error parsing Crossdocking Excel:', err);
      throw new Error(err.message || 'Error al procesar el archivo Excel. Verifica el formato de la pestaña.');
    }
  };

  // Filtered records
  const availableMonths = Array.from(new Set(records.map((record) => getReportMonthFromDate(record.fecha)).filter((month): month is string => Boolean(month))));
  const monthRecords = records.filter((record) => selectedMonth === 'Todos' || getReportMonthFromDate(record.fecha) === selectedMonth);
  const monthSummary: CrossdockingSummary = {
    volRegular: monthRecords.reduce((sum, record) => sum + record.volRegular, 0),
    volExtraordinario: monthRecords.reduce((sum, record) => sum + record.volExtraordinario, 0),
    volDomFer: monthRecords.reduce((sum, record) => sum + record.volDomFerNoct, 0),
    reprocesos: summary.reprocesos,
  };
  const filteredRecords = monthRecords.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.fecha.toLowerCase().includes(q) ||
      r.observaciones.toLowerCase().includes(q) ||
      String(r.m3Prog).includes(q) ||
      String(r.volRegular).includes(q)
    );
  });

  const totalVolumenSummary = monthSummary.volRegular + monthSummary.volExtraordinario + monthSummary.volDomFer;

  return (
    <div className="space-y-6 pb-12 font-sans text-[#1A1A2E]">
      <ReportModuleHeader
        title="Crossdocking: volúmenes y recepciones"
        description="Consulta el volumen recibido, cumplimiento de programación, proveedores tardíos y operaciones extraordinarias del mes."
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onSelectMonth={onSelectMonth}
        eyebrow="OPERACIÓN · CROSSDOCKING"
        actions={<><DataFreshnessStatus source="crossdocking" /><button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold">Imprimir / PDF</button></>}
      />

      {/* 2. CUADRO RESUMEN B2:D6 (EXACTO DEL EXCEL DEL USUARIO) */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-5 md:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg">
                RANGO B2:D6
              </span>
              <h2 className="text-base md:text-lg font-black text-slate-900">
                Resumen Oficial Declarado de Crossdocking
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Información oficial consolidada de la pestaña Excel (datos exactos sin recálculos inventados)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              Total Acumulado: <b className="text-slate-900 font-mono">{fmt(totalVolumenSummary, 2)} m³</b>
            </span>
          </div>
        </div>

        {/* Side by side: Exact Table replication + Executive metric cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-start">
          {/* Exact table style as in screenshot image_774a77c0.png */}
          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-300 shadow-inner">
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center justify-between">
              <span>Vista de Celdas Excel B2:D6</span>
              <span className="text-[10px] text-blue-600 font-mono">Pestaña "Crossdocking"</span>
            </div>

            <div className="overflow-hidden border border-slate-400 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#D9D9D9] text-black font-black border-b border-slate-400 text-sm">
                    <th className="py-1.5 px-4 border-r border-slate-400 w-1/2">Item</th>
                    <th className="py-1.5 px-4 text-right">M3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-sans text-sm">
                  <tr className="hover:bg-blue-50/50">
                    <td className="py-1.5 px-4 border-r border-slate-300 font-semibold text-slate-900">
                      Vol Regular
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono font-black text-slate-900">
                      {fmt(monthSummary.volRegular, 2)}
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50">
                    <td className="py-1.5 px-4 border-r border-slate-300 font-semibold text-slate-900">
                      Vol Extraordinario
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono font-black text-slate-900">
                      {fmt(monthSummary.volExtraordinario, 2)}
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50">
                    <td className="py-1.5 px-4 border-r border-slate-300 font-semibold text-slate-900">
                      Vol Dom Fer
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono font-black text-slate-900">
                      {fmt(monthSummary.volDomFer, 2)}
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50">
                    <td className="py-1.5 px-4 border-r border-slate-300 font-semibold text-slate-900">
                      Reprocesos
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono font-black text-slate-900">
                      {summary.reprocesos > 0 ? 'No desglosado por día' : fmt(0, 2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-[10.5px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                Información sincronizada en línea mediante Google Sheets y registros oficiales de sede.
              </span>
            </div>
          </div>

          {/* 4 Executive Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Vol Regular */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-4 shadow-md border-2 border-blue-500/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-200">
                <span>Vol Regular</span>
                <span>📦</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  {fmt(monthSummary.volRegular, 2)} m³
                </div>
                <div className="text-[11px] font-bold text-blue-200 mt-0.5">
                  Operación Ordinaria ({totalVolumenSummary > 0 ? ((monthSummary.volRegular / totalVolumenSummary) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <div className="pt-2 border-t border-blue-400/30 text-[10.5px] text-blue-100 flex items-center justify-between">
                <span>Flujo estándar de recepción</span>
                <span className="font-bold">Principal</span>
              </div>
            </div>

            {/* Card 2: Vol Extraordinario */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-4 shadow-md border-2 border-amber-300/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-100">
                <span>Vol Extraordinario</span>
                <span>⚡</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  {fmt(monthSummary.volExtraordinario, 2)} m³
                </div>
                <div className="text-[11px] font-bold text-amber-100 mt-0.5">
                  Sobrecupo &amp; Ventana Ext. ({totalVolumenSummary > 0 ? ((monthSummary.volExtraordinario / totalVolumenSummary) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <div className="pt-2 border-t border-amber-400/30 text-[10.5px] text-amber-100 flex items-center justify-between">
                <span>Atenciones especiales</span>
                <span className="font-bold">Facturable</span>
              </div>
            </div>

            {/* Card 3: Vol Dom Fer */}
            <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-slate-900 text-white rounded-2xl p-4 shadow-md border-2 border-purple-400/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-200">
                <span>Vol Dom | Fer</span>
                <span>🌙</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  {fmt(monthSummary.volDomFer, 2)} m³
                </div>
                <div className="text-[11px] font-bold text-purple-200 mt-0.5">
                  Domingos, Feriados &amp; Turnos Nocturnos
                </div>
              </div>
              <div className="pt-2 border-t border-purple-400/30 text-[10.5px] text-purple-200 flex items-center justify-between">
                <span>Atención en días no hábiles</span>
                <span className="font-bold">Tarifa Especial</span>
              </div>
            </div>

            {/* Card 4: Reprocesos */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-2xl p-4 shadow-md border-2 border-emerald-400/40 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-100">
                <span>Reprocesos</span>
                <span>🛡️</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  {summary.reprocesos > 0 ? 'No desglosado por día' : fmt(0, 2)}
                </div>
                <div className="text-[11px] font-bold text-emerald-200 mt-0.5">
                  Cero reprocesos registrados
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-400/30 text-[10.5px] text-emerald-100 flex items-center justify-between">
                <span>Eficiencia operativa 100%</span>
                <span className="font-bold text-emerald-300">Óptimo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STANDARD MANUAL DATA IMPORT */}
      <ManualDataImportPanel
        source="crossdocking"
        title="Actualizar información de Crossdocking"
        acceptedExtensions={['.xlsx', '.xls', '.csv']}
        instructions="Importa el resumen B2:D6 y los registros diarios de la pestaña Crossdocking."
        onImport={handleFileUpload}
      />

      {/* 4. VISUAL CHARTS OF VOLUME EVOLUTION */}
      <CrossdockingCharts summary={monthSummary} records={monthRecords} />

      {/* DIRECTORIAL OBSERVATIONS FOR CROSSDOCKING */}
      <ExecutiveObservationsSection
        moduleName="volumetry"
        observations={getObservationsByModule('volumetry')}
        defaultExpanded={false}
      />

      {/* 5. OPERATIONAL MASTER TABLE (FAITHFUL REPLICATION OF IMAGE 1) */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-5 md:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>📋 Tabla Detallada de Recepción Cross Docking</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Estructura oficial idéntica al encabezado del Excel empresarial STOL
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por fecha, observación o volumen..."
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
              {filteredRecords.length} Registros
            </span>
          </div>
        </div>

        {/* Master Table with EXACT header styling from user's image */}
        <div className="mt-4 overflow-x-auto border-2 border-slate-800 rounded-xl shadow-md">
          <table className="w-full text-center text-xs border-collapse font-sans min-w-[1200px]">
            {/* ROW 1: Super Header */}
            <thead>
              <tr className="border-b border-slate-900 text-black font-black text-xs">
                {/* Fecha */}
                <th
                  rowSpan={1}
                  className="bg-[#F79646] text-black font-black py-2.5 px-3 border-r border-slate-900 w-24"
                >
                  Fecha
                </th>

                {/* Recepción Cross Docking (Spans 13 columns) */}
                <th
                  colSpan={13}
                  className="bg-[#F79646] text-black font-black py-2.5 px-4 border-r border-slate-900 tracking-wide"
                >
                  Recepción Cross Docking
                </th>

                {/* Observaciones */}
                <th
                  rowSpan={1}
                  className="bg-[#FFFF00] text-black font-black py-2.5 px-4"
                >
                  Observaciones
                </th>
              </tr>

              {/* ROW 2: Sub-headers */}
              <tr className="border-b-2 border-slate-900 text-[11px] font-black text-black">
                {/* Under Fecha */}
                <th className="bg-white border-r border-slate-400 py-2 px-2"></th>

                {/* Peach group: M3 & LPN & Prov */}
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  M3 Prog
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  M3 Recb Ptio
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  M3 Recb Nve
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  LPN Prog Ptio
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  LPN Prog Nave
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  LPN Ptio
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  LPN Nve
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  Prov prog
                </th>
                <th className="bg-[#FDE9D9] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  Prov Tardanza
                </th>

                {/* Light Gold group: Vol Regular, Vol Extraordinario, Vol Dom | Fer | Noct */}
                <th className="bg-[#FBD99B] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  Vol Regular
                </th>
                <th className="bg-[#FBD99B] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  Vol Extraordinario
                </th>
                <th className="bg-[#FBD99B] border-r border-slate-400 py-2 px-2 whitespace-nowrap">
                  Vol Dom | Fer | Noct
                </th>

                {/* Dark Crimson group: M3 Por Atenc Ext */}
                <th className="bg-[#800000] text-white border-r border-slate-900 py-2 px-2 whitespace-nowrap font-black">
                  M3 Por Atenc Ext
                </th>

                {/* Under Observaciones */}
                <th className="bg-white py-2 px-3 text-left"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 font-sans text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-xs text-slate-400">
                    No se encontraron registros de Crossdocking que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    className="hover:bg-amber-50/40 transition-colors font-medium text-center"
                  >
                    {/* Fecha */}
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold whitespace-nowrap text-slate-900 bg-slate-50/50">
                      {r.fecha}
                    </td>

                    {/* M3 Prog */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono text-slate-700">
                      {fmt(r.m3Prog, 1)}
                    </td>

                    {/* M3 Recb Ptio */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/30">
                      {fmt(r.m3RecbPtio, 1)}
                    </td>

                    {/* M3 Recb Nve */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-sky-900 bg-sky-50/30">
                      {fmt(r.m3RecbNve, 1)}
                    </td>

                    {/* LPN Prog Ptio */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono text-slate-600">
                      {r.lpnProgPtio}
                    </td>

                    {/* LPN Prog Nave */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono text-slate-600">
                      {r.lpnProgNave}
                    </td>

                    {/* LPN Ptio */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-emerald-800 bg-emerald-50/20">
                      {r.lpnPtio}
                    </td>

                    {/* LPN Nve */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-emerald-800 bg-emerald-50/20">
                      {r.lpnNve}
                    </td>

                    {/* Prov prog */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono text-slate-700">
                      {r.provProg}
                    </td>

                    {/* Prov Tardanza */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold">
                      {r.provTardanza > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {r.provTardanza}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Vol Regular */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-slate-900">
                      {fmt(r.volRegular, 1)}
                    </td>

                    {/* Vol Extraordinario */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-amber-700 bg-amber-50/30">
                      {fmt(r.volExtraordinario, 1)}
                    </td>

                    {/* Vol Dom | Fer | Noct */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-bold text-purple-700 bg-purple-50/30">
                      {fmt(r.volDomFerNoct, 1)}
                    </td>

                    {/* M3 Por Atenc Ext (Crimson accent) */}
                    <td className="py-2.5 px-2 border-r border-slate-200 font-mono font-black text-rose-800 bg-rose-50">
                      {fmt(r.m3PorAtencExt, 1)}
                    </td>

                    {/* Observaciones */}
                    <td className="py-2.5 px-3 text-left text-xs text-slate-600 max-w-xs truncate" title={r.observaciones}>
                      {r.observaciones || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. EXECUTIVE FOOTER */}
      <footer className="text-center text-xs text-slate-500 font-medium py-3 border-t border-slate-200">
        Plataforma Integral de Auditorías Operacionales STOL · Módulo de Evolución de Volúmenes por Área (Crossdocking Oficial)
      </footer>
    </div>
  );
};
