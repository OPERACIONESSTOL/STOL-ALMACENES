import React from 'react';
import { CalendarDays } from 'lucide-react';

export const REPORT_MONTHS = ['Julio', 'Agosto', 'Setiembre', 'Octubre'];

const MONTH_NUMBERS: Record<string, number> = {
  Julio: 7,
  Agosto: 8,
  Setiembre: 9,
  Octubre: 10,
};

export const getReportMonthFromDate = (date: string): string | null => {
  const monthNumber = date.includes('/') ? Number(date.split('/')[1]) : Number(date.slice(5, 7));
  return REPORT_MONTHS.find((month) => MONTH_NUMBERS[month] === monthNumber) || null;
};

interface ReportModuleHeaderProps {
  title: string;
  description: string;
  selectedMonth: string;
  availableMonths?: string[];
  onSelectMonth: (month: string) => void;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export const ReportModuleHeader: React.FC<ReportModuleHeaderProps> = ({
  title,
  description,
  selectedMonth,
  availableMonths = REPORT_MONTHS,
  onSelectMonth,
  actions,
  eyebrow,
}) => (
  <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700 rounded-2xl px-5 py-5 md:px-6 text-white shadow-lg">
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">{eyebrow}</div>}
        <h1 className="text-xl md:text-2xl font-black text-white">{title}</h1>
        <p className="max-w-3xl text-xs md:text-sm leading-relaxed text-slate-300">{description}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        {actions}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-700 bg-slate-950/80 overflow-x-auto">
          <span className="inline-flex items-center gap-1.5 px-2 text-[10px] font-black text-slate-400 uppercase shrink-0">
            <CalendarDays className="w-3.5 h-3.5" /> Mes
          </span>
          {REPORT_MONTHS.map((month) => {
            const isAvailable = availableMonths.includes(month);
            const isSelected = selectedMonth === month;
            return (
              <button
                key={month}
                type="button"
                onClick={() => onSelectMonth(month)}
                disabled={!isAvailable}
                aria-pressed={isSelected}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                  isSelected ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={isAvailable ? `Ver resultados de ${month}` : `No hay datos de ${month} en esta vista`}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </header>
);