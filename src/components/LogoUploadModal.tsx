import React, { useState, useRef } from 'react';
import { useLogo } from '../context/LogoContext';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Link2,
  Trash2,
  Eye,
} from 'lucide-react';

export const LogoUploadModal: React.FC = () => {
  const {
    customLogoUrl,
    setCustomLogoUrl,
    isUploadModalOpen,
    closeUploadModal,
    resetLogo,
  } = useLogo();

  const [previewUrl, setPreviewUrl] = useState<string | null>(customLogoUrl);
  const [urlInput, setUrlInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const handleFileProcess = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG, WebP).');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('El tamaño del archivo supera 5MB. Por favor usa una imagen más optimizada.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPreviewUrl(result);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setPreviewUrl(urlInput.trim());
    setError(null);
  };

  const handleSave = () => {
    setCustomLogoUrl(previewUrl);
    closeUploadModal();
  };

  const handleResetToDefault = () => {
    resetLogo();
    setPreviewUrl(null);
    setUrlInput('');
    closeUploadModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={closeUploadModal}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight font-sans">
                Identidad Corporativa Oficial STOL
              </h3>
              <p className="text-xs text-slate-400">
                Carga el logo exacto de la empresa para toda la plataforma
              </p>
            </div>
          </div>
          <button
            onClick={closeUploadModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Preservación fiel de identidad:</strong> Al cargar aquí el archivo de imagen oficial de STOL, se mostrará idéntico en el menú lateral, encabezado, reportes ejecutivos e impresión en PDF sin ninguna alteración ni distorsión.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Opción 1: Subir Archivo de Imagen (PNG, SVG, JPG, WebP)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 mb-2">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Haz clic para seleccionar o arrastra la imagen aquí
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Recomendado: PNG con fondo transparente o archivo SVG vectorial
              </p>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Opción 2: O ingresar URL directa de la imagen
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://ejemplo.com/logo-stol.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Cargar URL
              </button>
            </div>
          </div>

          {/* Live Previews */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" /> Vista previa en la interfaz
              </span>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setUrlInput('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar imagen
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dark Background Preview (Sidebar / Header) */}
              <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[90px] relative">
                <span className="text-[10px] font-mono text-slate-400 absolute top-2 left-2">
                  Fondo Oscuro (Barra Lateral)
                </span>
                <div className="mt-4 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo STOL"
                      className="max-h-12 max-w-full object-contain filter drop-shadow"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-xl font-black text-white tracking-wider font-sans">
                        STOL
                      </span>
                      <span className="block text-[8px] font-bold text-slate-300 tracking-widest uppercase">
                        ALMACENES Y DEPÓSITOS
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Light Background Preview (White Header / Print) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center min-h-[90px] relative">
                <span className="text-[10px] font-mono text-slate-400 absolute top-2 left-2">
                  Fondo Blanco (Encabezado / PDF)
                </span>
                <div className="mt-4 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo STOL"
                      className="max-h-12 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-xl font-black text-slate-900 tracking-wider font-sans">
                        STOL
                      </span>
                      <span className="block text-[8px] font-bold text-slate-600 tracking-widest uppercase">
                        ALMACENES Y DEPÓSITOS
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Restablecer tipografía corporativa limpia por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer por defecto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeUploadModal}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar y Aplicar Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
