import * as XLSX from 'xlsx';
import { SkuMeasurement } from '../types/volumetry';

// Helper to normalize strings for flexible column matching
export const normalizeColumnHeader = (header: unknown): string => {
  return String(header ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^A-Z0-9]/g, '_')     // replace spaces and special chars with underscore
    .replace(/_+/g, '_');
};

// Aliases for each expected field in the SKU Master
const COLUMN_ALIASES: Record<string, string[]> = {
  sku: [
    'SKU',
    'CODIGO_SKU',
    'CODIGO',
    'COD_SKU',
    'ITEM',
    'CODIGO_ITEM',
    'CODIGO_MATERIAL',
    'ID_SKU',
    'COD_ARTICULO',
    'ID',
  ],
  descripcion: [
    'DESCRIPCION',
    'DESCRIPCION_PRODUCTO',
    'PRODUCTO',
    'DETALLE',
    'NOMBRE',
    'NOMBRE_PRODUCTO',
    'ARTICULO',
    'DESCRIPCION_DEL_PRODUCTO',
  ],
  categoria: [
    'CATEGORIA',
    'FAMILIA',
    'SUBFAMILIA',
    'GRUPO',
    'LINEA',
    'TIPO_PRODUCTO',
    'RUBRO',
    'SEGMENTO',
  ],
  proceso: [
    'PROCESO',
    'AREA',
    'ETAPA',
    'ZONA',
    'PUNTO_CONTROL',
    'PROCESO_LOGISTICO',
  ],
  usuario: [
    'USUARIO',
    'AUDITOR',
    'OPERARIO',
    'MEDIDO_POR',
    'RESPONSABLE',
    'OPERADOR',
    'ANALISTA',
  ],
  fecha: [
    'FECHA',
    'DATE',
    'FECHA_MEDICION',
    'FECHA_REGISTRO',
    'DIA',
    'F_MEDICION',
  ],
  largoCm: [
    'LARGO_CM',
    'LARGO',
    'L_CM',
    'LONGITUD_CM',
    'LONGITUD',
    'LARGO_REAL',
    'LARGO_FISICO',
  ],
  anchoCm: [
    'ANCHO_CM',
    'ANCHO',
    'W_CM',
    'PROFUNDIDAD_CM',
    'ANCHO_REAL',
    'ANCHO_FISICO',
  ],
  altoCm: [
    'ALTO_CM',
    'ALTO',
    'H_CM',
    'ALTURA_CM',
    'ALTURA',
    'ALTO_REAL',
    'ALTO_FISICO',
  ],
  pesoKg: [
    'PESO_KG',
    'PESO',
    'PESO_BRUTO_KG',
    'PESO_FISICO',
    'KG',
    'PESO_REAL',
  ],
  masterLargoCm: [
    'MASTER_LARGO_CM',
    'MASTER_LARGO',
    'M_LARGO',
    'LARGO_WMS',
    'LARGO_MAESTRO',
    'WMS_LARGO',
  ],
  masterAnchoCm: [
    'MASTER_ANCHO_CM',
    'MASTER_ANCHO',
    'M_ANCHO',
    'ANCHO_WMS',
    'ANCHO_MAESTRO',
    'WMS_ANCHO',
  ],
  masterAltoCm: [
    'MASTER_ALTO_CM',
    'MASTER_ALTO',
    'M_ALTO',
    'ALTO_WMS',
    'ALTO_MAESTRO',
    'WMS_ALTO',
  ],
  masterPesoKg: [
    'MASTER_PESO_KG',
    'MASTER_PESO',
    'M_PESO',
    'PESO_WMS',
    'PESO_MAESTRO',
    'WMS_PESO',
  ],
  notas: [
    'NOTAS',
    'OBSERVACIONES',
    'COMENTARIOS',
    'NOTAS_AUDITORIA',
    'OBSERVACION',
  ],
};

// Find matching value from raw object row using normalized aliases
const extractFieldValue = (row: Record<string, any>, aliases: string[]): any => {
  const normalizedRowKeys = Object.keys(row).map((k) => ({
    raw: k,
    norm: normalizeColumnHeader(k),
  }));

  for (const alias of aliases) {
    const normAlias = normalizeColumnHeader(alias);
    const matched = normalizedRowKeys.find(
      (k) => k.norm === normAlias || k.norm.includes(normAlias) || normAlias.includes(k.norm)
    );
    if (matched && row[matched.raw] !== undefined && row[matched.raw] !== null && row[matched.raw] !== '') {
      return row[matched.raw];
    }
  }
  return undefined;
};

// Safe number parser
const parseNumeric = (val: any, fallback = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(',', '.').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
};

// Parse Excel serial or string date
export const formatExcelDate = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel serial date to JS Date
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    return dateInfo.toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  return str;
};

export interface ParseSkuMasterResult {
  success: boolean;
  measurements: SkuMeasurement[];
  totalRowsParsed: number;
  criticalDiscrepanciesCount: number;
  minorVariationsCount: number;
  conformeCount: number;
  totalVolumeM3: number;
  sheetName: string;
  errorMessage?: string;
}

/**
 * Parses a loaded XLSX Workbook into SkuMeasurement items
 */
export const parseSkuMasterWorkbook = (workbook: XLSX.WorkBook): ParseSkuMasterResult => {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      success: false,
      measurements: [],
      totalRowsParsed: 0,
      criticalDiscrepanciesCount: 0,
      minorVariationsCount: 0,
      conformeCount: 0,
      totalVolumeM3: 0,
      sheetName: '',
      errorMessage: 'El archivo Excel no contiene hojas de cálculo válidas.',
    };
  }

  // Look for target sheet (MAESTRO, SKUS, MEDICIONES, or 1st sheet)
  const targetSheetName =
    workbook.SheetNames.find((name) => {
      const n = normalizeColumnHeader(name);
      return (
        n.includes('MAESTRO') ||
        n.includes('SKU') ||
        n.includes('MEDICION') ||
        n.includes('VOLUMETRIA') ||
        n.includes('VOLUMEN')
      );
    }) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    return {
      success: false,
      measurements: [],
      totalRowsParsed: 0,
      criticalDiscrepanciesCount: 0,
      minorVariationsCount: 0,
      conformeCount: 0,
      totalVolumeM3: 0,
      sheetName: targetSheetName,
      errorMessage: `No se pudo leer la hoja "${targetSheetName}".`,
    };
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: true,
  });

  if (rawRows.length === 0) {
    return {
      success: false,
      measurements: [],
      totalRowsParsed: 0,
      criticalDiscrepanciesCount: 0,
      minorVariationsCount: 0,
      conformeCount: 0,
      totalVolumeM3: 0,
      sheetName: targetSheetName,
      errorMessage: 'La hoja seleccionada está vacía o no tiene registros de datos.',
    };
  }

  const measurements: SkuMeasurement[] = [];
  let criticalCount = 0;
  let minorCount = 0;
  let conformeCount = 0;
  let totalVolume = 0;

  rawRows.forEach((r, idx) => {
    const rawSku = extractFieldValue(r, COLUMN_ALIASES.sku);
    if (!rawSku) return; // Skip rows without SKU code

    const sku = String(rawSku).trim().toUpperCase();
    const descripcion =
      String(extractFieldValue(r, COLUMN_ALIASES.descripcion) || `Producto ${sku}`).trim();
    const categoria =
      String(extractFieldValue(r, COLUMN_ALIASES.categoria) || 'General').trim();

    const rawProceso = String(extractFieldValue(r, COLUMN_ALIASES.proceso) || 'Recepción').trim();
    let proceso: SkuMeasurement['proceso'] = 'Recepción';
    const normProc = normalizeColumnHeader(rawProceso);
    if (normProc.includes('ALMACEN')) proceso = 'Almacenamiento';
    else if (normProc.includes('DESPACHO')) proceso = 'Despacho';
    else if (normProc.includes('CROSS') || normProc.includes('CDK')) proceso = 'Cross-Docking';
    else if (normProc.includes('AUDIT')) proceso = 'Auditoría';

    const usuario = String(extractFieldValue(r, COLUMN_ALIASES.usuario) || 'Operaciones STOL').trim();
    const fecha = formatExcelDate(extractFieldValue(r, COLUMN_ALIASES.fecha));
    const hora = new Date().toTimeString().split(' ')[0].slice(0, 5);

    // Dimensions
    const largoCm = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.largoCm), 30);
    const anchoCm = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.anchoCm), 25);
    const altoCm = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.altoCm), 20);
    const pesoKg = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.pesoKg), 5);

    // Master Dimensions (WMS)
    let masterLargo = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.masterLargoCm), largoCm);
    let masterAncho = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.masterAnchoCm), anchoCm);
    let masterAlto = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.masterAltoCm), altoCm);
    let masterPeso = parseNumeric(extractFieldValue(r, COLUMN_ALIASES.masterPesoKg), pesoKg);

    // If master is completely 0 or missing, default to actual
    if (masterLargo <= 0) masterLargo = largoCm;
    if (masterAncho <= 0) masterAncho = anchoCm;
    if (masterAlto <= 0) masterAlto = altoCm;
    if (masterPeso <= 0) masterPeso = pesoKg;

    // Calculate volumes in m3 (1 m3 = 1,000,000 cm3)
    const actualVol = parseFloat(((largoCm * anchoCm * altoCm) / 1000000).toFixed(4));
    const masterVol = parseFloat(((masterLargo * masterAncho * masterAlto) / 1000000).toFixed(4));

    // Calculate variation percentage
    const diffPct =
      masterVol > 0
        ? parseFloat((Math.abs((actualVol - masterVol) / masterVol) * 100).toFixed(1))
        : 0;

    let estado: SkuMeasurement['estado'] = 'Conforme';
    if (diffPct > 15) {
      estado = 'Discrepancia Crítica';
      criticalCount++;
    } else if (diffPct > 5) {
      estado = 'Variación Menor';
      minorCount++;
    } else {
      conformeCount++;
    }

    const notas = extractFieldValue(r, COLUMN_ALIASES.notas);

    totalVolume += actualVol;

    measurements.push({
      id: `MED-IMP-${(idx + 1).toString().padStart(4, '0')}`,
      sku,
      descripcion,
      categoria,
      usuario,
      proceso,
      fecha,
      hora,
      timestamp: Date.now() - idx * 60000,
      largoCm,
      anchoCm,
      altoCm,
      pesoKg,
      volumenM3: actualVol,
      masterLargoCm: masterLargo,
      masterAnchoCm: masterAncho,
      masterAltoCm: masterAlto,
      masterPesoKg: masterPeso,
      masterVolumenM3: masterVol,
      variacionVolPct: diffPct,
      estado,
      notasAuditoria: notas ? String(notas) : diffPct > 15 ? 'Discrepancia detectada en importación masiva.' : undefined,
    });
  });

  return {
    success: measurements.length > 0,
    measurements,
    totalRowsParsed: measurements.length,
    criticalDiscrepanciesCount: criticalCount,
    minorVariationsCount: minorCount,
    conformeCount,
    totalVolumeM3: parseFloat(totalVolume.toFixed(2)),
    sheetName: targetSheetName,
    errorMessage: measurements.length === 0 ? 'No se encontraron filas con código SKU válido.' : undefined,
  };
};

/**
 * Reads and parses an uploaded File (.xlsx, .xls, .csv)
 */
export const parseSkuMasterFile = async (file: File): Promise<ParseSkuMasterResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({
            success: false,
            measurements: [],
            totalRowsParsed: 0,
            criticalDiscrepanciesCount: 0,
            minorVariationsCount: 0,
            conformeCount: 0,
            totalVolumeM3: 0,
            sheetName: '',
            errorMessage: 'No se pudo leer el contenido del archivo.',
          });
          return;
        }

        const workbook = XLSX.read(buffer, {
          type: 'binary',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });

        const result = parseSkuMasterWorkbook(workbook);
        resolve(result);
      } catch (err: any) {
        resolve({
          success: false,
          measurements: [],
          totalRowsParsed: 0,
          criticalDiscrepanciesCount: 0,
          minorVariationsCount: 0,
          conformeCount: 0,
          totalVolumeM3: 0,
          sheetName: '',
          errorMessage: `Error procesando Excel: ${err?.message || 'Formato no soportado'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        measurements: [],
        totalRowsParsed: 0,
        criticalDiscrepanciesCount: 0,
        minorVariationsCount: 0,
        conformeCount: 0,
        totalVolumeM3: 0,
        sheetName: '',
        errorMessage: 'Error de lectura de archivo en el navegador.',
      });
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Fetches and parses an Excel file from an online URL (e.g. corporate public folder, cloud shared link)
 */
export const fetchAndParseSkuMasterFromUrl = async (url: string): Promise<ParseSkuMasterResult> => {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('La URL está vacía.');
    }

    // Transform OneDrive / SharePoint / Google Drive URLs to direct download links if necessary
    let directUrl = cleanUrl;
    if (cleanUrl.includes('drive.google.com') && cleanUrl.includes('/d/')) {
      const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        directUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    } else if (cleanUrl.includes('onedrive.live.com') && !cleanUrl.includes('download=1')) {
      directUrl = cleanUrl.includes('?') ? `${cleanUrl}&download=1` : `${cleanUrl}?download=1`;
    }

    const response = await fetch(directUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error de red al consultar el archivo (${response.status}: ${response.statusText})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
    });

    return parseSkuMasterWorkbook(workbook);
  } catch (err: any) {
    return {
      success: false,
      measurements: [],
      totalRowsParsed: 0,
      criticalDiscrepanciesCount: 0,
      minorVariationsCount: 0,
      conformeCount: 0,
      totalVolumeM3: 0,
      sheetName: '',
      errorMessage:
        err?.message ||
        'No se pudo conectar a la carpeta pública o URL configurada. Verifique permisos o use la subida directa.',
    };
  }
};

/**
 * Generates an official Excel template for operations to maintain their daily SKU Master
 */
export const downloadOfficialSkuMasterTemplate = () => {
  const headers = [
    'SKU',
    'DESCRIPCION',
    'CATEGORIA',
    'PROCESO',
    'USUARIO',
    'FECHA',
    'LARGO_CM',
    'ANCHO_CM',
    'ALTO_CM',
    'PESO_KG',
    'MASTER_LARGO_CM',
    'MASTER_ANCHO_CM',
    'MASTER_ALTO_CM',
    'MASTER_PESO_KG',
    'NOTAS_AUDITORIA',
  ];

  const sampleRows = [
    [
      'SKU-LOG-4091',
      'Caja Master Aceite Industrial 20L x 2',
      'Líquidos e Insumos',
      'Recepción',
      'Carlos Ramos',
      new Date().toISOString().split('T')[0],
      42.0,
      31.5,
      38.0,
      19.8,
      42.0,
      31.0,
      38.0,
      19.5,
      'Conforme con ficha de rampa',
    ],
    [
      'SKU-ALM-8820',
      'Pallet Bulto Filtros de Aire Alta Densidad',
      'Repuestos Automotrices',
      'Almacenamiento',
      'Andrea Mendoza',
      new Date().toISOString().split('T')[0],
      65.0,
      45.0,
      52.0,
      14.2,
      58.0,
      40.0,
      45.0,
      12.0,
      'Sobredimensión por cambio de empaque',
    ],
    [
      'SKU-DSP-1194',
      'Empaque Corrugado Válvulas Hidráulicas x 12',
      'Ferretería & Maquinaria',
      'Despacho',
      'Luis Paredes',
      new Date().toISOString().split('T')[0],
      35.0,
      25.0,
      20.0,
      8.5,
      35.0,
      25.0,
      20.0,
      8.4,
      'Medido en línea de embalaje',
    ],
    [
      'SKU-REC-5521',
      'Caja Baterías de Ciclo Profundo AGM 12V',
      'Energía & Baterías',
      'Recepción',
      'Pamela Torres',
      new Date().toISOString().split('T')[0],
      38.0,
      28.0,
      30.0,
      31.0,
      36.0,
      26.0,
      28.0,
      29.5,
      'Esquineros plásticos aumentan ancho',
    ],
    [
      'SKU-CDK-7714',
      'Contenedor Plástico Herramientas Manuales',
      'Herramientas',
      'Cross-Docking',
      'Jorge Vega',
      new Date().toISOString().split('T')[0],
      50.0,
      35.0,
      28.0,
      11.2,
      49.0,
      35.0,
      27.5,
      11.0,
      'Tránsito directo a sucursal',
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // SKU
    { wch: 40 }, // DESCRIPCION
    { wch: 22 }, // CATEGORIA
    { wch: 16 }, // PROCESO
    { wch: 18 }, // USUARIO
    { wch: 12 }, // FECHA
    { wch: 12 }, // LARGO_CM
    { wch: 12 }, // ANCHO_CM
    { wch: 12 }, // ALTO_CM
    { wch: 12 }, // PESO_KG
    { wch: 18 }, // MASTER_LARGO_CM
    { wch: 18 }, // MASTER_ANCHO_CM
    { wch: 18 }, // MASTER_ALTO_CM
    { wch: 18 }, // MASTER_PESO_KG
    { wch: 35 }, // NOTAS
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MAESTRO_SKU_PLANTILLA');

  XLSX.writeFile(wb, `Plantilla_Oficial_Maestro_SKUs_STOL.xlsx`);
};

/**
 * Exports current measurements to an official formatted Excel file
 */
export const exportMeasurementsToFullExcel = (measurements: SkuMeasurement[]) => {
  const headers = [
    'ID_MEDICION',
    'CODIGO_SKU',
    'DESCRIPCION_PRODUCTO',
    'CATEGORIA',
    'PROCESO_LOGISTICO',
    'AUDITOR_RESPONSABLE',
    'FECHA_MEDICION',
    'HORA',
    'LARGO_REAL_CM',
    'ANCHO_REAL_CM',
    'ALTO_REAL_CM',
    'PESO_REAL_KG',
    'VOLUMEN_REAL_M3',
    'WMS_LARGO_CM',
    'WMS_ANCHO_CM',
    'WMS_ALTO_CM',
    'WMS_PESO_KG',
    'WMS_VOLUMEN_M3',
    'VARIACION_VOL_PCT',
    'ESTADO_AUDITORIA',
    'NOTAS_AUDITORIA',
  ];

  const rows = measurements.map((m) => [
    m.id,
    m.sku,
    m.descripcion,
    m.categoria,
    m.proceso,
    m.usuario,
    m.fecha,
    m.hora,
    m.largoCm,
    m.anchoCm,
    m.altoCm,
    m.pesoKg,
    m.volumenM3,
    m.masterLargoCm,
    m.masterAnchoCm,
    m.masterAltoCm,
    m.masterPesoKg,
    m.masterVolumenM3,
    m.variacionVolPct,
    m.estado,
    m.notasAuditoria || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 38 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MEDICIONES_VOLUMETRIA');

  // Summary sheet for Board / Gerencia
  const totalM3 = measurements.reduce((acc, m) => acc + m.volumenM3, 0);
  const criticas = measurements.filter((m) => m.estado === 'Discrepancia Crítica').length;
  const menores = measurements.filter((m) => m.estado === 'Variación Menor').length;
  const conformes = measurements.filter((m) => m.estado === 'Conforme').length;

  const summaryHeaders = ['INDICADOR_EJECUTIVO', 'VALOR_AUDITADO', 'UNIDAD / NOTA'];
  const summaryRows = [
    ['Total SKUs Medidos', measurements.length, 'SKUs registrados'],
    ['Volumen Total Acumulado', totalM3.toFixed(3), 'm³ medidos'],
    ['SKUs Conformes (0 - 5%)', conformes, `${((conformes / measurements.length) * 100).toFixed(1)}% del catálogo`],
    ['Variaciones Menores (5 - 15%)', menores, `${((menores / measurements.length) * 100).toFixed(1)}% del catálogo`],
    ['Discrepancias Críticas (> 15%)', criticas, `${((criticas / measurements.length) * 100).toFixed(1)}% Requieren ajuste WMS`],
    ['Fecha de Emisión del Reporte', new Date().toLocaleString('es-PE'), 'Generado desde Intranet STOL'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'RESUMEN_EJECUTIVO_DIRECTORIO');

  XLSX.writeFile(wb, `Maestro_Volumetria_STOL_${new Date().toISOString().split('T')[0]}.xlsx`);
};
