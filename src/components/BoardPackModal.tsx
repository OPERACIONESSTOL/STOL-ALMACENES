import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { StolLogo } from './StolLogo';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Target,
  ShieldCheck,
  Calendar,
  Clock,
  Box,
  Truck,
  Users,
  Building,
  Plus,
} from 'lucide-react';

interface BoardPackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoardPackModal: React.FC<BoardPackModalProps> = ({ isOpen, onClose }) => {
  const { boardAgreements, addBoardAgreement, updateAgreementStatus, lastOperationFeed } = useRole();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'ALTA' | 'MEDIA' | 'ESTRATEGICA'>('ALTA');
  const [newDeadline, setNewDeadline] = useState('30 Nov 2026');

  if (!isOpen) return null;

  const handleCreateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;
    addBoardAgreement({
      observationId: 'manual-board-directive',
      title: newTitle,
      agreementText: newText,
      approvedBy: 'Acuerdo de Sesión de Directorio',
      priority: newPriority,
      deadline: newDeadline,
      status: 'EN_CURSO',
    });
    setNewTitle('');
    setNewText('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 pr-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Documento Confidencial de Directorio
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-cyan-300 font-mono">Sesión Semestral Q4 2026</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>DOSSIER EJECUTIVO DE DIRECTORIO · STOL</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
                Informe de consolidación estratégica elaborado con información alimentada por el Área de
                Operaciones en sede, diseñado para la evaluación y toma de decisiones del Directorio.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 text-slate-800 text-xs">
          {/* Metadata Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-slate-600">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Sede Operativa: <b>Almacén Central STOL Huachipa</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Última Carga por Operaciones: <b>{lastOperationFeed}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Frecuencia Presencial Directorio: <b>Semestral (2 veces/año)</b></span>
            </div>
          </div>

          {/* Section 1: Macro Scorecard */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                1. Cuadro de Mando Integral: Los 4 Pilares del Negocio
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Fuente: Jefatura de Operaciones</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Pilar 1 */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase">Supervisores</span>
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">84.3%</div>
                <div className="text-[11px] text-rose-600 font-bold">Meta 98% (Brecha -13.7 pts)</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  Menor nota: Pedro Oliva (77.6%)
                </div>
              </div>

              {/* Pilar 2 */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase">Horas Extras</span>
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">14,128.6 h</div>
                <div className="text-[11px] text-orange-600 font-bold">41.9% Dominicales (5,926 h)</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  Concentración: Picking (31.7%)
                </div>
              </div>

              {/* Pilar 3 */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase">Volumetría WMS</span>
                  <Box className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">473.9 m³</div>
                <div className="text-[11px] text-emerald-600 font-bold">70.2% SKUs Catalogados</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  3 Discrepancias críticas WMS
                </div>
              </div>

              {/* Pilar 4 */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase">Flota Alquilada</span>
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">98.5%</div>
                <div className="text-[11px] text-slate-600 font-bold">19 Equipos (NOVA/DERCO)</div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  24.5h inoperativas en KGR-241
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Libro Digital de Acuerdos e Instrucciones del Directorio */}
          <div>
            <div className="flex flex-wrap items-center justify-between mb-3 border-b border-slate-200 pb-2 gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. Libro Digital de Acuerdos e Instrucciones del Directorio
                </h3>
                <p className="text-[11px] text-slate-500">
                  Directivas formales emitidas por el Directorio a la Gerencia General para cumplimiento en sede
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Acuerdo</span>
              </button>
            </div>

            {/* Form to add agreement */}
            {showAddForm && (
              <form
                onSubmit={handleCreateAgreement}
                className="bg-blue-50/60 border-2 border-blue-200 rounded-2xl p-4 mb-4 space-y-3 animate-in fade-in"
              >
                <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wide">
                  Nuevo Acuerdo de Sesión de Directorio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Título del Acuerdo / Mandato:
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej: Aprobación de adenda tarifaria por cubicaje WMS..."
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Prioridad:</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    >
                      <option value="ALTA">Alta Prioridad</option>
                      <option value="ESTRATEGICA">Estratégica</option>
                      <option value="MEDIA">Media</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Instrucción Detallada para la Gerencia General:
                  </label>
                  <textarea
                    rows={2}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Detalle de la instrucción, recursos aprobados y responsabilidades..."
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Plazo Máximo:</span>
                    <input
                      type="text"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="text-xs p-1 bg-white border border-slate-300 rounded-lg w-28 text-center font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-700 text-white font-bold hover:bg-blue-800"
                    >
                      Asentar en Acta
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Agreements List */}
            <div className="space-y-2.5">
              {boardAgreements.map((agr) => (
                <div
                  key={agr.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                          agr.priority === 'ESTRATEGICA'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : agr.priority === 'ALTA'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {agr.priority}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{agr.title}</h4>
                      <span className="text-slate-400 text-[10.5px]">({agr.decisionDate})</span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{agr.agreementText}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5">
                      <span>Plazo: <b>{agr.deadline}</b></span>
                      <span>Autoridad: <b>{agr.approvedBy}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={agr.status}
                      onChange={(e) => updateAgreementStatus(agr.id, e.target.value as any)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer ${
                        agr.status === 'CUMPLIDO'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : agr.status === 'EN_CURSO'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="PENDIENTE_EJECUCION">Pendiente</option>
                      <option value="EN_CURSO">En Curso</option>
                      <option value="CUMPLIDO">Cumplido</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Legal & Board Certification */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Certificación de Confiabilidad Operativa
            </div>
            <p className="text-[11px] leading-relaxed">
              La información presentada en esta Intranet ha sido alimentada y convalidada por las Jefaturas de
              Operaciones, Flota, Auditoría SIG y RRHH de STOL Operador Logístico. Este dossier sirve de base para las
              deliberaciones ordinarias y extraordinarias del Directorio Corporativo.
            </p>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            STOL Operador Logístico · Sistema de Inteligencia y Control Directorial
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Cerrar Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
