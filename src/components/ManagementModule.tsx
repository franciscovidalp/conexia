import React, { useState } from 'react';
import { 
  ClipboardList, Plus, FileDown, Trash2, Edit, CheckCircle, 
  Sparkles, BookOpen, Clock
} from 'lucide-react';
import type { ManagementObjective, Activity, SchoolType } from '../types';
import { dbService } from '../firebase';
import { exportManagementObjectivesReportPDF } from '../lib/pdfCoexistence';
import toast from 'react-hot-toast';

interface ManagementModuleProps {
  activeSchool: SchoolType;
  objectives: ManagementObjective[];
  onObjectivesChange: (objs: ManagementObjective[]) => void;
  activities: Activity[];
}

export const ManagementModule: React.FC<ManagementModuleProps> = ({
  activeSchool,
  objectives,
  onObjectivesChange,
  activities
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObj, setEditingObj] = useState<ManagementObjective | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ManagementObjective['category']>('Prevención');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ManagementObjective['status']>('No Iniciado');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  // Open modal for new
  const handleOpenNewModal = () => {
    setEditingObj(null);
    setTitle('');
    setCategory('Prevención');
    setTarget('');
    setDescription('');
    setStatus('No Iniciado');
    setSelectedActivityIds([]);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (obj: ManagementObjective) => {
    setEditingObj(obj);
    setTitle(obj.title);
    setCategory(obj.category);
    setTarget(obj.target);
    setDescription(obj.description);
    setStatus(obj.status);
    setSelectedActivityIds(obj.associatedActivityIds || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    const payload = {
      title,
      category,
      target,
      description,
      status,
      associatedActivityIds: selectedActivityIds,
      school: activeSchool
    };

    try {
      if (editingObj) {
        await dbService.updateManagementObjective(editingObj.id, payload);
        const updated = objectives.map(o => o.id === editingObj.id ? { ...o, ...payload } : o);
        onObjectivesChange(updated);
        toast.success('Objetivo modificado correctamente.');
      } else {
        const created = await dbService.createManagementObjective(payload);
        onObjectivesChange([created, ...objectives]);
        toast.success('Nuevo objetivo de gestión registrado.');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar objetivo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta meta del Plan de Gestión?')) return;
    try {
      await dbService.deleteManagementObjective(id);
      onObjectivesChange(objectives.filter(o => o.id !== id));
      toast.success('Meta eliminada del Plan.');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar meta.');
    }
  };

  const handleActivityToggle = (actId: string) => {
    setSelectedActivityIds(prev => 
      prev.includes(actId) ? prev.filter(id => id !== actId) : [...prev, actId]
    );
  };

  // Calculations
  const totalCount = objectives.length;
  const completedCount = objectives.filter(o => o.status === 'Completado').length;
  const inProgressCount = objectives.filter(o => o.status === 'En Proceso').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered list
  const filtered = objectives.filter(o => categoryFilter === 'Todos' || o.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-primary h-7 w-7" />
            Plan de Gestión de Convivencia Escolar
          </h2>
          <p className="text-sm text-slate-500">
            Metas anuales obligatorias Mineduc, vinculación de talleres formativos y reportabilidad del Consejo Escolar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportManagementObjectivesReportPDF(objectives, activities, activeSchool);
              toast.success('Generando informe general en PDF...');
            }}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer"
          >
            <FileDown size={14} />
            <span>Exportar Informe</span>
          </button>
          
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={14} />
            <span>Registrar Meta / Objetivo</span>
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Circle & Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Cumplimiento Plan</span>
            <h4 className="text-2xl font-black text-slate-800">{completionRate}%</h4>
            <p className="text-xs text-slate-500">{completedCount} de {totalCount} metas finalizadas</p>
          </div>
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-primary" strokeDasharray={`${completionRate}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>

        {/* Total Objectives count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Metas Registradas</span>
            <h4 className="text-2xl font-black text-slate-800">{totalCount}</h4>
            <p className="text-xs text-slate-500">Plan anual de convivencia activo</p>
          </div>
        </div>

        {/* Objectives in progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">En Ejecución</span>
            <h4 className="text-2xl font-black text-slate-800">{inProgressCount}</h4>
            <p className="text-xs text-slate-500">Talleres preventivos en curso</p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Filtrar Categoría:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-xl p-1 shrink-0">
            {['Todos', 'Prevención', 'Formación', 'Intervención', 'Redes'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OBJECTIVES GRID */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 space-y-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
          <p className="font-semibold text-sm">No existen objetivos registrados bajo esta categoría.</p>
          <p className="text-xs text-slate-450">Presiona "Registrar Meta" en la esquina superior para agregar un hito al plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((obj) => {
            const associatedActs = activities.filter(a => obj.associatedActivityIds?.includes(a.id));
            
            return (
              <div key={obj.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                {/* Top header within card */}
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${
                      obj.category === 'Prevención' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      obj.category === 'Formación' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      obj.category === 'Intervención' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                      {obj.category}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      obj.status === 'Completado' ? 'bg-emerald-500 text-white' :
                      obj.status === 'En Proceso' ? 'bg-amber-500 text-white animate-pulse' :
                      'bg-slate-200 text-slate-650'
                    }`}>
                      {obj.status === 'Completado' && <CheckCircle size={10} />}
                      {obj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 mt-3 leading-snug">{obj.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{obj.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Alcance: {obj.target || 'Todo el colegio'}</p>

                  {/* Associated Activities List */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Talleres Vinculados ({associatedActs.length})</h4>
                    {associatedActs.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Ningún taller preventivo asociado a esta meta.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {associatedActs.map(act => (
                          <div key={act.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-150/40 text-[10px]">
                            <span className="font-semibold text-slate-700 truncate max-w-[170px]">{act.title}</span>
                            <span className="text-[9px] text-slate-450 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">{act.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom actions within card */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(obj)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                    title="Editar"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(obj.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-primary" size={18} />
                {editingObj ? 'Modificar Meta de Gestión' : 'Registrar Meta de Gestión'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-750 p-1 cursor-pointer"
              >
                <Plus className="rotate-45" size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Título de la Meta o Acción</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Ejecutar 3 talleres preventivos sobre ciberacoso en enseñanza media..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Category and Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Categoría del Plan</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  >
                    <option value="Prevención">Prevención</option>
                    <option value="Formación">Formación Apoderados/Docentes</option>
                    <option value="Intervención">Intervención Escolar</option>
                    <option value="Redes">Redes de Apoyo</option>
                    <option value="Otro">Otro Hito Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Alcance / Público Objetivo</label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="Ej: 7° Básico a 4° Medio / Profesores"
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Descripción Detallada</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Redacte las acciones concretas, recursos y plazos estipulados para esta meta..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  rows={3}
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Estado de Avance</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                >
                  <option value="No Iniciado">No Iniciado (Planificado)</option>
                  <option value="En Proceso">En Ejecución (En Proceso)</option>
                  <option value="Completado">Finalizado (Completado)</option>
                </select>
              </div>

              {/* Associated Activities Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1.5">Vincular Talleres de Vínculo Escolar Realizados</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-h-40 overflow-y-auto space-y-2.5">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-450 text-center py-4">No hay talleres registrados en Vínculo Escolar para vincular.</p>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="flex items-start gap-2 text-xs">
                        <input
                          type="checkbox"
                          id={`chk-${act.id}`}
                          checked={selectedActivityIds.includes(act.id)}
                          onChange={() => handleActivityToggle(act.id)}
                          className="w-4 h-4 text-primary bg-slate-100 border-slate-350 rounded focus:ring-primary focus:ring-1 cursor-pointer mt-0.5"
                        />
                        <label htmlFor={`chk-${act.id}`} className="text-slate-650 font-medium cursor-pointer leading-normal">
                          <span className="font-bold text-slate-800">{act.title}</span> ({act.date} • {act.speaker})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
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
                  {editingObj ? 'Guardar Cambios' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
