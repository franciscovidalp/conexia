import React, { useState } from 'react';
import { 
  Network, Plus, FileDown, Trash2, CheckCircle, 
  Search, X, CalendarDays, Clock, FileSpreadsheet
} from 'lucide-react';
import type { ExternalReferral, Student, Staff, SchoolType } from '../types';
import { dbService } from '../firebase';
import { exportExternalReferralPDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface DerivationsModuleProps {
  activeSchool: SchoolType;
  referrals: ExternalReferral[];
  onReferralsChange: (refs: ExternalReferral[]) => void;
  students: Student[];
  staff: Staff[];
  loggedInUser: Staff;
}

export const DerivationsModule: React.FC<DerivationsModuleProps> = ({
  activeSchool,
  referrals,
  onReferralsChange,
  students,
  staff,
  loggedInUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modal / Editing states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ExternalReferral | null>(null);

  // New Referral Form state
  const [selectedGrade, setSelectedGrade] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institution, setInstitution] = useState<ExternalReferral['institution']>('OPD');
  const [reason, setReason] = useState('');
  const [previousMeasures, setPreviousMeasures] = useState('');

  // Follow-up editing state
  const [editStatus, setEditStatus] = useState<ExternalReferral['status']>('Pendiente');
  const [editSentDate, setEditSentDate] = useState('');
  const [editFolio, setEditFolio] = useState('');
  const [editObservations, setEditObservations] = useState('');

  const handleOpenNewModal = () => {
    setSelectedGrade('');
    setStudentId('');
    setInstitution('OPD');
    setReason('');
    setPreviousMeasures('');
    setIsModalOpen(true);
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error('Debe seleccionar un estudiante.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Ingrese el motivo de la derivación.');
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      toast.error('Estudiante no encontrado.');
      return;
    }

    const payload = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      school: activeSchool,
      institution,
      reason,
      previousMeasures: previousMeasures || 'Entrevistas de contención y citación de apoderado.',
      status: 'Pendiente' as const,
      professionalId: loggedInUser.rut,
      professionalName: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };

    try {
      const created = await dbService.createExternalReferral(payload);
      onReferralsChange([created, ...referrals]);
      setIsModalOpen(false);
      toast.success('Derivación registrada de forma exitosa.');
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar derivación.');
    }
  };

  const handleSelectReferral = (ref: ExternalReferral) => {
    setSelectedReferral(ref);
    setEditStatus(ref.status);
    setEditSentDate(ref.sentDate || '');
    setEditFolio(ref.folioNumber || '');
    setEditObservations(ref.observations || '');
  };

  const handleUpdateFollowup = async () => {
    if (!selectedReferral) return;

    const payload = {
      status: editStatus,
      sentDate: editSentDate || undefined,
      folioNumber: editFolio || undefined,
      observations: editObservations || undefined
    };

    try {
      await dbService.updateExternalReferral(selectedReferral.id, payload);
      
      const updatedRef = {
        ...selectedReferral,
        ...payload
      };

      setSelectedReferral(updatedRef);
      onReferralsChange(referrals.map(r => r.id === selectedReferral.id ? updatedRef : r));
      toast.success('Bitácora de derivación actualizada.');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar datos.');
    }
  };

  const handleDeleteReferral = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta derivación a red externa? Esta acción es irreversible.')) {
      return;
    }
    try {
      await dbService.deleteExternalReferral(id);
      onReferralsChange(referrals.filter(r => r.id !== id));
      if (selectedReferral?.id === id) {
        setSelectedReferral(null);
      }
      toast.success('Derivación eliminada de la bitácora.');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar registro.');
    }
  };

  // Unique Grades for filtering
  const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();

  // Statistics
  const pendingCount = referrals.filter(r => r.status === 'Pendiente').length;
  const sentCount = referrals.filter(r => r.status === 'Enviado' || r.status === 'En Revisión').length;
  const resolvedCount = referrals.filter(r => r.status === 'Resuelto').length;

  // Filtered referrals list
  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.studentId.includes(searchTerm);
    
    const matchesInst = institutionFilter === 'Todos' || r.institution === institutionFilter;
    const matchesStatus = statusFilter === 'Todos' || r.status === statusFilter;

    return matchesSearch && matchesInst && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Network className="text-primary h-7 w-7" />
            Derivación e Intervención en Redes Externas
          </h2>
          <p className="text-sm text-slate-500">
            Oficios y carpetas formales dirigidas a OPD, Tribunales de Familia, CESFAM y redes de protección de la niñez.
          </p>
        </div>
        
        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-sm shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Generar Derivación a Red</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pendientes</p>
            <h4 className="text-2xl font-black text-slate-800">{pendingCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Enviados / En Curso</p>
            <h4 className="text-2xl font-black text-slate-800">{sentCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Resueltos / Cerrados</p>
            <h4 className="text-2xl font-black text-slate-800">{resolvedCount}</h4>
          </div>
        </div>
      </div>

      {/* FILTER & LIST AREA */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* SEARCH AND FILTERS */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por alumno, rut o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Enviado">Enviados</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Resuelto">Resueltos</option>
              <option value="Archivado">Archivados</option>
            </select>

            {/* Institution Filter */}
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="Todos">Todas las Instituciones</option>
              <option value="OPD">OPD</option>
              <option value="CESFAM">CESFAM</option>
              <option value="Tribunal de Familia">Tribunal de Familia</option>
              <option value="Carabineros">Carabineros</option>
              <option value="Oficina Local de Niñez (OLN)">OLN</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="overflow-x-auto">
          {filteredReferrals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Network className="mx-auto h-12 w-12 text-slate-350" />
              <p className="font-semibold text-sm">No se encontraron derivaciones en esta categoría.</p>
              <p className="text-xs text-slate-450">Agrega un nuevo oficio formal presionando el botón "Generar Derivación".</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Estudiante / Curso</th>
                  <th className="px-6 py-4">Institución Destino</th>
                  <th className="px-6 py-4">N° Oficio / Folio</th>
                  <th className="px-6 py-4">Fecha de Derivación</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReferrals.map((ref) => {
                  return (
                    <tr key={ref.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="font-bold text-slate-800">{ref.studentName}</div>
                        <div className="text-xs text-slate-450">{ref.studentId} • {ref.grade}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/50">
                          {ref.institution}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 font-mono text-xs text-slate-650">
                        {ref.folioNumber || '---'}
                      </td>
                      <td className="px-6 py-4.5 font-medium text-slate-600">
                        {ref.sentDate || 'Pendiente'}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                          ref.status === 'Resuelto' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                          ref.status === 'Enviado' ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                          ref.status === 'En Revisión' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                          'text-slate-650 bg-slate-50 border-slate-200'
                        }`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2">
                        <button
                          onClick={() => handleSelectReferral(ref)}
                          className="text-xs font-bold text-primary bg-primary-light/50 hover:bg-primary-light hover:text-primary-hover px-3 py-1.5 rounded-lg border border-primary/5 transition-all cursor-pointer"
                        >
                          Actualizar
                        </button>
                        <button
                          onClick={() => {
                            const student = students.find(s => s.id === ref.studentId);
                            const professional = staff.find(st => st.rut === ref.professionalId) || loggedInUser;
                            if (student) {
                              exportExternalReferralPDF(ref, student, professional);
                              toast.success('Generando Ficha de Derivación PDF...');
                            } else {
                              toast.error('No se pudo encontrar la ficha del alumno.');
                            }
                          }}
                          title="Descargar Ficha PDF"
                          className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/40 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                        >
                          <FileDown size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteReferral(ref.id)}
                          title="Eliminar"
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FOLLOW-UP DRAWER / POPUP */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in overflow-hidden border-l border-slate-200">
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary-light/10 border border-primary/20 px-2 py-0.5 rounded-md">
                  Ficha de Derivación: {selectedReferral.institution}
                </span>
                <h3 className="text-lg font-black mt-1.5">{selectedReferral.studentName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Curso: {selectedReferral.grade} • Creada: {selectedReferral.createdAt.split('T')[0]}
                </p>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50">
              {/* Context Summary card */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Detalles Originales</h4>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">Motivo Derivación:</span>
                  <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{selectedReferral.reason}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">Medidas Previas del Colegio:</span>
                  <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{selectedReferral.previousMeasures}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold">Profesional a cargo:</span>
                  <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{selectedReferral.professionalName}</p>
                </div>
              </div>

              {/* Follow-up / Status Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Gestión de Envío y Folios</h4>

                {/* Status selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Estado de Derivación</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente (No enviado)</option>
                    <option value="Enviado">Enviado (Oficio en tránsito)</option>
                    <option value="En Revisión">En Revisión (Bajo análisis receptor)</option>
                    <option value="Resuelto">Resuelto (Caso con medidas de red)</option>
                    <option value="Archivado">Archivado / Cerrado</option>
                  </select>
                </div>

                {/* Sent Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Recepción / Envío</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
                    <input
                      type="date"
                      value={editSentDate}
                      onChange={(e) => setEditSentDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* Folio / Oficio */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">N° de Oficio / Folio de Recepción</label>
                  <input
                    type="text"
                    value={editFolio}
                    onChange={(e) => setEditFolio(e.target.value)}
                    placeholder="Ej: OF-2026-088 / ORD-1244"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Observaciones / Respuestas de la Red</label>
                  <textarea
                    value={editObservations}
                    onChange={(e) => setEditObservations(e.target.value)}
                    placeholder="Registre las respuestas de la OPD, citaciones de tribunales o progresos de atención médica..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  const student = students.find(s => s.id === selectedReferral.studentId);
                  const professional = staff.find(st => st.rut === selectedReferral.professionalId) || loggedInUser;
                  if (student) {
                    exportExternalReferralPDF(selectedReferral, student, professional);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200/50 cursor-pointer"
              >
                <FileDown size={14} />
                <span>Imprimir Ficha</span>
              </button>

              <button
                onClick={handleUpdateFollowup}
                className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW REFERRAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Network className="text-primary" size={18} />
                Derivación a Redes Externas
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-755 p-1 cursor-pointer"
              >
                <Plus className="rotate-45" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-6 space-y-4">
              
              {/* Student selectors with course filtering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Curso del Estudiante</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      const gradeStudents = students.filter(s => s.grade === e.target.value);
                      setStudentId(gradeStudents[0]?.id || '');
                    }}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    required
                  >
                    <option value="">Seleccione curso...</option>
                    {uniqueGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Estudiante a Derivar</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={!selectedGrade}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>Seleccione estudiante...</option>
                    {students
                      .filter(s => s.grade === selectedGrade)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Institution of destination */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Institución de Apoyo / Receptora</label>
                <select
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                >
                  <option value="OPD">Oficina de Protección de Derechos (OPD)</option>
                  <option value="CESFAM">CESFAM / Salud Primaria Mental</option>
                  <option value="Tribunal de Familia">Tribunal de Familia</option>
                  <option value="Carabineros">Carabineros / Denuncia Violencia</option>
                  <option value="Oficina Local de Niñez (OLN)">Oficina Local de Niñez (OLN)</option>
                  <option value="Otro">Otro Centro Especializado externo</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Síntesis Diagnóstica / Motivo de Derivación</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describa pormenorizadamente los indicadores detectados de negligencia, vulneración o riesgo clínico del alumno..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  rows={4}
                  required
                />
              </div>

              {/* Previous measures */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Medidas Adoptadas Previamente por el Colegio</label>
                <textarea
                  value={previousMeasures}
                  onChange={(e) => setPreviousMeasures(e.target.value)}
                  placeholder="Detalle entrevistas psicosociales realizadas, acuerdos de convivencia firmados con apoderados o resguardos RICE previos..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Confirmar y Generar Oficio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
