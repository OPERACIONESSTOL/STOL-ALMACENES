import React, { useState } from 'react';
import { StolLogo } from '../components/StolLogo';
import {
  Building2,
  PackageCheck,
  Truck,
  ShieldCheck,
  Layers,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Box,
  BarChart2,
  Maximize2,
  X,
  Eye,
  Check,
  Copy,
  FileText,
  AlertCircle,
  ExternalLink,
  Target,
  Award,
  Shield,
  Camera,
  Activity,
  Briefcase,
  Users,
} from 'lucide-react';

const STOL_TEAM_IMAGE = '/assets/aistudio/03d8a98b-3b63-4c74-842a-d7038b26a382_84f13131.jpg';

interface PublicWebsiteViewProps {
  onEnterIntranet: () => void;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({ onEnterIntranet }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    servicioInteres: 'Gestión de almacenamiento',
    mensaje: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({
        nombre: '',
        empresa: '',
        email: '',
        telefono: '',
        servicioInteres: 'Gestión de almacenamiento',
        mensaje: '',
      });
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP HEADER / NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Corporate Identification */}
          <div className="flex items-center gap-3">
            <StolLogo variant="header" />
          </div>

          {/* Institutional Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[11.5px] font-bold text-slate-600 uppercase tracking-wider">
            <a href="#inicio" className="hover:text-blue-600 transition-colors">
              Inicio
            </a>
            <a href="#quienes-somos" className="hover:text-blue-600 transition-colors">
              Quiénes Somos
            </a>
            <a href="#mision-vision" className="hover:text-blue-600 transition-colors">
              Misión & Visión
            </a>
            <a href="#cadena-valor" className="hover:text-blue-600 transition-colors">
              Cadena de Valor
            </a>
            <a href="#servicios" className="hover:text-blue-600 transition-colors">
              Servicios
            </a>
            <a href="#infraestructura" className="hover:text-blue-600 transition-colors">
              Sede & Flota
            </a>
            <a href="#certificaciones" className="hover:text-blue-600 transition-colors">
              Certificaciones
            </a>
            <a href="#clientes" className="hover:text-blue-600 transition-colors">
              Clientes
            </a>
            <a href="#contacto" className="hover:text-blue-600 transition-colors">
              Contacto
            </a>
          </nav>

          {/* Portal Access Button (Bridge to Private Intranet) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onEnterIntranet}
              className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-slate-900/10 cursor-pointer"
              title="Acceso exclusivo para el Directorio, Gerencia y Jefaturas de STOL"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white transition-colors" />
              <span>Acceso Intranet STOL</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-blue-500/30 text-[10px] text-cyan-200 border border-blue-400/40">
                Directorio & Jefaturas
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION: IDENTIDAD & ESLOGAN CORPORATIVO */}
      <section id="inicio" className="relative bg-gradient-to-b from-slate-950 via-[#0B1528] to-slate-900 text-white py-20 lg:py-28 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Official Identity & Mission Hook */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-cyan-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>STOL | Almacenes y Depósitos · Operador Logístico</span>
              </div>

              {/* Official Corporate Slogan */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Almacenamiento, Distribución y Control de Inventario con Precisión Total
              </h1>

              {/* Official Definition */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Somos un operador logístico a la medida de las necesidades de cada negocio. Brindamos servicios
                especializados en recepción de proveedores nacionales, recepción de importaciones, picking y packing,
                despacho, control de inventario y gestión integral de almacenamiento.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href="#contacto"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contactar Equipo Directivo</span>
                </a>

                <button
                  onClick={onEnterIntranet}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-all cursor-pointer backdrop-blur-xs"
                >
                  <Lock className="w-4 h-4 text-cyan-300" />
                  <span>Ingresar a la Intranet de Gestión</span>
                </button>
              </div>

              {/* 3 Pillars of Service (Official) */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-cyan-400 block">Pilar 1</span>
                  <div className="font-bold text-xs text-white">Gestión integral de almacenamiento</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-cyan-400 block">Pilar 2</span>
                  <div className="font-bold text-xs text-white">Recepción nacional e importaciones</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-cyan-400 block">Pilar 3</span>
                  <div className="font-bold text-xs text-white">Trazabilidad y seguridad total</div>
                </div>
              </div>
            </div>

            {/* Right Column: Verified Facility & Team Showcase Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-950/90 border-2 border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md relative group">
                <div
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative aspect-4/3 overflow-hidden cursor-pointer bg-slate-900"
                  title="Haga clic para ampliar en alta resolución"
                >
                  <img
                    src={STOL_TEAM_IMAGE}
                    alt="Equipo Operativo y Patio de Maniobras de STOL en Sede San Martín de Porres"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-[10.5px] font-black uppercase text-cyan-300 border border-cyan-500/30 shadow-md">
                    Sede San Martín de Porres · Patio Central
                  </div>

                  {/* Expand button */}
                  <div className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-white hover:text-cyan-400 border border-slate-700 transition-colors shadow-md">
                    <Maximize2 className="w-4 h-4" />
                  </div>

                  {/* Bottom overlay text */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      Instalaciones y Equipo Operativo STOL
                    </div>
                    <p className="text-[11px] text-slate-200 font-medium line-clamp-2">
                      Fotografía oficial del personal en patio de maniobras, maquinaria de carga y naves de almacenamiento.
                    </p>
                  </div>
                </div>

                {/* Directorial Portal Card Banner */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                  <div className="p-3.5 bg-gradient-to-r from-blue-950 to-indigo-950 rounded-2xl border border-blue-800/60 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase">Acceso Exclusivo Intranet</h4>
                      <p className="text-[10.5px] text-blue-200">
                        Visualización de indicadores de gestión para Directorio y Jefaturas.
                      </p>
                    </div>
                    <button
                      onClick={onEnterIntranet}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shrink-0 cursor-pointer transition-colors shadow-md"
                    >
                      Ingresar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ¿QUIÉNES SOMOS? */}
      <section id="quienes-somos" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
              Identidad & Propósito
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ¿Quiénes somos?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              "Un operador logístico a la medida de su negocio."
            </p>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Brindamos servicios especializados para las necesidades específicas de nuestros clientes, que comprenden
              recepción de proveedores nacionales, recepción de importaciones, picking/packing, despacho, control de inventario
              y gestión de almacenamiento.
            </p>
          </div>

          {/* 3 Pilares Corporativos Declarados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                1. Gestión Integral de Almacenamiento
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Custodia segura de mercaderías con optimización de espacios y control riguroso de inventarios bajo
                procedimientos operativos precisos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                2. Recepción Nacional e Importaciones
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Atención y verificación minuciosa del ingreso de carga tanto de proveedores locales como de contenedores
                de importación en rampa.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                3. Trazabilidad y Seguridad Total
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seguimiento integral de cada lote y SKU, resguardo seguro de los inventarios y cumplimiento de estrictos
                estándares de seguridad de la cadena de suministro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MISIÓN Y VISIÓN EMPRESARIAL */}
      <section id="mision-vision" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
              Dirección Estratégica
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Misión y Visión Empresarial
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Directrices fundamentales de STOL para orientar el servicio al cliente y la excelencia operativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Misión Card */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-blue-500/30">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10.5px] font-black uppercase text-cyan-400 tracking-wider">
                    Propósito Corporativo
                  </span>
                  <h3 className="text-2xl font-black text-white">Misión</h3>
                </div>
              </div>

              <blockquote className="text-sm sm:text-base text-slate-200 leading-relaxed italic border-l-4 border-cyan-400 pl-4 py-1">
                "Ser la Empresa Logística referente del sector, brindando las mejores soluciones integrales a nuestros
                clientes para mejorar sus procesos y costos, beneficiando directamente su cadena de suministro."
              </blockquote>
            </div>

            {/* Visión Card */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10.5px] font-black uppercase text-cyan-400 tracking-wider">
                    Aspiración de Liderazgo
                  </span>
                  <h3 className="text-2xl font-black text-white">Visión</h3>
                </div>
              </div>

              <blockquote className="text-sm sm:text-base text-slate-200 leading-relaxed italic border-l-4 border-blue-500 pl-4 py-1">
                "Ser el Operador Logístico líder en el mercado, logrando el reconocimiento de nuestros clientes gracias a la
                excelencia y la calidad operativa ofrecida en todos nuestros servicios."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CADENA DE VALOR LOGÍSTICA & PRINCIPIOS */}
      <section id="cadena-valor" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
              Enfoque Operativo
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Cadena de Valor Logística
            </h2>
            <div className="inline-block px-3.5 py-1 rounded-full bg-blue-50 text-blue-900 font-bold text-xs border border-blue-200">
              Objetivo General: Excelencia Operativa
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
              "Estructuramos cada servicio con instrucciones detalladas para garantizar un producto final de alta calidad y
              máxima agilidad, como parte de nuestra visión empresarial."
            </p>
          </div>

          {/* Principios Operativos vs Valores y Atributos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Principios Operativos */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Principios Operativos
              </h3>
              <p className="text-xs text-slate-500">
                Pautas de ejecución que guían la labor de cada supervisor y operario en sede:
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Trazabilidad total de la mercadería</strong>
                    <span className="text-slate-500 text-[11px]">Control y seguimiento minucioso en cada etapa del flujo.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Resguardo seguro de los inventarios</strong>
                    <span className="text-slate-500 text-[11px]">Custodia física y control de accesos para la protección de la carga.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 block text-xs">Procedimientos precisos, sin errores</strong>
                    <span className="text-slate-500 text-[11px]">Estandarización de procesos para minimizar mermas y desvíos.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: Valores y Atributos */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Valores y Atributos Destacados
              </h3>
              <p className="text-xs text-slate-500">
                Cultura de servicio y compromiso organizacional de STOL:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-base font-black text-blue-900 uppercase">Agilidad</div>
                  <p className="text-[11px] text-slate-500">Respuesta oportuna en rampa y despacho.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-base font-black text-blue-900 uppercase">Responsabilidad</div>
                  <p className="text-[11px] text-slate-500">Compromiso estricto con los acuerdos.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-base font-black text-blue-900 uppercase">Confianza</div>
                  <p className="text-[11px] text-slate-500">Relaciones sólidas y transparentes.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-base font-black text-blue-900 uppercase">Excelencia</div>
                  <p className="text-[11px] text-slate-500">Calidad operativa en cada proceso.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PORTAFOLIO DE SERVICIOS (LOS 6 OFICIALES AUTORIZADOS) */}
      <section id="servicios" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
              Portafolio Oficial STOL
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Servicios Especializados
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Líneas de servicio estructuradas según la presentación corporativa STOL 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Servicio 01</span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Recepción de Carga
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Atención y verificación minuciosa de proveedores nacionales e importaciones."
                </p>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Servicio 02</span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Picking & Packing
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Preparación precisa de pedidos y empaque optimizado para su distribución."
                </p>
              </div>
            </div>

            {/* Service 3 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Servicio 03</span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Cross Docking
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Transferencia ágil de mercadería sin almacenamiento prolongado."
                </p>
              </div>
            </div>

            {/* Service 4 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Box className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Servicio 04</span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Almacenamiento
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Control de inventarios con custodia segura y optimización de espacios."
                </p>
              </div>
            </div>

            {/* Service 5 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Servicio 05</span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Despacho & Salida
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Proceso final de salida coordinado, garantizando entregas oportunas."
                </p>
              </div>
            </div>

            {/* Service 6 */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Servicio 06</span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Logística Inversa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Recepción, inspección y reincorporación eficiente de inventarios devueltos."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSTALACIONES & FOTOGRAFÍA VERIFICADA DE SEDE */}
      <section id="infraestructura" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
              Sede Central STOL
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Instalaciones & Equipo Operativo en Sede
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ubicación en Chuquitanta, San Martín de Porres. Patio central de maniobras, naves de almacenamiento y equipo de supervisión y rampa.
            </p>
          </div>

          {/* Panoramic Container */}
          <div className="bg-slate-950 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl group relative">
            <div
              onClick={() => setIsImageModalOpen(true)}
              className="relative overflow-hidden cursor-pointer bg-slate-900"
            >
              <img
                src={STOL_TEAM_IMAGE}
                alt="Fotografía Oficial del Equipo y Patio de Maniobras de STOL"
                className="w-full h-[360px] sm:h-[480px] lg:h-[600px] object-cover object-top transition-transform duration-700 group-hover:scale-102"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />

              {/* Top Banner on image */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md text-xs font-black text-cyan-300 border border-cyan-500/30">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Fotografía Oficial en Patio de Maniobras · Sede San Martín de Porres</span>
                </div>

                <div className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md text-xs font-bold text-white hover:text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg">
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>Ver en Pantalla Completa HD</span>
                </div>
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 pointer-events-none">
                <div className="max-w-2xl bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg">
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                    Sede Operativa STOL
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Equipo Humano, Flota de Carga y Patio de Maniobras
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Av. Las Huertas S/N Lote 4A, Chuquitanta, San Martín de Porres, Lima - Perú.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageModalOpen(true);
                  }}
                  className="pointer-events-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspeccionar en HD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CERTIFICACIONES Y SEGURIDAD DECLARADAS */}
      <section id="certificaciones" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
              Seguridad & Estándares Declarados
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Certificaciones y Seguridad
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Estándares y mecanismos de control reportados en la presentación corporativa STOL 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ISO 9001 */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                ISO 9001: Calidad
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Sistema de Gestión de Calidad estandarizado, orientado a la mejora continua y trazabilidad de procesos."
              </p>
            </div>

            {/* BASC */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Certificación BASC
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Estándar internacional de control y seguridad que protege la cadena de suministro del comercio ilícito."
              </p>
            </div>

            {/* CCTV 24/7 */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Monitoreo CCTV 24/7
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Videovigilancia permanente, control de accesos estricto y cumplimiento de Seguridad y Salud Ocupacional."
              </p>
            </div>
          </div>

          {/* Mandatory Transparency Disclaimer Box */}
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11.5px] leading-relaxed">
              <strong>Nota de transparencia informativa:</strong> Estos contenidos reflejan lo declarado en la presentación corporativa
              STOL 2026. Por política de integridad de datos, no se publican números de registro, fechas de vigencia ni alcances específicos
              hasta que sean acreditados mediante la documentación oficial correspondiente.
            </p>
          </div>
        </div>
      </section>

      {/* 9. PRINCIPALES CLIENTES AUTORIZADOS */}
      <section id="clientes" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
              Confianza Empresarial
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Principales Clientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Empresas y cuentas identificadas en la presentación corporativa STOL 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Promart */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Retail & Mejoramiento
                </span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                PROMART HOMECENTER
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Cadena de tiendas de mejoramiento del hogar y retail, del grupo peruano Intercorp, dedicada a materiales
                de construcción, acabados y decoración."
              </p>
            </div>

            {/* Grupo Muya */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Servicios & Parques
                </span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                GRUPO MUYA
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Empresa dedicada a administrar y operar parques cementerios bajo la marca Parque Ecológico Esperanza Eterna."
              </p>
            </div>

            {/* Yarqa Asesores */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Gestión de Proyectos
                </span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                YARQA ASESORES
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Compañía dedicada a la administración customizada de proyectos y empresas de pequeña y mediana envergadura."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. INTEGRACIÓN CON DASHBOARD EJECUTIVO & TELEMETRÍA REAL */}
      <section className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
              Control & Auditoría Operativa
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Plataforma de Inteligencia & Telemetría STOL
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Módulos de información operativa centralizados para la toma de decisiones del Directorio, la Gerencia y las Jefaturas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            {/* Modulo 1 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Módulo 1</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm">Volumetría & SKUs</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Mediciones físicas en rampa para validación contra fichas técnicas WMS y detección de sobrecubicaje.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                Fuente: Maestro Excel de Patio
              </div>
            </div>

            {/* Modulo 2 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Módulo 2</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm">Horas Extras (HHEE)</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Auditoría de sobretiempos diurnos, dominicales y días de bono por área operativa.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                Fuente: Planillas auditadas HHEE
              </div>
            </div>

            {/* Modulo 3 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Módulo 3</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm">Desempeño Supervisores</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Evaluación integral bajo la matriz 60/20/20 (Operaciones 60%, SIG 20%, RRHH 20%).
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                Fuente: Comité de Auditoría STOL
              </div>
            </div>

            {/* Modulo 4 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Módulo 4</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm">Control de Flota</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Monitoreo de 19 unidades (montacargas y apiladores) con registro de horómetros y paradas de mantenimiento.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                Fuente: Bitácora de Horómetros Sede
              </div>
            </div>
          </div>

          {/* Intranet Call to Action */}
          <div className="p-6 bg-gradient-to-r from-blue-950 to-indigo-950 rounded-3xl border border-blue-800/60 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                ¿Requiere consultar los indicadores operativos en vivo?
              </h3>
              <p className="text-xs text-blue-200">
                El Directorio y la Gerencia pueden acceder a la Intranet desde cualquier dispositivo.
              </p>
            </div>
            <button
              onClick={onEnterIntranet}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-cyan-300" />
              <span>Abrir Intranet STOL</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. CONTACTO CORPORATIVO OFICIAL */}
      <section id="contacto" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Official Closing Message */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
              Comuníquese con STOL
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
              ¿Listo para optimizar su logística?
            </h2>
            <p className="text-lg sm:text-xl font-bold text-cyan-300">
              Conversemos sobre su operación.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Póngase en contacto con nuestro equipo directivo y descubra cómo podemos mejorar su cadena de suministro.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Official Contact Data */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Datos de Contacto Directivo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atención comercial y técnica de STOL | Almacenes y Depósitos.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Phone */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Teléfono de Contacto</span>
                      <strong className="text-slate-900 text-sm font-mono">+51 933 597 681</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyText('+51 933 597 681', 'telefono')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors"
                    title="Copiar teléfono"
                  >
                    {copiedField === 'telefono' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Email */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo Electrónico Oficial</span>
                      <strong className="text-slate-900 text-sm font-mono">fprado@stol.pe</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyText('fprado@stol.pe', 'email')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors"
                    title="Copiar correo"
                  >
                    {copiedField === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Address */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dirección de la Sede</span>
                      <p className="text-slate-800 font-bold leading-relaxed">
                        Av. Las Huertas S/N Lote 4A, Chuquitanta, San Martín de Porres, Lima - Perú
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleCopyText(
                        'Av. Las Huertas S/N Lote 4A, Chuquitanta, San Martín de Porres, Lima - Perú',
                        'direccion'
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors shrink-0"
                    title="Copiar dirección"
                  >
                    {copiedField === 'direccion' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Functional Direct Contact Message Form */}
            <div className="lg:col-span-7 bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-black text-slate-900 uppercase mb-2">
                Enviar Mensaje al Equipo Directivo
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Su mensaje será canalizado directamente a la jefatura comercial y operativa (fprado@stol.pe).
              </p>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-sm">¡Mensaje registrado con éxito!</h4>
                  <p className="text-xs text-emerald-800">
                    El equipo directivo de STOL revisará su requerimiento a la brevedad.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej. Roberto Gómez"
                        value={contactForm.nombre}
                        onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Empresa / Razón Social *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej. Distribuidora Logística S.A."
                        value={contactForm.empresa}
                        onChange={(e) => setContactForm({ ...contactForm, empresa: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="contacto@empresa.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Teléfono de Contacto *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+51 900 000 000"
                        value={contactForm.telefono}
                        onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Servicio de Interés</label>
                    <select
                      value={contactForm.servicioInteres}
                      onChange={(e) => setContactForm({ ...contactForm, servicioInteres: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-bold"
                    >
                      <option value="Recepción de carga">Recepción de carga</option>
                      <option value="Picking & Packing">Picking & Packing</option>
                      <option value="Cross Docking">Cross Docking</option>
                      <option value="Gestión de almacenamiento">Almacenamiento y control de inventario</option>
                      <option value="Despacho & Salida">Despacho & Salida</option>
                      <option value="Logística inversa">Logística inversa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Detalle de su Requerimiento</label>
                    <textarea
                      rows={4}
                      placeholder="Describa brevemente las necesidades de su operación logística..."
                      value={contactForm.mensaje}
                      onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar Requerimiento a fprado@stol.pe</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER INSTITUCIONAL */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="space-y-1">
              <StolLogo variant="sidebar" />
              <p className="text-[11px] text-slate-400 mt-2">
                STOL | Almacenes y Depósitos · Operador Logístico
              </p>
              <p className="text-[10px] text-slate-500">
                Av. Las Huertas S/N Lote 4A, Chuquitanta, San Martín de Porres, Lima - Perú
              </p>
            </div>

            {/* Direct Link to Intranet */}
            <div className="flex items-center gap-3">
              <button
                onClick={onEnterIntranet}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-900 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Portal Intranet STOL (Directorio & Jefaturas)</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>&copy; 2026 STOL. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <span>Almacenamiento</span>
              <span>·</span>
              <span>Distribución</span>
              <span>·</span>
              <span>Control de Inventario</span>
            </div>
          </div>
        </div>
      </footer>

      {/* FULLSCREEN HD IMAGE LIGHTBOX MODAL */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-black tracking-tight">
                Instalaciones & Equipo Operativo · Sede San Martín de Porres (Alta Resolución)
              </h3>
            </div>
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          </div>

          {/* Image Container */}
          <div
            className="w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl relative bg-slate-950 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={STOL_TEAM_IMAGE}
              alt="Fotografía Oficial en Alta Resolución del Equipo STOL"
              className="w-full h-auto max-h-[82vh] object-contain select-none"
            />
          </div>

          <div className="w-full max-w-6xl pt-3 text-center text-xs text-slate-400">
            Fotografía tomada en el patio central de maniobras de STOL | Almacenes y Depósitos (Chuquitanta, San Martín de Porres, Lima).
          </div>
        </div>
      )}
    </div>
  );
};
