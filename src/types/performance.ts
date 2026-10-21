export interface SupervisorMonthly {
  id: string;
  name: string;
  badge?: string;
  directBoss: string;
  isAuditor?: boolean;
  active: boolean;
  notes?: string;
  months: {
    ene: number | null;
    feb: number | null;
    mar: number | null;
    abr: number | null;
    may: number | null;
    jun: number | null;
    jul: number | null;
    ago: number | null;
    set: number | null;
    oct: number | null;
  };
  finalGradeOverride?: number | null;
}

export interface SupervisorWeekly {
  supervisorId: string;
  supervisorName: string;
  directBoss: string;
  weeks: {
    sem40: number | null;
    sem41: number | null;
    sem42: number | null;
    sem43: number | null;
    sem44: number | null;
  };
}

export type ObservationPillar = 'Operaciones' | 'RRHH' | 'SIG';

export interface ObservationItem {
  id: string;
  supervisorName: string;
  pillar: ObservationPillar;
  deductionPoints: number; // e.g. -6.8
  title: string;
  description: string;
  auditor: string;
  period: string; // e.g. "Semana 41 · Octubre"
}

export interface QuarterlySummary {
  t1: number;
  t1Detail: string;
  t2: number;
  t2Detail: string;
  t3: number;
  t3Detail: string;
  t4: number;
  t4Detail: string;
}

export interface GlobalDashboardConfig {
  metaERU: number; // Default 98.0
  companyName: string;
  year: number;
  monthsList: Array<{ key: keyof SupervisorMonthly['months']; label: string }>;
}
