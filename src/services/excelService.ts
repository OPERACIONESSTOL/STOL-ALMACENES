/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Excel Integration Service for STOL Logistics Platform
 * Handles:
 * 1. Template generation for offline spreadsheets (Horómetros de Flota & Cubicaje)
 * 2. Local Excel file reading and schema validation
 * 3. Export of current audit tables to Excel
 */

import * as XLSX from 'xlsx';
import { Equipment, MaintenanceIncident } from '../types/fleet';

/**
 * Generates an official Excel template for Fleet Horometers and triggers download
 */
export function downloadFleetExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Horómetros Mensuales
  const sampleHorometros = [
    {
      'Código de Equipo': 'MC-01',
      Proveedor: 'DERCO',
      'Tipo de Equipo': 'MONTACARGA',
      Mes: 'Octubre',
      'Horas Usadas': 184.5,
      'Horas Inoperativas': 0.0,
      'Límite Contratado': 300,
      'Centro de Costo': 'Almacén Central',
      Observaciones: 'Operativo conforme',
    },
    {
      'Código de Equipo': 'MC-02',
      Proveedor: 'DERCO',
      'Tipo de Equipo': 'MONTACARGA',
      Mes: 'Octubre',
      'Horas Usadas': 212.0,
      'Horas Inoperativas': 4.5,
      'Límite Contratado': 300,
      'Centro de Costo': 'Recepción',
      Observaciones: 'Mantenimiento preventivo 250h',
    },
    {
      'Código de Equipo': 'ELEV-01',
      Proveedor: 'NOVA',
      'Tipo de Equipo': 'ELEVADOR',
      Mes: 'Octubre',
      'Horas Usadas': 310.2,
      'Horas Inoperativas': 2.0,
      'Límite Contratado': 375,
      'Centro de Costo': 'Racks y Alturas',
      Observaciones: 'Turno extendido',
    },
    {
      'Código de Equipo': 'ELEV-02',
      Proveedor: 'NOVA',
      'Tipo de Equipo': 'ELEVADOR',
      Mes: 'Octubre',
      'Horas Usadas': 295.0,
      'Horas Inoperativas': 0.0,
      'Límite Contratado': 375,
      'Centro de Costo': 'Racks y Alturas',
      Observaciones: 'Operativo',
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(sampleHorometros);
  XLSX.utils.book_append_sheet(wb, ws1, 'Flota_Horometros');

  // Sheet 2: Bitácora de Incidencias
  const sampleIncidencias = [
    {
      'Fecha Incidencia': '2026-10-15',
      Mes: 'Octubre',
      'Código Equipo': 'MC-02',
      Proveedor: 'DERCO',
      'Tipo Mantenimiento': 'Preventivo',
      Resultado: 'Reparado',
      'Horas Inoperativo': 4.5,
      'Motivo / Falla': 'Cambio preventivo de mangueras hidráulicas y filtros',
    },
    {
      'Fecha Incidencia': '2026-10-18',
      Mes: 'Octubre',
      'Código Equipo': 'ELEV-01',
      Proveedor: 'NOVA',
      'Tipo Mantenimiento': 'Correctivo',
      Resultado: 'Reparado',
      'Horas Inoperativo': 2.0,
      'Motivo / Falla': 'Ajuste de sensor de presencia en mástil',
    },
  ];

  const ws2 = XLSX.utils.json_to_sheet(sampleIncidencias);
  XLSX.utils.book_append_sheet(wb, ws2, 'Bitacora_Incidencias');

  // Sheet 3: Instrucciones Oficiales
  const instrucciones = [
    {
      Regla: '1. Conservar nombres de columnas',
      Detalle: 'No renombrar encabezados para garantizar compatibilidad con la plataforma STOL.',
    },
    {
      Regla: '2. Unidades de Medida',
      Detalle: 'Las horas deben expresarse en decimales (ejemplo 184.5). No colocar texto en columnas de horas.',
    },
    {
      Regla: '3. Formato de Fechas',
      Detalle: 'Utilizar formato YYYY-MM-DD o DD/MM/YYYY.',
    },
    {
      Regla: '4. Conexión en la Nube',
      Detalle: 'Para vincular vía Google Sheets, importe este archivo a Google Drive y use Archivo > Publicar en la Web.',
    },
  ];
  const ws3 = XLSX.utils.json_to_sheet(instrucciones);
  XLSX.utils.book_append_sheet(wb, ws3, 'Instrucciones_Normativas');

  XLSX.writeFile(wb, 'plantilla_oficial_flota_horometros_stol.xlsx');
}

/**
 * Generates an official Excel template for Volumetric Cubicaje
 */
export function downloadVolumetryExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  const sampleVolumetry = [
    {
      'Código SKU': 'SKU-00192',
      Descripción: 'Caja Organizadora Polipropileno 45L',
      Familia: 'Plásticos y Hogar',
      'Largo Real (cm)': 60.0,
      'Ancho Real (cm)': 40.0,
      'Alto Real (cm)': 35.0,
      'Volumen Unitario (m³)': 0.084,
      'Volumen WMS (m³)': 0.075,
      'Discrepancia %': 12.0,
      'Estado Auditoría': 'DISCREPANCIA_CRITICA',
      'Supervisor Auditor': 'Jaiter Girón',
      'Fecha Medición': '2026-10-14',
    },
    {
      'Código SKU': 'SKU-00451',
      Descripción: 'Set Toallas Algodón Premium 6 Unidades',
      Familia: 'Textil Hogar',
      'Largo Real (cm)': 45.0,
      'Ancho Real (cm)': 30.0,
      'Alto Real (cm)': 20.0,
      'Volumen Unitario (m³)': 0.027,
      'Volumen WMS (m³)': 0.027,
      'Discrepancia %': 0.0,
      'Estado Auditoría': 'CONFORME',
      'Supervisor Auditor': 'Pedro Oliva',
      'Fecha Medición': '2026-10-16',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleVolumetry);
  XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Volumetria');
  XLSX.writeFile(wb, 'plantilla_oficial_mediciones_volumetria_stol.xlsx');
}
