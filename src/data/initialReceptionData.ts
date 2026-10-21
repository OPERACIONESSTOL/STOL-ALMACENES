import { EquipmentReceptionPhoto } from '../types/fleet';

// High-fidelity SVG visual placeholders for initial mock evidence
const createSvgDataUrl = (title: string, subtitle: string, code: string, color: string, badge: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#111827" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#bg)" />
    <rect width="800" height="600" fill="url(#grid)" />
    
    <!-- Outer frame -->
    <rect x="25" y="25" width="750" height="550" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
    
    <!-- Top banner -->
    <rect x="25" y="25" width="750" height="70" rx="16" fill="${color}" fill-opacity="0.2" />
    <text x="50" y="68" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="1">STOL · ACTA DE RECEPCIÓN TÉCNICA DE EQUIPO</text>
    
    <!-- Badge -->
    <rect x="630" y="44" width="120" height="32" rx="16" fill="${color}" />
    <text x="690" y="65" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#ffffff" text-anchor="middle">${badge}</text>
    
    <!-- Equipment Icon & Frame -->
    <rect x="60" y="125" width="310" height="400" rx="12" fill="#090d16" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
    <circle cx="215" cy="270" r="85" fill="${color}" fill-opacity="0.15" />
    <path d="M170 290 L170 230 L230 230 L255 260 L255 290 Z" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="185" cy="295" r="15" fill="#ffffff" />
    <circle cx="240" cy="295" r="15" fill="#ffffff" />
    <path d="M265 240 L285 240 L285 305 L265 305" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
    
    <text x="215" y="380" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1">${code}</text>
    <text x="215" y="410" font-family="system-ui, sans-serif" font-weight="600" font-size="14" fill="#94a3b8" text-anchor="middle">Inspección Física en Sede STOL</text>
    
    <!-- Technical Data Sheet side -->
    <rect x="395" y="125" width="345" height="400" rx="12" fill="#090d16" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
    <text x="420" y="165" font-family="system-ui, sans-serif" font-weight="800" font-size="18" fill="#ffffff">${title}</text>
    <text x="420" y="190" font-family="system-ui, sans-serif" font-weight="500" font-size="13" fill="#cbd5e1">${subtitle}</text>
    
    <!-- Checklist items -->
    <line x1="420" y1="210" x2="715" y2="210" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
    
    <text x="420" y="240" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#38bdf8">✓ Horómetro Inicial:</text>
    <text x="590" y="240" font-family="monospace" font-weight="800" font-size="14" fill="#facc15">CERTIFICADO</text>
    
    <text x="420" y="275" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#38bdf8">✓ Mástil &amp; Cilindros:</text>
    <text x="590" y="275" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#4ade80">Sin fugas hidr.</text>
    
    <text x="420" y="310" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#38bdf8">✓ Batería / Motor:</text>
    <text x="590" y="310" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#4ade80">100% Operativo</text>
    
    <text x="420" y="345" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#38bdf8">✓ Llantas &amp; Rodillos:</text>
    <text x="590" y="345" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#4ade80">95% Vida útil</text>
    
    <text x="420" y="380" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#38bdf8">✓ Firma de Recepción:</text>
    <text x="590" y="380" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#facc15">Conforme STOL</text>
    
    <!-- Stamp at bottom -->
    <rect x="420" y="420" width="295" height="80" rx="8" fill="#1e293b" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="435" y="450" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#94a3b8">AUDITORÍA PATIO STOL · CONTROL DE FLOTA</text>
    <text x="435" y="470" font-family="system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748b">Registro digital de ingreso para auditoría de Directorio</text>
    <text x="435" y="488" font-family="monospace" font-weight="700" font-size="10" fill="#38bdf8">ID DOC: REC-STOL-2026-F</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_RECEPTION_PHOTOS: EquipmentReceptionPhoto[] = [
  {
    id: 'rec-001',
    equipmentCode: 'NOVATRANS 290',
    provider: 'NOVA',
    equipmentType: 'MONTACARGA',
    date: '2026-07-02',
    category: 'HOROMETRO',
    title: 'Lectura de Horómetro Inicial en Rampa de Descarga',
    initialHorometer: 14.5,
    notes: 'Recepción en rampa 3. Horómetro verificado y registrado en presencia del transportista de NOVATRANS. Unidad limpia sin abolladuras en contrapeso.',
    responsible: 'Ing. Carlos Mendoza (Jefe de Patio)',
    status: 'CONFORME',
    imageUrl: createSvgDataUrl(
      'Lectura de Horómetro Inicial',
      'Horómetro en 14.5 hrs al ingreso a sede',
      'NOVATRANS 290',
      '#2563eb',
      'HORÓMETRO 14.5h'
    ),
    fileName: 'recepcion_horometro_novatrans290.jpg',
    fileSize: '2.4 MB',
    uploadedAt: '2026-07-02 09:30',
  },
  {
    id: 'rec-002',
    equipmentCode: 'HER-160',
    provider: 'DERCO',
    equipmentType: 'ELEVADOR',
    date: '2026-07-05',
    category: 'MASTIL_HORQUILLAS',
    title: 'Inspección de Mástil Triplex y Cilindro Hidráulico',
    initialHorometer: 2.0,
    notes: 'Verificación de elevación a 9.5 metros. Se comprobó ausencia de fugas de aceite hidráulico en mangueras y estado impecable de uñas de elevador.',
    responsible: 'Téc. Marco Aurelio (Mecánica STOL)',
    status: 'CONFORME',
    imageUrl: createSvgDataUrl(
      'Inspección Mástil & Horquillas',
      'Prueba de elevación máxima y sellos',
      'HER-160',
      '#d97706',
      'ELEVADOR DERCO'
    ),
    fileName: 'elevador_her160_mastil.jpg',
    fileSize: '3.1 MB',
    uploadedAt: '2026-07-05 11:15',
  },
  {
    id: 'rec-003',
    equipmentCode: 'HGR-141',
    provider: 'DERCO',
    equipmentType: 'MONTACARGA',
    date: '2026-07-08',
    category: 'ACTA_ENTREGA',
    title: 'Acta de Entrega Oficial y Guía de Remisión DERCO',
    initialHorometer: 0.8,
    notes: 'Acta física firmada por el representante de DERCO y el Supervisor de Operaciones STOL. Se adjunta copia de póliza y manual de operador.',
    responsible: 'Felipe Prado (Operaciones STOL)',
    status: 'CONFORME',
    imageUrl: createSvgDataUrl(
      'Acta de Entrega & Guía',
      'Documento de recepción firmado conforme',
      'HGR-141',
      '#059669',
      'ACTA FIRMADA'
    ),
    fileName: 'acta_entrega_firmada_hgr141.pdf.jpg',
    fileSize: '1.8 MB',
    uploadedAt: '2026-07-08 15:40',
  },
  {
    id: 'rec-004',
    equipmentCode: 'KGR-465',
    provider: 'DERCO',
    equipmentType: 'MONTACARGA',
    date: '2026-07-12',
    category: 'DANOS_PREVIOS',
    title: 'Registro de Desgaste Preexistente en Pintura de Techo Protector',
    initialHorometer: 18.2,
    notes: 'Observación consignada en acta: raspón superficial en el parante izquierdo del protector de cabina proveniente del transporte. No compromete la estructura.',
    responsible: 'Ing. Carlos Mendoza (Jefe de Patio)',
    status: 'OBSERVADO',
    imageUrl: createSvgDataUrl(
      'Inspección de Carrocería Previa',
      'Raspón superficial consignado en acta',
      'KGR-465',
      '#e11d48',
      'OBSERVADO EN ACTA'
    ),
    fileName: 'evidencia_parante_kgr465.jpg',
    fileSize: '2.9 MB',
    uploadedAt: '2026-07-12 16:20',
  },
];
