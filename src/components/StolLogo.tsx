import React from 'react';

interface StolLogoProps {
  className?: string;
  variant?: 'badge' | 'header' | 'sidebar' | 'collapsed';
}

export const StolLogo: React.FC<StolLogoProps> = ({
  className = '',
  variant = 'header',
}) => {
  // Collapsed variant for minimized sidebar
  if (variant === 'collapsed') {
    return (
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-950 to-slate-900 text-white font-black text-xs tracking-wider border border-blue-800/70 shadow-sm select-none ${className}`}
        title="STOL – Operador Logístico"
      >
        <div className="flex flex-col items-center leading-none">
          <span className="text-[11px] font-black tracking-tighter">STOL</span>
          <span className="text-[6.5px] font-extrabold text-cyan-400 tracking-tighter">OL</span>
        </div>
      </div>
    );
  }

  // Large badge variant
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0F172A] to-blue-950 text-white shadow-lg border border-slate-700/80 select-none ${className}`}
        title="STOL – Operador Logístico"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-0.5 flex items-center justify-center shrink-0 shadow-md border border-cyan-400/40">
          <span className="font-black text-white text-xs tracking-tight">STOL</span>
        </div>
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tight text-white font-sans">
              STOL
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-md border border-cyan-500/40 uppercase tracking-wider font-sans">
              Operador Logístico
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase font-sans mt-0.5">
            ALMACENES Y DEPÓSITOS S.A.
          </span>
        </div>
      </div>
    );
  }

  // Sidebar variant (Dark Theme)
  if (variant === 'sidebar') {
    return (
      <div
        className={`flex items-center gap-2.5 p-1 select-none ${className}`}
        title="Intranet STOL – Operaciones & Directorio"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-0.5 flex items-center justify-center shrink-0 shadow-md border border-cyan-400/40">
          <span className="font-black text-white text-xs tracking-tight">STOL</span>
        </div>
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl tracking-tight text-white font-sans">
              STOL
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 bg-cyan-950/90 text-cyan-300 rounded border border-cyan-700/60 font-sans tracking-wide uppercase">
              Intranet
            </span>
          </div>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 font-sans mt-0.5">
            INTRANET CORPORATIVA
          </span>
        </div>
      </div>
    );
  }

  // Header variant (Light Theme)
  return (
    <div
      className={`flex items-center gap-2.5 select-none ${className}`}
      title="Intranet STOL – Operaciones & Directorio"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-950 to-blue-950 p-0.5 flex items-center justify-center shrink-0 shadow-xs border border-slate-700">
        <span className="font-black text-white text-[11px] tracking-tight">STOL</span>
      </div>
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tight text-slate-900 font-sans">
            STOL
          </span>
          <span className="text-[10px] font-black px-2.5 py-0.5 bg-gradient-to-r from-blue-900 via-slate-900 to-cyan-950 text-cyan-300 rounded-lg border border-cyan-700/40 shadow-xs uppercase tracking-wider font-sans">
            Intranet
          </span>
        </div>
        <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 font-sans mt-0.5">
          INTRANET CORPORATIVA
        </span>
      </div>
    </div>
  );
};
