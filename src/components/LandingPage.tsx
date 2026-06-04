import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Activity, 
  FileText, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Lock,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet,
  AlertTriangle,
  ClipboardList,
  Network,
  BarChart3
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const faqData = [
    {
      question: "¿Cómo ayuda Conexia a cumplir con las exigencias de la Superintendencia de Educación?",
      answer: "Conexia está diseñada bajo los lineamientos de la Circular 482 y la Ley 20.536 sobre Violencia Escolar. La plataforma genera de manera automática actas estandarizadas de denuncias, bitácoras de medidas tomadas, y el debido proceso RICE (Recepción, Investigación, Medidas, Resolución). Todo con marcas de tiempo y registro de firmas de funcionarios, sirviendo de respaldo fidedigno ante cualquier fiscalización."
    },
    {
      question: "¿Cómo se protege la privacidad de la información clínica y psicosocial?",
      answer: "La confidencialidad es nuestra máxima prioridad. Conexia implementa un control estricto de roles. La información de las Bitácoras Psicosociales individuales y familiares solo es visible para el equipo clínico (Psicólogo, Trabajador Social, Orientador) y está restringida para otros funcionarios del establecimiento. Además, toda la transmisión de datos está encriptada."
    },
    {
      question: "¿El Plan de Gestión Anual y las Derivaciones Externas se vinculan con otros módulos?",
      answer: "Sí, de manera nativa. El Plan de Gestión Anual de Convivencia Escolar permite enlazar los talleres y asambleas realizados en el módulo de Vínculo Escolar. Por otro lado, el módulo de Derivación Externa permite filtrar alumnos por su curso real y generar la Ficha Oficial de Derivación Intersectorial en PDF firmada digitalmente."
    },
    {
      question: "¿El Calendario Maestro requiere que ingresemos las actividades por duplicado?",
      answer: "No. Conexia cuenta con una arquitectura de sincronización inteligente. Cuando una psicóloga agenda una sesión, el encargado de convivencia registra una citación de apoderado, o se ingresa un taller de vínculo escolar, el sistema puebla de manera automática el Calendario Maestro del colegio. No requiere ningún trabajo manual extra."
    },
    {
      question: "¿Qué tipo de reportes estadísticos y gráficos entrega el sistema?",
      answer: "El sistema genera dashboards interactivos con el índice RICE por curso, el semáforo conductual de estudiantes (verde para positivo, naranjo para faltas leves, rojo para graves/gravísimas), porcentaje de resolución de casos, y gráficos sobre los temas más recurrentes abordados en talleres y atenciones psicosociales."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      
      {/* BACKGROUND GLOWS - Pastel colors for friendly light design */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-100/40 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[25%] right-[-10%] w-[65%] h-[55%] rounded-full bg-violet-100/45 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[150px] pointer-events-none"></div>

      {/* HEADER / NAV BAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/logo.png" 
              alt="Conexia Logo" 
              className="w-11 h-11 object-contain bg-white rounded-xl p-1 shadow-md shadow-indigo-500/5 border border-slate-150" 
            />
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 tracking-tight uppercase">
              Conexia
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors cursor-pointer">
              El Trabajo que Facilita
            </button>
            <button onClick={() => scrollToSection('registers')} className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors cursor-pointer">
              Módulos e Integraciones
            </button>
            <button onClick={() => scrollToSection('security')} className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors cursor-pointer">
              Seguridad & Leyes
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors cursor-pointer">
              Preguntas Frecuentes
            </button>
          </nav>

          {/* Login Button (Large) */}
          <div className="hidden md:flex items-center">
            <button 
              onClick={onLoginClick}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold px-7 py-3 rounded-xl text-sm transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/15 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer flex items-center gap-2 group"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-5 shadow-xl animate-in slide-in">
            <button onClick={() => scrollToSection('features')} className="text-left text-base font-semibold text-slate-600 hover:text-slate-950 transition-colors py-2">
              El Trabajo que Facilita
            </button>
            <button onClick={() => scrollToSection('registers')} className="text-left text-base font-semibold text-slate-600 hover:text-slate-950 transition-colors py-2">
              Módulos e Integraciones
            </button>
            <button onClick={() => scrollToSection('security')} className="text-left text-base font-semibold text-slate-600 hover:text-slate-950 transition-colors py-2">
              Seguridad & Leyes
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-left text-base font-semibold text-slate-600 hover:text-slate-950 transition-colors py-2">
              Preguntas Frecuentes
            </button>
            <hr className="border-slate-100 my-2" />
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onLoginClick();
              }}
              className="w-full text-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <ShieldCheck size={14} />
          <span>SaaS para la Convivencia Escolar del Siglo XXI</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-none max-w-4xl">
          Centraliza la gestión escolar y <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600">
            potencia el bienestar psicosocial
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
          La plataforma definitiva para la dupla psicosocial, encargados de convivencia y directivos. Automatiza protocolos RICE, bitácoras confidenciales y la agenda en un solo lugar de manera amigable y colaborativa.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-indigo-500/15 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ingresar al Portal</span>
            <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-8 py-4 rounded-xl text-base transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Ver Funcionalidades</span>
          </button>
        </div>

        {/* INTERACTIVE MOCKUP SHOWCASE */}
        <div className="mt-20 w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-6 backdrop-blur-md shadow-2xl relative">
          {/* Glass Card Header Decor */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono text-slate-500 ml-2">CONEXIA_DASHBOARD_LIVE</span>
            </div>
            <div className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full font-bold">
              Mineduc Circular 482 Sincronizada
            </div>
          </div>

          {/* Grid representing dashboard preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Stat Box 1 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Semáforo de Alertas RICE</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">Colegio Biobío</h3>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Casos Graves (RICE)
                  </span>
                  <span className="font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-bold">4 Alertas</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Casos Leves
                  </span>
                  <span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-bold">12 Registros</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Anotaciones Positivas
                  </span>
                  <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">+28</span>
                </div>
              </div>
            </div>

            {/* Stat Box 2 (Interactive Preview of master calendar integration) */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Calendario Maestro Automático</p>
                <p className="text-xs text-slate-500 mt-1">Próximos Eventos Sincronizados</p>
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="bg-indigo-50/50 border-l-4 border-indigo-500 p-2 rounded-r-xl">
                  <p className="text-xs font-bold text-slate-800 truncate">Taller: Manejo de Ansiedad (Dupla)</p>
                  <p className="text-[10px] text-indigo-600 mt-0.5 font-semibold">Hoy, 14:30 | 8° Básico A</p>
                </div>
                <div className="bg-emerald-50/50 border-l-4 border-emerald-500 p-2 rounded-r-xl">
                  <p className="text-xs font-bold text-slate-800 truncate">Citación de Apoderados (Convivencia)</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">Mañana, 09:00 | Mediación Leve</p>
                </div>
              </div>
            </div>

            {/* Stat Box 3 (Internal Messaging mockup) */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Mensajería Interna Activa</p>
                  <p className="text-xs text-slate-500 mt-1">Canal Seguro Colegas</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="bg-indigo-50/40 border border-indigo-100 p-2.5 rounded-xl text-[11px] leading-relaxed">
                  <p className="font-bold text-indigo-700">Psicóloga Carolina S.</p>
                  <p className="text-slate-655 mt-0.5">"Acabo de agendar derivación psicosocial del alumno del 1° Medio. Revisa la ficha cuando puedas."</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-indigo-600 font-bold">Bandeja Compartida (Solo Funcionarios)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Glow Dot */}
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-violet-400/20 rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* METRICAS DE IMPACTO (Key statistics) */}
      <section className="bg-white border-y border-slate-200/80 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-slate-50/50 border border-slate-150 rounded-2xl hover:shadow-md transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-indigo-50 text-indigo-655 mb-4">
              <Clock size={24} />
            </div>
            <h4 className="text-3xl sm:text-4xl font-black text-slate-900">90%</h4>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 font-bold uppercase tracking-wider">Ahorro Administrativo</p>
            <p className="text-xs text-slate-500 mt-1">Menos tiempo en papeleo y firmas físicas</p>
          </div>

          <div className="text-center p-6 bg-slate-50/50 border border-slate-150 rounded-2xl hover:shadow-md transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-violet-50 text-violet-655 mb-4">
              <TrendingUp size={24} />
            </div>
            <h4 className="text-3xl sm:text-4xl font-black text-slate-900">40+ hrs</h4>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 font-bold uppercase tracking-wider">Horas Mensuales</p>
            <p className="text-xs text-slate-500 mt-1">Recuperadas para atención y terapias directas</p>
          </div>

          <div className="text-center p-6 bg-slate-50/50 border border-slate-150 rounded-2xl hover:shadow-md transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-emerald-50 text-emerald-655 mb-4">
              <Users size={24} />
            </div>
            <h4 className="text-3xl sm:text-4xl font-black text-slate-900">100%</h4>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 font-bold uppercase tracking-wider">Historial Centralizado</p>
            <p className="text-xs text-slate-500 mt-1">Acceso inmediato a la ficha del alumno</p>
          </div>

          <div className="text-center p-6 bg-slate-50/50 border border-slate-150 rounded-2xl hover:shadow-md transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-amber-50 text-amber-655 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-3xl sm:text-4xl font-black text-slate-900">0%</h4>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 font-bold uppercase tracking-wider">Pérdida de Datos</p>
            <p className="text-xs text-slate-500 mt-1">Servidor seguro en la nube e historial íntegro</p>
          </div>
        </div>
      </section>

      {/* EL TRABAJO QUE FACILITA (Value Prop by Role) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-indigo-650 uppercase tracking-widest">Optimización de Procesos</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">¿Cómo facilita el trabajo diario en el colegio?</h3>
          <p className="text-slate-655 mt-4 font-semibold">
            Conexia unifica el trabajo de los diferentes estamentos para abordar el bienestar escolar de manera transversal y colaborativa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={22} />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Para la Dupla Psicosocial</h4>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Elimina las planillas sueltas y los archivadores. El equipo de psicólogos y trabajadores sociales registra de forma confidencial entrevistas, intervenciones con apoderados y derivaciones externas en un portal privado.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-indigo-600 font-bold">
              <span>Optimización terapéutica</span>
              <CheckCircle2 size={14} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl hover:border-violet-500/30 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={22} />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Para Encargados de Convivencia</h4>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Automatiza el RICE. Registra de manera guiada cada evento menor, grave o gravísimo. La plataforma calcula de forma instantánea el semáforo conductual, notifica a directivos y genera el expediente formal PDF exigido por fiscalizaciones.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-violet-600 font-bold">
              <span>Seguimiento de normativas</span>
              <CheckCircle2 size={14} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={22} />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Para Directores y Sostenedores</h4>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Visualización transversal del estado del establecimiento. Revisa índices de convivencia por curso en tiempo real, verifica el cumplimiento del calendario de talleres socioemocionales y toma decisiones basadas en estadísticas claras y consolidadas.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-emerald-600 font-bold">
              <span>Control e indicadores globales</span>
              <CheckCircle2 size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* REGISTROS QUE SE PUEDEN LLEVAR (Features List) */}
      <section id="registers" className="bg-slate-105/50 py-24 border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-650 uppercase tracking-widest">Módulos Integrados</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">¿Qué registros permite llevar Conexia?</h3>
            <p className="text-slate-655 mt-4 font-semibold">
              Cada funcionalidad se conecta de forma nativa para evitar el ingreso duplicado de datos y optimizar la labor docente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Casos RICE */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-indigo-50 text-indigo-600 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Casos de Convivencia y RICE</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Ingreso categorizado de incidentes (Leve, Grave, Gravísima). Registro de medidas formativas inmediatas, firmas digitales del debido proceso y cálculo de semáforo de alerta conductual.
                </p>
              </div>
            </div>

            {/* Feature 2: Bitácoras Psicosociales */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-violet-50 text-violet-600 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Ficha y Bitácora Psicosocial</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Fichas individuales para intervenciones clínicas. Registro de entrevistas con apoderados, derivaciones a la red externa (OPD, CESFAM, Tribunales) y acuerdos en confidencialidad absoluta.
                </p>
              </div>
            </div>

            {/* Feature 3: Calendario Maestro */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-emerald-50 text-emerald-600 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Calendario Maestro Inteligente</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Poblado de forma automática con todos los talleres agendados en Vinculo Escolar, reuniones de apoderados, citaciones de convivencia y alertas críticas. Visibilidad consolidada sin doble ingreso.
                </p>
              </div>
            </div>

            {/* Feature 4: Mensajería Interna */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-amber-50 text-amber-600 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <MessageSquare size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Mensajería Interna Privada</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Canal de chat seguro integrado para coordinar derivaciones o talleres socioemocionales de forma instantánea entre los mismos funcionarios pertenecientes al establecimiento escolar.
                </p>
              </div>
            </div>

            {/* Feature 5: Talleres de Vínculo */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-rose-50 text-rose-600 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <Activity size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Talleres y Actividades Escolares</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Sistematización de talleres, charlas formativas a apoderados y asambleas. Registro rápido de asistencia de alumnos y evaluación de objetivos de desarrollo personal e inclusión.
                </p>
              </div>
            </div>

            {/* Feature 6: Historial de Calificaciones RICE */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-sky-50 text-sky-600 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Seguimiento de Semáforos</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Filtro inteligente de cursos en color rojo que posean incidencias negativas, y marcado directo por alumnos en verde (positivo), naranja (leve) o rojo (faltas graves y gravísimas).
                </p>
              </div>
            </div>

            {/* Feature 7: Diagnóstico Socioemocional DIA */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-violet-50 text-violet-650 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <BarChart3 size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Diagnóstico Socioemocional (DIA)</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Cuestionarios del clima de aula alineados con DIA Mineduc. Comparte enlaces públicos con estudiantes/apoderados para obtener reportes cualitativos con alertas de riesgo clínico automático.
                </p>
              </div>
            </div>

            {/* Feature 8: Plan de Gestión Anual */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-emerald-50 text-emerald-650 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <ClipboardList size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Plan de Gestión Anual</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Planificación de metas de convivencia por categorías Mineduc. Asocia talleres realizados y exporta reportes en PDF consolidados listos para la aprobación del Consejo Escolar.
                </p>
              </div>
            </div>

            {/* Feature 9: Derivación Intersectorial a Redes */}
            <div className="bg-white border border-slate-250 p-6 rounded-2xl flex gap-4 hover:border-slate-350 hover:scale-[1.02] hover:shadow-md transition-all duration-300 shadow-sm">
              <div className="shrink-0 p-3 rounded-xl bg-indigo-50 text-indigo-650 w-12 h-12 flex items-center justify-center animate-zoom-in">
                <Network size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Derivación a Redes Externas</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Gestión oficial de derivaciones a OPD, CESFAM, OLN y Tribunales de Familia. Filtrado dinámico por curso, seguimiento de folios y estados, y descarga de la ficha intersectorial en PDF.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEGURIDAD & CUMPLIMIENTO NORMAS (Circular 482 & Ley 20.536) */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="bg-gradient-to-r from-indigo-50/50 via-slate-50 to-violet-50/50 border border-slate-200/85 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg mb-4">
              Cumplimiento Normativo Superintendencia
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Diseñado en estricto apego al Reglamento Interno (RICE) y Circular 482
            </h3>
            <p className="text-slate-600 text-sm mt-4 leading-relaxed font-medium">
              Cumple a cabalidad con las exigencias del Mineduc en Chile. Conexia proporciona el marco digital seguro para garantizar el derecho al debido proceso de los estudiantes, el resguardo de información clínica ultra-confidencial y la entrega instantánea de informes digitales ante fiscalizaciones.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Ley 20.536 de Violencia Escolar</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Circular N° 482 Mineduc</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Encriptación SSL & Firebase Security</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 w-32 h-32 shadow-xl shadow-indigo-500/5">
            <Lock size={48} className="text-indigo-600" />
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES (FAQ Accordion) */}
      <section id="faq" className="bg-slate-100/50 py-24 border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-650 uppercase tracking-widest">Preguntas Frecuentes</h2>
            <h3 className="text-3xl font-black text-slate-900 mt-2">Respuestas rápidas sobre Conexia</h3>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base pr-4">{faq.question}</span>
                  <ChevronDown 
                    size={18} 
                    className={`text-indigo-650 shrink-0 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === index ? 'max-h-72 border-t border-slate-100' : 'max-h-0'}`}
                >
                  <p className="p-6 text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none"></div>
        <h3 className="text-3xl sm:text-4xl font-black text-slate-900">¿Listo para modernizar tu establecimiento?</h3>
        <p className="text-slate-600 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed font-medium">
          Únete a los colegios que ya gestionan su convivencia y apoyo psicosocial de forma profesional, eficiente, amigable y 100% digital.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoginClick}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold px-10 py-4.5 rounded-xl text-base shadow-xl shadow-indigo-500/15 hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <span>Ingresar al Portal Escolar</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Conexia Logo" 
              className="w-8 h-8 object-contain bg-white rounded-lg p-0.5 shadow-sm border border-slate-200" 
            />
            <span className="font-bold text-slate-700 tracking-wider">CONEXIA SAAS</span>
          </div>
          <div className="text-center md:text-right font-mono font-semibold">
            Plataforma de Apoyo Escolar Integral • © {new Date().getFullYear()} Conexia. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
};
