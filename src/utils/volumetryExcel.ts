import * as XLSX from 'xlsx';
import { SkuMeasurement } from '../types/volumetry';

export const normalizeKey = (key: unknown): string => {
  return String(key ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_');
};

function findField(row: Record<string, unknown>, aliases: string[]): unknown {
  const normKeys = Object.keys(row).map((k) => ({ original: k, norm: normalizeKey(k) }));
  for (const alias of aliases) {
    const normAlias = normalizeKey(alias);
    const match = normKeys.find((k) => k.norm === normAlias || k.norm.includes(normAlias));
    if (match) {
      return row[match.original];
    }
  }
  return null;
}

function parseNumber(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

function parseDate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (typeof val === 'number') {
    // Excel serial date
    try {
      const d = new Date(Math.round((val - 25569) * 864e5));
      return d.toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }
  const str = String(val).trim();
  // Check if YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  // Check if DD/MM/YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return str.slice(0, 10);
}

export function parseVolumetryMasterWorkbook(buffer: ArrayBuffer): SkuMeasurement[] {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('El archivo Excel no contiene hojas de datos.');

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    defval: null,
    raw: true,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('La hoja seleccionada está vacía.');
  }

  const measurements: SkuMeasurement[] = [];

  rawRows.forEach((r, idx) => {
    const rawSku = findField(r, ['SKU', 'CODIGO', 'ITEM', 'COD_SKU', 'ARTICULO', 'ID']);
    if (!rawSku) return;

    const sku = String(rawSku).trim();
    if (!sku || sku.toLowerCase() === 'total') return;

    const descripcion = String(
      findField(r, ['DESCRIPCION', 'PRODUCTO', 'DETALLE', 'NOMBRE_PRODUCTO', 'NOMBRE']) ||
        `SKU ${sku}`
    ).trim();

    const categoria = String(
      findField(r, ['CATEGORIA', 'FAMILIA', 'LINEA', 'RUBRO', 'TIPO_PRODUCTO']) || 'General'
    ).trim();

    const usuario = String(
      findField(r, ['USUARIO', 'AUDITOR', 'OPERADOR', 'RESPONSABLE', 'MEDIDO_POR']) ||
        'Auditor Sede'
    ).trim();

    const rawProceso = String(
      findField(r, ['PROCESO', 'AREA', 'ETAPA', 'ZONA', 'UBICACION']) || 'Recepción'
    ).trim();

    let proceso: SkuMeasurement['proceso'] = 'Recepción';
    const normP = rawProceso.toUpperCase();
    if (normP.includes('ALMACEN')) proceso = 'Almacenamiento';
    else if (normP.includes('CROSS') || normP.includes('DOCK')) proceso = 'Cross-Docking';
    else if (normP.includes('DESPACHO') || normP.includes('SALIDA')) proceso = 'Despacho';
    else if (normP.includes('AUDIT') || normP.includes('CICLIC')) proceso = 'Auditoría';
    else if (normP.includes('PICK')) proceso = 'Almacenamiento';

    const fecha = parseDate(findField(r, ['FECHA', 'FECHA_MEDICION', 'DIA', 'DATE']));
    const hora = String(findField(r, ['HORA', 'TIME', 'HORA_MEDICION']) || '12:00').trim();

    // Physical dimensions
    const largoCm = parseNumber(findField(r, ['LARGO', 'LARGO_CM', 'L', 'LONGITUD']), 30);
    const anchoCm = parseNumber(findField(r, ['ANCHO', 'ANCHO_CM', 'W', 'WIDTH']), 25);
    const altoCm = parseNumber(findField(r, ['ALTO', 'ALTO_CM', 'H', 'HEIGHT', 'ALTURA']), 20);
    const pesoKg = parseNumber(findField(r, ['PESO', 'PESO_KG', 'WEIGHT', 'PESO_REAL']), 5);

    const volumenM3 =
      Math.round(((largoCm * anchoCm * altoCm) / 1000000) * 10000) / 10000;

    // Master / WMS dimensions
    const masterLargoCm = parseNumber(
      findField(r, ['MASTER_LARGO', 'WMS_LARGO', 'LARGO_SISTEMA', 'LARGO_CATALOGO']),
      largoCm
    );
    const masterAnchoCm = parseNumber(
      findField(r, ['MASTER_ANCHO', 'WMS_ANCHO', 'ANCHO_SISTEMA', 'ANCHO_CATALOGO']),
      anchoCm
    );
    const masterAltoCm = parseNumber(
      findField(r, ['MASTER_ALTO', 'WMS_ALTO', 'ALTO_SISTEMA', 'ALTO_CATALOGO']),
      altoCm
    );
    const masterPesoKg = parseNumber(
      findField(r, ['MASTER_PESO', 'WMS_PESO', 'PESO_SISTEMA', 'PESO_CATALOGO']),
      pesoKg
    );

    const masterVolumenM3 =
      Math.round(((masterLargoCm * masterAnchoCm * masterAltoCm) / 1000000) * 10000) / 10000;

    // Calculate variation
    let variacionVolPct = 0;
    if (masterVolumenM3 > 0) {
      variacionVolPct =
        Math.round(((volumenM3 - masterVolumenM3) / masterVolumenM3) * 1000) / 10;
    }

    const absDiff = Math.abs(variacionVolPct);
    let estado: SkuMeasurement['estado'] = 'Conforme';
    if (absDiff > 15) {
      estado = 'Discrepancia Crítica';
    } else if (absDiff > 5) {
      estado = 'Variación Menor';
    }

    const notasAuditoria = String(
      findField(r, ['NOTAS', 'OBSERVACIONES', 'OBS', 'COMENTARIOS', 'DESVIACION']) || ''
    ).trim();

    measurements.push({
      id: `MED-IMP-${idx + 1}`,
      sku,
      descripcion,
      categoria,
      usuario,
      proceso,
      fecha,
      hora,
      timestamp: Date.now() - idx * 3600000,
      largoCm,
      anchoCm,
      altoCm,
      pesoKg,
      volumenM3,
      masterLargoCm,
      masterAnchoCm,
      masterAltoCm,
      masterPesoKg,
      masterVolumenM3,
      variacionVolPct,
      estado,
      notasAuditoria: notasAuditoria || undefined,
    });
  });

  if (measurements.length === 0) {
    throw new Error('No se pudieron extraer registros válidos de SKU del archivo Excel.');
  }

  return measurements;
}

export function exportVolumetryTemplate() {
  const wb = XLSX.utils.book_new();

  const sampleRows = [
    {
      SKU: 'SKU-LOG-4091',
      DESCRIPCION: 'Caja Master Aceite Industrial 20L x 2',
      CATEGORIA: 'Líquidos e Insumos',
      USUARIO: 'Carlos Ramos',
      PROCESO: 'Recepción',
      FECHA: '2026-10-20',
      LARGO_CM: 42.0,
      ANCHO_CM: 31.5,
      ALTO_CM: 38.0,
      PESO_KG: 19.8,
      WMS_LARGO_CM: 42.0,
      WMS_ANCHO_CM: 31.0,
      WMS_ALTO_CM: 38.0,
      WMS_PESO_KG: 19.5,
      OBSERVACIONES: 'Medición física conforme con ficha técnica',
    },
    {
      SKU: 'SKU-ALM-8820',
      DESCRIPCION: 'Pallet Bulto Filtros de Aire Alta Densidad',
      CATEGORIA: 'Repuestos Automotrices',
      USUARIO: 'Andrea Mendoza',
      PROCESO: 'Almacenamiento',
      FECHA: '2026-10-20',
      LARGO_CM: 65.0,
      ANCHO_CM: 45.0,
      ALTO_CM: 52.0,
      PESO_KG: 14.2,
      WMS_LARGO_CM: 58.0,
      WMS_ANCHO_CM: 40.0,
      WMS_ALTO_CM: 45.0,
      WMS_PESO_KG: 12.0,
      OBSERVACIONES: 'Proveedor cambió empaque secundario sin notificar',
    },
    {
      SKU: 'SKU-DSP-1194',
      DESCRIPCION: 'Empaque Corrugado Válvulas Hidráulicas x 12',
      CATEGORIA: 'Ferretería & Maquinaria',
      USUARIO: 'Luis Paredes',
      PROCESO: 'Despacho',
      FECHA: '2026-10-20',
      LARGO_CM: 35.0,
      ANCHO_CM: 25.0,
      ALTO_CM: 20.0,
      PESO_KG: 8.5,
      WMS_LARGO_CM: 35.0,
      WMS_ANCHO_CM: 25.0,
      WMS_ALTO_CM: 20.0,
      WMS_PESO_KG: 8.4,
      OBSERVACIONES: 'Carga conforme para despacho rápido',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'MAESTRO_VOLUMETRIA');
  XLSX.writeFile(wb, 'Plantilla_Maestro_Volumetria_STOL.xlsx');
}
