import { MetricChannel, PresetDataset, TelemetryReading } from '../types/telemetry';

export const PRESET_DATASETS: PresetDataset[] = [
  {
    id: 'iot_environment',
    name: 'IoT & Climatización Ambiental',
    description: 'Monitoreo de confort ambiental, pureza del aire y climatización en tiempo real.',
    sampleIntervalMs: 1000,
    channels: [
      {
        id: 'temp',
        name: 'Temperatura',
        unit: '°C',
        color: '#f97316', // orange
        minRange: 15,
        maxRange: 38,
        warnThreshold: 28.5,
        critThreshold: 32.0,
        decimals: 1,
        category: 'temperature',
      },
      {
        id: 'humidity',
        name: 'Humedad Relativa',
        unit: '%',
        color: '#06b6d4', // cyan
        minRange: 20,
        maxRange: 90,
        warnThreshold: 68.0,
        critThreshold: 78.0,
        decimals: 1,
        category: 'generic',
      },
      {
        id: 'co2',
        name: 'Concentración CO₂',
        unit: 'ppm',
        color: '#a855f7', // purple
        minRange: 350,
        maxRange: 1800,
        warnThreshold: 950,
        critThreshold: 1250,
        decimals: 0,
        category: 'chemical',
      },
      {
        id: 'pressure',
        name: 'Presión Barométrica',
        unit: 'hPa',
        color: '#3b82f6', // blue
        minRange: 980,
        maxRange: 1035,
        warnThreshold: 1025,
        critThreshold: 1032,
        decimals: 1,
        category: 'pressure',
      },
      {
        id: 'pm25',
        name: 'Partículas PM2.5',
        unit: 'µg/m³',
        color: '#10b981', // emerald
        minRange: 2,
        maxRange: 60,
        warnThreshold: 30,
        critThreshold: 45,
        decimals: 1,
        category: 'chemical',
      },
    ],
  },
  {
    id: 'industrial_power',
    name: 'Planta Eléctrica & Energía',
    description: 'Telemetría de potencia trifásica, voltaje, corriente y factor de disipación.',
    sampleIntervalMs: 800,
    channels: [
      {
        id: 'voltage',
        name: 'Voltaje de Red',
        unit: 'V',
        color: '#eab308', // amber
        minRange: 200,
        maxRange: 250,
        warnThreshold: 235,
        critThreshold: 242,
        decimals: 1,
        category: 'energy',
      },
      {
        id: 'current',
        name: 'Corriente de Carga',
        unit: 'A',
        color: '#ef4444', // red
        minRange: 5,
        maxRange: 65,
        warnThreshold: 48,
        critThreshold: 58,
        decimals: 1,
        category: 'energy',
      },
      {
        id: 'power',
        name: 'Potencia Activa',
        unit: 'kW',
        color: '#8b5cf6', // violet
        minRange: 1,
        maxRange: 16,
        warnThreshold: 12.5,
        critThreshold: 14.8,
        decimals: 2,
        category: 'energy',
      },
      {
        id: 'frequency',
        name: 'Frecuencia Red',
        unit: 'Hz',
        color: '#14b8a6', // teal
        minRange: 49.0,
        maxRange: 51.0,
        warnThreshold: 50.35,
        critThreshold: 50.6,
        decimals: 2,
        category: 'energy',
      },
      {
        id: 'winding_temp',
        name: 'Temp. Devanado',
        unit: '°C',
        color: '#f43f5e', // rose
        minRange: 35,
        maxRange: 105,
        warnThreshold: 82,
        critThreshold: 92,
        decimals: 1,
        category: 'temperature',
      },
    ],
  },
  {
    id: 'sandbox_server',
    name: 'Rendimiento Servidor / CodeSandbox',
    description: 'Métricas de ejecución, latencia de API, heap de Node.js y rendimiento en vivo.',
    sampleIntervalMs: 600,
    channels: [
      {
        id: 'latency',
        name: 'Latencia API',
        unit: 'ms',
        color: '#38bdf8', // light blue
        minRange: 10,
        maxRange: 400,
        warnThreshold: 180,
        critThreshold: 300,
        decimals: 0,
        category: 'performance',
      },
      {
        id: 'cpu',
        name: 'Carga de CPU',
        unit: '%',
        color: '#f97316',
        minRange: 0,
        maxRange: 100,
        warnThreshold: 75,
        critThreshold: 90,
        decimals: 1,
        category: 'performance',
      },
      {
        id: 'memory',
        name: 'Heap de Memoria',
        unit: 'MB',
        color: '#ec4899', // pink
        minRange: 100,
        maxRange: 1024,
        warnThreshold: 750,
        critThreshold: 920,
        decimals: 0,
        category: 'performance',
      },
      {
        id: 'throughput',
        name: 'Peticiones / seg',
        unit: 'req/s',
        color: '#22c55e', // green
        minRange: 0,
        maxRange: 320,
        warnThreshold: 250,
        critThreshold: 295,
        decimals: 0,
        category: 'performance',
      },
      {
        id: 'error_rate',
        name: 'Tasa Errores 5xx',
        unit: '%',
        color: '#dc2626',
        minRange: 0,
        maxRange: 10,
        warnThreshold: 2.0,
        critThreshold: 4.5,
        decimals: 2,
        category: 'performance',
      },
    ],
  },
  {
    id: 'biochemical_lab',
    name: 'Laboratorio Bio-Químico',
    description: 'Control de reactores en línea, pH, oxígeno disuelto y conductividad de medios.',
    sampleIntervalMs: 1200,
    channels: [
      {
        id: 'ph',
        name: 'Potencial de Hidrógeno (pH)',
        unit: 'pH',
        color: '#10b981',
        minRange: 5.5,
        maxRange: 9.0,
        warnThreshold: 7.8,
        critThreshold: 8.3,
        decimals: 2,
        category: 'chemical',
      },
      {
        id: 'do2',
        name: 'Oxígeno Disuelto',
        unit: 'mg/L',
        color: '#0284c7',
        minRange: 2.0,
        maxRange: 10.0,
        warnThreshold: 8.0,
        critThreshold: 8.8,
        decimals: 2,
        category: 'chemical',
      },
      {
        id: 'cond',
        name: 'Conductividad',
        unit: 'µS/cm',
        color: '#eab308',
        minRange: 150,
        maxRange: 850,
        warnThreshold: 620,
        critThreshold: 760,
        decimals: 0,
        category: 'chemical',
      },
      {
        id: 'temp_reactor',
        name: 'Temperatura Reactor',
        unit: '°C',
        color: '#f97316',
        minRange: 20,
        maxRange: 50,
        warnThreshold: 39,
        critThreshold: 43,
        decimals: 1,
        category: 'temperature',
      },
    ],
  },
];

// Stateful state for continuous simulation
class TelemetrySimulator {
  private baseStates: Record<string, number> = {};
  private stepCount: number = 0;
  private forcedAnomalyChannel: string | null = null;
  private anomalyStrength: number = 1;

  public initialize(channels: MetricChannel[]) {
    this.baseStates = {};
    channels.forEach((ch) => {
      // Start around mid-range
      const mid = (ch.minRange + ch.warnThreshold) / 2;
      this.baseStates[ch.id] = mid;
    });
    this.stepCount = 0;
    this.forcedAnomalyChannel = null;
  }

  public injectAnomaly(channelId: string, strength: number = 1.6) {
    this.forcedAnomalyChannel = channelId;
    this.anomalyStrength = strength;
  }

  public generateStep(channels: MetricChannel[]): TelemetryReading {
    this.stepCount++;
    const now = Date.now();
    const date = new Date(now);
    const timeString = date.toTimeString().split(' ')[0];

    const reading: TelemetryReading = {
      timestamp: now,
      timeString,
    };

    channels.forEach((ch) => {
      let currentVal = this.baseStates[ch.id];
      if (currentVal === undefined) {
        currentVal = (ch.minRange + ch.warnThreshold) / 2;
      }

      const span = ch.maxRange - ch.minRange;
      const noise = (Math.random() - 0.49) * (span * 0.025);
      const wave = Math.sin((this.stepCount * 0.08) + (ch.id.charCodeAt(0) % 5)) * (span * 0.015);

      // Random drift
      let nextVal = currentVal + noise + wave;

      // Check if forced anomaly on this channel
      if (this.forcedAnomalyChannel === ch.id) {
        nextVal = ch.critThreshold * this.anomalyStrength;
        // Reset after 1 step
        this.forcedAnomalyChannel = null;
      } else {
        // 0.8% natural random spike probability
        if (Math.random() < 0.008) {
          nextVal = ch.warnThreshold + (ch.critThreshold - ch.warnThreshold) * (0.8 + Math.random() * 0.5);
        }
      }

      // Constrain within bounds
      nextVal = Math.max(ch.minRange, Math.min(ch.maxRange * 1.1, nextVal));
      this.baseStates[ch.id] = nextVal;

      reading[ch.id] = Number(nextVal.toFixed(ch.decimals));
    });

    return reading;
  }

  public generateInitialHistory(channels: MetricChannel[], pointsCount = 30, intervalMs = 1000): TelemetryReading[] {
    this.initialize(channels);
    const readings: TelemetryReading[] = [];
    const now = Date.now();

    for (let i = pointsCount; i >= 1; i--) {
      const pastTime = now - i * intervalMs;
      const d = new Date(pastTime);
      const timeStr = d.toTimeString().split(' ')[0];

      const r: TelemetryReading = {
        timestamp: pastTime,
        timeString: timeStr,
      };

      channels.forEach((ch) => {
        const mid = (ch.minRange + ch.warnThreshold) / 2;
        const span = ch.maxRange - ch.minRange;
        const wave = Math.sin((i * 0.12) + (ch.id.charCodeAt(0) % 5)) * (span * 0.08);
        const noise = (Math.random() - 0.5) * (span * 0.03);
        const val = Math.max(ch.minRange, Math.min(ch.maxRange, mid + wave + noise));
        r[ch.id] = Number(val.toFixed(ch.decimals));
      });

      readings.push(r);
    }

    return readings;
  }
}

export const simulator = new TelemetrySimulator();
