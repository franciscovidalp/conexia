import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Info,
  Users
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Meeting, SchoolType, Staff, CoexistenceCase } from '../types';
import toast from 'react-hot-toast';

interface CalendarModuleProps {
  activeSchool: SchoolType;
  loggedInUser: Staff | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'workshop' | 'session' | 'meeting' | 'case';
  color: string;
  category: string;
  description?: string;
  location?: string;
  speaker?: string;
  contactType?: string;
  professionalName?: string;
  studentName?: string;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  activeSchool,
  loggedInUser
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingType, setMeetingType] = useState<Meeting['type']>('Citación Apoderado');
  const [meetingDesc, setMeetingDesc] = useState('');

  // Event Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadAllEvents();
  }, [activeSchool]);

  const loadAllEvents = async () => {
    setLoading(true);
    try {
      // Fetch workshops
      const workshops = await dbService.getActivities(activeSchool);
      // Fetch sessions
      const sessions = await dbService.getAllClinicalSessionsForSchool(activeSchool);
      // Fetch meetings
      const meetings = await dbService.getMeetings(activeSchool);
      // Fetch coexistence cases (anotaciones)
      const casesObj = await dbService.getCoexistenceCases(activeSchool, 100);
      const cases = casesObj?.data || [];

      const formattedEvents: CalendarEvent[] = [];

      // Add workshops
      workshops.forEach((w) => {
        formattedEvents.push({
          id: w.id,
          title: w.title,
          date: w.date,
          type: 'workshop',
          color: w.status === 'Realizada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
          category: `Taller (${w.status})`,
          description: w.summary || 'Taller preventivo programado.',
          location: w.location,
          speaker: w.speaker
        });
      });

      // Add clinical sessions
      sessions.forEach((s) => {
        formattedEvents.push({
          id: s.id,
          title: `Intervención: ${s.studentName || 'Estudiante'}`,
          date: s.date,
          type: 'session',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          category: `Intervención (${s.contactType})`,
          description: `${s.notes}\nCompromisos: ${s.agreements}`,
          professionalName: s.professionalName
        });
      });

      // Add meetings
      meetings.forEach((m) => {
        formattedEvents.push({
          id: m.id,
          title: m.title,
          date: m.date,
          time: m.time,
          type: 'meeting',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          category: m.type,
          description: m.description
        });
      });

      // Add coexistence cases (anotaciones)
      cases.forEach((c: CoexistenceCase) => {
        formattedEvents.push({
          id: c.id,
          title: `Anotación: ${c.studentName} (${c.type})`,
          date: c.date,
          type: 'case',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          category: `Anotación (${c.type})`,
          description: `Estudiante: ${c.studentName}\nDetalle: ${c.description}\nReportado por: ${c.reporterName}\nEstado: ${c.status}`
        });
      });

      setEvents(formattedEvents);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar eventos del calendario.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) {
      toast.error('Ingrese un título para la reunión.');
      return;
    }

    try {
      await dbService.createMeeting({
        title: meetingTitle,
        date: meetingDate,
        time: meetingTime,
        type: meetingType,
        description: meetingDesc,
        school: activeSchool
      });

      toast.success('Reunión agendada correctamente.');
      setIsModalOpen(false);
      // Reset form
      setMeetingTitle('');
      setMeetingDesc('');
      loadAllEvents();
    } catch (e) {
      toast.error('Error al agendar la reunión.');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!loggedInUser) {
      toast.error('Debe estar autenticado para realizar esta acción.');
      return;
    }
    if (window.confirm('¿Está seguro de que desea eliminar esta citación/reunión?')) {
      try {
        await dbService.deleteMeeting(id);
        toast.success('Reunión eliminada.');
        if (selectedEvent?.id === id) {
          setSelectedEvent(null);
        }
        loadAllEvents();
      } catch (e) {
        toast.error('Error al eliminar la reunión.');
      }
    }
  };

  // Helper calendar functions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust first day (Monday as first day of week)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  // Fill empty days before month start
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  // Fill actual month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
      {/* Left panel: Calendar Grid */}
      <div className="flex-1 p-6 border-r border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Calendario de Actividades e Intervenciones
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Talleres, bitácora psicosocial y reuniones</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-700 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[350px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-slate-400 mt-2">Cargando eventos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Days of the week headers */}
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-slate-400">
                {d}
              </div>
            ))}

            {/* Calendar cells */}
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-slate-50/50 rounded-xl h-16 md:h-24"></div>;
              }

              const formattedDay = String(day).padStart(2, '0');
              const formattedMonth = String(month + 1).padStart(2, '0');
              const dayStr = `${year}-${formattedMonth}-${formattedDay}`;
              const dayEvents = getEventsForDate(dayStr);
              const isSelected = selectedDate === dayStr;
              const isToday = new Date().toISOString().split('T')[0] === dayStr;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`relative cursor-pointer rounded-xl border p-1 md:p-2 h-16 md:h-24 transition-all hover:border-indigo-200 group flex flex-col justify-between ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/10 shadow-sm' 
                      : isToday 
                        ? 'border-slate-300 bg-slate-50' 
                        : 'border-slate-100 bg-white'
                  }`}
                >
                  <span className={`text-xs md:text-sm font-bold block ${
                    isSelected 
                      ? 'text-indigo-600' 
                      : isToday 
                        ? 'text-slate-800 underline decoration-2' 
                        : 'text-slate-500'
                  }`}>
                    {day}
                  </span>

                  {/* Desktop view: Event pills (up to 2) */}
                  <div className="hidden md:flex flex-col gap-1 overflow-hidden mt-1 flex-1 justify-end">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div 
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border truncate transition-transform hover:scale-[1.02] ${ev.color}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[8px] text-indigo-600 font-bold self-end bg-indigo-50 px-1 rounded">
                        +{dayEvents.length - 2} más
                      </span>
                    )}
                  </div>

                  {/* Mobile view: Dot indicators */}
                  <div className="flex md:hidden gap-0.5 justify-center mt-1">
                    {dayEvents.map((ev) => (
                      <span 
                        key={ev.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === 'workshop' 
                            ? 'bg-amber-500' 
                            : ev.type === 'session' 
                              ? 'bg-purple-500' 
                              : ev.type === 'case'
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-50 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-200"></span>
            Taller Programado
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-200"></span>
            Taller Realizado
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-200"></span>
            Intervención Psicosocial
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-200"></span>
            Reunión / Citación
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-200"></span>
            Anotación de Convivencia
          </span>
        </div>
      </div>

      {/* Right panel: Details of Selected Date & Action Button */}
      <div className="w-full md:w-80 bg-slate-50/50 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-700">Eventos del día</h3>
              <p className="text-xs text-indigo-600 font-medium">
                {selectedDate.split('-').reverse().join('/')}
              </p>
            </div>
            <button
              onClick={() => {
                setMeetingDate(selectedDate);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Agendar
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No hay eventos agendados para este día.</p>
              </div>
            ) : (
              selectedDateEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5 ${ev.color}`}>
                      {ev.category}
                    </span>
                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">{ev.title}</h4>
                    {ev.time && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {ev.time} hrs
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-50">
                    {ev.type === 'meeting' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMeeting(ev.id);
                        }}
                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-md transition-colors"
                        title="Eliminar Reunión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5">
                      Ver detalle
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Resumen Mensual</h4>
            <div className="grid grid-cols-4 gap-1">
              <div className="bg-amber-50/50 p-1.5 rounded-lg text-center">
                <span className="text-[10px] text-amber-700 font-semibold block truncate">Talleres</span>
                <span className="text-base font-extrabold text-amber-800">
                  {events.filter(e => e.type === 'workshop').length}
                </span>
              </div>
              <div className="bg-purple-50/50 p-1.5 rounded-lg text-center">
                <span className="text-[10px] text-purple-700 font-semibold block truncate">Clínicas</span>
                <span className="text-base font-extrabold text-purple-800">
                  {events.filter(e => e.type === 'session').length}
                </span>
              </div>
              <div className="bg-indigo-50/50 p-1.5 rounded-lg text-center">
                <span className="text-[10px] text-indigo-700 font-semibold block truncate">Reuniones</span>
                <span className="text-base font-extrabold text-indigo-800">
                  {events.filter(e => e.type === 'meeting').length}
                </span>
              </div>
              <div className="bg-rose-50/50 p-1.5 rounded-lg text-center">
                <span className="text-[10px] text-rose-700 font-semibold block truncate">Casos</span>
                <span className="text-base font-extrabold text-rose-800">
                  {events.filter(e => e.type === 'case').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MEETING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                Agendar Citación o Reunión
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título de la Actividad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Citación Apoderado de Diego Pérez"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hora (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Evento</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as Meeting['type'])}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Citación Apoderado">Citación Apoderado</option>
                  <option value="Reunión Técnica">Reunión Técnica</option>
                  <option value="Consejo de Profesores">Consejo de Profesores</option>
                  <option value="Otro">Otro / Administrativo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción / Objetivos</label>
                <textarea
                  placeholder="Detalles sobre los temas a tratar o participantes..."
                  value={meetingDesc}
                  onChange={(e) => setMeetingDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Detalle del Evento
              </h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5 ${selectedEvent.color}`}>
                  {selectedEvent.category}
                </span>
                <h4 className="text-lg font-bold text-slate-800">{selectedEvent.title}</h4>
              </div>

              <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-medium text-slate-700">
                    Fecha: {selectedEvent.date.split('-').reverse().join('/')}
                  </span>
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-700">Hora: {selectedEvent.time} hrs</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-700">Lugar: {selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.speaker && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-700">Expositor: {selectedEvent.speaker}</span>
                  </div>
                )}
                {selectedEvent.professionalName && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-700">Profesional: {selectedEvent.professionalName}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detalles / Contenido</h5>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl whitespace-pre-line leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                {selectedEvent.type === 'meeting' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(selectedEvent.id)}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Actividad
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
