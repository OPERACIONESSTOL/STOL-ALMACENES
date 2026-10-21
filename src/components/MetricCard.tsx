import React from 'react';
import { MetricChannel, ChannelStats, TelemetryReading } from '../types/telemetry';
import {
  Thermometer,
  Zap,
  Activity,
  Droplets,
  Gauge,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface MetricCardProps {
  channel: MetricChannel;
  stats: ChannelStats;
  history: TelemetryReading[];
  isSelected: boolean;
  onSelect: () => void;
  onInjectAnomaly: (channelId: string) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  channel,
  stats,
  history,
  isSelected,
  onSelect,
  onInjectAnomaly,
}) => {
  // Category icon mapping
  const renderIcon = () => {
    switch (channel.category) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" style={{ color: channel.color }} />;
      case 'energy':
        return <Zap className="w-4 h-4" style={{ color: channel.color }} />;
      case 'performance':
        return <Cpu className="w-4 h-4" style={{ color: channel.color }} />;
      case 'chemical':
        return <Droplets className="w-4 h-4" style={{ color: channel.color }} />;
      case 'pressure':
        return <Gauge className="w-4 h-4" style={{ color: channel.color }} />;
      default:
        return <Activity className="w-4 h-4" style={{ color: channel.color }} />;
    }
  };

  // Sparkline generator (SVG path from last 20 readings)
  const renderSparkline = () => {
    const points = history.slice(-20).map((r) => Number(r[channel.id]) || 0);
    if (points.length < 2) return null;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const padding = 2;

    const coords = points.map((val, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathData = `M ${coords.join(' L ')}`;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-9 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${channel.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={channel.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={channel.color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${width - padding},${height} L ${padding},${height} Z`}
          fill={`url(#grad-${channel.id})`}
        />
        <path
          d={pathData}
          fill="none"
          stroke={channel.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current point */}
        <circle
          cx={coords[coords.length - 1].split(',')[0]}
          cy={coords[coords.length - 1].split(',')[1]}
          r="3"
          fill={channel.color}
          className="animate-pulse"
        />
      </svg>
    );
  };

  // Percentage within range for circular gauge or linear gauge
  const clampedVal = Math.max(channel.minRange, Math.min(channel.maxRange, stats.current));
  const percent = ((clampedVal - channel.minRange) / (channel.maxRange - channel.minRange)) * 100;

  // Rate of change indicator
  const renderTrend = () => {
    if (Math.abs(stats.rateOfChange) < 0.05) {
      return (
        <span className="flex items-center text-xs text-slate-400" title="Estable">
          <Minus className="w-3.5 h-3.5" /> Est.
        </span>
      );
    } else if (stats.rateOfChange > 0) {
      return (
        <span
          className="flex items-center text-xs text-emerald-400 font-mono"
          title={`Tasa: +${stats.rateOfChange.toFixed(2)} ${channel.unit}/s`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" /> +{Math.abs(stats.rateOfChange).toFixed(1)}/s
        </span>
      );
    } else {
      return (
        <span
          className="flex items-center text-xs text-rose-400 font-mono"
          title={`Tasa: ${stats.rateOfChange.toFixed(2)} ${channel.unit}/s`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" /> -{Math.abs(stats.rateOfChange).toFixed(1)}/s
        </span>
      );
    }
  };

  // Determine status color theme
  const getStatusBorder = () => {
    if (stats.status === 'critical') return 'border-red-500/80 bg-red-950/20 shadow-red-900/20 shadow-md';
    if (stats.status === 'warning') return 'border-amber-500/80 bg-amber-950/20 shadow-amber-900/20 shadow-md';
    if (isSelected) return 'border-cyan-500/90 bg-slate-900/90 shadow-cyan-950/30 shadow-md ring-1 ring-cyan-500/50';
    return 'border-slate-800 bg-slate-900/70 hover:border-slate-700';
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${getStatusBorder()}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/80">
              {renderIcon()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200 leading-tight">
                {channel.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Rango: {channel.minRange} - {channel.maxRange} {channel.unit}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {stats.status === 'critical' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-700 animate-pulse">
              <AlertCircle className="w-3 h-3" /> CRÍTICO
            </span>
          ) : stats.status === 'warning' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-700">
              <AlertCircle className="w-3 h-3" /> ALERTA
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
              NORMAL
            </span>
          )}
        </div>

        {/* Current Reading & Rate */}
        <div className="flex items-baseline justify-between mt-3 mb-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl font-extrabold tracking-tight font-mono"
              style={{ color: channel.color }}
            >
              {stats.current.toFixed(channel.decimals)}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              {channel.unit}
            </span>
          </div>
          <div>{renderTrend()}</div>
        </div>

        {/* Mini Gauge Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden my-2 border border-slate-700/50">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(3, percent))}%`,
              backgroundColor:
                stats.status === 'critical'
                  ? '#ef4444'
                  : stats.status === 'warning'
                  ? '#f59e0b'
                  : channel.color,
            }}
          />
        </div>

        {/* Sparkline */}
        <div className="my-2.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/70">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-mono">
              <Radio className="w-2.5 h-2.5 text-cyan-500 animate-pulse" /> Flujo en Vivo (20s)
            </span>
            <span className="font-mono">{stats.current.toFixed(channel.decimals)} {channel.unit}</span>
          </div>
          {renderSparkline()}
        </div>
      </div>

      {/* Numerical Stats Footer */}
      <div className="mt-2 pt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
          <div className="bg-slate-950/50 rounded p-1">
            <div className="text-slate-500">Mín</div>
            <div className="font-mono text-slate-300 font-medium">
              {stats.min.toFixed(channel.decimals)}
            </div>
          </div>
          <div className="bg-slate-950/50 rounded p-1">
            <div className="text-slate-500">Promedio</div>
            <div className="font-mono text-slate-300 font-medium">
              {stats.mean.toFixed(channel.decimals)}
            </div>
          </div>
          <div className="bg-slate-950/50 rounded p-1">
            <div className="text-slate-500">Máx</div>
            <div className="font-mono text-slate-300 font-medium">
              {stats.max.toFixed(channel.decimals)}
            </div>
          </div>
          <div className="bg-slate-950/50 rounded p-1">
            <div className="text-slate-500">Desv (σ)</div>
            <div className="font-mono text-cyan-400 font-medium">
              {stats.stdDev.toFixed(channel.decimals)}
            </div>
          </div>
        </div>

        {/* Quick Test Trigger Button (revealed on hover or on click) */}
        <div className="flex items-center justify-between mt-2 pt-1">
          <span className="text-[10px] text-slate-500">
            {isSelected ? '★ Canal Seleccionado' : 'Clic para enfocar'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInjectAnomaly(channel.id);
            }}
            className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-800/60 transition-colors"
            title={`Simular pico anómalo para ${channel.name}`}
          >
            Pico de Prueba
          </button>
        </div>
      </div>
    </div>
  );
};
