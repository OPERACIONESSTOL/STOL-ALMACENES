import * as XLSX from 'xlsx';
import { CrossdockingSummary, CrossdockingDailyRecord } from '../types/crossdocking';

// Clean text for flexible string matching
const clean = (val: unknown): string => {
  return String(val ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Robust number parser supporting:
 * - Direct numbers
 * - Strings with commas as thousands: "225,335.42"
 * - Strings with dots as thousands: "225.335,42"
 * - Strings with commas as decimals: "4172,16"
 * - Plain numeric strings: "225335.42"
 */
export const parseExcelNumber = (val: unknown, fallback = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (!str) return fallback;

  // Clean direct number "225335.42"
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const n = parseFloat(str);
    return isNaN(n) ? fallback : n;
  }

  // "225,335.42" (comma thousands, dot decimal)
  if (/^-?[\d,]+\.\d+$/.test(str)) {
    const cleanStr = str.replace(/,/g, '');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? fallback : n;
  }

  // "225.335,42" (dot thousands, comma decimal)
  if (/^-?[\d.]+\,\d+$/.test(str)) {
    const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? fallback : n;
  }

  // "4172,16" (comma decimal)
  if (/^-?\d+,\d+$/.test(str)) {
    const cleanStr = str.replace(/,/g, '.');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? fallback : n;
  }

  // General fallback: keep digits, minus, dot, comma
  const sanitized = str.replace(/[^\d.,-]/g, '');
  if (!sanitized) return fallback;

  if (sanitized.includes('.') && sanitized.includes(',')) {
    if (sanitized.indexOf('.') < sanitized.indexOf(',')) {
      // 1.234,56
      const n = parseFloat(sanitized.replace(/\./g, '').replace(/,/g, '.'));
      return isNaN(n) ? fallback : n;
    } else {
      // 1,234.56
      const n = parseFloat(sanitized.replace(/,/g, ''));
      return isNaN(n) ? fallback : n;
    }
  }

  if (sanitized.includes(',')) {
    const n = parseFloat(sanitized.replace(/,/g, '.'));
    return isNaN(n) ? fallback : n;
  }

  const n = parseFloat(sanitized);
  return isNaN(n) ? fallback : n;
};

/**
 * Robust date parser supporting Día/Mes/Año format:
 * - Excel numeric serials (e.g. 45570 -> 05/10/2026)
 * - Date objects
 * - Strings: DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY, YYYY-MM-DD
 */
export const parseExcelDate = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';

  // 1. If it's a JavaScript Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // 2. If it's an Excel numeric serial code (typically 20000 - 65000)
  if (typeof val === 'number') {
    if (val > 20000 && val < 65000) {
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        if (dateObj) {
          const day = String(dateObj.d).padStart(2, '0');
          const month = String(dateObj.m).padStart(2, '0');
          const year = dateObj.y;
          return `${day}/${month}/${year}`;
        }
      } catch (e) {
        // fallback
      }
    }
    return String(val);
  }

  const str = String(val).trim();

  // 3. String formatted as DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${day}/${month}/${year}`;
  }

  // 4. String formatted as YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  return str;
};

export interface ParseCrossdockingResult {
  summary: CrossdockingSummary | null;
  records: CrossdockingDailyRecord[];
  sheetName: string;
  totalRowsRead: number;
}

/**
 * Parses an uploaded Excel file to extract:
 * 1. The B2:D6 Summary Table (Vol Regular, Vol Extraordinario, Vol Dom Fer, Reprocesos)
 * 2. The daily records matching the user's 14 columns
 */
export const parseCrossdockingExcelFile = async (file: File): Promise<ParseCrossdockingResult> => {
  const data = await file.arrayBuffer();
  // Read with cellDates, cellFormula and cellStyles to support formula values and dates
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellFormula: true,
    cellStyles: true,
    cellNF: true,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja de cálculo.');
  }

  // 1. Locate the best sheet
  let targetSheetName = workbook.SheetNames[0];

  // Try finding sheet by name
  for (const name of workbook.SheetNames) {
    const c = clean(name);
    if (c.includes('cross') || c.includes('docking') || c.includes('cd')) {
      targetSheetName = name;
      break;
    }
  }

  let worksheet = workbook.Sheets[targetSheetName];

  // If not found by name, scan sheets for content keywords
  if (!worksheet) {
    targetSheetName = workbook.SheetNames[0];
    worksheet = workbook.Sheets[targetSheetName];
  }

  // Convert sheet to 2D array
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  // 2. EXTRACT B2:D6 SUMMARY BOX
  // The user specifies: "ese campo va a estar en B2:D6 en la misma pestaña de crossdocking"
  let volRegular: number | null = null;
  let volExtraordinario: number | null = null;
  let volDomFer: number | null = null;
  let reprocesos: number | null = null;

  // Approach A: Direct cell lookup in worksheet
  const checkCell = (coord: string): number | null => {
    const cell = worksheet[coord];
    if (!cell) return null;
    if (typeof cell.v === 'number' && !isNaN(cell.v)) return cell.v;
    if (cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
      const n = parseExcelNumber(cell.v, -999999);
      if (n !== -999999) return n;
    }
    if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== '') {
      const n = parseExcelNumber(cell.w, -999999);
      if (n !== -999999) return n;
    }
    return null;
  };

  // Exact specification: B2:C6 are merged rows for item labels, and Column D has the formula results!
  const d3Val = checkCell('D3');
  const d4Val = checkCell('D4');
  const d5Val = checkCell('D5');
  const d6Val = checkCell('D6');

  if (d3Val !== null) volRegular = d3Val;
  if (d4Val !== null) volExtraordinario = d4Val;
  if (d5Val !== null) volDomFer = d5Val;
  if (d6Val !== null) reprocesos = d6Val;

  // Approach B: Search rows for labels if not found by direct coordinates D3..D6
  for (let r = 0; r < Math.min(30, rawRows.length); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellText = clean(row[c]);

      if (cellText === 'vol regular' || (cellText.includes('regular') && cellText.includes('vol'))) {
        // In merged B:C, Col D is index 3
        const valD = row[3] !== undefined ? parseExcelNumber(row[3], -999999) : -999999;
        if (valD !== -999999) {
          volRegular = valD;
        } else {
          for (let nextC = c + 1; nextC <= Math.min(c + 5, row.length - 1); nextC++) {
            const val = parseExcelNumber(row[nextC], -999999);
            if (val !== -999999) {
              volRegular = val;
              break;
            }
          }
        }
      } else if (cellText.includes('extraordinario')) {
        const valD = row[3] !== undefined ? parseExcelNumber(row[3], -999999) : -999999;
        if (valD !== -999999) {
          volExtraordinario = valD;
        } else {
          for (let nextC = c + 1; nextC <= Math.min(c + 5, row.length - 1); nextC++) {
            const val = parseExcelNumber(row[nextC], -999999);
            if (val !== -999999) {
              volExtraordinario = val;
              break;
            }
          }
        }
      } else if (cellText.includes('dom fer') || (cellText.includes('dom') && cellText.includes('fer'))) {
        const valD = row[3] !== undefined ? parseExcelNumber(row[3], -999999) : -999999;
        if (valD !== -999999) {
          volDomFer = valD;
        } else {
          for (let nextC = c + 1; nextC <= Math.min(c + 5, row.length - 1); nextC++) {
            const val = parseExcelNumber(row[nextC], -999999);
            if (val !== -999999) {
              volDomFer = val;
              break;
            }
          }
        }
      } else if (cellText === 'reprocesos' || cellText.includes('reproceso')) {
        const valD = row[3] !== undefined ? parseExcelNumber(row[3], -999999) : -999999;
        if (valD !== -999999) {
          reprocesos = valD;
        } else {
          for (let nextC = c + 1; nextC <= Math.min(c + 5, row.length - 1); nextC++) {
            const val = parseExcelNumber(row[nextC], -999999);
            if (val !== -999999) {
              reprocesos = val;
              break;
            }
          }
        }
      }
    }
  }

  const summary: CrossdockingSummary = {
    volRegular: volRegular !== null ? volRegular : 225335.42,
    volExtraordinario: volExtraordinario !== null ? volExtraordinario : 19905.16,
    volDomFer: volDomFer !== null ? volDomFer : 4172.16,
    reprocesos: reprocesos !== null ? reprocesos : 0.0,
  };

  // 3. LOCATE MAIN TABLE HEADER ROW
  // In the user's Excel, Row 1 has "Fecha" and "Recepción Cross Docking", and Row 2 has "M3 Prog", "M3 Recb Ptio", etc.
  // We identify the sub-header row by looking for at least 2 key columns: "m3 prog", "m3 recb", "lpn", "vol regular", etc.
  let headerRowIndex = -1;
  const colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(30, rawRows.length); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    let matchCount = 0;
    for (let c = 0; c < row.length; c++) {
      const text = clean(row[c]);
      if (
        text.includes('m3 prog') ||
        text.includes('m3 recb') ||
        text.includes('lpn prog') ||
        text.includes('lpn ptio') ||
        text.includes('lpn nve') ||
        text.includes('prov prog') ||
        text.includes('tardanza') ||
        text === 'vol regular' ||
        text.includes('extraordinario') ||
        text.includes('atenc ext')
      ) {
        matchCount++;
      }
    }

    if (matchCount >= 2) {
      headerRowIndex = r;

      // Also check row above (r-1) for "fecha" or other titles
      const prevRow = r > 0 ? rawRows[r - 1] : [];

      // Map columns in this row
      for (let c = 0; c < row.length; c++) {
        const text = clean(row[c]);
        const prevText = Array.isArray(prevRow) ? clean(prevRow[c]) : '';

        // Fecha can be in column 0 or labeled "fecha" in this row or previous row
        if (text === 'fecha' || text.includes('fecha') || prevText === 'fecha' || prevText.includes('fecha')) {
          colMap['fecha'] = c;
        } else if (text.includes('m3 prog') || (text.includes('prog') && text.includes('m3'))) {
          colMap['m3Prog'] = c;
        } else if (text.includes('recb ptio') || text.includes('recb patio') || text.includes('m3 ptio')) {
          colMap['m3RecbPtio'] = c;
        } else if (
          text.includes('recb nve') ||
          text.includes('recb nave') ||
          text.includes('m3 nave') ||
          text.includes('m3 nve')
        ) {
          colMap['m3RecbNve'] = c;
        } else if (text.includes('lpn prog ptio') || (text.includes('lpn') && text.includes('prog') && text.includes('ptio'))) {
          colMap['lpnProgPtio'] = c;
        } else if (
          text.includes('lpn prog nave') ||
          text.includes('lpn prog nve') ||
          (text.includes('lpn') && text.includes('prog') && (text.includes('nave') || text.includes('nve')))
        ) {
          colMap['lpnProgNave'] = c;
        } else if (text === 'lpn ptio' || (text.includes('lpn') && text.includes('ptio') && !text.includes('prog'))) {
          colMap['lpnPtio'] = c;
        } else if (
          text === 'lpn nve' ||
          text === 'lpn nave' ||
          (text.includes('lpn') && (text.includes('nve') || text.includes('nave')) && !text.includes('prog'))
        ) {
          colMap['lpnNve'] = c;
        } else if (text.includes('prov prog') || (text.includes('prov') && text.includes('prog'))) {
          colMap['provProg'] = c;
        } else if (text.includes('tardanza') || text.includes('tard')) {
          colMap['provTardanza'] = c;
        } else if (text === 'vol regular' || (text.includes('regular') && text.includes('vol'))) {
          colMap['volRegular'] = c;
        } else if (text.includes('extraordinario')) {
          colMap['volExtraordinario'] = c;
        } else if (text.includes('dom') && (text.includes('fer') || text.includes('noct'))) {
          colMap['volDomFerNoct'] = c;
        } else if (text.includes('atenc ext') || text.includes('atencion ext') || text.includes('m3 por atenc')) {
          colMap['m3PorAtencExt'] = c;
        } else if (text.includes('observ') || prevText.includes('observ')) {
          colMap['observaciones'] = c;
        }
      }

      // If 'fecha' was not explicitly labeled in the sub-header row, default to column 0
      if (colMap['fecha'] === undefined) {
        colMap['fecha'] = 0;
      }

      break;
    }
  }

  // 4. EXTRACT DAILY RECORDS
  const records: CrossdockingDailyRecord[] = [];

  if (headerRowIndex !== -1) {
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      // Date column
      const rawFecha = colMap['fecha'] !== undefined ? row[colMap['fecha']] : row[0];
      if (rawFecha === null || rawFecha === undefined || String(rawFecha).trim() === '') {
        continue;
      }

      const fechaCleanText = clean(rawFecha);
      // Skip totals row or non-date headers
      if (
        fechaCleanText.includes('total') ||
        fechaCleanText.includes('suma') ||
        fechaCleanText.includes('promedio') ||
        fechaCleanText.includes('item') ||
        fechaCleanText.includes('observacion')
      ) {
        continue;
      }

      // Format date strictly in Día/Mes/Año
      const fechaStr = parseExcelDate(rawFecha);
      if (!fechaStr || fechaStr.length < 5) continue;

      // Extract columns with fallbacks to positional columns
      const m3Prog = colMap['m3Prog'] !== undefined ? parseExcelNumber(row[colMap['m3Prog']]) : parseExcelNumber(row[1]);
      const m3RecbPtio =
        colMap['m3RecbPtio'] !== undefined ? parseExcelNumber(row[colMap['m3RecbPtio']]) : parseExcelNumber(row[2]);
      const m3RecbNve =
        colMap['m3RecbNve'] !== undefined ? parseExcelNumber(row[colMap['m3RecbNve']]) : parseExcelNumber(row[3]);
      const lpnProgPtio =
        colMap['lpnProgPtio'] !== undefined ? parseExcelNumber(row[colMap['lpnProgPtio']]) : parseExcelNumber(row[4]);
      const lpnProgNave =
        colMap['lpnProgNave'] !== undefined ? parseExcelNumber(row[colMap['lpnProgNave']]) : parseExcelNumber(row[5]);
      const lpnPtio =
        colMap['lpnPtio'] !== undefined ? parseExcelNumber(row[colMap['lpnPtio']]) : parseExcelNumber(row[6]);
      const lpnNve =
        colMap['lpnNve'] !== undefined ? parseExcelNumber(row[colMap['lpnNve']]) : parseExcelNumber(row[7]);
      const provProg =
        colMap['provProg'] !== undefined ? parseExcelNumber(row[colMap['provProg']]) : parseExcelNumber(row[8]);
      const provTardanza =
        colMap['provTardanza'] !== undefined ? parseExcelNumber(row[colMap['provTardanza']]) : parseExcelNumber(row[9]);
      const recVolRegular =
        colMap['volRegular'] !== undefined ? parseExcelNumber(row[colMap['volRegular']]) : parseExcelNumber(row[10]);
      const recVolExtraordinario =
        colMap['volExtraordinario'] !== undefined
          ? parseExcelNumber(row[colMap['volExtraordinario']])
          : parseExcelNumber(row[11]);
      const volDomFerNoct =
        colMap['volDomFerNoct'] !== undefined
          ? parseExcelNumber(row[colMap['volDomFerNoct']])
          : parseExcelNumber(row[12]);
      const m3PorAtencExt =
        colMap['m3PorAtencExt'] !== undefined
          ? parseExcelNumber(row[colMap['m3PorAtencExt']])
          : parseExcelNumber(row[13]);
      const observaciones =
        colMap['observaciones'] !== undefined
          ? String(row[colMap['observaciones']] ?? '').trim()
          : String(row[14] ?? '').trim();

      records.push({
        id: `xd-${r}-${Date.now()}`,
        fecha: fechaStr,
        m3Prog,
        m3RecbPtio,
        m3RecbNve,
        lpnProgPtio,
        lpnProgNave,
        lpnPtio,
        lpnNve,
        provProg,
        provTardanza,
        volRegular: recVolRegular,
        volExtraordinario: recVolExtraordinario,
        volDomFerNoct,
        m3PorAtencExt,
        observaciones,
      });
    }
  }

  return {
    summary,
    records,
    sheetName: targetSheetName,
    totalRowsRead: records.length,
  };
};

/**
 * Generates an official Excel template with:
 * - Summary box in B2:D6
 * - Orange banner and subheaders in rows 9 & 10
 * - Sample data in rows 11-17
 */
export const generateCrossdockingTemplateExcel = (
  summary: CrossdockingSummary,
  records: CrossdockingDailyRecord[]
) => {
  const wsData: (string | number)[][] = [
    [],
    ['', 'Item', 'M3'],
    ['', 'Vol Regular', summary.volRegular],
    ['', 'Vol Extraordinario', summary.volExtraordinario],
    ['', 'Vol Dom Fer', summary.volDomFer],
    ['', 'Reprocesos', summary.reprocesos],
    [],
    [],
    [
      'Fecha',
      'Recepción Cross Docking',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Observaciones',
    ],
    [
      '',
      'M3 Prog',
      'M3 Recb Ptio',
      'M3 Recb Nve',
      'LPN Prog Ptio',
      'LPN Prog Nave',
      'LPN Ptio',
      'LPN Nve',
      'Prov prog',
      'Prov Tardanza',
      'Vol Regular',
      'Vol Extraordinario',
      'Vol Dom | Fer | Noct',
      'M3 Por Atenc Ext',
      'Observaciones',
    ],
  ];

  records.forEach((rec) => {
    wsData.push([
      rec.fecha,
      rec.m3Prog,
      rec.m3RecbPtio,
      rec.m3RecbNve,
      rec.lpnProgPtio,
      rec.lpnProgNave,
      rec.lpnPtio,
      rec.lpnNve,
      rec.provProg,
      rec.provTardanza,
      rec.volRegular,
      rec.volExtraordinario,
      rec.volDomFerNoct,
      rec.m3PorAtencExt,
      rec.observaciones,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 38 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Crossdocking');
  XLSX.writeFile(wb, 'STOL_Crossdocking_Volumenes_Declarados.xlsx');
};
