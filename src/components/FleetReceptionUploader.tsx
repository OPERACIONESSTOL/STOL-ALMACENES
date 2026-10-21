import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  EquipmentReceptionPhoto,
  ReceptionPhotoCategory,
  ReceptionStatus,
  EquipmentProvider,
  EquipmentType,
} from '../types/fleet';
import { FLEET_EQUIPOS } from '../data/initialFleetData';
import { INITIAL_RECEPTION_PHOTOS } from '../data/initialReceptionData';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Search,
  Filter,
  Trash2,
  Download,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Truck,
  ShieldCheck,
  Plus,
  RefreshCw,
  FolderOpen,
  Info,
  Video,
  Play,
  PlayCircle,
  Film,
} from 'lucide-react';

export const RECEPTION_PHOTOS_STORAGE_KEY = 'stol_fleet_reception_photos';
const STORAGE_KEY = RECEPTION_PHOTOS_STORAGE_KEY;

export const CATEGORY_LABELS: Record<ReceptionPhotoCategory, { label: string; icon: string; color: string }> = {
  HOROMETRO: { label: 'Lectura de Horómetro Inicial', icon: '⏱️', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ACTA_ENTREGA: { label: 'Acta de Entrega / Guía', icon: '📄', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CARROCERIA: { label: 'Inspección Carrocería / Rampa', icon: '🚜', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  MASTIL_HORQUILLAS: { label: 'Mástil & Horquillas', icon: '🏗️', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  BATERIA_MOTOR: { label: 'Batería / Motor / Cargador', icon: '⚡', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  DANOS_PREVIOS: { label: 'Registro de Daños Preexistentes', icon: '⚠️', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  VIDEO_INCIDENCIA: { label: 'Video de Incidencia / Falla Mecánica', icon: '🎥', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  OPERACION_CAMPO: { label: 'Video / Evidencia en Operación', icon: '🎬', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
};

const STATUS_CONFIG: Record<ReceptionStatus, { label: string; bg: string; text: string; border: string }> = {
  CONFORME: { label: 'RECEPCIÓN CONFORME', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
  OBSERVADO: { label: 'CON OBSERVACIONES', bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' },
  CONDICIONADO: { label: 'RECEPCIÓN CONDICIONADA', bg: 'bg-amber-500', text: 'text-slate-950', border: 'border-amber-600' },
};

// Helper: compress image client-side to ensure sharp quality while preserving local storage quota
const compressImage = (file: File): Promise<{ dataUrl: string; sizeString: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 1100px (crystal sharp for web inspection while compact ~80KB)
        const MAX_DIM = 1100;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            sizeString: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
        const approxBytes = Math.round((dataUrl.length * 3) / 4);
        const sizeString =
          approxBytes > 1024 * 1024
            ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(approxBytes / 1024)} KB`;

        resolve({ dataUrl, sizeString });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

// Helper: process video client-side, read dataUrl or objectUrl, and extract video poster frame
const processVideo = (
  file: File
): Promise<{ dataUrl: string; posterUrl: string; sizeString: string; duration?: string }> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    const approxMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeString = `${approxMB} MB`;

    // Timeout fallback after 3 seconds
    const timer = setTimeout(() => {
      resolve({
        dataUrl: objectUrl,
        posterUrl: '',
        sizeString,
        duration: '0:15',
      });
    }, 3000);

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      clearTimeout(timer);
      let posterUrl = '';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, video.videoWidth || 640);
        canvas.height = Math.round((canvas.width * (video.videoHeight || 360)) / (video.videoWidth || 640));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          posterUrl = canvas.toDataURL('image/jpeg', 0.7);
        }
      } catch (err) {
        console.warn('Could not extract video poster', err);
      }

      const durSec = Math.round(video.duration || 0);
      const mins = Math.floor(durSec / 60);
      const secs = (durSec % 60).toString().padStart(2, '0');
      const duration = durSec > 0 ? `${mins}:${secs}` : undefined;

      // If under 8MB, also read as dataUrl for persistence across page reloads
      if (file.size < 8 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            posterUrl,
            sizeString,
            duration,
          });
        };
        reader.onerror = () => {
          resolve({ dataUrl: objectUrl, posterUrl, sizeString, duration });
        };
        reader.readAsDataURL(file);
        return;
      }

      resolve({ dataUrl: objectUrl, posterUrl, sizeString, duration });
    };

    video.onerror = () => {
      clearTimeout(timer);
      resolve({ dataUrl: objectUrl, posterUrl: '', sizeString });
    };
  });
};

interface FleetReceptionUploaderProps {
  selectedEquipmentCode?: string | null;
  onClearEquipmentFilter?: () => void;
}

export const FleetReceptionUploader: React.FC<FleetReceptionUploaderProps> = ({
  selectedEquipmentCode,
  onClearEquipmentFilter,
}) => {
  // Photos state loaded from localStorage or default
  const [photos, setPhotos] = useState<EquipmentReceptionPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_RECEPTION_PHOTOS;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    } catch {
      // quota or private browsing handling
    }
  }, [photos]);

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  // Filters
  const [equipmentFilter, setEquipmentFilter] = useState<string>(selectedEquipmentCode || 'ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync external filter if prop changes
  useEffect(() => {
    if (selectedEquipmentCode) {
      setEquipmentFilter(selectedEquipmentCode);
      setNewEquipCode(selectedEquipmentCode);
    }
  }, [selectedEquipmentCode]);

  // When opening modal, synchronize newEquipCode with current equipmentFilter if not ALL
  const openUploadModal = (targetEquip?: string) => {
    if (targetEquip && targetEquip !== 'ALL') {
      setNewEquipCode(targetEquip);
    } else if (equipmentFilter !== 'ALL') {
      setNewEquipCode(equipmentFilter);
    }
    setIsUploadModalOpen(true);
  };

  // New photo form state
  const [newEquipCode, setNewEquipCode] = useState<string>(selectedEquipmentCode || 'NOVATRANS 290');
  const [newCategory, setNewCategory] = useState<ReceptionPhotoCategory>('HOROMETRO');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newHorometer, setNewHorometer] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState<ReceptionStatus>('CONFORME');
  const [newResponsible, setNewResponsible] = useState<string>('Supervisor de Patio STOL');
  const [newNotes, setNewNotes] = useState<string>('');
  const [stagedFiles, setStagedFiles] = useState<{
    file: File;
    dataUrl: string;
    posterUrl?: string;
    sizeString: string;
    mediaType: 'IMAGE' | 'VIDEO';
    duration?: string;
  }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (Images & Videos)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newStaged: {
      file: File;
      dataUrl: string;
      posterUrl?: string;
      sizeString: string;
      mediaType: 'IMAGE' | 'VIDEO';
      duration?: string;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo =
        file.type.startsWith('video/') ||
        /\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/i.test(file.name);
      const isImage =
        file.type.startsWith('image/') ||
        /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name) ||
        !isVideo;

      if (isVideo) {
        try {
          const vRes = await processVideo(file);
          newStaged.push({
            file,
            dataUrl: vRes.dataUrl,
            posterUrl: vRes.posterUrl,
            sizeString: vRes.sizeString,
            mediaType: 'VIDEO',
            duration: vRes.duration,
          });
          setNewCategory('VIDEO_INCIDENCIA');
          if (!newTitle) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            setNewTitle(`Video Incidencia: ${cleanName}`);
          }
        } catch (err) {
          console.error('Error processing video:', err);
        }
      } else if (isImage) {
        try {
          const compressed = await compressImage(file);
          newStaged.push({
            file,
            dataUrl: compressed.dataUrl,
            sizeString: compressed.sizeString,
            mediaType: 'IMAGE',
          });
          if (!newTitle) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            setNewTitle(`Recepción: ${cleanName}`);
          }
        } catch (err) {
          console.error('Error processing image:', err);
        }
      }
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setIsUploading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Submit new photo(s) & video(s)
  const handleSaveReceptionPhoto = () => {
    if (stagedFiles.length === 0) {
      alert('Por favor selecciona o arrastra al menos una fotografía o video de recepción / incidencia.');
      return;
    }

    // Find equipment metadata
    const eqMeta = FLEET_EQUIPOS.find((e) => e.codigo === newEquipCode);
    const provider: EquipmentProvider = eqMeta ? eqMeta.proveedor : 'NOVA';
    const equipType: EquipmentType = eqMeta ? eqMeta.tipo : 'MONTACARGA';

    const newPhotosCreated: EquipmentReceptionPhoto[] = stagedFiles.map((staged, idx) => ({
      id: `rec-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      equipmentCode: newEquipCode,
      provider,
      equipmentType: equipType,
      date: newDate,
      category: newCategory,
      title: newTitle || (staged.mediaType === 'VIDEO' ? `Video Incidencia ${newEquipCode}` : `Recepción Técnica ${newEquipCode}`),
      initialHorometer: newHorometer ? parseFloat(newHorometer) : undefined,
      notes: newNotes || (staged.mediaType === 'VIDEO' ? 'Registro audiovisual de incidencia/falla reportada en patio STOL.' : 'Recepción física y verificación de componentes en patio STOL.'),
      responsible: newResponsible || 'Operaciones STOL',
      status: newStatus,
      imageUrl: staged.dataUrl,
      mediaType: staged.mediaType,
      duration: staged.duration,
      fileName: staged.file.name,
      fileSize: staged.sizeString,
      uploadedAt: new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    setPhotos((prev) => [...newPhotosCreated, ...prev]);

    // Automatically align equipment filter to newly uploaded unit so user immediately sees their upload
    setEquipmentFilter(newEquipCode);
    setSuccessToast(`¡Expediente guardado con éxito! Se registraron ${newPhotosCreated.length} archivo(s) para el equipo ${newEquipCode}.`);
    setTimeout(() => setSuccessToast(null), 6000);

    // Reset form
    setStagedFiles([]);
    setNewTitle('');
    setNewHorometer('');
    setNewNotes('');
    setIsUploadModalOpen(false);
  };

  // Delete photo or video
  const handleDeletePhoto = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('¿Deseas eliminar este registro del expediente?')) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (lightboxPhotoIndex !== null) {
        setLightboxPhotoIndex(null);
      }
    }
  };

  // Reset to initial sample
  const handleResetToSample = () => {
    if (window.confirm('¿Restablecer las evidencias iniciales de demostración de STOL?')) {
      setPhotos(INITIAL_RECEPTION_PHOTOS);
      localStorage.removeItem(STORAGE_KEY);
      setSuccessToast('Se restauraron las evidencias iniciales de demostración.');
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Filtered photos & videos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (equipmentFilter !== 'ALL' && p.equipmentCode !== equipmentFilter) return false;
      if (providerFilter !== 'ALL' && p.provider !== providerFilter) return false;
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (mediaTypeFilter === 'IMAGE' && p.mediaType === 'VIDEO') return false;
      if (mediaTypeFilter === 'VIDEO' && p.mediaType !== 'VIDEO') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          p.equipmentCode.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.responsible.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          p.fileName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [photos, equipmentFilter, providerFilter, categoryFilter, statusFilter, mediaTypeFilter, searchTerm]);

  // Statistics for Directorio
  const stats = useMemo(() => {
    const totalCount = photos.length;
    const uniqueEquipments = new Set(photos.map((p) => p.equipmentCode)).size;
    const conformes = photos.filter((p) => p.status === 'CONFORME').length;
    const observados = photos.filter((p) => p.status === 'OBSERVADO' || p.status === 'CONDICIONADO').length;
    const horometrosCert = photos.filter((p) => p.category === 'HOROMETRO' && p.initialHorometer !== undefined).length;
    const totalVideos = photos.filter((p) => p.mediaType === 'VIDEO').length;

    return { totalCount, uniqueEquipments, conformes, observados, horometrosCert, totalVideos };
  }, [photos]);

  // Current lightbox photo
  const currentLightboxPhoto = lightboxPhotoIndex !== null ? filteredPhotos[lightboxPhotoIndex] : null;

  const nextLightbox = () => {
    if (lightboxPhotoIndex === null) return;
    setLightboxPhotoIndex((prev) => (prev! + 1) % filteredPhotos.length);
    setLightboxZoom(1);
  };

  const prevLightbox = () => {
    if (lightboxPhotoIndex === null) return;
    setLightboxPhotoIndex((prev) => (prev! - 1 + filteredPhotos.length) % filteredPhotos.length);
    setLightboxZoom(1);
  };

  // Download image helper
  // Download helper (Image or Video)
  const downloadImage = (photo: EquipmentReceptionPhoto) => {
    const isVid = photo.mediaType === 'VIDEO';
    const ext = isVid ? 'mp4' : 'jpg';
    const a = document.createElement('a');
    a.href = photo.imageUrl;
    a.download = `STOL_${photo.equipmentCode.replace(/\s+/g, '_')}_${photo.category}_${photo.date}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS TOAST FEEDBACK */}
      {successToast && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-xs font-bold text-emerald-950 flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-black px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. HEADER & ACTION BAR */}
      <div className="bg-gradient-to-r from-[#1A1A2E] via-[#1E293B] to-[#0F172A] rounded-2xl border-2 border-slate-700/80 shadow-xl p-5 md:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Camera className="w-4 h-4 text-amber-400" />
                MÓDULO DE FOTOGRAFÍAS, VIDEOS &amp; ACTAS DE RECEPCIÓN
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {stats.totalCount} Evidencias Registradas
              </span>
              {stats.totalVideos > 0 && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Film className="w-3 h-3 text-rose-400" />
                  {stats.totalVideos} Videos de Incidencias
                </span>
              )}
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {stats.uniqueEquipments} de 19 Equipos con Evidencia
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Recepción Técnica de Montacargas, Elevadores &amp; Videos de Incidencias
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Carga y custodia digital de fotografías y videos de rampa: lectura de horómetros de entrada,
              inspección visual de mástil/horquillas, actas firmadas por proveedores (NOVATRANS y DERCO) y registro en video de
              fallas mecánicas para auditorías del Directorio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => openUploadModal()}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Fotos o Videos</span>
            </button>

            <button
              onClick={handleResetToSample}
              title="Restablecer fotos de muestra"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer Demo</span>
            </button>
          </div>
        </div>

        {/* 2. DIRECTORIAL METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-700/80">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10.5px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Evidencias Totales</span>
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white mt-1">{stats.totalCount}</div>
            <div className="text-[10px] text-blue-300 mt-0.5">{stats.totalVideos} videos · {stats.totalCount - stats.totalVideos} fotos</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10.5px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Horómetros Certificados</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">{stats.horometrosCert}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lecturas iniciales OK</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10.5px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Recepciones Conformes</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{stats.conformes}</div>
            <div className="text-[10px] text-emerald-300 mt-0.5">Sin novedades en rampa</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3">
            <div className="text-[10.5px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Con Observación / Daño</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-1">{stats.observados}</div>
            <div className="text-[10px] text-rose-300 mt-0.5">Registrado en acta</div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código de equipo, inspector, título, video o notas..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Media Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setMediaTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mediaTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({stats.totalCount})
            </button>
            <button
              onClick={() => setMediaTypeFilter('IMAGE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mediaTypeFilter === 'IMAGE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>Fotos</span>
            </button>
            <button
              onClick={() => setMediaTypeFilter('VIDEO')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mediaTypeFilter === 'VIDEO'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Videos ({stats.totalVideos})</span>
            </button>
          </div>

          {/* Equipment selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-700">Equipo:</span>
              <select
                value={equipmentFilter}
                onChange={(e) => {
                  setEquipmentFilter(e.target.value);
                  if (e.target.value === 'ALL' && onClearEquipmentFilter) {
                    onClearEquipmentFilter();
                  }
                }}
                className="bg-white font-bold text-slate-900 rounded-lg px-2 py-0.5 border border-slate-300 focus:outline-none text-xs"
              >
                <option value="ALL">Todos los Equipos ({FLEET_EQUIPOS.length})</option>
                {FLEET_EQUIPOS.map((eq) => (
                  <option key={eq.codigo} value={eq.codigo}>
                    {eq.codigo} ({eq.proveedor} · {eq.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Provider selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Proveedor:</span>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="bg-white font-bold text-slate-900 rounded-lg px-2 py-0.5 border border-slate-300 focus:outline-none text-xs"
              >
                <option value="ALL">Todos</option>
                <option value="NOVA">NOVATRANS</option>
                <option value="DERCO">DERCO</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Tipo de Foto:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white font-bold text-slate-900 rounded-lg px-2 py-0.5 border border-slate-300 focus:outline-none text-xs max-w-[180px]"
              >
                <option value="ALL">Todas las Categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white font-bold text-slate-900 rounded-lg px-2 py-0.5 border border-slate-300 focus:outline-none text-xs"
              >
                <option value="ALL">Todos</option>
                <option value="CONFORME">Conforme</option>
                <option value="OBSERVADO">Observado</option>
                <option value="CONDICIONADO">Condicionado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter tags pill row */}
        {(equipmentFilter !== 'ALL' || providerFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtros activos:</span>
            {equipmentFilter !== 'ALL' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                Equipo: {equipmentFilter}
                <button
                  onClick={() => {
                    setEquipmentFilter('ALL');
                    onClearEquipmentFilter?.();
                  }}
                  className="hover:text-blue-950"
                >
                  ×
                </button>
              </span>
            )}
            {providerFilter !== 'ALL' && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                {providerFilter}
                <button onClick={() => setProviderFilter('ALL')}>×</button>
              </span>
            )}
            {categoryFilter !== 'ALL' && (
              <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                {CATEGORY_LABELS[categoryFilter as ReceptionPhotoCategory]?.label}
                <button onClick={() => setCategoryFilter('ALL')}>×</button>
              </span>
            )}
            <button
              onClick={() => {
                setEquipmentFilter('ALL');
                setProviderFilter('ALL');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setSearchTerm('');
                onClearEquipmentFilter?.();
              }}
              className="text-xs text-blue-600 hover:underline font-bold ml-auto"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* 4. PHOTO GALLERY GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900">No se encontraron fotografías de recepción</h3>
            <p className="text-xs text-slate-500 mt-1">
              No hay fotos que coincidan con los filtros aplicados o aún no has cargado imágenes para este equipo.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Cargar Fotografías Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPhotos.map((photo, index) => {
            const catInfo = CATEGORY_LABELS[photo.category] || CATEGORY_LABELS.CARROCERIA;
            const statusInfo = STATUS_CONFIG[photo.status] || STATUS_CONFIG.CONFORME;
            const isNova = photo.provider === 'NOVA';

            return (
              <div
                key={photo.id}
                onClick={() => {
                  setLightboxPhotoIndex(index);
                  setLightboxZoom(1);
                }}
                className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Media container (Image or Video) */}
                  <div className="relative aspect-4/3 bg-slate-950 overflow-hidden">
                    {photo.mediaType === 'VIDEO' ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                        {photo.imageUrl.startsWith('data:video/') || photo.imageUrl.startsWith('blob:') ? (
                          <video
                            src={photo.imageUrl}
                            className="w-full h-full object-cover opacity-80"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-1 fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Top tags */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs bg-slate-900/90 text-white border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-sm">
                          {photo.equipmentCode}
                        </span>
                        {photo.mediaType === 'VIDEO' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shadow-sm bg-rose-600 text-white flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            <span>VIDEO</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Bottom overlay in image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between pointer-events-none">
                      <span className="text-[10px] font-mono font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded">
                        📅 {photo.date}
                      </span>

                      {photo.initialHorometer !== undefined ? (
                        <span className="text-[11px] font-black font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                          ⏱️ {photo.initialHorometer} h
                        </span>
                      ) : photo.duration ? (
                        <span className="text-[10.5px] font-mono font-bold bg-black/70 text-rose-300 px-2 py-0.5 rounded">
                          ▶ {photo.duration}
                        </span>
                      ) : null}
                    </div>

                    {/* Hover button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="bg-white/95 text-slate-900 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                        {photo.mediaType === 'VIDEO' ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                            Reproducir Video
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                            Ampliar en HD
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Body description */}
                  <div className="p-4 space-y-2.5">
                    {/* Category pill & Provider */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catInfo.color}`}
                      >
                        <span>{catInfo.icon}</span>
                        <span className="truncate max-w-[170px]">{catInfo.label}</span>
                      </span>

                      <span
                        className={`text-[9.5px] font-black px-1.5 py-0.5 rounded uppercase ${
                          isNova ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {photo.provider}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-black text-slate-900 line-clamp-1 leading-snug" title={photo.title}>
                      {photo.title}
                    </h4>

                    {/* Notes preview */}
                    {photo.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed" title={photo.notes}>
                        {photo.notes}
                      </p>
                    )}

                    {/* Inspector */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[140px]">👤 {photo.responsible}</span>
                      <span className="font-mono">{photo.fileSize}</span>
                    </div>
                  </div>
                </div>

                {/* Footer quick action bar */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(photo);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-xs font-bold flex items-center gap-1"
                    title="Descargar fotografía"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Bajar</span>
                  </button>

                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Eliminar de expediente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border-2 border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1A1A2E] to-[#1E293B] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Subir Fotografías &amp; Videos al Expediente</h3>
                  <p className="text-xs text-slate-300">
                    Registro de ingreso físico a sede STOL (Horómetro, Mástil, Carrocería, Actas y Videos de Incidencias)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mkv,.avi"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />

                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center text-amber-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center text-rose-500">
                    <Film className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-sm font-black text-slate-800">
                  Arrastra aquí tus fotos o videos de incidencias o haz clic para examinar
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Soporta fotografías (.JPG, .PNG, .WEBP) y videos de incidentes (.MP4, .MOV, .WEBM). Los videos se optimizan para visualización inmediata.
                </p>

                {isUploading && (
                  <div className="mt-3 text-xs font-bold text-amber-600 flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Procesando archivo multimedia...</span>
                  </div>
                )}
              </div>

              {/* Staged photos and videos preview */}
              {stagedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Archivos seleccionados ({stagedFiles.length}):</span>
                    <button
                      onClick={() => setStagedFiles([])}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {stagedFiles.map((st, i) => (
                      <div
                        key={i}
                        className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group bg-slate-900"
                      >
                        {st.mediaType === 'VIDEO' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2 text-center">
                            {st.posterUrl ? (
                              <img src={st.posterUrl} alt={`Thumb ${i}`} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            ) : null}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                              <Film className="w-6 h-6 text-rose-400" />
                              <span className="text-[9px] font-black uppercase text-white bg-rose-600/90 px-1.5 py-0.5 rounded">
                                VIDEO {st.duration || ''}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <img src={st.dataUrl} alt={`Foto ${i}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => setStagedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100 z-20 cursor-pointer"
                          title="Quitar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1 py-0.2 rounded font-mono z-10">
                          {st.sizeString}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                {/* Equipment code */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Equipo STOL a Asignar *</label>
                  <select
                    value={newEquipCode}
                    onChange={(e) => setNewEquipCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FLEET_EQUIPOS.map((eq) => (
                      <option key={eq.codigo} value={eq.codigo}>
                        {eq.codigo} — {eq.proveedor} ({eq.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Categoría de Fotografía o Video *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ReceptionPhotoCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, item]) => (
                      <option key={k} value={k}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Initial Horometer */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Horómetro al Momento de Captura (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newHorometer}
                    onChange={(e) => setNewHorometer(e.target.value)}
                    placeholder="Ej. 14.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Fecha de Registro *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Estatus del Equipo *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ReceptionStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CONFORME">✅ Conforme (Sin Daños ni Desvíos)</option>
                    <option value="OBSERVADO">⚠️ Con Observaciones (Raspón, Falla o Fuga)</option>
                    <option value="CONDICIONADO">🟡 Condicionado (Pendiente Regularizar)</option>
                  </select>
                </div>

                {/* Responsible */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Inspector / Reportado por</label>
                  <input
                    type="text"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza (Jefe de Patio)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Título del Registro</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Video de falla de elevación en mástil o Foto de horómetro inicial"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Notas Técnicas / Observaciones de Patio
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detallar condiciones de llegada, falla reportada, batería, daños o circunstancias del video..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveReceptionPhoto}
                disabled={stagedFiles.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar en Expediente ({stagedFiles.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FULL-SCREEN LIGHTBOX MODAL */}
      {currentLightboxPhoto && lightboxPhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 md:p-6 select-none animate-in fade-in duration-200">
          {/* Top toolbar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-sm bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg">
                {currentLightboxPhoto.equipmentCode}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white truncate max-w-md">{currentLightboxPhoto.title}</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Foto {lightboxPhotoIndex + 1} de {filteredPhotos.length} · {currentLightboxPhoto.date}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {currentLightboxPhoto.mediaType !== 'VIDEO' && (
                <>
                  <button
                    onClick={() => setLightboxZoom((z) => Math.min(2.5, z + 0.25))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Acercar (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLightboxZoom((z) => Math.max(0.75, z - 0.25))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Alejar (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLightboxZoom(1)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Restablecer Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => downloadImage(currentLightboxPhoto)}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title={currentLightboxPhoto.mediaType === 'VIDEO' ? 'Descargar Video' : 'Descargar Foto'}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {currentLightboxPhoto.mediaType === 'VIDEO' ? 'Bajar Video' : 'Descargar'}
                </span>
              </button>
              <button
                onClick={() => setLightboxPhotoIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-2"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main stage with prev/next buttons */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-3">
            {/* Prev button */}
            <button
              onClick={prevLightbox}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Media display (Image or Video) */}
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              {currentLightboxPhoto.mediaType === 'VIDEO' ? (
                <video
                  src={currentLightboxPhoto.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl bg-black"
                />
              ) : (
                <img
                  src={currentLightboxPhoto.imageUrl}
                  alt={currentLightboxPhoto.title}
                  style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.2s ease-out' }}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              )}
            </div>

            {/* Next button */}
            <button
              onClick={nextLightbox}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom details card */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 text-white text-xs shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    STATUS_CONFIG[currentLightboxPhoto.status].bg
                  } text-white`}
                >
                  {STATUS_CONFIG[currentLightboxPhoto.status].label}
                </span>

                <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[currentLightboxPhoto.category]?.icon}{' '}
                  {CATEGORY_LABELS[currentLightboxPhoto.category]?.label}
                </span>

                {currentLightboxPhoto.initialHorometer !== undefined && (
                  <span className="text-[11px] font-mono font-black text-amber-400">
                    ⏱️ Horómetro de Entrada: {currentLightboxPhoto.initialHorometer} h
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-xs">{currentLightboxPhoto.notes}</p>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-[11px] shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4">
              <div>
                <div className="text-white font-bold">{currentLightboxPhoto.responsible}</div>
                <div>Subido: {currentLightboxPhoto.uploadedAt}</div>
              </div>

              <button
                onClick={(e) => handleDeletePhoto(currentLightboxPhoto.id, e)}
                className="p-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Eliminar de expediente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
