import { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { dbService } from './firebase';
import type { Student, Staff, SchoolType, UserRole, School, CoexistenceCase, Activity, PsychosocialCase, RiceProtocol } from './types';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Shared color themes
import { THEMES } from './lib/themes';
import type { ColorTheme } from './lib/themes';

// Lazy load dashboard modules for optimal initial page loading speed (split chunks)
const SchoolCoexistence = lazy(() => import('./components/SchoolCoexistence').then(m => ({ default: m.SchoolCoexistence })));
const SchoolActivities = lazy(() => import('./components/SchoolActivities').then(m => ({ default: m.SchoolActivities })));
const PsychosocialModule = lazy(() => import('./components/PsychosocialModule').then(m => ({ default: m.PsychosocialModule })));
const CalendarModule = lazy(() => import('./components/CalendarModule').then(m => ({ default: m.CalendarModule })));
const MessagingModule = lazy(() => import('./components/MessagingModule').then(m => ({ default: m.MessagingModule })));
const SettingsModule = lazy(() => import('./components/SettingsModule').then(m => ({ default: m.SettingsModule })));
const LoginModule = lazy(() => import('./components/LoginModule').then(m => ({ default: m.LoginModule })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const ClimateDiagnosisModule = lazy(() => import('./components/ClimateDiagnosisModule').then(m => ({ default: m.ClimateDiagnosisModule })));
const PublicSurveyForm = lazy(() => import('./components/PublicSurveyForm').then(m => ({ default: m.PublicSurveyForm })));
const RiceProtocolsModule = lazy(() => import('./components/RiceProtocolsModule').then(m => ({ default: m.RiceProtocolsModule })));


function App() {
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchool] = useState<SchoolType>('Colegio San Nicolás');
  const [activeRole, setActiveRole] = useState<UserRole>('Convivencia');
  const [activeTab, setActiveTab] = useState<string>('coexistence');

  // Authenticated Staff state
  const [loggedInUser, setLoggedInUser] = useState<Staff | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Cached collections (Zero-Read Architecture)
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [coexistenceCases, setCoexistenceCases] = useState<CoexistenceCase[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [psychosocialCases, setPsychosocialCases] = useState<PsychosocialCase[]>([]);
  const [riceProtocols, setRiceProtocols] = useState<RiceProtocol[]>([]);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cached' | 'error'>('loading');

  // 10 Color Theme state
  const [activeTheme, setActiveTheme] = useState<ColorTheme>(() => {
    const savedId = localStorage.getItem('conexia_active_theme_id');
    const matched = THEMES.find(t => t.id === savedId);
    return matched || THEMES[0]; // defaults to indigo
  });

  // Inject CSS Variables on activeTheme change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--conexia-primary', activeTheme.primary);
    root.style.setProperty('--conexia-primary-hover', activeTheme.primaryHover);
    root.style.setProperty('--conexia-primary-light', activeTheme.primaryLight);
    root.style.setProperty('--conexia-accent', activeTheme.accent);
    root.style.setProperty('--conexia-accent-bg', activeTheme.accentBg);
    
    localStorage.setItem('conexia_active_theme_id', activeTheme.id);
  }, [activeTheme]);

  // Load available schools on mount
  const loadSchools = async () => {
    try {
      const sch = await dbService.getSchools();
      setSchools(sch);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSchools();
    // Purge any legacy simulated survey data from localStorage
    Object.keys(localStorage)
      .filter(k => k.startsWith('conexia_dia_resp_'))
      .forEach(k => localStorage.removeItem(k));
  }, []);

  // Main loader for students, staff, and other collections to optimize Firestore reads
  const loadSchoolCache = async (school: SchoolType) => {
    if (!loggedInUser) return;
    setCacheStatus('loading');
    try {
      const loadedStudents = await dbService.getStudents(school);
      const loadedStaff = await dbService.getStaff(school);
      const casesObj = await dbService.getCoexistenceCases(school, 1000);
      const loadedActivities = await dbService.getActivities(school);
      const loadedPsychosocial = await dbService.getPsychosocialCases(school);
      const loadedProtocols = await dbService.getRiceProtocols(school);
 
      setStudents(loadedStudents);
      setStaff(loadedStaff);
      setCoexistenceCases(casesObj?.data || []);
      setActivities(loadedActivities || []);
      setPsychosocialCases(loadedPsychosocial || []);
      setRiceProtocols(loadedProtocols || []);
      setCacheStatus('cached');
    } catch (e) {
      console.error("Error al cargar la base de datos: ", e);
      setCacheStatus('error');
      toast.error("Error al cargar datos del establecimiento.");
    }
  };

  useEffect(() => {
    if (loggedInUser) {
      loadSchoolCache(activeSchool);
    }
  }, [activeSchool, loggedInUser]);

  const refreshStudentsState = async () => {
    const dbStudents = await dbService.getStudents(activeSchool);
    setStudents(dbStudents);
  };

  const refreshStaffState = async () => {
    const dbStaff = await dbService.getStaff(activeSchool);
    setStaff(dbStaff);
  };

  const handleLoginSuccess = (schoolName: string, role: string, staffMember: Staff) => {
    setLoggedInUser(staffMember);
    setActiveSchool(schoolName);
    setActiveRole(role as UserRole);
    
    // Land clinical roles directly on Dupla Psicosocial
    if (role === 'Psicólogo' || role === 'Trabajador Social' || role === 'Orientador') {
      setActiveTab('psychosocial');
    } else {
      setActiveTab('coexistence');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    toast.success('Sesión cerrada correctamente.');
  };

  // Public survey link bypass (check parameters)
  const urlParams = new URLSearchParams(window.location.search);
  const surveyIdParam = urlParams.get('surveyId');
  const schoolParam = urlParams.get('school');
  const gradeParam = urlParams.get('grade');

  if (surveyIdParam) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Suspense fallback={
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm font-semibold">Cargando diagnóstico...</p>
          </div>
        }>
          <PublicSurveyForm 
            surveyId={surveyIdParam}
            schoolName={schoolParam || ''}
            gradeName={gradeParam || ''}
          />
        </Suspense>
      </>
    );
  }

  // If not logged in, render Landing Page with Login portal option
  if (!loggedInUser) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Suspense fallback={
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-sm font-semibold">Cargando Conexia...</p>
          </div>
        }>
          {isLoginOpen ? (
            <LoginModule 
              onLoginSuccess={(schoolName, role, staffMember) => {
                setIsLoginOpen(false);
                handleLoginSuccess(schoolName, role, staffMember);
              }} 
              onClose={() => setIsLoginOpen(false)}
            />
          ) : (
            <LandingPage onLoginClick={() => setIsLoginOpen(true)} />
          )}
        </Suspense>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSchool={activeSchool}
        setActiveSchool={setActiveSchool}
        activeRole={activeRole}
        cacheStatus={cacheStatus}
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        schools={schools}
      >
        <Suspense fallback={
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[400px] font-sans">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm font-semibold">Cargando módulo de Convivencia...</p>
          </div>
        }>
          {activeTab === 'coexistence' && (
            <SchoolCoexistence
              activeSchool={activeSchool}
              students={students}
              staff={staff}
              onRefreshStudents={refreshStudentsState}
              coexistenceCases={coexistenceCases}
              onCoexistenceCasesChange={setCoexistenceCases}
            />
          )}

          {activeTab === 'protocols' && (
            <RiceProtocolsModule
              activeSchool={activeSchool}
              students={students}
              staff={staff}
              loggedInUser={loggedInUser!}
              riceProtocols={riceProtocols}
              onRiceProtocolsChange={setRiceProtocols}
            />
          )}

          {activeTab === 'activities' && (
            <SchoolActivities
              activeSchool={activeSchool}
              students={students}
              activities={activities}
              onActivitiesChange={setActivities}
            />
          )}

          {activeTab === 'psychosocial' && (
            <PsychosocialModule
              activeSchool={activeSchool}
              students={students}
              staff={staff}
              loggedInUser={loggedInUser}
              psychosocialCases={psychosocialCases}
              onPsychosocialCasesChange={setPsychosocialCases}
            />
          )}

          {activeTab === 'climate' && (
            <ClimateDiagnosisModule
              activeSchool={activeSchool}
              students={students}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              activeSchool={activeSchool}
              schools={schools}
              onRefreshSchools={loadSchools}
              students={students}
              onRefreshStudents={refreshStudentsState}
              onRefreshStaff={refreshStaffState}
              activeTheme={activeTheme}
              setActiveTheme={setActiveTheme}
              loggedInUser={loggedInUser}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarModule
              activeSchool={activeSchool}
              loggedInUser={loggedInUser}
            />
          )}

          {activeTab === 'messaging' && (
            <MessagingModule
              activeSchool={activeSchool}
              loggedInUser={loggedInUser}
              staff={staff}
            />
          )}
        </Suspense>
      </Layout>
    </>
  );
}

export default App;
