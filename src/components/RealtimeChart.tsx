import React, { useState, useRef } from 'react';
import { MetricChannel, TelemetryReading } from '../types/telemetry';
import {
  Layers,
  Crosshair,
  SlidersHorizontal,
  Clock,
  Maximize2,
  ZoomIn,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface RealtimeChartProps {
  channels: MetricChannel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  history: TelemetryReading[];
  isStreaming: boolean;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  history,
  isStreaming,
}) => {
  const [windowPoints, setWindowPoints] = useState<number>(50); // 30, 50, 100, 200 points
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [scrubOffset, setScrubOffset] = useState<number>(0); // 0 means live (end of buffer)
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedChannel =
    channels.find((c) => c.id === selectedChannelId) || channels[0] || null;

  // Window slice calculation considering scrub offset
  const totalLength = history.length;
  const endIndex = Math.max(0, totalLength - scrubOffset);
  const startIndex = Math.max(0, endIndex - windowPoints);
  const visibleReadings = history.slice(startIndex, endIndex);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Min and Max for Y axis
  let yMin = 0;
  let yMax = 100;

  if (viewMode === 'single' && selectedChannel) {
    const rawValues = visibleReadings.map((r) => Number(r[selectedChannel.id]) || 0);
    const dataMin = rawValues.length > 0 ? Math.min(...rawValues) : selectedChannel.minRange;
    const dataMax = rawValues.length > 0 ? Math.max(...rawValues) : selectedChannel.maxRange;

    // Give some breathing room
    yMin = Math.min(selectedChannel.minRange, Math.floor(dataMin * 0.95));
    yMax = Math.max(selectedChannel.critThreshold * 1.05, Math.ceil(dataMax * 1.05));
    if (yMax <= yMin) yMax = yMin + 10;
  } else {
    // Multi mode is normalized to 0 - 100%
    yMin = 0;
    yMax = 100;
  }

  // Coordinate helper
  const getX = (idx: number, count: number) => {
    if (count <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (idx / (count - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return paddingTop + plotHeight - ((clamped - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Build Single Channel Path
  const buildChannelPath = (channel: MetricChannel) => {
    if (visibleReadings.length < 2) return '';
    const points = visibleReadings.map((r, idx) => {
      let val = Number(r[channel.id]) || 0;
      if (viewMode === 'multi') {
        // Normalize
        const span = channel.maxRange - channel.minRange || 1;
        val = ((val - channel.minRange) / span) * 100;
      }
      const x = getX(idx, visibleReadings.length);
      const y = getY(val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Warning and Critical Threshold lines for single mode
  const warnY = selectedChannel ? getY(selectedChannel.warnThreshold) : 0;
  const critY = selectedChannel ? getY(selectedChannel.critThreshold) : 0;

  // Mouse move for hover inspector
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || visibleReadings.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX - (paddingLeft / svgWidth) * rect.width) / ((plotWidth / svgWidth) * rect.width);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const index = Math.round(clampedRatio * (visibleReadings.length - 1));
    setHoverIndex(index);
  };

  const hoveredReading =
    hoverIndex !== null && visibleReadings[hoverIndex] ? visibleReadings[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between"
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm font-bold text-white">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Osciloscopio de Telemetría</span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'single'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Canal con Umbrales
            </button>
            <button
              onClick={() => setViewMode('multi')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === 'multi'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Superposición (% Relativo)
            </button>
          </div>
        </div>

        {/* Channel quick buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {channels.map((ch) => {
            const isChSelected = ch.id === selectedChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                  isChSelected
                    ? 'border-slate-500 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
                style={{
                  backgroundColor: isChSelected ? `${ch.color}22` : undefined,
                  color: isChSelected ? ch.color : undefined,
                  borderColor: isChSelected ? ch.color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ch.color }}
                />
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>

        {/* Window buffer buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-400">Ventana:</span>
            {[30, 50, 100].map((pts) => (
              <button
                key={pts}
                onClick={() => setWindowPoints(pts)}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  windowPoints === pts
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {pts}p
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main SVG Plot Canvas */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] min-h-[220px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Background Plot Area */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={plotWidth}
            height={plotHeight}
            fill="#090d16"
            rx="6"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + plotHeight * pct;
            const val = yMax - pct * (yMax - yMin);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + plotWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val.toFixed(viewMode === 'multi' ? 0 : selectedChannel?.decimals || 1)}
                  {viewMode === 'multi' ? '%' : ''}
                </text>
              </g>
            );
          })}

          {/* Threshold Lines in Single Channel Mode */}
          {viewMode === 'single' && selectedChannel && (
            <>
              {/* Warning Threshold */}
              {warnY >= paddingTop && warnY <= paddingTop + plotHeight && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={warnY}
                    x2={paddingLeft + plotWidth}
                    y2={warnY}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  />
                  <text
                    x={paddingLeft + plotWidth - 6}
                    y={warnY - 4}
                    textAnchor="end"
                    fill="#f59e0b"
                    fontSize="9"
                    fontWeight="600"
                  >
                    Alerta: {selectedChannel.warnThreshold} {selectedChannel.unit}
                  </text>
                </g>
              )}

              {/* Critical Threshold */}
              {critY >= paddingTop && critY <= paddingTop + plotHeight && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={critY}
                    x2={paddingLeft + plotWidth}
                    y2={critY}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    strokeOpacity="0.9"
                  />
                  <text
                    x={paddingLeft + plotWidth - 6}
                    y={critY - 4}
                    textAnchor="end"
                    fill="#ef4444"
                    fontSize="9"
                    fontWeight="700"
                  >
                    Crítico: {selectedChannel.critThreshold} {selectedChannel.unit}
                  </text>
                </g>
              )}
            </>
          )}

          {/* Data Lines */}
          {viewMode === 'multi' ? (
            channels.map((ch) => {
              const d = buildChannelPath(ch);
              if (!d) return null;
              const isSelected = ch.id === selectedChannelId;
              return (
                <path
                  key={ch.id}
                  d={d}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })
          ) : (
            selectedChannel && (
              <>
                {/* Gradient area under curve */}
                <defs>
                  <linearGradient id="mainAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selectedChannel.color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={selectedChannel.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${buildChannelPath(selectedChannel)} L ${paddingLeft + plotWidth},${
                    paddingTop + plotHeight
                  } L ${paddingLeft},${paddingTop + plotHeight} Z`}
                  fill="url(#mainAreaGrad)"
                />
                <path
                  d={buildChannelPath(selectedChannel)}
                  fill="none"
                  stroke={selectedChannel.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )
          )}

          {/* Hover Crosshair & Pointer */}
          {hoverIndex !== null && visibleReadings[hoverIndex] && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex, visibleReadings.length)}
                y1={paddingTop}
                x2={getX(hoverIndex, visibleReadings.length)}
                y2={paddingTop + plotHeight}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Point on selected channel */}
              {selectedChannel && (
                <circle
                  cx={getX(hoverIndex, visibleReadings.length)}
                  cy={getY(
                    viewMode === 'multi'
                      ? (((Number(visibleReadings[hoverIndex][selectedChannel.id]) || 0) -
                          selectedChannel.minRange) /
                          (selectedChannel.maxRange - selectedChannel.minRange || 1)) *
                          100
                      : Number(visibleReadings[hoverIndex][selectedChannel.id]) || 0
                  )}
                  r="5"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Time markers on X-Axis */}
          {visibleReadings.length > 0 &&
            [0, Math.floor(visibleReadings.length / 2), visibleReadings.length - 1].map((idx) => {
              if (!visibleReadings[idx]) return null;
              const x = getX(idx, visibleReadings.length);
              return (
                <text
                  key={idx}
                  x={x}
                  y={paddingTop + plotHeight + 16}
                  textAnchor={idx === 0 ? 'start' : idx === visibleReadings.length - 1 ? 'end' : 'middle'}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {visibleReadings[idx].timeString}
                </text>
              );
            })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredReading && hoverIndex !== null && (
          <div
            className="absolute top-3 right-4 pointer-events-none bg-slate-950/90 border border-slate-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-xs z-20 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] border-b border-slate-800 pb-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{hoveredReading.timeString}</span>
            </div>
            {viewMode === 'single' && selectedChannel ? (
              <div className="flex items-center justify-between gap-3 font-mono">
                <span className="text-slate-300 font-medium">{selectedChannel.name}:</span>
                <span
                  className="font-bold text-sm"
                  style={{ color: selectedChannel.color }}
                >
                  {Number(hoveredReading[selectedChannel.id]).toFixed(selectedChannel.decimals)}{' '}
                  {selectedChannel.unit}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
                {channels.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 text-[10px]">{ch.name.substring(0, 10)}:</span>
                    <span style={{ color: ch.color }} className="font-semibold">
                      {Number(hoveredReading[ch.id]).toFixed(ch.decimals)} {ch.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrub Timeline Bar when User Pauses or Wants to Inspect History */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Línea Temporal (Retroceder / Inspeccionar):</span>
          <span className="font-mono text-cyan-300">
            {scrubOffset === 0 ? 'En Vivo (Últimos datos)' : `-${scrubOffset} muestras atrás`}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            type="range"
            min={0}
            max={Math.max(0, history.length - windowPoints)}
            value={scrubOffset}
            onChange={(e) => setScrubOffset(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            title="Arrastra para retroceder en el tiempo"
          />
          {scrubOffset > 0 && (
            <button
              onClick={() => setScrubOffset(0)}
              className="px-2 py-0.5 rounded text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors"
            >
              Volver al Vivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
