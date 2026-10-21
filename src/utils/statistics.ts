import { ChannelStats, TelemetryReading, CorrelationPair, MetricChannel } from '../types/telemetry';

export function computeChannelStats(
  channel: MetricChannel,
  readings: TelemetryReading[],
  windowSize = 40
): ChannelStats {
  if (!readings || readings.length === 0) {
    return {
      current: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      variance: 0,
      sma: 0,
      ema: 0,
      rateOfChange: 0,
      status: 'normal',
    };
  }

  // Extract numeric values for this channel
  const slice = readings.slice(-windowSize);
  const values = slice
    .map((r) => Number(r[channel.id]))
    .filter((v) => !isNaN(v) && isFinite(v));

  if (values.length === 0) {
    return {
      current: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      variance: 0,
      sma: 0,
      ema: 0,
      rateOfChange: 0,
      status: 'normal',
    };
  }

  const current = values[values.length - 1];

  // Mean
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;

  // Median
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Min / Max
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Variance & StdDev
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / (values.length || 1);
  const stdDev = Math.sqrt(variance);

  // SMA (Simple Moving Average - last 10)
  const smaPeriod = Math.min(10, values.length);
  const smaSlice = values.slice(-smaPeriod);
  const sma = smaSlice.reduce((a, b) => a + b, 0) / smaPeriod;

  // EMA (Exponential Moving Average)
  let ema = values[0];
  const alpha = 2 / (Math.min(12, values.length) + 1);
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
  }

  // Rate of change (delta per second)
  let rateOfChange = 0;
  if (slice.length >= 2) {
    const lastR = slice[slice.length - 1];
    const prevR = slice[slice.length - 2];
    const dt = (lastR.timestamp - prevR.timestamp) / 1000;
    if (dt > 0) {
      rateOfChange = (Number(lastR[channel.id]) - Number(prevR[channel.id])) / dt;
    }
  }

  // Status check
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (current >= channel.critThreshold || current < channel.minRange * 0.9) {
    status = 'critical';
  } else if (current >= channel.warnThreshold) {
    status = 'warning';
  }

  return {
    current,
    mean,
    median,
    min,
    max,
    stdDev,
    variance,
    sma,
    ema,
    rateOfChange,
    status,
  };
}

// Compute Pearson correlation matrix between all pairs of numeric channels
export function computePearsonCorrelations(
  channels: MetricChannel[],
  readings: TelemetryReading[],
  windowSize = 50
): CorrelationPair[] {
  if (readings.length < 5 || channels.length < 2) return [];

  const slice = readings.slice(-windowSize);
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < channels.length; i++) {
    for (let j = i + 1; j < channels.length; j++) {
      const chA = channels[i];
      const chB = channels[j];

      const x = slice.map((r) => Number(r[chA.id])).filter((v) => !isNaN(v));
      const y = slice.map((r) => Number(r[chB.id])).filter((v) => !isNaN(v));

      const n = Math.min(x.length, y.length);
      if (n < 5) continue;

      const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
      const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);

      const meanX = sumX / n;
      const meanY = sumY / n;

      let num = 0;
      let denX = 0;
      let denY = 0;

      for (let k = 0; k < n; k++) {
        const dx = x[k] - meanX;
        const dy = y[k] - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }

      const den = Math.sqrt(denX * denY);
      const r = den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));

      pairs.push({
        channelA: chA.name,
        channelB: chB.name,
        coefficient: r,
      });
    }
  }

  return pairs;
}

// Calculate Histogram bins
export interface HistogramBin {
  label: string;
  min: number;
  max: number;
  count: number;
}

export function computeHistogram(
  values: number[],
  numBins = 8
): HistogramBin[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [
      {
        label: min.toFixed(1),
        min,
        max,
        count: values.length,
      },
    ];
  }

  const binWidth = (max - min) / numBins;
  const bins: HistogramBin[] = Array.from({ length: numBins }, (_, i) => {
    const bMin = min + i * binWidth;
    const bMax = i === numBins - 1 ? max : min + (i + 1) * binWidth;
    return {
      label: `${bMin.toFixed(1)}`,
      min: bMin,
      max: bMax,
      count: 0,
    };
  });

  values.forEach((val) => {
    for (let i = 0; i < bins.length; i++) {
      if (val >= bins[i].min && (i === bins.length - 1 ? val <= bins[i].max : val < bins[i].max)) {
        bins[i].count++;
        break;
      }
    }
  });

  return bins;
}
