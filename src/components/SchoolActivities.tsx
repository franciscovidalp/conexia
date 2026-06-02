import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  MapPin, 
  UserCheck, 
  PlusCircle, 
  Search, 
  Trash2, 
  Download, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  BookOpen,
  Edit,
  X
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Student, Activity, SchoolType, ActivityStatus, AudienceType } from '../types';
import { exportActivityPDF, exportAllActivitiesReportPDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface SchoolActivitiesProps {
  activeSchool: SchoolType;
  students: Student[];
}

export const SchoolActivities: React.FC<SchoolActivitiesProps> = ({
  activeSchool,
  students
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'Todos'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'detalles' | 'audiencia' | 'ejecucion'>('detalles');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSpeaker, setFormSpeaker] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('Programada');
  const [formAudienceType, setFormAudienceType] = useState<AudienceType>('Masiva');
  const [formTargetGrades, setFormTargetGrades] = useState<string[]>([]);
  const [formTargetStudentIds, setFormTargetStudentIds] = useState<string[]>([]);
  const [formSummary, setFormSummary] = useState('');
  const [formEvidenceUrl, setFormEvidenceUrl] = useState('');

  // Search inside cached students for focalized audience
  const [studentSearch, setStudentSearch] = useState('');

  // Extract unique grades for school
  const schoolGrades = Array.from(new Set(students.map(s => s.grade))).sort();

  useEffect(() => {
    loadActivities();
  }, [activeSchool]);

  const loadActivities = async () => {
    try {
      const res = await dbService.getActivities(activeSchool);
      setActivities(res);
    } catch (e) {
      toast.error('Error al cargar actividades.');
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSpeaker('');
    setFormLocation('');
    setFormStatus('Programada');
    setFormAudienceType('Masiva');
    setFormTargetGrades([]);
    setFormTargetStudentIds([]);
    setFormSummary('');
    setFormEvidenceUrl('');
    setModalTab('detalles');
    setStudentSearch('');
    setEditingActivity(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormDate(act.date);
    setFormSpeaker(act.speaker);
    setFormLocation(act.location);
    setFormStatus(act.status);
    setFormAudienceType(act.audienceType);
    setFormTargetGrades(act.targetGrades || []);
    setFormTargetStudentIds(act.targetStudentIds || []);
    setFormSummary(act.summary || '');
    setFormEvidenceUrl(act.evidenceUrl || '');
    setModalTab('detalles');
    setStudentSearch('');
    setIsModalOpen(true);
  };

  const handleDeleteActivity = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta planificación de taller preventivo?')) {
      try {
        await dbService.deleteActivity(id);
        setActivities(prev => prev.filter(a => a.id !== id));
        toast.success('Actividad eliminada.');
      } catch (e) {
        toast.error('Error al eliminar.');
      }
    }
  };

  const handleToggleGrade = (grade: string) => {
    if (formTargetGrades.includes(grade)) {
      setFormTargetGrades(prev => prev.filter(g => g !== grade));
    } else {
      setFormTargetGrades(prev => [...prev, grade]);
    }
  };

  const handleAddFocalizedStudent = (studentId: string) => {
    if (formTargetStudentIds.includes(studentId)) {
      toast.error('Estudiante ya se encuentra agregado.');
      return;
    }
    setFormTargetStudentIds(prev => [...prev, studentId]);
    setStudentSearch('');
  };

  const handleRemoveFocalizedStudent = (studentId: string) => {
    setFormTargetStudentIds(prev => prev.filter(id => id !== studentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Ingrese el título de la actividad.');
      return;
    }
    if (!formSpeaker.trim()) {
      toast.error('Indique quién es el expositor.');
      return;
    }
    if (formAudienceType === 'Masiva' && formTargetGrades.length === 0) {
      toast.error('Seleccione al menos un curso de audiencia.');
      return;
    }
    if (formAudienceType === 'Focalizada' && formTargetStudentIds.length === 0) {
      toast.error('Agregue al menos un estudiante focalizado.');
      return;
    }

    try {
      const payload = {
        title: formTitle,
        date: formDate,
        speaker: formSpeaker,
        location: formLocation,
        status: formStatus,
        audienceType: formAudienceType,
        targetGrades: formAudienceType === 'Masiva' ? formTargetGrades : [],
        targetStudentIds: formAudienceType === 'Focalizada' ? formTargetStudentIds : [],
        summary: formSummary,
        evidenceUrl: formEvidenceUrl,
        school: activeSchool
      };

      if (editingActivity) {
        await dbService.updateActivity(editingActivity.id, payload);
        setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, ...payload } : a));
        toast.success('Actividad actualizada con éxito.');
      } else {
        const newAct = await dbService.createActivity(payload);
        setActivities(prev => [newAct, ...prev]);
        toast.success('Actividad planificada con éxito.');
      }

      setIsModalOpen(false);
    } catch (e) {
      toast.error('Error al guardar actividad.');
    }
  };

  const handleQuickStatusChange = async (actId: string, status: ActivityStatus) => {
    try {
      await dbService.updateActivity(actId, { status });
      setActivities(prev => prev.map(a => a.id === actId ? { ...a, status } : a));
      toast.success(`Actividad marcada como ${status}.`);
    } catch (e) {
      toast.error('Error al actualizar estado.');
    }
  };

  const handleExportIndividual = (act: Activity) => {
    const focalizedStudents = students.filter(s => act.targetStudentIds?.includes(s.id));
    exportActivityPDF(act, focalizedStudents);
    toast.success('Acta de actividad exportada en PDF.');
  };

  const handleExportGeneralReport = () => {
    if (activities.length === 0) {
      toast.error('No hay actividades para reportar.');
      return;
    }
    exportAllActivitiesReportPDF(activities);
    toast.success('Reporte consolidado exportado.');
  };

  const autocompleteStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(studentSearch.toLowerCase()) || s.rut.includes(studentSearch);
    return studentSearch.length > 1 && matchesSearch && !formTargetStudentIds.includes(s.id);
  });

  const filteredActivities = activities.filter(a => {
    if (filterStatus === 'Todos') return true;
    return a.status === filterStatus;
  });

  const getStatusStyle = (status: ActivityStatus) => {
    switch (status) {
      case 'Programada': return { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', icon: Clock };
      case 'Realizada': return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle };
      case 'Cancelada': return { bg: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500', icon: XCircle };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Vínculo Escolar</h2>
          <p className="text-sm text-slate-500">Gestión, planificación y reportería de talleres, seminarios y charlas socioemocionales.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportGeneralReport}
            className="flex items-center gap-2 border border-slate-350 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all bg-white cursor-pointer"
          >
            <FileText size={16} />
            <span>Reporte Consolidado</span>
          </button>
          
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Planificar Taller</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex gap-2">
          {(['Todos', 'Programada', 'Realizada', 'Cancelada'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === tab 
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              {tab === 'Todos' ? 'Mostrar Todas' : tab}
            </button>
          ))}
        </div>
        
        <div className="text-xs text-slate-400 font-medium">
          Mostrando {filteredActivities.length} de {activities.length} actividades planificadas.
        </div>
      </div>

      {/* Dashboard Grid */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <BookOpen size={48} className="mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-650">Sin Talleres Planificados</h3>
          <p className="text-sm max-w-sm mx-auto">No hay actividades de vinculación registradas bajo este estado o colegio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map(act => {
            const statusConfig = getStatusStyle(act.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div 
                key={act.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-all duration-200 group"
              >
                <div className="h-2 bg-primary"></div>
                
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusConfig.bg}`}>
                      <StatusIcon size={12} />
                      {act.status}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-primary/20">
                      {act.audienceType}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-800 leading-snug group-hover:text-primary transition-colors">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {act.summary || 'Sin descripción o bitácora de ejecución registrada aún.'}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-650">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{act.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-slate-400" />
                      <span>Facilitador: <strong className="font-semibold text-slate-700">{act.speaker}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span>Lugar: <span className="font-medium text-slate-700">{act.location}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span>Audiencia: {act.audienceType === 'Masiva' 
                        ? `Cursos (${act.targetGrades?.join(', ')})` 
                        : `${act.targetStudentIds?.length} Alumnos`
                      }</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {act.status === 'Programada' ? (
                      <>
                        <button
                          onClick={() => handleQuickStatusChange(act.id, 'Realizada')}
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer animate-in"
                        >
                          Hecho
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(act.id, 'Cancelada')}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer animate-in"
                        >
                          X
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Inactivo</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(act)}
                      className="text-primary hover:underline flex items-center gap-0.5 text-xs font-bold"
                      title="Editar Planificación"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="text-red-650 hover:underline flex items-center gap-0.5 text-xs font-bold"
                      title="Eliminar Actividad"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => handleExportIndividual(act)}
                      className="text-slate-500 hover:text-primary flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                      title="Descargar Acta PDF"
                    >
                      <Download size={13} />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PLANIFICATION MODAL WITH TABS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in">
            
            {/* Header */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{editingActivity ? 'Editar Planificación Taller' : 'Planificar Actividad Preventiva'}</h3>
                <p className="text-[10px] text-slate-400">Diseño pedagógico y focalización de talleres socioemocionales.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xl"
              >
                &times;
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-650">
              <button
                type="button"
                onClick={() => setModalTab('detalles')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'detalles' ? 'border-primary text-primary bg-white' : 'border-transparent hover:text-slate-900'
                }`}
              >
                1. Detalles Generales
              </button>
              <button
                type="button"
                onClick={() => setModalTab('audiencia')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'audiencia' ? 'border-primary text-primary bg-white' : 'border-transparent hover:text-slate-900'
                }`}
              >
                2. Audiencia
              </button>
              <button
                type="button"
                onClick={() => setModalTab('ejecucion')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'ejecucion' ? 'border-primary text-primary bg-white' : 'border-transparent hover:text-slate-900'
                }`}
              >
                3. Ejecución
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* TAB 1: DETALLES GENERALES */}
              {modalTab === 'detalles' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título de la Actividad / Taller</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ej: Charla sobre Bullying y Ciberacoso"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Programada</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Expositor / Facilitador</label>
                      <input
                        type="text"
                        value={formSpeaker}
                        onChange={(e) => setFormSpeaker(e.target.value)}
                        placeholder="Ej: María Paz Toledo"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lugar de Realización / Canal</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="Ej: Gimnasio, Sala 2 Medio, Zoom..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: AUDIENCIA */}
              {modalTab === 'audiencia' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Audiencia</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 flex-1">
                        <input
                          type="radio"
                          name="audienceType"
                          value="Masiva"
                          checked={formAudienceType === 'Masiva'}
                          onChange={() => setFormAudienceType('Masiva')}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="text-sm font-bold text-slate-800">Masiva</span>
                          <p className="text-[10px] text-slate-400">Niveles o Cursos completos.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 flex-1">
                        <input
                          type="radio"
                          name="audienceType"
                          value="Focalizada"
                          checked={formAudienceType === 'Focalizada'}
                          onChange={() => setFormAudienceType('Focalizada')}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="text-sm font-bold text-slate-800">Focalizada</span>
                          <p className="text-[10px] text-slate-400">Grupo de alumnos cruzando caché.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {formAudienceType === 'Masiva' && (
                    <div className="space-y-2 animate-in slide-in">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Seleccionar Cursos Destinatarios</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {schoolGrades.map(grade => {
                          const isSelected = formTargetGrades.includes(grade);
                          return (
                            <button
                              type="button"
                              key={grade}
                              onClick={() => handleToggleGrade(grade)}
                              className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-primary-light border-primary text-primary shadow-inner'
                                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                              }`}
                            >
                              {grade}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formAudienceType === 'Focalizada' && (
                    <div className="space-y-3 animate-in slide-in">
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buscar y Agregar Alumnos</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                          <input
                            type="text"
                            placeholder="Escriba RUT o Nombre para buscar..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm"
                          />
                        </div>

                        {autocompleteStudents.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {autocompleteStudents.map(student => (
                              <button
                                type="button"
                                key={student.id}
                                onClick={() => handleAddFocalizedStudent(student.id)}
                                className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 text-left text-xs font-medium cursor-pointer"
                              >
                                <span>{student.firstName} {student.lastName} ({student.grade})</span>
                                <span className="text-[10px] text-slate-400 font-mono">{student.rut}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Alumnos Convocados ({formTargetStudentIds.length})</label>
                        {formTargetStudentIds.length === 0 ? (
                          <div className="text-center p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400 text-xs">
                            No se han agendado alumnos focalizados aún.
                          </div>
                        ) : (
                          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                            {formTargetStudentIds.map(studentId => {
                              const std = students.find(s => s.id === studentId);
                              if (!std) return null;
                              return (
                                <div key={studentId} className="flex items-center justify-between p-2.5 text-xs">
                                  <span>{std.firstName} {std.lastName} - <strong className="font-bold text-slate-500">{std.grade}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFocalizedStudent(studentId)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: EJECUCIÓN */}
              {modalTab === 'ejecucion' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado de Actividad</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                      >
                        <option value="Programada">Programada (Agenda)</option>
                        <option value="Realizada">Realizada (Finalizado)</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link de Evidencia (Drive, Acta firmada)</label>
                      <input
                        type="url"
                        value={formEvidenceUrl}
                        onChange={(e) => setFormEvidenceUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Resumen / Bitácora de Ejecución (Resultados)</label>
                    <textarea
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      placeholder="Describa cómo se desarrolló la jornada, hallazgos, dificultades y evaluación cualitativa..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm h-36"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
                <div>
                  {modalTab !== 'detalles' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'ejecucion' ? 'audiencia' : 'detalles')}
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
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  {modalTab !== 'ejecucion' ? (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'detalles' ? 'audiencia' : 'ejecucion')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      {editingActivity ? 'Guardar Cambios' : 'Guardar Planificación'}
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
