export interface MetricChannel {
  id: string;
  name: string;
  unit: string;
  color: string;
  minRange: number;
  maxRange: number;
  warnThreshold: number;
  critThreshold: number;
  decimals: number;
  category: 'temperature' | 'energy' | 'performance' | 'chemical' | 'pressure' | 'generic';
}

export interface TelemetryReading {
  timestamp: number; // Unix timestamp in ms
  timeString: string; // HH:mm:ss
  [key: string]: number | string; // channel id to value
}

export interface ChannelStats {
  current: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
  sma: number; // Simple Moving Average
  ema: number; // Exponential Moving Average
  rateOfChange: number; // Delta per second
  status: 'normal' | 'warning' | 'critical';
}

export interface AnomalyEvent {
  id: string;
  timestamp: number;
  timeString: string;
  channelId: string;
  channelName: string;
  value: number;
  unit: string;
  expectedMean: number;
  zScore: number;
  type: 'high_threshold' | 'low_threshold' | 'zscore_spike' | 'sudden_drop';
  severity: 'warning' | 'critical';
  resolved?: boolean;
}

export interface CorrelationPair {
  channelA: string;
  channelB: string;
  coefficient: number; // -1 to 1
}

export type ConnectionMode = 'simulator' | 'codesandbox_poll' | 'codesandbox_postmessage' | 'manual_input';

export interface CodeSandboxConfig {
  mode: ConnectionMode;
  sandboxUrl: string; // e.g. https://xxxx.csb.app/api/metrics
  sandboxId?: string; // e.g. "m7j48x" or full codesandbox URL
  pollIntervalMs: number;
  autoConnect: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  lastPingMs?: number;
  errorMessage?: string;
  totalPacketsReceived: number;
}

export interface PresetDataset {
  id: string;
  name: string;
  description: string;
  channels: MetricChannel[];
  sampleIntervalMs: number;
}
