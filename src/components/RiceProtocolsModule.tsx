import React, { useState } from 'react';
import { 
  ClipboardCheck, AlertCircle, Plus, Search, 
  Clock, CheckCircle2, Lock, ShieldAlert, FileDown, X, Info,
  Trash2, BookOpen, CalendarDays
} from 'lucide-react';
import type { Student, Staff, SchoolType, RiceProtocol, ProtocolStep } from '../types';
import { dbService } from '../firebase';
import { exportRiceProtocolPDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface RiceProtocolsModuleProps {
  activeSchool: SchoolType;
  students: Student[];
  staff: Staff[];
  loggedInUser: Staff;
  riceProtocols: RiceProtocol[];
  onRiceProtocolsChange: (protos: RiceProtocol[]) => void;
}

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const isOverdue = (p: RiceProtocol): boolean => {
  if (p.status === 'Cerrado') return false;
  const today = new Date().toISOString().split('T')[0];
  return today > p.dueDate;
};

export const RiceProtocolsModule: React.FC<RiceProtocolsModuleProps> = ({
  activeSchool,
  students,
  staff,
  loggedInUser,
  riceProtocols,
  onRiceProtocolsChange
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Abiertos' | 'Cerrados' | 'Fuera de Plazo'>('Todos');
  const [typeFilter, setTypeFilter] = useState<string>('Todos');

  // Active detail drawer/modal
  const [selectedProtocol, setSelectedProtocol] = useState<RiceProtocol | null>(null);
  const [activeStepId, setActiveStepId] = useState<string>('1_detection');

  // Step editing state (temp state for editing current active step in drawer)
  const [stepNotes, setStepNotes] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [stepFields, setStepFields] = useState<any>({});

  // New Protocol Form Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedNewGrade, setSelectedNewGrade] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newProtocolType, setNewProtocolType] = useState<'Bullying' | 'Violencia Escolar' | 'Vulneración de Derechos' | 'Drogas/Alcohol' | 'Ciberacoso' | 'Riesgo Suicida'>('Bullying');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newReporter, setNewReporter] = useState('');
  const [newInitialMeasures, setNewInitialMeasures] = useState('');

  // 15 school/calendar days for due date
  const handleOpenNewModal = () => {
    setIsNewModalOpen(true);
    setSelectedNewGrade('');
    setNewStudentId('');
    setNewReporter(`${loggedInUser.firstName} ${loggedInUser.lastName}`);
    setNewDescription('');
    setNewInitialMeasures('');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId) {
      toast.error('Debe seleccionar un estudiante.');
      return;
    }
    if (!newDescription.trim()) {
      toast.error('Ingrese una descripción de los hechos.');
      return;
    }

    const student = students.find(s => s.id === newStudentId);
    if (!student) {
      toast.error('Estudiante no encontrado.');
      return;
    }

    // Default 5-stage steps
    const defaultSteps: ProtocolStep[] = [
      {
        id: '1_detection',
        name: 'Detección y Registro',
        description: 'Registro de la denuncia o sospecha inicial y medidas de resguardo inmediatas.',
        status: 'Completado',
        completedAt: newDate,
        completedBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`,
        notes: `Protocolo activado por ${newReporter}. ${newDescription}`,
        fields: {
          initialMeasures: newInitialMeasures || 'Se aplican medidas básicas de contención y acompañamiento.',
          reporterName: newReporter
        }
      },
      {
        id: '2_notification',
        name: 'Derivación y Notificación',
        description: 'Citación formal e información entregada a los apoderados en un plazo máximo de 48 horas.',
        status: 'Pendiente',
        fields: {
          victimParentNotifiedDate: '',
          aggressorParentNotifiedDate: '',
          communicationType: 'Citación presencial'
        }
      },
      {
        id: '3_investigation',
        name: 'Investigación y Entrevistas',
        description: 'Entrevistas a involucrados, recopilación de testimonios y análisis de evidencias.',
        status: 'Pendiente',
        fields: {
          interviews: [],
          findings: ''
        }
      },
      {
        id: '4_resolution',
        name: 'Resolución y Medidas RICE',
        description: 'Determinación de medidas pedagógicas/formativas o sanciones reglamentarias.',
        status: 'Pendiente',
        fields: {
          measureType: 'Formativa',
          resolutionDescription: '',
          commitmentsSigned: false
        }
      },
      {
        id: '5_followup',
        name: 'Seguimiento e Informe',
        description: 'Monitoreo de compromisos de apoyo, derivación a dupla y cierre del expediente.',
        status: 'Pendiente',
        fields: {
          referredToDupla: false,
          followupDate: '',
          finalReportSummary: ''
        }
      }
    ];

    const startedAt = newDate;
    const dueDate = addDays(startedAt, 15); // standard 15 calendar days for compliance alert

    try {
      const created = await dbService.createRiceProtocol({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        grade: student.grade,
        school: activeSchool,
        protocolType: newProtocolType,
        status: 'Abierto',
        steps: defaultSteps,
        startedAt,
        dueDate
      });

      onRiceProtocolsChange([created, ...riceProtocols]);
      setIsNewModalOpen(false);
      toast.success('Protocolo activado correctamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al iniciar el protocolo.');
    }
  };

  // Open drawer and load step details
  const handleSelectProtocol = (p: RiceProtocol) => {
    setSelectedProtocol(p);
    // Find first incomplete step or default to first step
    const firstIncomplete = p.steps.find(s => s.status !== 'Completado');
    const stepId = firstIncomplete ? firstIncomplete.id : '1_detection';
    handleSelectStep(p, stepId);
  };

  const handleSelectStep = (p: RiceProtocol, stepId: string) => {
    setActiveStepId(stepId);
    const step = p.steps.find(s => s.id === stepId);
    if (step) {
      setStepNotes(step.notes || '');
      setStepCompleted(step.status === 'Completado');
      setStepFields(step.fields || {});
    }
  };

  const handleSaveStep = async () => {
    if (!selectedProtocol) return;

    const updatedSteps = selectedProtocol.steps.map(step => {
      if (step.id === activeStepId) {
        return {
          ...step,
          status: stepCompleted ? 'Completado' as const : ('En Proceso' as const),
          completedAt: stepCompleted ? new Date().toISOString().split('T')[0] : undefined,
          completedBy: stepCompleted ? `${loggedInUser.firstName} ${loggedInUser.lastName}` : undefined,
          notes: stepNotes,
          fields: stepFields
        };
      }
      return step;
    });

    try {
      await dbService.updateRiceProtocol(selectedProtocol.id, { steps: updatedSteps });
      
      const updatedProto = {
        ...selectedProtocol,
        steps: updatedSteps
      };
      
      setSelectedProtocol(updatedProto);
      onRiceProtocolsChange(riceProtocols.map(p => p.id === selectedProtocol.id ? updatedProto : p));
      toast.success('Etapa guardada.');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar cambios.');
    }
  };

  const handleCloseProtocol = async () => {
    if (!selectedProtocol) return;

    // Check if all steps are completed
    const incomplete = selectedProtocol.steps.filter(s => s.status !== 'Completado');
    if (incomplete.length > 0) {
      if (!window.confirm(`Existen ${incomplete.length} etapas pendientes de completar. ¿Está seguro que desea cerrar el protocolo legalmente?`)) {
        return;
      }
    }

    try {
      const closingDate = new Date().toISOString().split('T')[0];
      await dbService.updateRiceProtocol(selectedProtocol.id, {
        status: 'Cerrado',
        closedAt: closingDate
      });

      const updatedProto = {
        ...selectedProtocol,
        status: 'Cerrado' as const,
        closedAt: closingDate
      };

      setSelectedProtocol(updatedProto);
      onRiceProtocolsChange(riceProtocols.map(p => p.id === selectedProtocol.id ? updatedProto : p));
      toast.success('El protocolo ha sido CERRADO y archivado.');
    } catch (err) {
      console.error(err);
      toast.error('Error al cerrar el protocolo.');
    }
  };

  const handleDeleteProtocol = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este protocolo de actuación? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await dbService.deleteRiceProtocol(id);
      onRiceProtocolsChange(riceProtocols.filter(p => p.id !== id));
      if (selectedProtocol?.id === id) {
        setSelectedProtocol(null);
      }
      toast.success('Protocolo eliminado.');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar el protocolo.');
    }
  };

  // Calculations for dashboard
  const activeCount = riceProtocols.filter(p => p.status === 'Abierto').length;
  const closedCount = riceProtocols.filter(p => p.status === 'Cerrado').length;
  const overdueCount = riceProtocols.filter(isOverdue).length;
  const resolutionRate = riceProtocols.length > 0 
    ? Math.round((closedCount / riceProtocols.length) * 100) 
    : 0;

  // Filtered protocols list
  const filteredProtocols = riceProtocols.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.studentId.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'Abiertos') matchesStatus = p.status === 'Abierto';
    else if (statusFilter === 'Cerrados') matchesStatus = p.status === 'Cerrado';
    else if (statusFilter === 'Fuera de Plazo') matchesStatus = isOverdue(p);

    const matchesType = typeFilter === 'Todos' || p.protocolType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="text-primary h-7 w-7" />
            Protocolos de Actuación Digital (RICE)
          </h2>
          <p className="text-sm text-slate-500">
            Seguimiento legal paso a paso de incidentes y aplicación de protocolos de Convivencia Escolar.
          </p>
        </div>
        
        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-sm shrink-0"
        >
          <Plus size={16} />
          <span>Activar Protocolo RICE</span>
        </button>
      </div>

      {/* OVERVIEW STATS (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Activos</p>
            <h4 className="text-2xl font-black text-slate-800">{activeCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Cerrados</p>
            <h4 className="text-2xl font-black text-slate-800">{closedCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${overdueCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Fuera de Plazo</p>
            <h4 className={`text-2xl font-black ${overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{overdueCount}</h4>
          </div>
          {overdueCount > 0 && <span className="absolute top-0 right-0 w-2 h-full bg-red-500"></span>}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tasa de Cierre</p>
            <h4 className="text-2xl font-black text-slate-800">{resolutionRate}%</h4>
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
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
              {(['Todos', 'Abiertos', 'Cerrados', 'Fuera de Plazo'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    statusFilter === opt
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shrink-0 cursor-pointer"
            >
              <option value="Todos">Todos los Protocolos</option>
              <option value="Bullying">Bullying / Acoso</option>
              <option value="Violencia Escolar">Violencia Escolar</option>
              <option value="Vulneración de Derechos">Vulneración de Derechos</option>
              <option value="Drogas/Alcohol">Drogas/Alcohol</option>
              <option value="Ciberacoso">Ciberacoso</option>
              <option value="Riesgo Suicida">Riesgo Suicida</option>
            </select>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="overflow-x-auto">
          {filteredProtocols.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <p className="font-medium text-sm">No se encontraron protocolos registrados.</p>
              <p className="text-xs text-slate-450">Prueba ajustando los filtros de búsqueda o activa uno nuevo.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Estudiante / Curso</th>
                  <th className="px-6 py-4">Tipo Protocolo</th>
                  <th className="px-6 py-4">Fecha Inicio</th>
                  <th className="px-6 py-4">Límite Legal</th>
                  <th className="px-6 py-4">Progreso Etapas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProtocols.map((p) => {
                  const completedSteps = p.steps.filter(s => s.status === 'Completado').length;
                  const percent = Math.round((completedSteps / p.steps.length) * 100);
                  const isLate = isOverdue(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-550/10 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="font-bold text-slate-800">{p.studentName}</div>
                        <div className="text-xs text-slate-450">{p.studentId} • {p.grade}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/50">
                          {p.protocolType}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 font-medium text-slate-600">
                        {p.startedAt}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className={`font-semibold ${isLate ? 'text-red-600 font-bold flex items-center gap-1 animate-pulse' : 'text-slate-650'}`}>
                          {isLate && <AlertCircle size={13} />}
                          {p.dueDate}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="w-full max-w-[130px] space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>{completedSteps}/{p.steps.length} Etapas</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        {p.status === 'Cerrado' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <CheckCircle2 size={12} />
                            Cerrado
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                            isLate 
                              ? 'text-red-700 bg-red-50 border-red-100' 
                              : 'text-indigo-700 bg-indigo-50 border-indigo-100'
                          }`}>
                            <Clock size={12} />
                            Activo {isLate && '(Vencido)'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2">
                        <button
                          onClick={() => handleSelectProtocol(p)}
                          className="text-xs font-bold text-primary bg-primary-light/50 hover:bg-primary-light hover:text-primary-hover px-3 py-1.5 rounded-lg border border-primary/5 transition-all"
                        >
                          Gestionar
                        </button>
                        <button
                          onClick={() => {
                            const student = students.find(s => s.id === p.studentId);
                            if (student) {
                              exportRiceProtocolPDF(p, student, staff.find(st => st.role === 'Convivencia'));
                              toast.success('Generando expediente PDF...');
                            } else {
                              toast.error('No se pudo encontrar la ficha del alumno.');
                            }
                          }}
                          title="Descargar Acta PDF"
                          className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/40 rounded-lg inline-flex items-center justify-center transition-all"
                        >
                          <FileDown size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProtocol(p.id)}
                          title="Eliminar"
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg inline-flex items-center justify-center transition-all"
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

      {/* TIMELINE MANAGEMENT DRAWER / SPLIT PANEL */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          {/* Drawer Wrapper */}
          <div className="w-full max-w-4xl bg-slate-50 h-full flex flex-col shadow-2xl animate-slide-in overflow-hidden border-l border-slate-200">
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary-light/10 border border-primary/20 px-2 py-0.5 rounded-md">
                  Protocolo {selectedProtocol.protocolType}
                </span>
                <h3 className="text-lg font-black mt-1.5">{selectedProtocol.studentName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Curso: {selectedProtocol.grade} • Iniciado el {selectedProtocol.startedAt} • Límite: {selectedProtocol.dueDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedProtocol.status === 'Abierto' ? (
                  <button
                    onClick={handleCloseProtocol}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    <CheckCircle2 size={14} />
                    <span>Cerrar Protocolo</span>
                  </button>
                ) : (
                  <span className="bg-emerald-950/80 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-extrabold border border-emerald-900/50 flex items-center gap-1.5">
                    <Lock size={12} />
                    Protocolo Cerrado
                  </span>
                )}
                
                <button
                  onClick={() => {
                    const student = students.find(s => s.id === selectedProtocol.studentId);
                    if (student) {
                      exportRiceProtocolPDF(selectedProtocol, student, staff.find(st => st.role === 'Convivencia'));
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white p-2 rounded-xl transition-all border border-slate-700/60"
                  title="Exportar Expediente PDF"
                >
                  <FileDown size={15} />
                </button>

                <button
                  onClick={() => setSelectedProtocol(null)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Split Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Timeline Sidebar */}
              <div className="w-1/3 border-r border-slate-200 bg-white p-5 space-y-4 overflow-y-auto shrink-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Línea de Tiempo RICE</h4>
                <div className="space-y-1.5">
                  {selectedProtocol.steps.map((step, idx) => {
                    const isSelected = step.id === activeStepId;
                    const isDone = step.status === 'Completado';
                    const isPending = step.status === 'Pendiente';
                    const isProcessing = step.status === 'En Proceso';

                    return (
                      <button
                        key={step.id}
                        onClick={() => handleSelectStep(selectedProtocol, step.id)}
                        className={`w-full flex text-left p-3 rounded-xl border transition-all relative ${
                          isSelected 
                            ? 'border-primary bg-primary-light/10 text-primary font-bold shadow-sm' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-750 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex gap-2.5 w-full">
                          {/* Dot / Number indicator */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-extrabold mt-0.5 ${
                            isDone 
                              ? 'bg-emerald-500 text-white' 
                              : isProcessing 
                                ? 'bg-indigo-500 text-white animate-pulse'
                                : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          
                          <div>
                            <p className="text-xs leading-snug font-bold">{step.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                              {isDone ? `Hecho: ${step.completedAt}` : isPending ? 'Pendiente' : 'En edición'}
                            </p>
                          </div>
                        </div>

                        {isSelected && <span className="absolute top-0 right-0 w-1.5 h-full bg-primary rounded-r-xl"></span>}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 leading-relaxed flex gap-2">
                  <Info size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Importante:</span> Conforme a las orientaciones de la Superintendencia, cada etapa debe contener registros verídicos y firmas de respaldo.
                  </div>
                </div>
              </div>

              {/* Right Step Detail & Editor */}
              <div className="flex-1 bg-slate-50 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Stage description card */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm space-y-1">
                    <h4 className="text-base font-extrabold text-slate-800">
                      {selectedProtocol.steps.find(s => s.id === activeStepId)?.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selectedProtocol.steps.find(s => s.id === activeStepId)?.description}
                    </p>
                  </div>

                  {/* Form specific fields based on activeStepId */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Datos e Indicadores de la Etapa</h5>
                    
                    {activeStepId === '1_detection' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Medidas de resguardo adoptadas de inmediato</label>
                          <textarea
                            value={stepFields.initialMeasures || ''}
                            onChange={(e) => setStepFields({ ...stepFields, initialMeasures: e.target.value })}
                            placeholder="Ej. Separación preventiva de cursos durante los recreos, tutoría individual, etc."
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Funcionario que detecta / reporta</label>
                          <input
                            type="text"
                            value={stepFields.reporterName || ''}
                            onChange={(e) => setStepFields({ ...stepFields, reporterName: e.target.value })}
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {activeStepId === '2_notification' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Citación Apoderado Víctima</label>
                            <div className="relative">
                              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
                              <input
                                type="date"
                                value={stepFields.victimParentNotifiedDate || ''}
                                onChange={(e) => setStepFields({ ...stepFields, victimParentNotifiedDate: e.target.value })}
                                disabled={selectedProtocol.status === 'Cerrado'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Citación Apoderado Denunciado</label>
                            <div className="relative">
                              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
                              <input
                                type="date"
                                value={stepFields.aggressorParentNotifiedDate || ''}
                                onChange={(e) => setStepFields({ ...stepFields, aggressorParentNotifiedDate: e.target.value })}
                                disabled={selectedProtocol.status === 'Cerrado'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Canal de Comunicación Oficial</label>
                          <input
                            type="text"
                            placeholder="Ej. Acta firmada presencial / Correo certificado"
                            value={stepFields.communicationType || ''}
                            onChange={(e) => setStepFields({ ...stepFields, communicationType: e.target.value })}
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    {activeStepId === '3_investigation' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Entrevistados / Testigos declarantes (Separar por comas)</label>
                          <input
                            type="text"
                            placeholder="Ej. Profesor Jefe, Inspector de patio, Alumno A"
                            value={Array.isArray(stepFields.interviews) ? stepFields.interviews.join(', ') : stepFields.interviews || ''}
                            onChange={(e) => setStepFields({ ...stepFields, interviews: e.target.value.split(',').map((s: string) => s.trim()) })}
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Hallazgos y Conclusiones de la Investigación</label>
                          <textarea
                            placeholder="Registrar un breve análisis cronológico de los antecedentes y evidencias levantadas..."
                            value={stepFields.findings || ''}
                            onChange={(e) => setStepFields({ ...stepFields, findings: e.target.value })}
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {activeStepId === '4_resolution' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Medida Adoptada</label>
                            <select
                              value={stepFields.measureType || 'Formativa'}
                              onChange={(e) => setStepFields({ ...stepFields, measureType: e.target.value })}
                              disabled={selectedProtocol.status === 'Cerrado'}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                            >
                              <option value="Formativa">Medida Formativa RICE</option>
                              <option value="Pedagógica">Medida Pedagógica</option>
                              <option value="Disciplinaria / Sanción">Disciplinaria / Sanción RICE</option>
                              <option value="Derivación Externa">Derivación Externa</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id="commitments"
                              checked={stepFields.commitmentsSigned || false}
                              onChange={(e) => setStepFields({ ...stepFields, commitmentsSigned: e.target.checked })}
                              disabled={selectedProtocol.status === 'Cerrado'}
                              className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-1 cursor-pointer"
                            />
                            <label htmlFor="commitments" className="text-xs font-bold text-slate-650 cursor-pointer">
                              ¿Firmaron carta de compromisos?
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Descripción detallada de la Medida/Sanción</label>
                          <textarea
                            placeholder="Describir las sanciones, amonestaciones escritas o intervenciones psicopedagógicas acordadas..."
                            value={stepFields.resolutionDescription || ''}
                            onChange={(e) => setStepFields({ ...stepFields, resolutionDescription: e.target.value })}
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {activeStepId === '5_followup' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id="referred"
                              checked={stepFields.referredToDupla || false}
                              onChange={(e) => setStepFields({ ...stepFields, referredToDupla: e.target.checked })}
                              disabled={selectedProtocol.status === 'Cerrado'}
                              className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-1 cursor-pointer"
                            />
                            <label htmlFor="referred" className="text-xs font-bold text-slate-650 cursor-pointer">
                              ¿Derivar caso a Dupla Psicosocial?
                            </label>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Próximo Seguimiento / Control</label>
                            <div className="relative">
                              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
                              <input
                                type="date"
                                value={stepFields.followupDate || ''}
                                onChange={(e) => setStepFields({ ...stepFields, followupDate: e.target.value })}
                                disabled={selectedProtocol.status === 'Cerrado'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Resumen final de Cierre y Convivencia</label>
                          <textarea
                            placeholder="Redactar el balance final de la convivencia tras la aplicación de medidas y estado del alumno..."
                            value={stepFields.finalReportSummary || ''}
                            onChange={(e) => setStepFields({ ...stepFields, finalReportSummary: e.target.value })}
                            disabled={selectedProtocol.status === 'Cerrado'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* Standard observations / bitacora notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">Observaciones / Bitácora de esta Etapa</label>
                      <textarea
                        value={stepNotes}
                        onChange={(e) => setStepNotes(e.target.value)}
                        placeholder="Ingrese comentarios sobre el progreso, llamadas, dificultades o estados del proceso..."
                        disabled={selectedProtocol.status === 'Cerrado'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-400 font-sans"
                        rows={3.5}
                      />
                    </div>

                    {/* Complete Step Checkbox */}
                    {selectedProtocol.status === 'Abierto' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <input
                          type="checkbox"
                          id="stepCompleted"
                          checked={stepCompleted}
                          onChange={(e) => setStepCompleted(e.target.checked)}
                          className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-1 cursor-pointer"
                        />
                        <label htmlFor="stepCompleted" className="text-xs font-extrabold text-slate-800 cursor-pointer">
                          Marcar esta etapa como COMPLETADA / APROBADA
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom actions inside Drawer editor */}
                {selectedProtocol.status === 'Abierto' && (
                  <div className="mt-6 flex justify-end gap-3 shrink-0 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl shadow-inner">
                    <button
                      onClick={() => handleSelectProtocol(selectedProtocol)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 text-slate-600 transition-all"
                    >
                      Descartar Cambios
                    </button>
                    <button
                      onClick={handleSaveStep}
                      className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Guardar Avance de Etapa
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROTOCOL MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={20} />
                Activar Protocolo RICE Escolar
              </h3>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProtocol} className="p-6 space-y-4">
              {/* Student search/select */}
              {(() => {
                const uniqueGrades = Array.from(new Set(students.map(s => s.grade))).sort();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">Curso del Estudiante</label>
                      <select
                        value={selectedNewGrade}
                        onChange={(e) => {
                          setSelectedNewGrade(e.target.value);
                          const gradeStudents = students.filter(s => s.grade === e.target.value);
                          setNewStudentId(gradeStudents[0]?.id || '');
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
                      <label className="block text-xs font-bold text-slate-550 mb-1">Estudiante Implicado / Afectado</label>
                      <select
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                        disabled={!selectedNewGrade}
                        className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="" disabled>Seleccione estudiante...</option>
                        {students
                          .filter(s => s.grade === selectedNewGrade)
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                );
              })()}


              {/* Protocol type and incident date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Tipo de Protocolo a Activar</label>
                  <select
                    value={newProtocolType}
                    onChange={(e) => setNewProtocolType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  >
                    <option value="Bullying">Bullying / Acoso Escolar</option>
                    <option value="Violencia Escolar">Violencia Escolar (Física/Verbal)</option>
                    <option value="Vulneración de Derechos">Vulneración de Derechos</option>
                    <option value="Drogas/Alcohol">Porte o Consumo Alcohol/Drogas</option>
                    <option value="Ciberacoso">Ciberacoso / Cyberbullying</option>
                    <option value="Riesgo Suicida">Ideación o Riesgo Suicida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Fecha del Suceso / Registro</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Reporter name */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Denunciante / Quien activa el caso</label>
                <input
                  type="text"
                  value={newReporter}
                  onChange={(e) => setNewReporter(e.target.value)}
                  placeholder="Ej. Inspector Carlos Mendoza / Apoderado"
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Incident description */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Descripción de los hechos (Ficha inicial)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describa brevemente lo ocurrido, implicados y testigos reportados..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  rows={3}
                  required
                />
              </div>

              {/* Initial safety measures */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Medidas de resguardo inmediatas adoptadas</label>
                <textarea
                  value={newInitialMeasures}
                  onChange={(e) => setNewInitialMeasures(e.target.value)}
                  placeholder="Ej. Suspensión del agresor, acompañamiento víctima, derivación psicosocial urgente..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  rows={2}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Confirmar e Iniciar Proceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
