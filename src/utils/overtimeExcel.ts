import * as XLSX from 'xlsx';
import { OvertimeRecord, BonusRecord, OvertimeDataset } from '../types/overtime';

export const normalizeString = (s: unknown): string => {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
};

export const excelSerialToIso = (n: number): string => {
  if (!n || isNaN(n)) return '';
  try {
    const d = new Date(Math.round((n - 25569) * 864e5));
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

export const isoToExcelSerial = (isoDate: string): number => {
  if (!isoDate) return 0;
  const ms = Date.parse(isoDate);
  if (isNaN(ms)) return 0;
  return Math.floor(ms / 864e5 + 25569);
};

export const formatHours = (v: number): string => {
  return (v || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

function pickField(row: Record<string, unknown>, prefix: string, exact: boolean = false): unknown {
  const normPrefix = normalizeString(prefix);
  const foundKey = Object.keys(row).find((k) =>
    exact ? normalizeString(k) === normPrefix : normalizeString(k).startsWith(normPrefix)
  );
  return foundKey ? row[foundKey] : null;
}

function getSheetJson(wb: XLSX.WorkBook, sheetNameTarget: string): Record<string, unknown>[] {
  const normTarget = normalizeString(sheetNameTarget);
  const matchedName = wb.SheetNames.find((s) => normalizeString(s) === normTarget);
  if (!matchedName) {
    throw new Error(`No se encontró la pestaña "${sheetNameTarget}" en el libro Excel.`);
  }
  return XLSX.utils.sheet_to_json(wb.Sheets[matchedName], {
    range: 3, // header row is line 4 (0-indexed 3)
    raw: true,
    defval: null,
  });
}

export function parseOvertimeWorkbook(buffer: ArrayBuffer): OvertimeDataset {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const hh: OvertimeRecord[] = [];

  const hheeRows = getSheetJson(wb, 'HHEE');
  hheeRows.forEach((r) => {
    let fVal = pickField(r, 'FECHA', true);
    if (typeof fVal === 'string') {
      fVal = Date.parse(fVal) / 864e5 + 25569;
    }
    if (typeof fVal !== 'number' || isNaN(fVal)) return;

    const rawH = pickField(r, 'CANTIDAD DE HORAS');
    let numH = 0;
    if (typeof rawH === 'number') {
      numH = rawH * 24;
    } else {
      const de = pickField(r, 'DE:', true);
      const a = pickField(r, 'A:', true);
      if (typeof de === 'number' && typeof a === 'number') {
        numH = (((a - de) % 1 + 1) % 1) * 24;
      }
    }

    const obs = normalizeString(pickField(r, 'OBSERVACION ('));
    const isDominicalOrHoliday = /DOMINICAL|FERIADO/.test(obs) ? 1 : 0;

    const rawWeek = pickField(r, 'SEMANAL', true) ?? pickField(r, 'SEMANA', true);
    const parsedWeek = parseInt(String(rawWeek ?? '0'), 10);

    const cargo = normalizeString(pickField(r, 'CARGO', true));
    const area = normalizeString(pickField(r, 'AREA', true));

    if (cargo && area && numH > 0) {
      hh.push({
        f: Math.floor(fVal),
        c: cargo,
        a: area,
        h: Math.round(numH * 10000) / 10000,
        x: isDominicalOrHoliday,
        w: isNaN(parsedWeek) ? 0 : parsedWeek,
      });
    }
  });

  const bo: BonusRecord[] = [];
  try {
    const bonoRows = getSheetJson(wb, 'BONO');
    bonoRows.forEach((r) => {
      const d = pickField(r, 'DIAS', true);
      if (typeof d !== 'number' || isNaN(d)) return;
      const area = normalizeString(pickField(r, 'AREA', true));
      const cargo = normalizeString(pickField(r, 'CARGO', true));
      if (area && cargo) {
        bo.push({ a: area, c: cargo, d });
      }
    });
  } catch (err) {
    console.warn('Advertencia al leer pestaña BONO:', err);
  }

  if (hh.length === 0) {
    throw new Error('La pestaña HHEE no contiene filas válidas de horas extras.');
  }

  return { hh, bo };
}

export function exportOvertimeToExcel(
  records: OvertimeRecord[],
  bonusRecords: BonusRecord[],
  fileName: string = 'HHEE_Export_STOL.xlsx'
) {
  const wb = XLSX.utils.book_new();

  const hhData = records.map((r) => ({
    Fecha: excelSerialToIso(r.f),
    Semana: r.w || '',
    Area: r.a,
    Cargo: r.c,
    'Horas Extras': r.h,
    Tipo: r.x === 1 ? 'Dominical / Feriado' : 'Ordinaria',
  }));

  const boData = bonusRecords.map((b) => ({
    Area: b.a,
    Cargo: b.c,
    'Dias de Bono': b.d,
  }));

  const wsHHEE = XLSX.utils.json_to_sheet(hhData);
  const wsBONO = XLSX.utils.json_to_sheet(boData);

  XLSX.utils.book_append_sheet(wb, wsHHEE, 'HHEE');
  XLSX.utils.book_append_sheet(wb, wsBONO, 'BONO');

  XLSX.writeFile(wb, fileName);
}
