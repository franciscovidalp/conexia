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

const getDaysRemaining = (dueDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T12:00:00');
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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

  // Tab states for Drawer (Steps vs. Measures)
  const [drawerTab, setDrawerTab] = useState<'steps' | 'measures'>('steps');

  // Form states for creating a new Measure
  const [measureDesc, setMeasureDesc] = useState('');
  const [measureResp, setMeasureResp] = useState('');
  const [measureStart, setMeasureStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [measureEnd, setMeasureEnd] = useState(() => addDays(new Date().toISOString().split('T')[0], 10));

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
    setDrawerTab('steps');
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

  const handleAddMeasure = async () => {
    if (!selectedProtocol) return;
    if (!measureDesc.trim() || !measureResp.trim()) {
      toast.error('Por favor, ingresa la descripción y el responsable de la medida.');
      return;
    }

    const newMeasure = {
      id: 'measure_' + Date.now(),
      description: measureDesc.trim(),
      responsibleName: measureResp.trim(),
      startDate: measureStart,
      endDate: measureEnd,
      complianceLog: {}
    };

    const updatedMeasures = [...(selectedProtocol.measures || []), newMeasure];

    try {
      await dbService.updateRiceProtocol(selectedProtocol.id, { measures: updatedMeasures });
      
      const updatedProto = {
        ...selectedProtocol,
        measures: updatedMeasures
      };

      setSelectedProtocol(updatedProto);
      onRiceProtocolsChange(riceProtocols.map(p => p.id === selectedProtocol.id ? updatedProto : p));
      
      setMeasureDesc('');
      setMeasureResp('');
      toast.success('Medida de resguardo registrada.');
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar la medida.');
    }
  };

  const handleToggleCompliance = async (measureId: string, dateStr: string, completed: boolean) => {
    if (!selectedProtocol || !selectedProtocol.measures) return;

    const updatedMeasures = selectedProtocol.measures.map(m => {
      if (m.id === measureId) {
        return {
          ...m,
          complianceLog: {
            ...m.complianceLog,
            [dateStr]: completed
          }
        };
      }
      return m;
    });

    try {
      await dbService.updateRiceProtocol(selectedProtocol.id, { measures: updatedMeasures });
      
      const updatedProto = {
        ...selectedProtocol,
        measures: updatedMeasures
      };

      setSelectedProtocol(updatedProto);
      onRiceProtocolsChange(riceProtocols.map(p => p.id === selectedProtocol.id ? updatedProto : p));
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar cumplimiento.');
    }
  };

  const handleDeleteMeasure = async (measureId: string) => {
    if (!selectedProtocol || !selectedProtocol.measures) return;

    const updatedMeasures = selectedProtocol.measures.filter(m => m.id !== measureId);

    try {
      await dbService.updateRiceProtocol(selectedProtocol.id, { measures: updatedMeasures });
      
      const updatedProto = {
        ...selectedProtocol,
        measures: updatedMeasures
      };

      setSelectedProtocol(updatedProto);
      onRiceProtocolsChange(riceProtocols.map(p => p.id === selectedProtocol.id ? updatedProto : p));
      toast.success('Medida de resguardo eliminada.');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la medida.');
    }
  };

  const getWeekDays = () => {
    const current = new Date();
    const week = [];
    const distance = current.getDay() - 1; // 0 para Dom, 1 para Lun, ...
    const monday = new Date(current);
    monday.setDate(current.getDate() - (distance < 0 ? 6 : distance));
    monday.setHours(12, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      week.push({
        dateStr: day.toISOString().split('T')[0],
        dayName: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'][i],
        shortLabel: day.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
      });
    }
    return week;
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
                        <div className="font-semibold text-slate-700">{p.dueDate}</div>
                        {p.status === 'Cerrado' ? (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Completado
                          </div>
                        ) : (() => {
                          const daysLeft = getDaysRemaining(p.dueDate);
                          if (daysLeft < 0) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-100 rounded px-1.5 py-0.5 mt-1 animate-pulse">
                                <AlertCircle size={10} />
                                Vencido {Math.abs(daysLeft)} d
                              </span>
                            );
                          } else if (daysLeft === 0) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 mt-1 animate-pulse">
                                <AlertCircle size={10} />
                                Vence hoy
                              </span>
                            );
                          } else if (daysLeft <= 3) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-1">
                                <AlertCircle size={10} />
                                Crítico ({daysLeft} d)
                              </span>
                            );
                          } else if (daysLeft <= 7) {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-yellow-750 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5 mt-1">
                                <Clock size={10} />
                                Advertencia ({daysLeft} d)
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 mt-1">
                                <CheckCircle2 size={10} />
                                En plazo ({daysLeft} d)
                              </span>
                            );
                          }
                        })()}
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
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-1">
                  <span>Curso: {selectedProtocol.grade}</span>
                  <span>•</span>
                  <span>Iniciado el {selectedProtocol.startedAt}</span>
                  <span>•</span>
                  <span>Límite: {selectedProtocol.dueDate}</span>
                  {selectedProtocol.status === 'Abierto' && (() => {
                    const daysLeft = getDaysRemaining(selectedProtocol.dueDate);
                    if (daysLeft < 0) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-900/60 rounded px-1.5 py-0.5 ml-1">
                          <AlertCircle size={10} className="animate-pulse" />
                          Vencido {Math.abs(daysLeft)} d
                        </span>
                      );
                    } else if (daysLeft === 0) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-900/60 rounded px-1.5 py-0.5 ml-1 animate-pulse">
                          <AlertCircle size={10} />
                          Vence hoy
                        </span>
                      );
                    } else if (daysLeft <= 3) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-900/60 rounded px-1.5 py-0.5 ml-1">
                          <AlertCircle size={10} />
                          Crítico ({daysLeft} d)
                        </span>
                      );
                    } else if (daysLeft <= 7) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-900/60 rounded px-1.5 py-0.5 ml-1">
                          <Clock size={10} />
                          Advertencia ({daysLeft} d)
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded px-1.5 py-0.5 ml-1">
                          <CheckCircle2 size={10} />
                          En plazo ({daysLeft} d)
                        </span>
                      );
                    }
                  })()}
                </div>
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
              <div className="w-1/3 border-r border-slate-200 bg-white p-5 flex flex-col overflow-y-auto shrink-0">
                {/* Drawer Tab Switcher */}
                <div className="flex border-b border-slate-100 mb-4 text-xs font-extrabold uppercase tracking-wider shrink-0">
                  <button
                    onClick={() => setDrawerTab('steps')}
                    className={`flex-1 pb-2.5 text-center border-b-2 transition-all cursor-pointer ${
                      drawerTab === 'steps'
                        ? 'border-indigo-650 text-indigo-750 font-black'
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    1. Etapas RICE
                  </button>
                  <button
                    onClick={() => setDrawerTab('measures')}
                    className={`flex-1 pb-2.5 text-center border-b-2 transition-all cursor-pointer ${
                      drawerTab === 'measures'
                        ? 'border-indigo-650 text-indigo-750 font-black'
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    2. Medidas
                  </button>
                </div>

                {drawerTab === 'steps' ? (
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Línea de Tiempo RICE</h4>
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

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 leading-relaxed flex gap-2 shrink-0">
                      <Info size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700">Importante:</span> Conforme a las orientaciones de la Superintendencia, cada etapa debe contener registros verídicos y firmas de respaldo.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medidas de Resguardo</h4>
                      {(!selectedProtocol.measures || selectedProtocol.measures.length === 0) ? (
                        <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No hay medidas de resguardo decretadas para este caso.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedProtocol.measures.map((m) => {
                            const totalDays = Object.keys(m.complianceLog || {}).length;
                            const compliedDays = Object.values(m.complianceLog || {}).filter(Boolean).length;
                            const compliancePercent = totalDays > 0 ? Math.round((compliedDays / totalDays) * 100) : 100;

                            return (
                              <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-1.5 text-xs animate-in fade-in">
                                <div>
                                  <div className="font-bold text-slate-800 line-clamp-2">{m.description}</div>
                                  <div className="text-[10px] text-slate-450 mt-1">Responsable: {m.responsibleName}</div>
                                </div>
                                <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-100">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    compliancePercent >= 80 
                                      ? 'text-emerald-700 bg-emerald-50' 
                                      : compliancePercent >= 50 
                                        ? 'text-yellow-700 bg-yellow-50' 
                                        : 'text-red-700 bg-red-50'
                                  }`}>
                                    Cumplimiento: {compliancePercent}%
                                  </span>
                                  {selectedProtocol.status === 'Abierto' && (
                                    <button
                                      onClick={() => handleDeleteMeasure(m.id)}
                                      className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 leading-relaxed flex gap-2 shrink-0">
                      <ShieldAlert size={16} className="text-indigo-650 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700">Evidencia de Medidas:</span> Marcar el cumplimiento diario ayuda al colegio a demostrar proactividad y debida diligencia.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Step Detail & Editor */}
              <div className="flex-1 bg-slate-50 p-6 flex flex-col justify-between overflow-y-auto">
                {drawerTab === 'steps' ? (
                  <div className="h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      {/* Stage description card */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm space-y-1 animate-in fade-in">
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
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Citación Apoderado Víctima (Fecha)</label>
                                <input
                                  type="date"
                                  value={stepFields.victimParentNotifiedDate || ''}
                                  onChange={(e) => setStepFields({ ...stepFields, victimParentNotifiedDate: e.target.value })}
                                  disabled={selectedProtocol.status === 'Cerrado'}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Citación Apoderado Denunciado (Fecha)</label>
                                <input
                                  type="date"
                                  value={stepFields.aggressorParentNotifiedDate || ''}
                                  onChange={(e) => setStepFields({ ...stepFields, aggressorParentNotifiedDate: e.target.value })}
                                  disabled={selectedProtocol.status === 'Cerrado'}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Medio de Comunicación / Notificación</label>
                              <select
                                value={stepFields.communicationType || 'Reunión Presencial'}
                                onChange={(e) => setStepFields({ ...stepFields, communicationType: e.target.value })}
                                disabled={selectedProtocol.status === 'Cerrado'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              >
                                <option value="Reunión Presencial">Reunión Presencial</option>
                                <option value="Correo Oficial">Correo Oficial</option>
                                <option value="Comunicación Telefónica">Comunicación Telefónica</option>
                                <option value="Carta Certificada">Carta Certificada</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {activeStepId === '3_investigation' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Testigos / Entrevistados (Separados por coma)</label>
                              <input
                                type="text"
                                placeholder="Ej. Pedro Pérez (Docente), Ana Gómez (Inspectora), etc."
                                value={Array.isArray(stepFields.interviews) ? stepFields.interviews.join(', ') : ''}
                                onChange={(e) => setStepFields({ ...stepFields, interviews: e.target.value.split(',').map(s => s.trim()) })}
                                disabled={selectedProtocol.status === 'Cerrado'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Conclusiones de la Investigación</label>
                              <textarea
                                placeholder="Registrar hechos validados, versiones concordantes y conclusiones sobre la vulneración..."
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
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Medida Adoptada</label>
                                <select
                                  value={stepFields.measureType || 'Formativa'}
                                  onChange={(e) => setStepFields({ ...stepFields, measureType: e.target.value })}
                                  disabled={selectedProtocol.status === 'Cerrado'}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                >
                                  <option value="Formativa">Medida Formativa RICE</option>
                                  <option value="Pedagógica">Medida Pedagógica</option>
                                  <option value="Sanción Disciplinaria">Sanción Disciplinaria Directa</option>
                                  <option value="Derivación de Apoyo">Derivación de Apoyo Continuo</option>
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
                ) : (
                  <div className="h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      {/* Measures introduction card */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm space-y-1 animate-in fade-in">
                        <h4 className="text-base font-extrabold text-slate-800">
                          Medidas de Resguardo Mineduc (Circular 482)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Decrete medidas de acompañamiento y resguardo inmediatas. Registre el cumplimiento diario de lunes a viernes para resguardar la legalidad de los procesos.
                        </p>
                      </div>

                      {/* Register New Measure Form */}
                      {selectedProtocol.status === 'Abierto' && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                          <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Decretar Nueva Medida</h5>
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Descripción de la Medida</label>
                            <input
                              type="text"
                              value={measureDesc}
                              onChange={(e) => setMeasureDesc(e.target.value)}
                              placeholder="Ej. Separación preventiva de patios en recreo"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Responsable de Vigilancia</label>
                              <input
                                type="text"
                                value={measureResp}
                                onChange={(e) => setMeasureResp(e.target.value)}
                                placeholder="Ej. Docente de turno"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Vigencia (Inicio / Término)</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="date"
                                  value={measureStart}
                                  onChange={(e) => setMeasureStart(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                                />
                                <span className="text-slate-400 text-xs">a</span>
                                <input
                                  type="date"
                                  value={measureEnd}
                                  onChange={(e) => setMeasureEnd(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={handleAddMeasure}
                              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                              Agregar Medida
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Compliance Log Grid */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                        <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                          Bitácora Semanal de Cumplimiento ({getWeekDays()[0].shortLabel} al {getWeekDays()[4].shortLabel})
                        </h5>

                        {(!selectedProtocol.measures || selectedProtocol.measures.length === 0) ? (
                          <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Registre una medida de resguardo arriba para comenzar el control semanal de cumplimiento.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="text-[10px] font-bold text-slate-450 uppercase border-b border-slate-100">
                                  <th className="py-2.5 pr-4">Medida Decretada</th>
                                  {getWeekDays().map((d) => (
                                    <th key={d.dateStr} className="py-2.5 text-center px-2 font-black">
                                      <div>{d.dayName}</div>
                                      <div className="text-[9px] text-slate-400 font-medium">{d.shortLabel}</div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedProtocol.measures.map((m) => (
                                  <tr key={m.id} className="hover:bg-slate-50/50">
                                    <td className="py-3.5 pr-4 font-medium text-slate-750">
                                      <div>{m.description}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">Resp: {m.responsibleName}</div>
                                    </td>
                                    {getWeekDays().map((d) => {
                                      const isWithinRange = d.dateStr >= m.startDate && d.dateStr <= m.endDate;
                                      const isChecked = m.complianceLog[d.dateStr] || false;

                                      return (
                                        <td key={d.dateStr} className="py-3.5 text-center px-2">
                                          {isWithinRange ? (
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              disabled={selectedProtocol.status === 'Cerrado'}
                                              onChange={(e) => handleToggleCompliance(m.id, d.dateStr, e.target.checked)}
                                              className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 focus:ring-1 cursor-pointer"
                                            />
                                          ) : (
                                            <span className="text-slate-300 font-mono">-</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
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
