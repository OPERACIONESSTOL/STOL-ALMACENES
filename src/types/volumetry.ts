export interface SkuMeasurement {
  id: string;
  sku: string;
  descripcion: string;
  categoria: string;
  usuario: string;
  proceso: 'Recepción' | 'Almacenamiento' | 'Cross-Docking' | 'Despacho' | 'Auditoría';
  fecha: string;
  hora: string;
  timestamp: number;
  // Medición física actual
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  pesoKg: number;
  volumenM3: number; // (largo * ancho * alto) / 1,000,000
  // Valor maestro de WMS/ERP
  masterLargoCm: number;
  masterAnchoCm: number;
  masterAltoCm: number;
  masterPesoKg: number;
  masterVolumenM3: number;
  // Desviación calculada
  variacionVolPct: number; // Porcentaje de diferencia
  estado: 'Conforme' | 'Variación Menor' | 'Discrepancia Crítica' | 'Pendiente Validación';
  notasAuditoria?: string;
}

export interface VolumetryMetrics {
  totalProductosMedidos: number;
  totalCajasMedidas: number;
  volumenTotalM3: number;
  skusRegistrados: number;
  skusPendientes: number;
  totalCatalogoSkus: number;
  porcentajeAvance: number;
  discrepanciasCriticas: number;
  medicionesHoy: number;
  promedioM3PorCaja: number;
}

export interface ProcessVolumeDistribution {
  proceso: string;
  cajasMedidas: number;
  volumenM3: number;
  porcentaje: number;
}

export interface UserVolumeDistribution {
  usuario: string;
  medicionesCount: number;
  volumenM3: number;
  tasaDiscrepanciaPct: number;
  eficienciaHora: number;
}
