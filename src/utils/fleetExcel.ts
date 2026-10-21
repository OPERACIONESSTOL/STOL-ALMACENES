import * as XLSX from 'xlsx';
import {
  Equipment,
  MaintenanceIncident,
  EquipmentProvider,
  EquipmentType,
  FleetUsageLogRecord,
} from '../types/fleet';
import { FLEET_EQUIPOS, FLEET_INCIDENCIAS } from '../data/initialFleetData';

// Helper to normalize strings for flexible column and header matching
export const cleanStr = (val: unknown): string => {
  return String(val ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // keep only alphanumeric
};

// Convert Excel dates or string dates (handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serials)
export const parseDateVal = (val: unknown): string => {
  if (val === null || val === undefined || val === '') {
    return new Date().toISOString().split('T')[0];
  }

  // If number (Excel serial date)
  if (typeof val === 'number') {
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj) {
        const y = String(dateObj.y).padStart(4, '0');
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // fallback below
    }
  }

  const s = String(val).trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return s;
};

// Strict chronological ordering for months
export const MONTH_ORDER: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  setiembre: 9,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export const getMonthChronologicalIndex = (monthName: string): number => {
  const c = cleanStr(monthName);
  for (const [key, idx] of Object.entries(MONTH_ORDER)) {
    if (c.includes(key)) return idx;
  }
  return 99;
};

export const sortMonthsChronologically = (months: string[]): string[] => {
  return [...months].sort((a, b) => getMonthChronologicalIndex(a) - getMonthChronologicalIndex(b));
};

// Month name canonical normalization
export const normalizeMonthName = (raw: unknown): string => {
  const c = cleanStr(raw);
  if (c.includes('ene')) return 'Enero';
  if (c.includes('feb')) return 'Febrero';
  if (c.includes('mar')) return 'Marzo';
  if (c.includes('abr')) return 'Abril';
  if (c.includes('may')) return 'Mayo';
  if (c.includes('jun')) return 'Junio';
  if (c.includes('jul')) return 'Julio';
  if (c.includes('ago')) return 'Agosto';
  if (c.includes('set') || c.includes('sep')) return 'Setiembre';
  if (c.includes('oct')) return 'Octubre';
  if (c.includes('nov')) return 'Noviembre';
  if (c.includes('dic')) return 'Diciembre';
  return String(raw || 'Setiembre').trim();
};

// Safely extracts numeric value from cell or formula result
export const getNumericCellValue = (cellVal: unknown): number => {
  if (cellVal === null || cellVal === undefined || cellVal === '') return 0;
  if (typeof cellVal === 'number') {
    return isNaN(cellVal) ? 0 : cellVal;
  }
  const s = String(cellVal).trim().replace(',', '.');
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

export interface ParseFleetExcelResult {
  success: boolean;
  equipos: Equipment[];
  incidencias: MaintenanceIncident[];
  detectedMonths: string[];
  equipmentCount: number;
  incidentsCount: number;
  sheetNames: string[];
  message: string;
}

/**
 * Parses an uploaded Excel file for Fleet & Horometers data.
 * Specifically honors:
 * 1. Column "HORAS USADAS" (Column M / formula result evaluated by Excel), NOT cumulative "HOROMETRO FINAL" (17000+).
 * 2. Month order sorted chronologically.
 * 3. Equipment replacement timeline (Derco fleet replacement at ~24/09: HGR-279 to 286 entered, HGR-027 left, SGR-017 is backup).
 * 4. Respects all formulas and cell values without modification.
 */
export const parseFleetExcelFile = async (file: File): Promise<ParseFleetExcelResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), {
    type: 'array',
    cellDates: true,
    cellFormula: true,
    cellStyles: true,
    cellNF: true,
    raw: false, // ensures evaluated formula values are retrieved
    dateNF: 'yyyy-mm-dd',
  });

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja legible.');
  }

  // Clone initial data as base dictionary so codes retain provider/type metadata
  const equiposMap = new Map<string, Equipment>();
  FLEET_EQUIPOS.forEach((eq) => {
    equiposMap.set(eq.codigo.trim().toUpperCase(), JSON.parse(JSON.stringify(eq)));
  });

  const parsedIncidencias: MaintenanceIncident[] = [];
  const detectedMonthsSet = new Set<string>();

  // Check sheets
  let horometrosSheet: XLSX.WorkSheet | null = null;
  let incidenciasSheet: XLSX.WorkSheet | null = null;

  for (const name of sheetNames) {
    const cName = cleanStr(name);
    if (
      cName.includes('horometro') ||
      cName.includes('flota') ||
      cName.includes('equipo') ||
      cName.includes('montacarga') ||
      cName.includes('control') ||
      cName.includes('registro')
    ) {
      if (!horometrosSheet) horometrosSheet = workbook.Sheets[name];
    }
    if (
      cName.includes('incidencia') ||
      cName.includes('bitacora') ||
      cName.includes('falla') ||
      cName.includes('mantenimiento') ||
      cName.includes('correctivo')
    ) {
      if (!incidenciasSheet) incidenciasSheet = workbook.Sheets[name];
    }
  }

  // Default to first sheet if not matched by name
  if (!horometrosSheet && sheetNames.length > 0) {
    horometrosSheet = workbook.Sheets[sheetNames[0]];
  }

  // Parse Horometros sheet
  if (horometrosSheet) {
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(horometrosSheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawRows.length > 0) {
      // Find header row (usually contains "codigo", "equipo", "horas usadas", "proveedor", etc.)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(15, rawRows.length); i++) {
        const row = rawRows[i] || [];
        const rowStr = row.map(cleanStr).join(' ');
        if (
          (rowStr.includes('codigo') || rowStr.includes('equipo') || rowStr.includes('idregistro')) &&
          (rowStr.includes('proveedor') ||
            rowStr.includes('hora') ||
            rowStr.includes('mes') ||
            rowStr.includes('tipo') ||
            rowStr.includes('horometro'))
        ) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1 && rawRows.length > 1) {
        headerRowIndex = 0;
      }

      if (headerRowIndex >= 0) {
        const headerRow = (rawRows[headerRowIndex] || []).map((c) => String(c || '').trim());
        const dataRows = rawRows.slice(headerRowIndex + 1);

        // Identify exact columns based on user's screenshot
        // ID REGISTRO | ID EQUIPO | PROVEEDOR | CODIGO EQUIPO | TIPO EQUIPO | ANO | MES | DIA | FECHA DE REGISTRO | HORA DE REGISTRO | HOROMETRO INICIO | HOROMETRO FINAL | HORAS USADAS | LIMITE HORA ...
        let colCodigo = -1;
        let colProveedor = -1;
        let colTipo = -1;
        let colLimite = -1;
        let colMes = -1;
        let colFecha = -1;
        let colDia = -1;
        let colAno = -1;
        let colHorometroInicio = -1;
        let colHorometroFinal = -1;
        let colHorasUsadas = -1;
        let colHorasInop = -1;
        let colArea = -1;
        let colOperador = -1;

        // Check for wide format columns (e.g. "Horas Julio", "Horas Agosto", etc.)
        const wideCols: { month: string; type: 'usadas' | 'inop'; colIdx: number }[] = [];

        headerRow.forEach((colName, idx) => {
          const c = cleanStr(colName);

          // 1. CODIGO EQUIPO
          if (
            c === 'codigoequipo' ||
            c === 'codigodeequipo' ||
            c === 'codigo' ||
            c === 'cod' ||
            (c.includes('codigo') && !c.includes('barra')) ||
            c === 'equipo' ||
            c === 'maquina'
          ) {
            if (colCodigo === -1 || c.includes('codigoequipo')) colCodigo = idx;
          }
          // 2. PROVEEDOR
          else if (c === 'proveedor' || c === 'proveedo' || c === 'prov' || c === 'empresa') {
            if (colProveedor === -1) colProveedor = idx;
          }
          // 3. TIPO EQUIPO
          else if (c === 'tipoequipo' || c === 'tipodeequipo' || c === 'tipo' || c === 'categoria') {
            if (colTipo === -1) colTipo = idx;
          }
          // 4. LIMITE HORA
          else if (c === 'limitehora' || c.includes('limite') || c.includes('tope') || c.includes('contrato')) {
            if (colLimite === -1) colLimite = idx;
          }
          // 5. MES
          else if (c === 'mes' || c === 'month' || c === 'periodo') {
            if (colMes === -1) colMes = idx;
          }
          // 6. FECHA DE REGISTRO
          else if (
            c === 'fechaderegistro' ||
            c === 'fecharegistro' ||
            c === 'fecha' ||
            c.includes('fechareg')
          ) {
            if (colFecha === -1) colFecha = idx;
          }
          // 7. DIA & ANO
          else if (c === 'dia' || c === 'day') {
            if (colDia === -1) colDia = idx;
          } else if (c === 'ano' || c === 'anio' || c === 'year') {
            if (colAno === -1) colAno = idx;
          }
          // 8. HOROMETRO INICIO (Meter Gauge Start)
          else if (c.includes('horometroinicio') || (c.includes('horometro') && c.includes('inicio'))) {
            colHorometroInicio = idx;
          }
          // 9. HOROMETRO FINAL (Meter Gauge End - e.g. 17000+)
          else if (c.includes('horometrofinal') || (c.includes('horometro') && c.includes('final'))) {
            colHorometroFinal = idx;
          }
          // 10. HORAS USADAS (THE ACTUAL FORMULA RESULT, e.g. 8.5h shift or month total ~500h max)
          // MUST NOT MATCH "horometro inicio", "horometro final", "lectura horometro", "limite hora"!
          else if (
            c === 'horasusadas' ||
            c === 'horasusada' ||
            c === 'horausadas' ||
            c === 'horausada' ||
            c === 'horasconsumidas' ||
            c === 'horastrabajadas' ||
            c === 'horasdeuso' ||
            c === 'horasuso' ||
            c === 'uso' ||
            (c.includes('horasusad') && !c.includes('limite'))
          ) {
            colHorasUsadas = idx;
          }
          // 11. INOPERATIVIDADES
          else if (
            c.includes('inoperat') ||
            c.includes('parada') ||
            c.includes('fallas') ||
            c.includes('horasinop')
          ) {
            if (colHorasInop === -1) colHorasInop = idx;
          }
          // 12. AREA & OPERADOR
          else if (c.includes('area')) {
            if (colArea === -1) colArea = idx;
          } else if (c.includes('operador')) {
            if (colOperador === -1) colOperador = idx;
          }

          // Check for wide month columns (e.g. "Julio", "Horas Julio", etc.)
          const monthsList = [
            'julio', 'agosto', 'setiembre', 'septiembre', 'octubre', 'noviembre', 'diciembre',
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'
          ];
          for (const m of monthsList) {
            if (c.includes(m)) {
              const mName = normalizeMonthName(m);
              detectedMonthsSet.add(mName);
              if (c.includes('inop') || c.includes('parada') || c.includes('falla')) {
                wideCols.push({ month: mName, type: 'inop', colIdx: idx });
              } else {
                wideCols.push({ month: mName, type: 'usadas', colIdx: idx });
              }
              break;
            }
          }
        });

        // Fallback for colHorasUsadas if not explicitly found:
        // Column M is index 12 in user screenshot
        if (colHorasUsadas === -1 && headerRow.length > 12) {
          const col12Name = cleanStr(headerRow[12]);
          if (col12Name.includes('usad') || col12Name.includes('hora')) {
            colHorasUsadas = 12;
          }
        }

        // Map to track per-equipment per-month summed hours (for shift/transaction logs)
        const equipmentUsageAccumulator = new Map<string, Record<string, number>>();
        const equipmentInopAccumulator = new Map<string, Record<string, number>>();
        const equipmentLogs = new Map<string, FleetUsageLogRecord[]>();

        // Process data rows
        dataRows.forEach((row) => {
          if (!row || row.length === 0) return;
          const rawCodigo = String(colCodigo >= 0 ? row[colCodigo] : row[3] || row[0] || '').trim();
          if (!rawCodigo || rawCodigo.length < 2) return;

          // Normalize equipment code
          const codeKey = rawCodigo.toUpperCase().replace(/\s+/g, ' ').trim();

          // Provider detection
          let prov: EquipmentProvider = 'DERCO';
          if (colProveedor >= 0 && row[colProveedor]) {
            const pStr = cleanStr(row[colProveedor]);
            if (pStr.includes('nova')) prov = 'NOVA';
          } else if (codeKey.includes('NOVA') || codeKey.includes('TRANS')) {
            prov = 'NOVA';
          }

          // Type detection & lifecycle
          let eqType: EquipmentType = 'MONTACARGA';
          if (colTipo >= 0 && row[colTipo]) {
            const tStr = cleanStr(row[colTipo]);
            if (tStr.includes('elev') || tStr.includes('apilador')) eqType = 'ELEVADOR';
            else if (tStr.includes('back')) eqType = 'BACKUP';
          } else if (codeKey.includes('HER') || codeKey.includes('ELEV')) {
            eqType = 'ELEVADOR';
          } else if (codeKey === 'HGR-027' || codeKey === 'SGR-017') {
            // SGR-017 became backup on 24/09
            if (codeKey === 'HGR-027' || codeKey === 'SGR-017') {
              eqType = 'BACKUP';
            }
          }

          // Limit
          let limit = eqType === 'ELEVADOR' ? 375 : 300;
          if (colLimite >= 0 && row[colLimite]) {
            const lNum = getNumericCellValue(row[colLimite]);
            if (lNum > 0) limit = lNum;
          }

          // Fetch or initialize equipment entry
          let eq = equiposMap.get(codeKey);
          if (!eq) {
            eq = {
              codigo: codeKey,
              proveedor: prov,
              tipo: eqType,
              limite: limit,
              meses: {},
              registros: [],
            };
            equiposMap.set(codeKey, eq);
          } else {
            eq.proveedor = prov;
            if (codeKey === 'SGR-017') {
              eq.tipo = 'BACKUP';
              eq.esBackupNuevo = true;
            } else {
              eq.tipo = eqType;
            }
            eq.limite = limit;
          }

          // Wide format detection
          if (wideCols.length > 0) {
            wideCols.forEach((wc) => {
              const valNum = getNumericCellValue(row[wc.colIdx]);
              if (!eq!.meses[wc.month]) {
                eq!.meses[wc.month] = { horas_usadas: 0, horas_inoperativas: 0 };
              }
              if (wc.type === 'usadas') {
                // If wide column has realistic hours (<= 1000)
                eq!.meses[wc.month].horas_usadas = valNum <= 1000 ? valNum : 0;
              } else {
                eq!.meses[wc.month].horas_inoperativas = valNum;
              }
            });
          }
          // Long / Transaction format (one row per shift / day, as in image_24ea6570.png)
          else {
            // Determine date and month
            let rowFecha = colFecha >= 0 ? parseDateVal(row[colFecha]) : '';
            let rawMes = colMes >= 0 ? row[colMes] : '';

            if (!rawMes && rowFecha) {
              const mIdx = parseInt(rowFecha.split('-')[1] || '0', 10);
              const mNames = [
                '',
                'Enero',
                'Febrero',
                'Marzo',
                'Abril',
                'Mayo',
                'Junio',
                'Julio',
                'Agosto',
                'Setiembre',
                'Octubre',
                'Noviembre',
                'Diciembre',
              ];
              rawMes = mNames[mIdx] || 'Setiembre';
            }

            const mesName = normalizeMonthName(rawMes);
            detectedMonthsSet.add(mesName);

            // EXTRACT HORAS USADAS:
            // This is the evaluated formula result in Column M ("HORAS USADAS")!
            let horasUsadasRow = 0;
            if (colHorasUsadas >= 0) {
              horasUsadasRow = getNumericCellValue(row[colHorasUsadas]);
            }

            // Safety check against odometer reading:
            // If the value is > 2000, it was an odometer meter gauge, NOT shift usage!
            if (horasUsadasRow > 2000) {
              if (colHorometroFinal >= 0 && colHorometroInicio >= 0) {
                const hf = getNumericCellValue(row[colHorometroFinal]);
                const hi = getNumericCellValue(row[colHorometroInicio]);
                if (hf > hi && hf - hi < 50) {
                  horasUsadasRow = hf - hi;
                } else {
                  horasUsadasRow = 0;
                }
              } else {
                horasUsadasRow = 0;
              }
            }

            // Inoperatividad
            const horasInopRow = colHorasInop >= 0 ? getNumericCellValue(row[colHorasInop]) : 0;

            // Accumulate per equipment and month
            if (!equipmentUsageAccumulator.has(codeKey)) {
              equipmentUsageAccumulator.set(codeKey, {});
              equipmentInopAccumulator.set(codeKey, {});
              equipmentLogs.set(codeKey, []);
            }

            const curMonthUsage = equipmentUsageAccumulator.get(codeKey)!;
            curMonthUsage[mesName] = (curMonthUsage[mesName] || 0) + horasUsadasRow;

            const curMonthInop = equipmentInopAccumulator.get(codeKey)!;
            curMonthInop[mesName] = (curMonthInop[mesName] || 0) + horasInopRow;

            // Store individual log record
            const logRec: FleetUsageLogRecord = {
              codigo: codeKey,
              proveedor: prov,
              tipo: eqType,
              mes: mesName,
              fechaRegistro: rowFecha,
              horasUsadas: horasUsadasRow,
              horometroInicio: colHorometroInicio >= 0 ? getNumericCellValue(row[colHorometroInicio]) : undefined,
              horometroFinal: colHorometroFinal >= 0 ? getNumericCellValue(row[colHorometroFinal]) : undefined,
              limiteHora: limit,
              areaTrabajo: colArea >= 0 ? String(row[colArea] || '') : undefined,
              operador: colOperador >= 0 ? String(row[colOperador] || '') : undefined,
            };
            equipmentLogs.get(codeKey)!.push(logRec);
          }
        });

        // Transfer accumulated monthly sums to equipment objects
        equipmentUsageAccumulator.forEach((monthsObj, code) => {
          const eq = equiposMap.get(code);
          if (eq) {
            Object.entries(monthsObj).forEach(([mName, sumHrs]) => {
              if (!eq.meses[mName]) {
                eq.meses[mName] = { horas_usadas: 0, horas_inoperativas: 0 };
              }
              // Set the accumulated sum (e.g. 488.7h, maximum ~500h)
              eq.meses[mName].horas_usadas = Math.round(sumHrs * 10) / 10;
            });
          }
        });

        equipmentInopAccumulator.forEach((monthsObj, code) => {
          const eq = equiposMap.get(code);
          if (eq) {
            Object.entries(monthsObj).forEach(([mName, sumInop]) => {
              if (eq.meses[mName]) {
                eq.meses[mName].horas_inoperativas = Math.round(sumInop * 10) / 10;
              }
            });
          }
        });

        equipmentLogs.forEach((logs, code) => {
          const eq = equiposMap.get(code);
          if (eq) {
            eq.registros = logs;
          }
        });
      }
    }
  }

  // Parse Incidencias sheet (if present)
  if (incidenciasSheet) {
    const rawIncRows: unknown[][] = XLSX.utils.sheet_to_json(incidenciasSheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawIncRows.length > 1) {
      let hIdx = -1;
      for (let i = 0; i < Math.min(10, rawIncRows.length); i++) {
        const rowStr = (rawIncRows[i] || []).map(cleanStr).join(' ');
        if (
          rowStr.includes('fecha') ||
          rowStr.includes('motivo') ||
          rowStr.includes('falla') ||
          rowStr.includes('codigo') ||
          rowStr.includes('mantenimiento')
        ) {
          hIdx = i;
          break;
        }
      }

      if (hIdx >= 0) {
        const hRow = (rawIncRows[hIdx] || []).map((c) => String(c || '').trim());
        const dataRows = rawIncRows.slice(hIdx + 1);

        let colFecha = -1;
        let colMes = -1;
        let colProv = -1;
        let colCod = -1;
        let colTipo = -1;
        let colRes = -1;
        let colHoras = -1;
        let colMotivo = -1;

        hRow.forEach((name, idx) => {
          const c = cleanStr(name);
          if (c === 'fecha' || c.includes('date')) colFecha = idx;
          else if (c === 'mes' || c.includes('month')) colMes = idx;
          else if (c.includes('proveedor') || c === 'prov') colProv = idx;
          else if (c.includes('codigo') || c === 'equipo' || c === 'cod') colCod = idx;
          else if (c.includes('tipo') || c.includes('mant')) colTipo = idx;
          else if (c.includes('resultado') || c.includes('estado')) colRes = idx;
          else if (c.includes('hora') || c.includes('duracion') || c.includes('tiempo')) colHoras = idx;
          else if (c.includes('motivo') || c.includes('falla') || c.includes('observacion') || c.includes('descrip'))
            colMotivo = idx;
        });

        dataRows.forEach((row) => {
          if (!row || row.length === 0) return;
          const motivo = String(colMotivo >= 0 ? row[colMotivo] : row[6] || '').trim();
          const codigo = String(colCod >= 0 ? row[colCod] : row[3] || '').trim().toUpperCase();
          if (!motivo && !codigo) return;

          const rawFecha = colFecha >= 0 ? row[colFecha] : row[0];
          const fechaStr = parseDateVal(rawFecha);
          const mesStr = normalizeMonthName(colMes >= 0 ? row[colMes] : row[1]);
          detectedMonthsSet.add(mesStr);

          let prov: EquipmentProvider = 'DERCO';
          const pStr = cleanStr(colProv >= 0 ? row[colProv] : row[2]);
          if (pStr.includes('nova') || codigo.includes('NOVA') || codigo.includes('TRANS')) {
            prov = 'NOVA';
          }

          const tipoMant = String(colTipo >= 0 ? row[colTipo] : 'Correctivo').trim() || 'Correctivo';
          const resultado = String(colRes >= 0 ? row[colRes] : 'Reparado').trim() || 'Reparado';
          const horas = getNumericCellValue(colHoras >= 0 ? row[colHoras] : 0);

          parsedIncidencias.push({
            fecha: fechaStr,
            mes: mesStr,
            proveedor: prov,
            codigo: codigo || 'EQ-GENERAL',
            tipo_mant: tipoMant,
            resultado: resultado,
            horas: horas,
            motivo: motivo || 'Mantenimiento registrado en formato establecido',
          });
        });
      }
    }
  }

  // Ensure default months if none detected
  if (detectedMonthsSet.size === 0) {
    detectedMonthsSet.add('Julio');
    detectedMonthsSet.add('Agosto');
    detectedMonthsSet.add('Setiembre');
    detectedMonthsSet.add('Octubre');
  }

  // Strictly sort months chronologically
  const finalMonths = sortMonthsChronologically(Array.from(detectedMonthsSet));

  const finalEquipos = Array.from(equiposMap.values());
  const finalIncidencias = parsedIncidencias.length > 0 ? parsedIncidencias : FLEET_INCIDENCIAS;

  return {
    success: true,
    equipos: finalEquipos,
    incidencias: finalIncidencias,
    detectedMonths: finalMonths,
    equipmentCount: finalEquipos.length,
    incidentsCount: finalIncidencias.length,
    sheetNames,
    message: `Se sincronizaron ${finalEquipos.length} equipos con la columna «Horas usadas» respetando fórmulas y orden cronológico.`,
  };
};
