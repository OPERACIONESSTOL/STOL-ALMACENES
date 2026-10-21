export interface ParsedDmyDate {
  day: number;
  month: number; // 1 - 12
  year: number;
  quarter: 1 | 2 | 3 | 4;
  week: number;
  dateObj: Date;
  isoDate: string; // YYYY-MM-DD
  displayDmy: string; // DD/MM/YYYY
}

export const MONTH_NAMES_ES = [
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

/**
 * Parses a "DD/MM/YYYY" or "D/M/YYYY" string into structured date components
 */
export const parseDmy = (str: string): ParsedDmyDate | null => {
  if (!str) return null;
  const parts = String(str).trim().split(/[\/\-\.]/);
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj.getTime())) return null;

  const quarter = (Math.ceil(month / 3) as 1 | 2 | 3 | 4) || 1;

  // Calculate ISO week
  const tempDate = new Date(dateObj.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const week = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);

  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const displayDmy = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  return {
    day,
    month,
    year,
    quarter,
    week,
    dateObj,
    isoDate,
    displayDmy,
  };
};

export type PeriodFilterMode =
  | 'TODOS'
  | 'DIARIO'
  | 'SEMANAL'
  | 'MENSUAL'
  | 'TRIMESTRAL'
  | 'ANUAL'
  | 'RANGO';

export interface DateFilterConfig {
  mode: PeriodFilterMode;
  selectedDate: string; // YYYY-MM-DD for DIARIO
  selectedYear: number; // For ANUAL, MENSUAL, TRIMESTRAL
  selectedMonth: number; // 1-12 for MENSUAL
  selectedQuarter: 1 | 2 | 3 | 4; // for TRIMESTRAL
  selectedWeek: number; // for SEMANAL
  startDate: string; // YYYY-MM-DD for RANGO
  endDate: string; // YYYY-MM-DD for RANGO
}
