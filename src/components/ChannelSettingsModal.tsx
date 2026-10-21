import React, { useState } from 'react';
import { MetricChannel } from '../types/telemetry';
import { X, Plus, Trash2, RotateCcw, Sliders, Check } from 'lucide-react';

interface ChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: MetricChannel[];
  onUpdateChannels: (updated: MetricChannel[]) => void;
  onResetToPreset: () => void;
}

export const ChannelSettingsModal: React.FC<ChannelSettingsModalProps> = ({
  isOpen,
  onClose,
  channels,
  onUpdateChannels,
  onResetToPreset,
}) => {
  const [localChannels, setLocalChannels] = useState<MetricChannel[]>(channels);
  const [newChannel, setNewChannel] = useState<{
    id: string;
    name: string;
    unit: string;
    color: string;
    minRange: number;
    maxRange: number;
    warnThreshold: number;
    critThreshold: number;
    decimals: number;
  }>({
    id: '',
    name: '',
    unit: '',
    color: '#06b6d4',
    minRange: 0,
    maxRange: 100,
    warnThreshold: 75,
    critThreshold: 90,
    decimals: 1,
  });

  if (!isOpen) return null;

  const handleFieldChange = (idx: number, field: keyof MetricChannel, val: unknown) => {
    const updated = [...localChannels];
    updated[idx] = { ...updated[idx], [field]: val };
    setLocalChannels(updated);
  };

  const handleRemoveChannel = (idx: number) => {
    if (localChannels.length <= 1) return; // Keep at least 1
    const updated = localChannels.filter((_, i) => i !== idx);
    setLocalChannels(updated);
  };

  const handleAddChannel = () => {
    if (!newChannel.name) return;
    const cleanId =
      newChannel.id.trim() ||
      newChannel.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const channelToAdd: MetricChannel = {
      ...newChannel,
      id: cleanId,
      category: 'generic',
    };

    setLocalChannels([...localChannels, channelToAdd]);
    setNewChannel({
      id: '',
      name: '',
      unit: '',
      color: '#f59e0b',
      minRange: 0,
      maxRange: 100,
      warnThreshold: 75,
      critThreshold: 90,
      decimals: 1,
    });
  };

  const handleSave = () => {
    onUpdateChannels(localChannels);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Configuración de Canales y Umbrales
              </h2>
              <p className="text-xs text-slate-400">
                Ajusta las variables de medición, unidades, límites operativos y alarmas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-200">
              Canales Monitoreados Actualmente ({localChannels.length})
            </div>

            <div className="space-y-3">
              {localChannels.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={ch.color}
                        onChange={(e) => handleFieldChange(idx, 'color', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-semibold text-white text-sm">{ch.name}</span>
                      <span className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        key: {ch.id}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveChannel(idx)}
                      disabled={localChannels.length <= 1}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors disabled:opacity-30"
                      title="Eliminar canal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Nombre</label>
                      <input
                        type="text"
                        value={ch.name}
                        onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Unidad</label>
                      <input
                        type="text"
                        value={ch.unit}
                        onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Rango Mín</label>
                      <input
                        type="number"
                        value={ch.minRange}
                        onChange={(e) =>
                          handleFieldChange(idx, 'minRange', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Rango Máx</label>
                      <input
                        type="number"
                        value={ch.maxRange}
                        onChange={(e) =>
                          handleFieldChange(idx, 'maxRange', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-amber-400 block mb-0.5">Alerta (&ge;)</label>
                      <input
                        type="number"
                        value={ch.warnThreshold}
                        onChange={(e) =>
                          handleFieldChange(idx, 'warnThreshold', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-amber-800/80 rounded px-2 py-1 text-amber-300 text-xs font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-rose-400 block mb-0.5">Crítico (&ge;)</label>
                      <input
                        type="number"
                        value={ch.critThreshold}
                        onChange={(e) =>
                          handleFieldChange(idx, 'critThreshold', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-rose-800/80 rounded px-2 py-1 text-rose-300 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Channel Card */}
          <div className="bg-slate-950/70 border border-dashed border-slate-700 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Agregar Nuevo Canal de Medición Personalizado</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <label className="text-slate-400 block mb-0.5">Nombre de Variable</label>
                <input
                  type="text"
                  placeholder="ej. Vibración Rotor"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Clave JSON (key en CodeSandbox)</label>
                <input
                  type="text"
                  placeholder="ej. vibration_x"
                  value={newChannel.id}
                  onChange={(e) => setNewChannel({ ...newChannel, id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Unidad (ej. mm/s, bar, V)</label>
                <input
                  type="text"
                  placeholder="ej. mm/s"
                  value={newChannel.unit}
                  onChange={(e) => setNewChannel({ ...newChannel, unit: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Color en Gráficos</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newChannel.color}
                    onChange={(e) => setNewChannel({ ...newChannel, color: e.target.value })}
                    className="w-8 h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-slate-400 text-xs">{newChannel.color}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <label className="text-slate-400 block mb-0.5">Rango Mínimo</label>
                <input
                  type="number"
                  value={newChannel.minRange}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, minRange: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Rango Máximo</label>
                <input
                  type="number"
                  value={newChannel.maxRange}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, maxRange: parseFloat(e.target.value) || 100 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-amber-400 block mb-0.5">Umbral Alerta (&ge;)</label>
                <input
                  type="number"
                  value={newChannel.warnThreshold}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, warnThreshold: parseFloat(e.target.value) || 75 })
                  }
                  className="w-full bg-slate-900 border border-amber-800/80 rounded px-2 py-1 text-amber-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-rose-400 block mb-0.5">Umbral Crítico (&ge;)</label>
                <input
                  type="number"
                  value={newChannel.critThreshold}
                  onChange={(e) =>
                    setNewChannel({ ...newChannel, critThreshold: parseFloat(e.target.value) || 90 })
                  }
                  className="w-full bg-slate-900 border border-rose-800/80 rounded px-2 py-1 text-rose-300 text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleAddChannel}
              disabled={!newChannel.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Canal a la Telemetría</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onResetToPreset();
              onClose();
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Canales de Fábrica</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar y Aplicar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
