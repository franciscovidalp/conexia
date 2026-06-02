import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CalendarRange, 
  Activity,
  LogOut,
  Building2,
  Database,
  Settings,
  User,
  MessageSquare,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  X
} from 'lucide-react';
import type { SchoolType, UserRole, Staff, School } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSchool: SchoolType;
  setActiveSchool: (school: SchoolType) => void;
  activeRole: UserRole;
  cacheStatus: 'loading' | 'cached' | 'error';
  loggedInUser: Staff | null;
  onLogout: () => void;
  schools: School[];
}

const MODULE_HELP: Record<string, { title: string; desc: string; steps: string[] }> = {
  climate: {
    title: "Diagnóstico DIA",
    desc: "Cuestionarios socioemocionales de Convivencia Escolar y clima de aula alineados con DIA Mineduc. Permite compartir enlaces y diagnosticar riesgos.",
    steps: [
      "Copia el enlace de encuesta del curso y compártelo con alumnos/apoderados.",
      "Revisa la retroalimentación grupal automática con fortalezas y áreas críticas del aula.",
      "Haz clic en cualquier fila para ver el desglose Likert individual y su recomendación clínica.",
      "Deriva con un solo clic a estudiantes con indicadores de riesgo crítico directo a la Dupla Psicosocial."
    ]
  },
  activities: {
    title: "Vínculo Escolar",
    desc: "Planificación, agendamiento y evaluación de talleres preventivos y de contención emocional en la comunidad escolar.",
    steps: [
      "Presiona 'Planificar Actividad' para definir un nuevo taller o asamblea.",
      "Configura el tipo de público (Masivo por cursos o Focalizado por estudiantes).",
      "Registra asistencia rápida y resume el balance de objetivos tras finalizar la actividad.",
      "Las actividades agendadas se sincronizan de inmediato con el Calendario Maestro."
    ]
  },
  coexistence: {
    title: "Convivencia Pro",
    desc: "Registro digital de anotaciones de incidentes escolares menores, graves y gravísimos, así como felicitaciones positivas.",
    steps: [
      "Filtra o busca alumnos por curso en la columna lateral izquierda.",
      "Observa el semáforo de riesgo conductual (Verde, Naranja, Rojo) y su puntaje de vida.",
      "Presiona 'Registrar Anotación' para consignar una falta o anotación positiva.",
      "El sistema descontará o sumará los puntos reglamentarios RICE en tiempo real."
    ]
  },
  protocols: {
    title: "Protocolos RICE",
    desc: "Activación, bitácora jurídica de 5 etapas reglamentarias de fiscalización RICE (Mineduc/Supereduc) y exportación de actas.",
    steps: [
      "Presiona 'Activar Protocolo RICE' para abrir un caso formal.",
      "Selecciona primero el Curso para que el sistema filtre de forma inmediata la lista de alumnos.",
      "Registra y firma cada una de las 5 etapas (Detección, Citación, Testigos, Medidas, Cierre).",
      "Descarga el Acta Final del expediente en PDF con marcas de tiempo y resguardo de datos legales."
    ]
  },
  psychosocial: {
    title: "Dupla Psicosocial",
    desc: "Espacio de trabajo privado e intervenciones terapéuticas para psicólogos y trabajadores sociales.",
    steps: [
      "Organiza el flujo clínico mediante el tablero Kanban (Ingresado, Intervención, Derivado, Alta).",
      "Haz clic en un expediente para examinar el historial familiar y de entrevistas.",
      "Registra bitácoras detalladas para cada sesión con el alumno, apoderados o redes externas.",
      "Exporta el reporte clínico completo en PDF con marcas temporales resguardadas."
    ]
  },
  calendar: {
    title: "Calendario Maestro",
    desc: "Cuadrícula unificada de planificación de eventos, atenciones psicosociales, talleres y plazos límite RICE.",
    steps: [
      "Filtra los tipos de eventos mostrados seleccionando los botones superiores por color.",
      "Haz clic en cualquier día o evento para expandir la agenda y participantes.",
      "Presiona 'Agendar Reunión' para programar citaciones formales o consejos de profesores.",
      "Los hitos críticos de RICE y derivaciones de la dupla se auto-sincronizan en esta vista."
    ]
  },
  messaging: {
    title: "Mensajería Segura",
    desc: "Bandeja de entrada interna y confidencial entre funcionarios de la misma comunidad escolar para derivaciones rápidas.",
    steps: [
      "Busca a tu colega en la nómina de funcionarios del establecimiento en la izquierda.",
      "Escribe consultas o notifica derivaciones confidenciales de estudiantes de manera directa.",
      "La bandeja de entrada cuenta con sincronización en tiempo real para agilizar la coordinación."
    ]
  },
  settings: {
    title: "Ajustes y Carga",
    desc: "Parámetros globales de Conexia, importación masiva de nóminas y personalización de temas visuales.",
    steps: [
      "Elige una de las 10 paletas de colores premium disponibles para el portal escolar.",
      "Administra los establecimientos, RUTs de directivos y credenciales de acceso.",
      "Sube nóminas de alumnos en formato CSV para poblar las bases de datos de forma masiva."
    ]
  }
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  activeSchool,
  setActiveSchool,
  activeRole,
  cacheStatus,
  loggedInUser,
  onLogout,
  schools
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const menuItems = [
    { id: 'climate', label: 'Diagnóstico DIA', icon: BarChart3 },
    { id: 'activities', label: 'Vínculo Escolar', icon: CalendarRange },
    { id: 'coexistence', label: 'Convivencia Pro', icon: ShieldAlert },
    { id: 'protocols', label: 'Protocolos RICE', icon: ClipboardCheck },
    { id: 'psychosocial', label: 'Dupla Psicosocial', icon: Activity },
    { id: 'calendar', label: 'Calendario', icon: CalendarRange },
    { id: 'messaging', label: 'Mensajería', icon: MessageSquare },
    { id: 'settings', label: 'Ajustes y Carga', icon: Settings }
  ];

  const currentHelp = MODULE_HELP[activeTab];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-2xl border-r border-slate-955">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <img src="/logo.png" alt="Conexia Logo" className="w-10 h-10 object-contain rounded-lg bg-white p-0.5" />
            <div>
              <h1 className="font-bold text-white text-base leading-tight tracking-tight">CONEXIA</h1>
              <p className="text-[10px] text-slate-500">Convivencia Escolar</p>
            </div>
          </div>

          {/* School Selector Card in Sidebar */}
          <div className="p-4 mx-4 my-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Building2 size={14} className="text-primary" />
              <span>Establecimiento</span>
            </div>
            <select
              value={activeSchool}
              onChange={(e) => setActiveSchool(e.target.value)}
              className="w-full bg-slate-900/60 text-white rounded-lg border border-white/10 px-2 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {schools.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Navigation Items */}
          <nav className="px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-white/10 text-white shadow-md border-l-4 border-primary backdrop-blur-md' 
                      : 'hover:bg-white/5 hover:text-slate-200 text-slate-400'
                  }`}
                >
                  <Icon size={18} className={`${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-450'} transition-colors`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logged-in Staff card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 space-y-3">
          {loggedInUser && (
            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{loggedInUser.firstName} {loggedInUser.lastName}</p>
                <p className="text-[10px] text-slate-500 truncate">{loggedInUser.role} (RICE)</p>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-bold py-2.5 rounded-xl border border-white/10 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER BAR */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold bg-primary-light text-primary px-3.5 py-1 rounded-full border border-primary/10 transition-colors duration-300">
              {activeSchool}
            </h2>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Rol Activo: <span className="font-bold text-slate-700">{activeRole}</span>
            </div>
          </div>

          {/* Status Indicator & Help Trigger */}
          <div className="flex items-center gap-3">
            {cacheStatus === 'loading' && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 text-xs animate-pulse font-medium">
                <Database size={13} />
                <span>Cargando...</span>
              </div>
            )}
            
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isHelpOpen
                  ? 'bg-primary-light text-primary border-primary/20 shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
              title="Guía de uso del módulo"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {/* MODULE WORKSPACE */}
        <section className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-7xl mx-auto w-full h-full space-y-6">
            {isHelpOpen && currentHelp && (
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800/80 animate-zoom-in relative overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="absolute top-4 right-4 text-slate-450 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>

                {/* Decorative glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>

                <div className="flex gap-4.5 items-start">
                  <div className="p-3 bg-primary-light/10 text-primary rounded-xl shrink-0 mt-0.5 border border-primary/20">
                    <HelpCircle size={22} className="text-primary" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-extrabold tracking-tight">Guía de Uso: {currentHelp.title}</h3>
                      <p className="text-xs text-slate-350 mt-1 leading-relaxed">{currentHelp.desc}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-200">
                      {currentHelp.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="font-mono font-bold text-primary">{idx + 1}.</span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {children}
          </div>
        </section>
      </main>

    </div>
  );
};
