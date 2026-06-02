import React from 'react';
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
  ClipboardCheck
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
  const menuItems = [
    { id: 'coexistence', label: 'Convivencia Pro', icon: ShieldAlert },
    { id: 'protocols', label: 'Protocolos RICE', icon: ClipboardCheck },
    { id: 'activities', label: 'Vínculo Escolar', icon: CalendarRange },
    { id: 'psychosocial', label: 'Dupla Psicosocial', icon: Activity },
    { id: 'climate', label: 'Diagnóstico DIA', icon: BarChart3 },
    { id: 'calendar', label: 'Calendario', icon: CalendarRange },
    { id: 'messaging', label: 'Mensajería', icon: MessageSquare },
    { id: 'settings', label: 'Ajustes y Carga', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <img src="/logo.png" alt="Conexia Logo" className="w-10 h-10 object-contain rounded-lg bg-white p-0.5" />
            <div>
              <h1 className="font-bold text-white text-base leading-tight tracking-tight">CONEXIA</h1>
              <p className="text-[10px] text-slate-500">Convivencia Escolar</p>
            </div>
          </div>

          {/* School Selector Card in Sidebar */}
          <div className="p-4 mx-4 my-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Building2 size={14} className="text-primary" />
              <span>Establecimiento</span>
            </div>
            <select
              value={activeSchool}
              onChange={(e) => setActiveSchool(e.target.value)}
              className="w-full bg-slate-800 text-white rounded-lg border border-slate-650 px-2 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-slate-800 text-white shadow-inner border-l-4 border-primary' 
                      : 'hover:bg-slate-800/40 hover:text-slate-200 text-slate-400'
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          {loggedInUser && (
            <div className="flex items-center gap-3 p-1.5 bg-slate-850/40 rounded-xl border border-slate-800">
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
            className="w-full flex items-center justify-center gap-2 hover:bg-slate-800/60 text-slate-400 hover:text-red-400 text-xs font-bold py-2 rounded-xl border border-slate-800 hover:border-red-900/40 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
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

          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            {cacheStatus === 'loading' && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 text-xs animate-pulse font-medium">
                <Database size={13} />
                <span>Cargando...</span>
              </div>
            )}
          </div>
        </header>

        {/* MODULE WORKSPACE */}
        <section className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </section>
      </main>

    </div>
  );
};
