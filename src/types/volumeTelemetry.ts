export type LogisticsProcess =
  | 'Recepción'
  | 'Cross Docking'
  | 'Picking'
  | 'Ecommerce'
  | 'Importados'
  | 'Despacho'
  | 'Almacenamiento';

export interface ProcessTelemetryData {
  proceso: LogisticsProcess;
  volumenRealM3: number;
  metaVolumenM3: number;
  capacidadOperativaM3: number;
  cajasProcesadas: number;
  palletsEquivalentes: number;
  cumplimientoPct: number;
  utilizacionCapacidadPct: number;
  promedioDiarioM3: number;
  variacionPeriodoAnteriorPct: number;
  estado: 'Optimo' | 'Alerta Capacidad' | 'Bajo Meta' | 'Sobrecarga';
  color: string;
}

export interface DailyVolumeRecord {
  fecha: string;
  diaSemana: string;
  volumenTotalM3: number;
  metaDiariaM3: number;
  capacidadDiariaM3: number;
  porProceso: Record<LogisticsProcess, number>;
  cajasTotales: number;
}

export interface VolumeTelemetrySummary {
  volumenTotalPeriodoM3: number;
  metaTotalPeriodoM3: number;
  capacidadTotalPeriodoM3: number;
  cumplimientoGlobalPct: number;
  promedioDiarioM3: number;
  variacionVsMesAnteriorPct: number;
  volumenAcumuladoAnualM3: number;
  comparativaAnioAnteriorM3: number;
  crecimientoInteranualPct: number;
  procesoLiderVolumen: LogisticsProcess;
  desviacionesCriticasCount: number;
}
