import React, { useState } from 'react';
import { 
  Mail, Plus, FileDown, Trash2, CheckCircle, 
  Search, X, CalendarDays, Clock, MapPin, User, FileText
} from 'lucide-react';
import type { ParentSummons, Student, Staff, SchoolType } from '../types';
import { dbService } from '../firebase';
import { exportParentSummonsPDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface SummonsModuleProps {
  activeSchool: SchoolType;
  summonsList: ParentSummons[];
  onSummonsChange: (summons: ParentSummons[]) => void;
  students: Student[];
  staff: Staff[];
  loggedInUser: Staff;
}

export const SummonsModule: React.FC<SummonsModuleProps> = ({
  activeSchool,
  summonsList,
  onSummonsChange,
  students,
  staff,
  loggedInUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modal / Editing states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSummons, setSelectedSummons] = useState<ParentSummons | null>(null);

  // New Summons Form state
  const [selectedGrade, setSelectedGrade] = useState('');
  const [studentId, setStudentId] = useState('');
  const [apoderadoName, setApoderadoName] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('Oficina de Convivencia Escolar');
  const [reason, setReason] = useState('');

  // Follow-up editing state
  const [editStatus, setEditStatus] = useState<ParentSummons['status']>('Pendiente');
  const [editNotes, setEditNotes] = useState('');

  const grades = Array.from(new Set(students.map(s => s.grade))).sort();
  const filteredStudents = students.filter(s => s.grade === selectedGrade);
  const schoolStaff = staff;

  const handleOpenNewModal = () => {
    setSelectedGrade('');
    setStudentId('');
    setApoderadoName('');
    setInterviewerId(loggedInUser.rut);
    setDate(new Date().toISOString().split('T')[0]);
    setTime('10:00');
    setLocation('Oficina de Convivencia Escolar');
    setReason('');
    setIsModalOpen(true);
  };

  const handleCreateSummons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error('Debe seleccionar un estudiante.');
      return;
    }
    if (!apoderadoName.trim()) {
      toast.error('Ingrese el nombre del apoderado.');
      return;
    }
    if (!interviewerId) {
      toast.error('Debe seleccionar un entrevistador.');
      return;
    }
    if (!date || !time) {
      toast.error('Seleccione fecha y hora.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Ingrese el motivo de la citación.');
      return;
    }

    const student = students.find(s => s.id === studentId);
    const interviewer = staff.find(st => st.rut === interviewerId);
    if (!student || !interviewer) {
      toast.error('Datos no encontrados.');
      return;
    }

    const payload = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      apoderadoName: apoderadoName.trim(),
      interviewerId: interviewer.rut,
      interviewerName: `${interviewer.firstName} ${interviewer.lastName}`,
      interviewerRole: interviewer.role,
      date,
      time,
      location: location.trim(),
      reason: reason.trim(),
      status: 'Pendiente' as const,
      school: activeSchool
    };

    try {
      const created = await dbService.createParentSummons(payload);
      onSummonsChange([created, ...summonsList]);
      setIsModalOpen(false);
      toast.success('Citación registrada con éxito.');
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar citación.');
    }
  };

  const handleSelectSummons = (summons: ParentSummons) => {
    setSelectedSummons(summons);
    setEditStatus(summons.status);
    setEditNotes(summons.notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedSummons) return;

    const payload: Partial<ParentSummons> = {
      status: editStatus,
      notes: editStatus === 'Asistió' ? editNotes : ''
    };

    try {
      await dbService.updateParentSummons(selectedSummons.id, payload);
      const updated = {
        ...selectedSummons,
        ...payload
      };
      setSelectedSummons(updated);
      onSummonsChange(summonsList.map(s => s.id === selectedSummons.id ? updated : s));
      toast.success('Estado de citación actualizado.');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar citación.');
    }
  };

  const handleDeleteSummons = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta citación? Esta acción es irreversible.')) {
      return;
    }
    try {
      await dbService.deleteParentSummons(id);
      onSummonsChange(summonsList.filter(s => s.id !== id));
      if (selectedSummons?.id === id) {
        setSelectedSummons(null);
      }
      toast.success('Citación eliminada.');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar registro.');
    }
  };

  const handleExportPDF = async (summons: ParentSummons) => {
    const student = students.find(s => s.id === summons.studentId);
    const interviewer = staff.find(st => st.rut === summons.interviewerId);
    if (!student || !interviewer) {
      toast.error('No se pudo encontrar la información completa del estudiante o entrevistador.');
      return;
    }
    toast.loading('Generando documento PDF...', { id: 'pdf-toast' });
    try {
      await exportParentSummonsPDF(summons, student, interviewer);
      toast.success('PDF generado exitosamente.', { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error('Error al generar PDF.', { id: 'pdf-toast' });
    }
  };

  // Filters logic
  const filteredSummons = summonsList.filter(s => {
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.apoderadoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'Todos' || s.grade === gradeFilter;
    const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const getStatusBadge = (status: ParentSummons['status']) => {
    switch (status) {
      case 'Pendiente': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Asistió': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'No asistió': return 'bg-rose-50 text-rose-700 border-rose-250';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-805 tracking-tight flex items-center gap-2">
            <Mail className="text-primary" />
            <span>Citaciones de Apoderado</span>
          </h2>
          <p className="text-sm text-slate-500">Administra las convocatorias, reuniones y actas de compromisos con los apoderados.</p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer select-none"
        >
          <Plus size={16} />
          <span>Nueva Citación</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row gap-3 shadow-xs">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por estudiante, apoderado o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>
        <div className="flex gap-3 shrink-0">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-650 cursor-pointer focus:outline-hidden focus:border-indigo-500"
          >
            <option value="Todos">Todos los Cursos</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-650 cursor-pointer focus:outline-hidden focus:border-indigo-500"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Asistió">Asistió</option>
            <option value="No asistió">No asistió</option>
          </select>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SUMMONS LIST */}
        <div className={`lg:col-span-${selectedSummons ? '7' : '12'} space-y-3`}>
          {filteredSummons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Mail className="stroke-[1.5]" size={42} />
              <p className="text-sm font-semibold">No se registran citaciones registradas</p>
              <p className="text-xs">Usa el botón superior para agendar una citación formal de apoderado.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Estudiante / Curso</th>
                      <th className="p-4">Apoderado</th>
                      <th className="p-4">Fecha / Hora</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredSummons.map(s => (
                      <tr 
                        key={s.id}
                        onClick={() => handleSelectSummons(s)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedSummons?.id === s.id ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{s.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{s.grade}</div>
                        </td>
                        <td className="p-4">{s.apoderadoName}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1"><CalendarDays size={13} className="text-slate-400" /> {s.date}</div>
                          <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5"><Clock size={12} /> {s.time}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getStatusBadge(s.status)}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleExportPDF(s)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
                              title="Exportar PDF de Citación"
                            >
                              <FileDown size={14} />
                            </button>
                            {(loggedInUser.role === 'Convivencia' || loggedInUser.role === 'Directivo' || loggedInUser.role === 'Administrador') && (
                              <button
                                onClick={() => handleDeleteSummons(s.id)}
                                className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-slate-405 hover:text-rose-600 transition-colors"
                                title="Eliminar citación"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SELECTED DETAILS PANEL */}
        {selectedSummons && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-zoom-in relative">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Detalles de Citación</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold mt-0.5">Estado: {selectedSummons.status}</p>
              </div>
              <button 
                onClick={() => setSelectedSummons(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info grid */}
              <div className="space-y-4 text-xs font-semibold text-slate-650">
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Estudiante Citado</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{selectedSummons.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{selectedSummons.grade}</div>
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 pt-2 flex items-start gap-3">
                    <User size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Apoderado Citado</div>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedSummons.apoderadoName}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/60 border border-slate-150 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><CalendarDays size={12} /> Fecha</div>
                    <div className="text-slate-800 font-bold">{selectedSummons.date}</div>
                  </div>
                  <div className="bg-slate-50/60 border border-slate-150 p-3 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Clock size={12} /> Hora</div>
                    <div className="text-slate-800 font-bold">{selectedSummons.time}</div>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-150 p-3 rounded-xl flex items-start gap-2.5">
                  <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Lugar de Entrevista</div>
                    <div className="text-slate-800 font-bold mt-0.5">{selectedSummons.location}</div>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-150 p-3 rounded-xl flex items-start gap-2.5">
                  <User size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Entrevistador Responsable</div>
                    <div className="text-slate-800 font-bold mt-0.5">{selectedSummons.interviewerName}</div>
                    <div className="text-[10px] text-slate-405 font-bold uppercase mt-0.5">{selectedSummons.interviewerRole}</div>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><FileText size={13} /> Objetivo / Motivo:</div>
                  <p className="text-slate-700 font-normal leading-relaxed text-justify bg-white border border-slate-200/60 p-2.5 rounded-lg">{selectedSummons.reason}</p>
                </div>
              </div>

              {/* ACTION: PDF EXPORT */}
              <button
                onClick={() => handleExportPDF(selectedSummons)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <FileDown size={14} />
                <span>Descargar Acta de Citación PDF</span>
              </button>

              {/* FOLLOW-UP STATUS FORM */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Bitácora Post-Entrevista</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado de Asistencia</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ParentSummons['status'])}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold cursor-pointer"
                    >
                      <option value="Pendiente">Pendiente (No realizada)</option>
                      <option value="Asistió">Asistió (Realizada)</option>
                      <option value="No asistió">No asistió (Inasistencia)</option>
                    </select>
                  </div>

                  {editStatus === 'Asistió' && (
                    <div className="animate-in fade-in zoom-in">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Acuerdos y Compromisos</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Registre los compromisos firmados por el apoderado y el entrevistador..."
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={handleUpdateStatus}
                    className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>Guardar Bitácora</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW SUMMONS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Registrar Nueva Citación de Apoderado</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSummons} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Curso</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setStudentId('');
                    }}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold cursor-pointer"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Estudiante</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold cursor-pointer"
                    required
                    disabled={!selectedGrade}
                  >
                    <option value="">Seleccione...</option>
                    {filteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Nombre del Apoderado Citado</label>
                <input
                  type="text"
                  value={apoderadoName}
                  onChange={(e) => setApoderadoName(e.target.value)}
                  placeholder="Ej: Carmen Gloria Morales Bascuñán"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Hora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Lugar de Entrevista</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Entrevistador Responsable</label>
                  <select
                    value={interviewerId}
                    onChange={(e) => setInterviewerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold cursor-pointer"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {schoolStaff.map(st => (
                      <option key={st.rut} value={st.rut}>{st.firstName} {st.lastName} ({st.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">Objetivo y Motivo de Citación</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detalle el motivo técnico de la citación de forma clara y respetuosa..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs leading-relaxed focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-150 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-650 font-bold py-2.5 rounded-xl text-center text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-xl text-center text-xs transition-all cursor-pointer shadow-sm"
                >
                  Confirmar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
