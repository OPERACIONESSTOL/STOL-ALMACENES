export interface OvertimeRecord {
  f: number; // Excel serial date
  c: string; // Cargo (e.g. CAPITAN, OPERARIO, DESPACHADOR)
  a: string; // Area (e.g. ECOMMERCE, PICKING, DESPACHO)
  h: number; // Cantidad de horas
  x: number; // 1 = Dominical / Feriado, 0 = Ordinaria
  w: number; // Semana (e.g. 35, 36)
}

export interface BonusRecord {
  a: string; // Area
  c: string; // Cargo
  d: number; // Dias trabajados bono
}

export interface OvertimeDataset {
  hh: OvertimeRecord[];
  bo: BonusRecord[];
}

export interface OvertimeFilterState {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  selectedArea: string;
  selectedCargo: string;
  selectedType: 'ALL' | 'REGULAR' | 'SPECIAL';
  selectedWeek: string; // 'ALL' or week number as string
  searchQuery: string;
}
