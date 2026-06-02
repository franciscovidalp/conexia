import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SchoolCoexistence } from './components/SchoolCoexistence';
import { SchoolActivities } from './components/SchoolActivities';
import { PsychosocialModule } from './components/PsychosocialModule';
import { SettingsModule, THEMES } from './components/SettingsModule';
import type { ColorTheme } from './components/SettingsModule';
import { LoginModule } from './components/LoginModule';
import { dbService } from './firebase';
import type { Student, Staff, SchoolType, UserRole, School } from './types';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

function App() {
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchool] = useState<SchoolType>('Colegio San Nicolás');
  const [activeRole, setActiveRole] = useState<UserRole>('Convivencia');
  const [activeTab, setActiveTab] = useState<string>('coexistence');

  // Authenticated Staff state
  const [loggedInUser, setLoggedInUser] = useState<Staff | null>(null);

  // Cached collections (Zero-Read Architecture)
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
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
  }, []);

  // Main loader for students & staff
  const loadSchoolCache = async (school: SchoolType) => {
    setCacheStatus('loading');
    try {
      const loadedStudents = await dbService.getStudents(school);
      const loadedStaff = await dbService.getStaff(school);
      setStudents(loadedStudents);
      setStaff(loadedStaff);
      setCacheStatus('cached');
    } catch (e) {
      console.error("Error al cargar la base de datos: ", e);
      setCacheStatus('error');
      toast.error("Error al cargar datos del establecimiento.");
    }
  };

  useEffect(() => {
    loadSchoolCache(activeSchool);
  }, [activeSchool]);

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
    setActiveTab('coexistence');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    toast.success('Sesión cerrada correctamente.');
  };

  // If not logged in, render Login portal
  if (!loggedInUser) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <LoginModule onLoginSuccess={handleLoginSuccess} />
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
        {activeTab === 'coexistence' && (
          <SchoolCoexistence
            activeSchool={activeSchool}
            students={students}
            staff={staff}
            onRefreshStudents={refreshStudentsState}
          />
        )}

        {activeTab === 'activities' && (
          <SchoolActivities
            activeSchool={activeSchool}
            students={students}
          />
        )}

        {activeTab === 'psychosocial' && (
          <PsychosocialModule
            activeSchool={activeSchool}
            students={students}
            staff={staff}
            loggedInUser={loggedInUser}
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
      </Layout>
    </>
  );
}

export default App;
