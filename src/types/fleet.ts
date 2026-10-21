export interface EquipmentMonthRecord {
  horas_usadas: number;
  horas_inoperativas: number;
}

export type EquipmentProvider = 'DERCO' | 'NOVA';
export type EquipmentType = 'MONTACARGA' | 'ELEVADOR' | 'BACKUP';

export interface FleetUsageLogRecord {
  idRegistro?: string;
  idEquipo?: string;
  proveedor: EquipmentProvider;
  codigo: string;
  tipo: EquipmentType;
  ano?: number;
  mes: string;
  dia?: number;
  fechaRegistro: string; // YYYY-MM-DD
  horaRegistro?: string;
  horometroInicio?: number;
  horometroFinal?: number;
  horasUsadas: number; // FORMULA / METRIC: Horas Usadas
  limiteHora?: number;
  lecturaHorometro?: string;
  tipoSolicitud?: string;
  areaTrabajo?: string;
  prevencionista?: string;
  operador?: string;
  dni?: string;
}

export interface Equipment {
  codigo: string;
  proveedor: EquipmentProvider;
  tipo: EquipmentType;
  limite: number; // 300 for montacargas, 375 for elevadores
  meses: Record<string, EquipmentMonthRecord>;
  fechaSalidaSede?: string; // e.g. '2026-09-24' for old units that left
  fechaIngresoSede?: string; // e.g. '2026-09-24' for new units HGR-279 to HGR-286
  esBackupNuevo?: boolean; // e.g. true for SGR-017 from 24/09
  estadoFlota?: 'ACTIVO' | 'SALIO_DE_SEDE' | 'NUEVO_INGRESO';
  registros?: FleetUsageLogRecord[];
}

export interface MaintenanceIncident {
  id?: string;
  fecha: string;
  mes: string; // 'Julio' | 'Agosto' | 'Setiembre' | etc.
  proveedor: EquipmentProvider;
  codigo: string;
  tipo_mant: string; // "Correctivo" | "Preventivo" | "Observación"
  resultado: string; // "Reparado" | "Pendiente"
  horas: number;
  motivo: string;
}

export type ReceptionPhotoCategory =
  | 'HOROMETRO'
  | 'ACTA_ENTREGA'
  | 'CARROCERIA'
  | 'MASTIL_HORQUILLAS'
  | 'BATERIA_MOTOR'
  | 'DANOS_PREVIOS'
  | 'VIDEO_INCIDENCIA'
  | 'OPERACION_CAMPO';

export type ReceptionStatus = 'CONFORME' | 'OBSERVADO' | 'CONDICIONADO';
export type ReceptionRecordType = 'RECEPCION' | 'INCIDENCIA';

export interface EquipmentReceptionPhoto {
  id: string;
  equipmentCode: string;
  provider: EquipmentProvider;
  equipmentType: EquipmentType;
  date: string;
  recordType?: ReceptionRecordType;
  category: ReceptionPhotoCategory;
  title: string;
  initialHorometer?: number;
  notes?: string;
  responsible: string;
  status: ReceptionStatus;
  imageUrl: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  duration?: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}
