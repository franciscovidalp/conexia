import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Folder, 
  ChevronRight, 
  FileText, 
  Calendar, 
  PlusCircle, 
  BookOpen, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  AlertTriangle,
  FileBadge2,
  Edit,
  Trash2
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, Staff, CoexistenceCase, SchoolType, CaseType, CaseStatus } from '../types';
import { exportCoexistenceCasePDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface SchoolCoexistenceProps {
  activeSchool: SchoolType;
  students: Student[];
  staff: Staff[];
  onRefreshStudents: () => void;
}

export const SchoolCoexistence: React.FC<SchoolCoexistenceProps> = ({
  activeSchool,
  students,
  staff,
  onRefreshStudents
}) => {
  // Hub States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Case Paginated List State
  const [cases, setCases] = useState<CoexistenceCase[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'hechos' | 'derivacion' | 'resolucion'>('hechos');
  const [editingCase, setEditingCase] = useState<CoexistenceCase | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<CaseType>('Leve');
  const [formDescription, setFormDescription] = useState('');
  const [formReporterId, setFormReporterId] = useState('');
  const [formProtocolActivated, setFormProtocolActivated] = useState(false);
  const [formProtocolName, setFormProtocolName] = useState('');
  const [formReferredToPsychosocial, setFormReferredToPsychosocial] = useState(false);
  const [formActionPlan, setFormActionPlan] = useState('');
  const [formCommitments, setFormCommitments] = useState('');
  const [formEvidenceUrl, setFormEvidenceUrl] = useState('');
  const [formStatus, setFormStatus] = useState<CaseStatus>('Resuelto');

  // Filter Unique Courses
  const courses = Array.from(new Set(students.map(s => s.grade))).sort();

  // Load General Cases
  useEffect(() => {
    loadRecentCases(true);
  }, [activeSchool]);

  const loadRecentCases = async (reset = false) => {
    setLoadingCases(true);
    try {
      const cursor = reset ? null : lastDoc;
      const res = await dbService.getCoexistenceCases(activeSchool, 5, cursor);
      if (reset) {
        setCases(res.data);
      } else {
        setCases(prev => [...prev, ...res.data]);
      }
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (e) {
      toast.error('Error al cargar historial de casos.');
    } finally {
      setLoadingCases(false);
    }
  };

  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('Leve');
    setFormDescription('');
    setFormReporterId(staff[0]?.rut || '');
    setFormProtocolActivated(false);
    setFormProtocolName('');
    setFormReferredToPsychosocial(false);
    setFormActionPlan('');
    setFormCommitments('');
    setFormEvidenceUrl('');
    setFormStatus('Resuelto');
    setModalTab('hechos');
    setEditingCase(null);
  };

  const handleOpenNewCaseModal = () => {
    if (!selectedStudent) {
      toast.error('Debe seleccionar un estudiante primero.');
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditCaseModal = (c: CoexistenceCase) => {
    setEditingCase(c);
    setFormDate(c.date);
    setFormType(c.type);
    setFormDescription(c.description);
    setFormReporterId(c.reporterId);
    setFormProtocolActivated(c.protocolActivated);
    setFormProtocolName(c.protocolName || '');
    setFormReferredToPsychosocial(c.referredToPsychosocial);
    setFormActionPlan(c.actionPlan || '');
    setFormCommitments(c.commitments || '');
    setFormEvidenceUrl(c.evidenceUrl || '');
    setFormStatus(c.status);
    setModalTab('hechos');
    setIsModalOpen(true);
  };

  // Delete Case
  const handleDeleteCase = async (id: string, type: CaseType) => {
    if (window.confirm('¿Está seguro de eliminar esta anotación de la hoja de vida?')) {
      try {
        await dbService.deleteCoexistenceCase(id);
        setCases(prev => prev.filter(c => c.id !== id));
        toast.success('Anotación eliminada.');

        // Revert score impact visually
        if (selectedStudent) {
          let delta = 0;
          if (type === 'Positiva') delta = -5;
          else if (type === 'Leve') delta = 5;
          else if (type === 'Grave') delta = 15;
          else if (type === 'Gravísima') delta = 25;

          // update dynamically in DB and state
          const newScore = Math.max(0, Math.min(100, selectedStudent.conductScore + delta));
          await dbService.updateStudent(selectedStudent.id, { conductScore: newScore });
          setSelectedStudent(prev => prev ? { ...prev, conductScore: newScore } : null);
          onRefreshStudents();
        }
      } catch (e) {
        toast.error('Error al eliminar anotación.');
      }
    }
  };

  // Submit Case Form (Handles Edit & Create)
  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!formDescription.trim()) {
      toast.error('Debe ingresar la descripción del hecho.');
      return;
    }
    if (!formReporterId) {
      toast.error('Debe especificar un funcionario informante.');
      return;
    }

    const reporter = staff.find(st => st.rut === formReporterId);
    if (!reporter) {
      toast.error('Funcionario inválido.');
      return;
    }

    try {
      const casePayload = {
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        school: activeSchool,
        date: formDate,
        type: formType,
        description: formDescription,
        reporterId: formReporterId,
        reporterName: `${reporter.firstName} ${reporter.lastName}`,
        protocolActivated: formProtocolActivated,
        protocolName: formProtocolActivated ? formProtocolName : '',
        referredToPsychosocial: formReferredToPsychosocial,
        actionPlan: formActionPlan,
        commitments: formCommitments,
        evidenceUrl: formEvidenceUrl,
        status: formStatus
      };

      if (editingCase) {
        // EDIT MODE
        await dbService.updateCoexistenceCase(editingCase.id, casePayload);
        setCases(prev => prev.map(item => item.id === editingCase.id ? { ...item, ...casePayload } : item));
        toast.success('Incidencia actualizada con éxito.');
      } else {
        // CREATE MODE
        const newCase = await dbService.createCoexistenceCase(casePayload);
        setCases(prev => [newCase, ...prev]);

        // Score delta impact
        let delta = 0;
        if (formType === 'Positiva') delta = 5;
        else if (formType === 'Leve') delta = -5;
        else if (formType === 'Grave') delta = -15;
        else if (formType === 'Gravísima') delta = -25;
        
        const newScore = Math.max(0, Math.min(100, selectedStudent.conductScore + delta));
        setSelectedStudent(prev => prev ? { ...prev, conductScore: newScore } : null);
        toast.success('Incidencia registrada con éxito.');
      }

      onRefreshStudents();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Error guardando caso.');
    }
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(search) || s.rut.includes(search);
    
    if (selectedCourse) {
      return matchesSearch && s.grade === selectedCourse;
    }
    return matchesSearch && searchTerm.length > 0;
  });

  const getSemaphoreBadge = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Estable', color: 'bg-emerald-500' };
    if (score >= 60) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Alerta', color: 'bg-amber-500' };
    return { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Crítico', color: 'bg-red-500' };
  };

  const getCaseTypeBadge = (type: CaseType) => {
    switch (type) {
      case 'Positiva': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Leve': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Grave': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Gravísima': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const studentCases = cases.filter(c => c.studentId === selectedStudent?.id);

  const handleExportPDF = (c: CoexistenceCase) => {
    const currentStudent = students.find(s => s.id === c.studentId) || selectedStudent;
    const currentReporter = staff.find(st => st.rut === c.reporterId) || {
      id: c.reporterId,
      rut: c.reporterId,
      firstName: c.reporterName.split(' ')[0] || '',
      lastName: c.reporterName.split(' ').slice(1).join(' ') || '',
      school: activeSchool,
      role: 'Docente',
      email: ''
    } as Staff;

    if (currentStudent) {
      exportCoexistenceCasePDF(c, currentStudent, currentReporter);
      toast.success('PDF generado con éxito.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Convivencia Pro</h2>
          <p className="text-sm text-slate-500">Módulo de registro de incidencias, activación de protocolos y derivaciones formales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Search & courses folders */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por estudiante o RUT..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedCourse && e.target.value.length > 0) {
                    setSelectedCourse(null);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-350 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            {selectedCourse && (
              <div className="flex items-center justify-between bg-primary-light text-primary px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-semibold">
                <span>Filtro Curso: {selectedCourse}</span>
                <button onClick={() => setSelectedCourse(null)} className="hover:text-primary-hover font-bold">×</button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {!searchTerm && !selectedCourse ? (
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Carpetas por Curso</h3>
                <div className="grid grid-cols-2 gap-3">
                  {courses.map(course => (
                    <button
                      key={course}
                      onClick={() => setSelectedCourse(course)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-primary-light/30 hover:border-primary/20 border border-slate-200 rounded-xl text-left transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                        <Folder size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{course}</div>
                        <div className="text-xs text-slate-500">
                          {students.filter(s => s.grade === course).length} alumnos
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No se encontraron estudiantes matriculados.
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const status = getSemaphoreBadge(student.conductScore);
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-primary-light/20 border-r-4 border-primary' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-105 flex items-center justify-center text-slate-600 font-semibold text-sm">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-805">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {student.grade} • RUT: {student.rut}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${status.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                            {student.conductScore} pts
                          </span>
                          <ChevronRight size={16} className="text-slate-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Student details */}
        <div className="lg:col-span-7 space-y-6">
          {selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                    <p className="text-xs text-slate-500">
                      RUT: <span className="font-mono">{selectedStudent.rut}</span> | Curso: <span className="font-semibold">{selectedStudent.grade}</span>
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleOpenNewCaseModal}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <PlusCircle size={16} />
                  <span>Registrar Anotación</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Índice Convivencia RICE</h4>
                    <p className="text-2xl font-black text-slate-800">{selectedStudent.conductScore} / 100</p>
                    <p className="text-xs text-slate-500">Puntaje dinámico de conducta escolar.</p>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-sm ${
                      selectedStudent.conductScore >= 80 ? 'border-emerald-500 text-emerald-600' :
                      selectedStudent.conductScore >= 60 ? 'border-amber-500 text-amber-600' :
                      'border-red-500 text-red-600'
                    }`}>
                      {selectedStudent.conductScore}%
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estado Conducta</h4>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedStudent.conductScore >= 80 ? (
                      <>
                        <TrendingUp className="text-emerald-500" size={24} />
                        <span className="text-sm font-bold text-emerald-700">Favorable</span>
                      </>
                    ) : selectedStudent.conductScore >= 60 ? (
                      <>
                        <AlertTriangle className="text-amber-500" size={24} />
                        <span className="text-sm font-bold text-amber-700">Observación</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="text-red-500" size={24} />
                        <span className="text-sm font-bold text-red-700">Riesgo Alto</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Actualizado hoy</span>
                </div>
              </div>

              {/* TIMELINE */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  <span>Historial Escolar y Timeline de Incidencias</span>
                </h4>
                
                {studentCases.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 text-xs border border-dashed border-slate-250">
                    No se registran anotaciones o incidencias en este establecimiento.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
                    {studentCases.map((c) => (
                      <div key={c.id} className="relative group">
                        
                        <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                          c.type === 'Positiva' ? 'bg-emerald-500' :
                          c.type === 'Leve' ? 'bg-sky-500' :
                          c.type === 'Grave' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>

                        <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl p-4 transition-colors space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Calendar size={13} />
                              {c.date}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getCaseTypeBadge(c.type)}`}>
                                {c.type}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                c.status === 'Resuelto' ? 'bg-emerald-55 text-emerald-800 border-emerald-200' :
                                c.status === 'En Proceso' ? 'bg-amber-55 text-amber-800 border-amber-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-705 font-medium leading-relaxed">
                            {c.description}
                          </p>

                          <div className="text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2.5 mt-2">
                            <span>Informado por: <span className="font-semibold">{c.reporterName}</span></span>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleOpenEditCaseModal(c)}
                                className="text-primary hover:text-primary-hover flex items-center gap-1 font-bold"
                              >
                                <Edit size={13} />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCase(c.id, c.type)}
                                className="text-red-650 hover:text-red-800 flex items-center gap-1 font-bold"
                              >
                                <Trash2 size={13} />
                                <span>Eliminar</span>
                              </button>
                              <button
                                onClick={() => handleExportPDF(c)}
                                className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold"
                              >
                                <Download size={13} />
                                <span>PDF</span>
                              </button>
                            </div>
                          </div>

                          {(c.protocolActivated || c.referredToPsychosocial) && (
                            <div className="mt-2 bg-primary-light/30 border border-primary/10 rounded-lg p-2.5 text-xs text-primary space-y-1">
                              {c.protocolActivated && (
                                <p className="flex items-center gap-1.5 font-medium">
                                  <FileBadge2 size={13} className="text-primary" />
                                  <span>Protocolo: <strong className="font-bold">{c.protocolName || 'Reglamento de Convivencia'}</strong></span>
                                </p>
                              )}
                              {c.referredToPsychosocial && (
                                <p className="flex items-center gap-1.5 font-medium">
                                  <ArrowRight size={13} className="text-primary" />
                                  <span>Derivado a <strong className="font-bold">Dupla Psicosocial</strong></span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
              <BookOpen size={48} className="mx-auto text-slate-350" />
              <h3 className="font-bold text-slate-600">Dossier Escolar del Estudiante</h3>
              <p className="text-sm max-w-sm mx-auto">Selecciona un estudiante de la barra lateral o busca por RUT para ver su hoja de vida, semáforo e historial clínico.</p>
            </div>
          )}

          {/* Recents list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-800">Recientes Casos Escolares (General)</h3>
            <div className="divide-y divide-slate-150">
              {cases.slice(0, 3).map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="space-y-0.5 font-medium">
                    <div className="font-bold text-slate-800">{c.studentName}</div>
                    <div className="text-xs text-slate-400">{c.date} • {c.type}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] rounded-full border font-semibold ${
                    c.status === 'Resuelto' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' : 'bg-amber-50 border-amber-250 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => loadRecentCases()}
                disabled={loadingCases}
                className="w-full text-center text-xs font-bold text-primary hover:text-primary-hover mt-2 block transition-colors disabled:opacity-50"
              >
                {loadingCases ? 'Cargando...' : 'Cargar más casos recientes'}
              </button>
            )}
          </div>

        </div>

      </div>

      {/* MODAL CRUD ANOTACIÓN CON PESTAÑAS */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{editingCase ? 'Editar Anotación' : 'Nueva Anotación / Incidencia'}</h3>
                <p className="text-[10px] text-slate-400">Registrando para: <span className="text-primary font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span></p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-550">
              <button
                type="button"
                onClick={() => setModalTab('hechos')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'hechos' ? 'border-primary text-primary bg-white' : 'border-transparent hover:text-slate-800'
                }`}
              >
                1. Hechos
              </button>
              <button
                type="button"
                onClick={() => setModalTab('derivacion')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'derivacion' ? 'border-primary text-primary bg-white' : 'border-transparent hover:text-slate-800'
                }`}
              >
                2. Derivaciones
              </button>
              <button
                type="button"
                onClick={() => setModalTab('resolucion')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'resolucion' ? 'border-primary text-primary bg-white' : 'border-transparent hover:text-slate-800'
                }`}
              >
                3. Resolución
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitCase} className="p-6 space-y-4">
              
              {/* TAB 1: HECHOS */}
              {modalTab === 'hechos' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha del Hecho</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Incidencia</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as CaseType)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                      >
                        <option value="Positiva">Positiva (Felicitación)</option>
                        <option value="Leve">Leve</option>
                        <option value="Grave">Grave</option>
                        <option value="Gravísima">Gravísima</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción Detallada de los Hechos</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Indique con claridad qué sucedió, participantes, lugar y contexto del suceso..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm h-32"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Funcionario Informante</label>
                    <select
                      value={formReporterId}
                      onChange={(e) => setFormReporterId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                      required
                    >
                      <option value="">Seleccione Funcionario...</option>
                      {staff.map(st => (
                        <option key={st.rut} value={st.rut}>{st.firstName} {st.lastName} ({st.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: DERIVACIONES */}
              {modalTab === 'derivacion' && (
                <div className="space-y-5 animate-in fade-in">
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formProtocolActivated}
                        onChange={(e) => setFormProtocolActivated(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-800">Activar Protocolo de Convivencia</span>
                        <p className="text-xs text-slate-500">¿Requiere activación de protocolos del reglamento escolar?</p>
                      </div>
                    </label>
                    
                    {formProtocolActivated && (
                      <div className="mt-3 animate-in slide-in">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre / Identificador del Protocolo</label>
                        <input
                          type="text"
                          value={formProtocolName}
                          onChange={(e) => setFormProtocolName(e.target.value)}
                          placeholder="Ej: Protocolo de Bullying y Maltrato"
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                          required={formProtocolActivated}
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formReferredToPsychosocial}
                        onChange={(e) => setFormReferredToPsychosocial(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-800">Derivar a Dupla Psicosocial</span>
                        <p className="text-xs text-slate-500">Crear caso confidencial en la Dupla para Psicólogos y Trabajadores Sociales.</p>
                      </div>
                    </label>
                  </div>

                </div>
              )}

              {/* TAB 3: RESOLUCIÓN */}
              {modalTab === 'resolucion' && (
                <div className="space-y-4 animate-in fade-in text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Plan de Acción (Medidas pedagógicas/disciplinarias)</label>
                    <textarea
                      value={formActionPlan}
                      onChange={(e) => setFormActionPlan(e.target.value)}
                      placeholder="Acciones correctivas, suspensiones formativas, citaciones a apoderados..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm h-20"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Compromisos del Estudiante / Apoderado</label>
                    <textarea
                      value={formCommitments}
                      onChange={(e) => setFormCommitments(e.target.value)}
                      placeholder="Indique los compromisos acordados..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm h-20"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link de Evidencia / Acta firmada (Drive, Cloud)</label>
                    <input
                      type="url"
                      value={formEvidenceUrl}
                      onChange={(e) => setFormEvidenceUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado de Resolución</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as CaseStatus)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                      >
                        <option value="Borrador">Borrador</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
                <div>
                  {modalTab !== 'hechos' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'resolucion' ? 'derivacion' : 'hechos')}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Atrás
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-850 rounded-xl"
                  >
                    Cancelar
                  </button>
                  {modalTab !== 'resolucion' ? (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'hechos' ? 'derivacion' : 'resolucion')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      {editingCase ? 'Guardar Cambios' : 'Guardar Incidencia'}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
