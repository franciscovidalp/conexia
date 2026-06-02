import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Trash2, 
  PlusCircle, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Download,
  Inbox,
  X,
  Edit
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, Staff, PsychosocialCase, ClinicalSession, SchoolType, PsychosocialStatus, RiskLevel, ContactType } from '../types';
import { exportPsychosocialReportPDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface PsychosocialModuleProps {
  activeSchool: SchoolType;
  students: Student[];
  staff: Staff[];
  loggedInUser: Staff | null;
  psychosocialCases: PsychosocialCase[];
  onPsychosocialCasesChange: (cases: PsychosocialCase[]) => void;
}

export const PsychosocialModule: React.FC<PsychosocialModuleProps> = ({
  activeSchool,
  students,
  staff,
  loggedInUser,
  psychosocialCases: cachedCases,
  onPsychosocialCasesChange
}) => {
  const [cases, setCases] = useState<PsychosocialCase[]>(cachedCases);
  const [selectedCase, setSelectedCase] = useState<PsychosocialCase | null>(null);
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [editingSession, setEditingSession] = useState<ClinicalSession | null>(null);

  useEffect(() => {
    setCases(cachedCases);
  }, [cachedCases]);

  // Modal Session state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionContactType, setSessionContactType] = useState<ContactType>('Estudiante');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionAgreements, setSessionAgreements] = useState('');
  const [sessionProfessionalId, setSessionProfessionalId] = useState('');

  const isAdmin = loggedInUser?.role === 'Administrador';
  const isClinician = loggedInUser?.role === 'Psicólogo' || loggedInUser?.role === 'Trabajador Social' || loggedInUser?.role === 'Orientador';
  const canEditOrDelete = isAdmin || isClinician;

  // Modal Edit Case state
  const [isEditCaseModalOpen, setIsEditCaseModalOpen] = useState(false);
  const [editCaseRiskLevel, setEditCaseRiskLevel] = useState<RiskLevel>('Medio');
  const [editCaseReason, setEditCaseReason] = useState('');

  // Load cases (reset state on school change)
  useEffect(() => {
    setSelectedCase(null);
    setSessions([]);
  }, [activeSchool]);

  // Load sessions when case is selected
  useEffect(() => {
    if (selectedCase) {
      loadSessions(selectedCase.id);
    } else {
      setSessions([]);
    }
  }, [selectedCase]);



  const loadSessions = async (caseId: string) => {
    try {
      const res = await dbService.getClinicalSessions(caseId);
      setSessions(res);
    } catch (e) {
      toast.error('Error al cargar bitácora clínica.');
    }
  };

  const handleMoveStatus = async (caseId: string, newStatus: PsychosocialStatus) => {
    try {
      await dbService.updatePsychosocialCaseStatus(caseId, newStatus);
      const updated = cachedCases.map(c => c.id === caseId ? { ...c, status: newStatus } : c);
      onPsychosocialCasesChange(updated);
      if (selectedCase?.id === caseId) {
        setSelectedCase(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success(`Caso actualizado a: ${newStatus}`);
    } catch (e) {
      toast.error('Error al actualizar estado del caso.');
    }
  };

  const handleCleanOrphans = async () => {
    const studentIds = students.map(s => s.id);
    try {
      const count = await dbService.cleanOrphanedCases(studentIds);
      if (count > 0) {
        toast.success(`Limpieza completada: Se eliminaron ${count} casos huérfanos sin matrícula activa.`);
        const updated = cachedCases.filter(c => studentIds.includes(c.studentId));
        onPsychosocialCasesChange(updated);
        setSelectedCase(null);
      } else {
        toast.success('No se detectaron casos huérfanos en la base de datos.');
      }
    } catch (e) {
      toast.error('Error al ejecutar la limpieza de huérfanos.');
    }
  };

  const handleOpenSessionModal = () => {
    if (!selectedCase) return;
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionContactType('Estudiante');
    setSessionNotes('');
    setSessionAgreements('');
    setSessionProfessionalId(staff[0]?.rut || '');
    setEditingSession(null);
    setIsSessionModalOpen(true);
  };

  const handleOpenEditSessionModal = (sess: ClinicalSession) => {
    setEditingSession(sess);
    setSessionDate(sess.date);
    setSessionContactType(sess.contactType);
    setSessionNotes(sess.notes);
    setSessionAgreements(sess.agreements);
    setSessionProfessionalId(sess.professionalId);
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = async (sessId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta sesión clínica de la bitácora confidencial?')) {
      try {
        await dbService.deleteClinicalSession(sessId);
        setSessions(prev => prev.filter(s => s.id !== sessId));
        toast.success('Sesión eliminada.');
      } catch (e) {
        toast.error('Error al eliminar sesión.');
      }
    }
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    if (!sessionNotes.trim()) {
      toast.error('Debe ingresar las notas confidenciales de la sesión.');
      return;
    }
    if (!sessionProfessionalId) {
      toast.error('Debe seleccionar un profesional a cargo.');
      return;
    }

    const professional = staff.find(st => st.rut === sessionProfessionalId);
    if (!professional) {
      toast.error('Profesional no válido.');
      return;
    }

    try {
      const payload = {
        caseId: selectedCase.id,
        date: sessionDate,
        contactType: sessionContactType,
        notes: sessionNotes,
        agreements: sessionAgreements,
        professionalId: sessionProfessionalId,
        professionalName: `${professional.firstName} ${professional.lastName}`
      };

      if (editingSession) {
        await dbService.updateClinicalSession(editingSession.id, payload);
        setSessions(prev => prev.map(s => s.id === editingSession.id ? { ...s, ...payload } : s));
        toast.success('Sesión actualizada con éxito.');
      } else {
        const newSess = await dbService.createClinicalSession(payload);
        setSessions(prev => [newSess, ...prev]);
        toast.success('Sesión registrada con éxito.');
      }

      setIsSessionModalOpen(false);
    } catch (e) {
      toast.error('Error al guardar sesión clínica.');
    }
  };

  const handleExportClinicalPDF = () => {
    if (!selectedCase) return;
    const student = students.find(s => s.id === selectedCase.studentId);
    if (!student) {
      toast.error('Estudiante no encontrado en la caché global.');
      return;
    }

    exportPsychosocialReportPDF(selectedCase, student, sessions);
    toast.success('Expediente clínico exportado en PDF.');
  };

  const handleOpenEditCaseModal = (pc: PsychosocialCase) => {
    setEditCaseRiskLevel(pc.riskLevel);
    setEditCaseReason(pc.reason);
    setIsEditCaseModalOpen(true);
  };

  const handleSubmitEditCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    if (!editCaseReason.trim()) {
      toast.error('Debe ingresar un motivo del ingreso.');
      return;
    }

    try {
      const updates = {
        riskLevel: editCaseRiskLevel,
        reason: editCaseReason.trim()
      };
      await dbService.updatePsychosocialCase(selectedCase.id, updates);
      const updated = cachedCases.map(c => c.id === selectedCase.id ? { ...c, ...updates } : c);
      onPsychosocialCasesChange(updated);
      setSelectedCase(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Ficha psicosocial actualizada.');
      setIsEditCaseModalOpen(false);
    } catch (e) {
      toast.error('Error al actualizar la ficha.');
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (window.confirm('¿Está seguro de eliminar por completo este expediente psicosocial y todas sus sesiones? Esta acción no se puede deshacer.')) {
      try {
        await dbService.deletePsychosocialCase(caseId);
        const updated = cachedCases.filter(c => c.id !== caseId);
        onPsychosocialCasesChange(updated);
        setSelectedCase(null);
        toast.success('Expediente psicosocial eliminado del sistema.');
      } catch (e) {
        toast.error('Error al eliminar expediente.');
      }
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'Bajo': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'Medio': return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'Alto': return 'bg-orange-50 text-orange-700 border-orange-250';
      case 'Crítico': return 'bg-red-50 text-red-700 border-red-250';
    }
  };

  const columns: { status: PsychosocialStatus; title: string; color: string }[] = [
    { status: 'Ingresado', title: 'Casos Ingresados', color: 'border-t-indigo-500' },
    { status: 'En Intervención', title: 'En Intervención', color: 'border-t-primary' },
    { status: 'Derivado a Redes', title: 'Derivado a Redes', color: 'border-t-fuchsia-500' },
    { status: 'Alta Clínica', title: 'De Alta', color: 'border-t-emerald-500' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FolderLock className="text-primary" />
            <span>Dupla Psicosocial - Expedientes Clínicos</span>
          </h2>
          <p className="text-sm text-slate-500">Espacio de alta reserva profesional y seguimiento confidencial de alumnos derivados.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanOrphans}
            className="flex items-center gap-2 bg-slate-105 hover:bg-slate-200 border border-slate-350 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Limpia registros de alumnos que ya no se encuentran matriculados"
          >
            <Trash2 size={16} />
            <span>Depurar Casos Huérfanos</span>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      {!selectedCase && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {columns.map(col => {
              const colCases = cases.filter(c => c.status === col.status);
              return (
                <div 
                  key={col.status} 
                  className={`bg-white rounded-2xl border border-slate-200 p-4 min-h-[450px] flex flex-col border-t-4 ${col.color} shadow-sm`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{col.title}</h3>
                    <span className="bg-slate-100 text-slate-650 font-bold px-2 py-0.5 rounded-lg text-xs">
                      {colCases.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-1">
                    {colCases.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-350 text-center">
                        <Inbox size={28} className="stroke-[1.5]" />
                        <span className="text-[10px] font-semibold mt-1">Sin Casos</span>
                      </div>
                    ) : (
                      colCases.map(c => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 cursor-pointer transition-all duration-200 space-y-3 group shadow-sm"
                        >
                          <div className="space-y-0.5 font-medium">
                            <h4 className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">
                              {c.studentName}
                            </h4>
                            <p className="text-[11px] text-slate-500">Curso: {c.grade}</p>
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] border-t border-slate-200/60 pt-2.5">
                            <span className={`px-2 py-0.5 rounded-full border font-bold ${getRiskBadge(c.riskLevel)}`}>
                              Riesgo {c.riskLevel}
                            </span>
                            <span className="text-slate-400 font-mono">{c.referredDate}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CASE DOSSIER VIEW */}
      {selectedCase && (
        <div className="space-y-4">
          <button 
            onClick={() => setSelectedCase(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            &larr; Volver al Casillero Kanban
          </button>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 text-xs shadow-inner">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <div>
              <strong className="font-bold">ADVERTENCIA DE SEGURIDAD CLÍNICA (Ley N° 19.628):</strong>
              <p className="text-red-750/90 mt-0.5">Este expediente contiene material sensible resguardado por el secreto profesional escolar. Queda estrictamente prohibida la divulgación de bitácoras clínicas externas sin previa resolución directiva.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in">
            
            {/* LEFT COMPONENT */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-xl bg-primary-light border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedCase.studentName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-805">{selectedCase.studentName}</h3>
                  <p className="text-xs text-slate-500">Ficha Clínica | Curso: {selectedCase.grade}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Estado de Derivación Activo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Ingresado', 'En Intervención', 'Derivado a Redes', 'Alta Clínica'] as const).map(st => {
                      const isCurrent = selectedCase.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleMoveStatus(selectedCase.id, st)}
                          className={`p-2 rounded-lg border text-left font-bold cursor-pointer transition-all ${
                            isCurrent 
                              ? 'bg-primary-light border-primary text-primary shadow-inner' 
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100/50'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 font-semibold">
                  <div>
                    <span className="text-slate-400 font-bold uppercase block mb-0.5">Nivel de Riesgo</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${getRiskBadge(selectedCase.riskLevel)}`}>
                      RIESGO {selectedCase.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block mb-0.5">Motivo del Ingreso</span>
                    <p className="text-slate-700 font-medium leading-relaxed bg-white border border-slate-200 p-2.5 rounded-lg">
                      {selectedCase.reason}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-between pt-1 border-t border-slate-200">
                    <span>Colegio: {selectedCase.school}</span>
                    <span>Ingreso: {selectedCase.referredDate}</span>
                  </div>
                </div>

                <button
                  onClick={handleExportClinicalPDF}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Descargar Expediente Clínico PDF</span>
                </button>

                {canEditOrDelete && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditCaseModal(selectedCase)}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Edit size={13} />
                      <span>Editar Ficha</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCase(selectedCase.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 text-xs font-bold py-2 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar Expediente</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COMPONENT */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <span>Bitácora de Sesiones Clínicas</span>
                </h3>
                <button
                  onClick={handleOpenSessionModal}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Registrar Sesión</span>
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-205 rounded-xl bg-slate-50 text-slate-400 text-xs">
                  Aún no se registran intervenciones o sesiones de apoyo psicosocial para este alumno.
                </div>
              ) : (
                <div className="relative border-l-2 border-primary-light/40 ml-3 pl-6 space-y-6">
                  {sessions.map((sess) => (
                    <div key={sess.id} className="relative">
                      
                      <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-primary shadow-sm flex items-center justify-center text-white text-[8px] font-bold"></span>

                      <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl p-4 transition-colors space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                            <Calendar size={13} />
                            {sess.date}
                          </span>
                          <span className="font-bold text-primary bg-primary-light border border-primary/20 px-2 py-0.5 rounded-md text-[10px]">
                            Contacto: {sess.contactType}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Notas Confidenciales:</span>
                          <div dangerouslySetInnerHTML={{ __html: sess.notes }} />
                        </div>

                        {sess.agreements && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 text-xs text-emerald-950">
                            <strong className="font-bold text-emerald-850">Compromisos / Acuerdos:</strong>
                            <p className="mt-0.5">{sess.agreements}</p>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1.5 border-t border-slate-200 justify-between">
                          <span>Profesional: <span className="font-semibold text-slate-650">{sess.professionalName}</span></span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditSessionModal(sess)}
                              className="text-primary hover:underline font-bold"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteSession(sess.id)}
                              className="text-red-600 hover:underline font-bold"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* NEW SESSION REGISTRY MODAL */}
      {isSessionModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in">
            
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{editingSession ? 'Editar Sesión Psicosocial' : 'Nueva Sesión de Acompañamiento'}</h3>
                <p className="text-[10px] text-slate-400">Registrando para: <span className="text-primary font-semibold">{selectedCase.studentName}</span></p>
              </div>
              <button 
                onClick={() => setIsSessionModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitSession} className="p-6 space-y-4 text-xs font-semibold">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Sesión</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Contacto</label>
                  <select
                    value={sessionContactType}
                    onChange={(e) => setSessionContactType(e.target.value as ContactType)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                  >
                    <option value="Estudiante">Estudiante (Individual)</option>
                    <option value="Apoderado">Apoderado (Familia)</option>
                    <option value="Aula">Aula (Mediación)</option>
                    <option value="Redes">Redes (OPD, Salud Pública)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas Clínicas Confidenciales</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Detalles de la sesión..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm h-36 font-sans font-medium"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Compromisos / Acuerdos Tomados</label>
                <input
                  type="text"
                  value={sessionAgreements}
                  onChange={(e) => setSessionAgreements(e.target.value)}
                  placeholder="Indique los compromisos acordados..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Profesional Firmante de la Ficha</label>
                <select
                  value={sessionProfessionalId}
                  onChange={(e) => setSessionProfessionalId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                  required
                >
                  <option value="">Seleccione Profesional...</option>
                  {staff.filter(st => st.role === 'Psicólogo' || st.role === 'Trabajador Social' || st.role === 'Convivencia' || st.role === 'Orientador' || st.role === 'Administrador').map(st => (
                    <option key={st.rut} value={st.rut}>{st.firstName} {st.lastName} ({st.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end border-t border-slate-200 pt-4 mt-6 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow"
                >
                  {editingSession ? 'Guardar Cambios' : 'Guardar Sesión'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT CASE MODAL */}
      {isEditCaseModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in">
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Editar Ficha Psicosocial</h3>
                <p className="text-[10px] text-slate-400">Modificando ficha de: <span className="text-primary font-semibold">{selectedCase.studentName}</span></p>
              </div>
              <button 
                onClick={() => setIsEditCaseModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditCase} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nivel de Riesgo</label>
                <select
                  value={editCaseRiskLevel}
                  onChange={(e) => setEditCaseRiskLevel(e.target.value as RiskLevel)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                  required
                >
                  <option value="Bajo">Bajo</option>
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Motivo del Ingreso / Descripción</label>
                <textarea
                  value={editCaseReason}
                  onChange={(e) => setEditCaseReason(e.target.value)}
                  placeholder="Detalle el motivo del ingreso o diagnóstico preliminar..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm h-36 font-sans font-medium"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end border-t border-slate-200 pt-4 mt-6 gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
