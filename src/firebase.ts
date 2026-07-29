import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  getDocs, 
  getDocsFromCache,
  getDoc,
  updateDoc, 
  doc, 
  query, 
  where, 
  deleteDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut 
} from 'firebase/auth';
import type { Student, Staff, CoexistenceCase, Activity, PsychosocialCase, ClinicalSession, SchoolType, PsychosocialStatus, School, ChatMessage, Meeting, SurveyAnswer, SurveyAccess, RiceProtocol, ManagementObjective, ExternalReferral, ParentSummons } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "conexia-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "conexia-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "conexia-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

const hasFirebaseConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY) &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'mock-api-key';
const demoModeEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

if (import.meta.env.PROD && !hasFirebaseConfig) {
  throw new Error('Configuración de Firebase ausente. CONEXIA bloqueó el inicio para evitar operar con datos locales inseguros.');
}

let useMock = demoModeEnabled;
let db: any = null;
let auth: any = null;

if (hasFirebaseConfig) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    auth = getAuth(app);
    useMock = false;
    console.log("Firebase conectado.");
  } catch (error) {
    console.error("No fue posible inicializar Firebase:", error);
    useMock = demoModeEnabled;
  }
} else if (!demoModeEnabled) {
  throw new Error('Firebase no está configurado. Para una demostración local explícita use VITE_ENABLE_DEMO_MODE=true.');
}

// Initial Mock Data
const INITIAL_SCHOOLS: School[] = [
  { id: "col-san-nicolas", name: "Colegio San Nicolás", rut: "76.452.330-2", address: "Av. Las Lilas 1420, Concepción", createdAt: new Date().toISOString() },
  { id: "col-biobio", name: "Colegio BioBío", rut: "78.110.890-K", address: "Calle Chacabuco 452, Chiguayante", createdAt: new Date().toISOString() }
];

const MOCK_STUDENTS: Student[] = [
  { id: "19.230.450-K", rut: "19.230.450-K", firstName: "Diego", lastName: "Valenzuela Jara", school: "Colegio San Nicolás", grade: "1° Medio A", conductScore: 88, email: "diego.valenzuela@sannicolas.cl" },
  { id: "20.114.892-2", rut: "20.114.892-2", firstName: "Martina", lastName: "Soto Villagrán", school: "Colegio San Nicolás", grade: "1° Medio A", conductScore: 92, email: "martina.soto@sannicolas.cl" },
  { id: "20.455.918-4", rut: "20.455.918-4", firstName: "Sebastián", lastName: "Pérez Muñoz", school: "Colegio San Nicolás", grade: "2° Medio B", conductScore: 54, email: "sebastian.perez@sannicolas.cl" },
  { id: "21.002.394-1", rut: "21.002.394-1", firstName: "Valentina", lastName: "Rojas Gatica", school: "Colegio San Nicolás", grade: "2° Medio B", conductScore: 78, email: "valentina.rojas@sannicolas.cl" },
  { id: "21.564.912-3", rut: "21.564.912-3", firstName: "Benjamín", lastName: "Cortés Salinas", school: "Colegio San Nicolás", grade: "3° Medio A", conductScore: 42, email: "benjamin.cortes@sannicolas.cl" },
  { id: "22.122.344-9", rut: "22.122.344-9", firstName: "Antonia", lastName: "Fuentes Riquelme", school: "Colegio San Nicolás", grade: "3° Medio A", conductScore: 97, email: "antonia.fuentes@sannicolas.cl" },
  { id: "19.812.330-9", rut: "19.812.330-9", firstName: "Joaquín", lastName: "Bustos Alarcón", school: "Colegio BioBío", grade: "1° Medio B", conductScore: 90 },
  { id: "20.222.190-3", rut: "20.222.190-3", firstName: "Camila", lastName: "Henríquez Silva", school: "Colegio BioBío", grade: "1° Medio B", conductScore: 48 },
  { id: "20.912.441-K", rut: "20.912.441-K", firstName: "Felipe", lastName: "Morales Pizarro", school: "Colegio BioBío", grade: "2° Medio A", conductScore: 80 },
  { id: "21.314.992-1", rut: "21.314.992-1", firstName: "Catalina", lastName: "Vergara Cid", school: "Colegio BioBío", grade: "2° Medio A", conductScore: 95 }
];

const MOCK_STAFF: Staff[] = [
  { id: "12.441.902-8", rut: "12.441.902-8", firstName: "Carlos", lastName: "Mendoza Allende", school: "Colegio San Nicolás", role: "Convivencia", email: "carlos.mendoza@sannicolas.cl" },
  { id: "14.230.119-K", rut: "14.230.119-K", firstName: "María Paz", lastName: "Toledo Bascuñán", school: "Colegio San Nicolás", role: "Psicólogo", email: "mariapaz.toledo@sannicolas.cl" },
  { id: "15.918.239-1", rut: "15.918.239-1", firstName: "Juan Pablo", lastName: "Silva Oyarzún", school: "Colegio San Nicolás", role: "Trabajador Social", email: "juan.silva@sannicolas.cl" },
  { id: "16.441.229-3", rut: "16.441.229-3", firstName: "Patricia", lastName: "Venegas Soto", school: "Colegio San Nicolás", role: "Docente", email: "patricia.venegas@sannicolas.cl" },
  { id: "10.992.812-4", rut: "10.992.812-4", firstName: "Sofía", lastName: "Castro Ruiz", school: "Colegio San Nicolás", role: "Directivo", email: "sofia.castro@sannicolas.cl" },
  { id: "13.111.459-2", rut: "13.111.459-2", firstName: "Alejandro", lastName: "Guzmán Ortíz", school: "Colegio BioBío", role: "Convivencia", email: "alejandro.guzman@biobio.cl" },
  { id: "15.223.902-1", rut: "15.223.902-1", firstName: "Camila", lastName: "Rojas Miranda", school: "Colegio BioBío", role: "Psicólogo", email: "camila.rojas@biobio.cl" },
  { id: "16.890.312-K", rut: "16.890.312-K", firstName: "Eduardo", lastName: "Salazar Garrido", school: "Colegio BioBío", role: "Trabajador Social", email: "eduardo.salazar@biobio.cl" },
  { id: "admin-1", rut: "9.999.999-9", firstName: "Administrador", lastName: "General", school: "Colegio BioBío", role: "Administrador", email: "admin@colegiobiobiola.cl" },
  { id: "admin-2", rut: "8.888.888-8", firstName: "Francisco Javier", lastName: "Vidal", school: "Colegio BioBío", role: "Administrador", email: "franciscojavier.vidal.p@gmail.com" }
];

const INITIAL_COEXISTENCE_CASES: CoexistenceCase[] = [
  {
    id: "case-101",
    studentId: "20.455.918-4",
    studentName: "Sebastián Pérez Muñoz",
    school: "Colegio San Nicolás",
    date: "2026-05-12",
    type: "Grave",
    description: "El estudiante se involucra en una discusión verbal acalorada con un docente de asignatura dentro de la sala de clases, usando vocabulario inadecuado y retirándose del aula sin autorización previa.",
    reporterId: "16.441.229-3",
    reporterName: "Patricia Venegas Soto",
    protocolActivated: true,
    protocolName: "Protocolo de Maltrato hacia Funcionarios",
    referredToPsychosocial: true,
    actionPlan: "Citación a apoderado de carácter urgente, derivación a dupla psicosocial para evaluar desregulación emocional, y amonestación escrita según RICE.",
    commitments: "El alumno se compromete a respetar las normas básicas de convivencia, acatar instrucciones docentes y asistir a entrevistas semanales con la psicóloga escolar.",
    status: "Resuelto",
    createdAt: "2026-05-12T10:30:00.000Z"
  },
  {
    id: "case-102",
    studentId: "21.564.912-3",
    studentName: "Benjamín Cortés Salinas",
    school: "Colegio San Nicolás",
    date: "2026-05-20",
    type: "Gravísima",
    description: "Estudiante es sorprendido portando un elemento cortopunzante (navaja retráctil) al interior del patio de juegos durante el segundo recreo de la jornada académica regular.",
    reporterId: "12.441.902-8",
    reporterName: "Carlos Mendoza Allende",
    protocolActivated: true,
    protocolName: "Protocolo de Porte de Armas u Objetos Peligrosos",
    referredToPsychosocial: true,
    actionPlan: "Suspensión preventiva inmediata, citación oficial a apoderado, denuncia institucional obligatoria a Carabineros de Chile según normativas vigentes, y canalización prioritaria con dupla clínica.",
    commitments: "Firma de carta condicional de matrícula, entrega de informe de psiquiatría externa para reincorporación al establecimiento escolar.",
    status: "En Proceso",
    createdAt: "2026-05-20T12:15:00.000Z"
  }
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "act-001",
    title: "Taller de Prevención del Bullying y Ciberacoso Escolar",
    date: "2026-06-15",
    speaker: "María Paz Toledo (Psicóloga)",
    location: "Gimnasio Techado Principal",
    status: "Programada",
    audienceType: "Masiva",
    targetGrades: ["1° Medio A", "2° Medio B"],
    school: "Colegio San Nicolás",
    createdAt: "2026-05-30T10:00:00Z"
  }
];

const INITIAL_PSYCHOSOCIAL_CASES: PsychosocialCase[] = [
  {
    id: "psy-case-1",
    studentId: "20.455.918-4",
    studentName: "Sebastián Pérez Muñoz",
    grade: "2° Medio B",
    school: "Colegio San Nicolás",
    status: "En Intervención",
    referredDate: "2026-05-12",
    reason: "Derivación automática tras incidente grave de agresión verbal a docente.",
    riskLevel: "Alto",
    createdAt: "2026-05-12T10:35:00Z"
  }
];

const INITIAL_SESSIONS: ClinicalSession[] = [
  {
    id: "sess-1",
    caseId: "psy-case-1",
    date: "2026-05-15",
    contactType: "Estudiante",
    notes: "<p>Se realiza entrevista individual con Sebastián. Se observa inicialmente reacio a dialogar.</p>",
    agreements: "Asistir a la próxima sesión agendada el día viernes.",
    professionalId: "14.230.119-K",
    professionalName: "María Paz Toledo Bascuñán",
    createdAt: "2026-05-15T11:00:00Z"
  }
];

const INITIAL_RICE_PROTOCOLS: RiceProtocol[] = [
  {
    id: "proto-1",
    caseId: "case-102",
    studentId: "21.564.912-3",
    studentName: "Benjamín Cortés Salinas",
    grade: "3° Medio A",
    school: "Colegio San Nicolás",
    protocolType: "Violencia Escolar",
    status: "Abierto",
    startedAt: "2026-05-20",
    dueDate: "2026-06-10",
    createdAt: "2026-05-20T12:20:00.000Z",
    steps: [
      {
        id: '1_detection',
        name: 'Detección y Registro',
        description: 'Registro del reporte inicial y adopción de medidas inmediatas de resguardo.',
        status: 'Completado',
        completedAt: '2026-05-20',
        completedBy: 'Carlos Mendoza Allende',
        notes: 'Estudiante es sorprendido portando elemento cortopunzante en patio. Se confisca objeto y se aísla preventivamente al estudiante.',
        fields: {
          initialMeasures: 'Suspensión preventiva del estudiante, citación inmediata de apoderado.',
          reporterName: 'Carlos Mendoza Allende'
        }
      },
      {
        id: '2_notification',
        name: 'Derivación y Notificación',
        description: 'Citación formal y comunicación escrita a los apoderados del estudiante afectado y el denunciado.',
        status: 'Completado',
        completedAt: '2026-05-21',
        completedBy: 'Carlos Mendoza Allende',
        notes: 'Apoderado asiste a reunión y firma acta de notificación de suspensión preventiva e inicio de investigación RICE.',
        fields: {
          victimParentNotifiedDate: '2026-05-20',
          aggressorParentNotifiedDate: '2026-05-20',
          communicationType: 'Citación presencial con firma de acta física.'
        }
      },
      {
        id: '3_investigation',
        name: 'Investigación y Entrevistas',
        description: 'Recopilación de relatos de implicados, testigos y análisis de antecedentes.',
        status: 'En Proceso',
        notes: 'Entrevista realizada a testigos del patio. Pendiente informe de inspectoría.',
        fields: {
          interviews: ['Carlos Mendoza (Inspector)', 'Estudiante Benjamín Cortés'],
          findings: 'Se corrobora que el objeto fue mostrado a compañeros en tono de broma, pero constituye una falta gravísima según el manual.'
        }
      },
      {
        id: '4_resolution',
        name: 'Resolución y Medidas RICE',
        description: 'Determinación de medidas formativas o disciplinarias según el reglamento interno.',
        status: 'Pendiente',
        fields: {
          measureType: '',
          resolutionDescription: '',
          commitmentsSigned: false
        }
      },
      {
        id: '5_followup',
        name: 'Seguimiento e Informe',
        description: 'Monitoreo de compromisos de apoyo, derivación a dupla psicosocial y cierre formal.',
        status: 'Pendiente',
        fields: {
          referredToDupla: true,
          followupDate: '',
          finalReportSummary: ''
        }
      }
    ]
  }
];

const INITIAL_OBJECTIVES: ManagementObjective[] = [
  {
    id: "obj-1",
    title: "Implementar Programa de Prevención del Cyberbullying",
    category: "Prevención",
    target: "7° Básico a 4° Medio",
    description: "Realizar talleres preventivos sobre el uso responsable de redes sociales y consecuencias del ciberacoso.",
    status: "En Proceso",
    associatedActivityIds: ["act-001"],
    school: "Colegio San Nicolás",
    createdAt: "2026-03-01T08:00:00Z"
  },
  {
    id: "obj-2",
    title: "Fortalecer la Alianza Familia-Escuela",
    category: "Formación",
    target: "Todo el Establecimiento",
    description: "Ejecutar jornadas formativas para apoderados sobre pautas de crianza respetuosa y contención emocional.",
    status: "No Iniciado",
    associatedActivityIds: [],
    school: "Colegio San Nicolás",
    createdAt: "2026-03-10T09:00:00Z"
  }
];

const INITIAL_REFERRALS: ExternalReferral[] = [
  {
    id: "ref-1",
    studentId: "21.564.912-3",
    studentName: "Benjamín Cortés Salinas",
    grade: "3° Medio A",
    school: "Colegio San Nicolás",
    institution: "OPD",
    reason: "Se deriva por sospecha grave de vulneración de derechos en el entorno familiar, evidenciada tras entrevistas y reporte de desregulación con porte de objeto peligroso.",
    previousMeasures: "Entrevistas individuales con la psicóloga escolar, citación y reunión presencial con el apoderado, aplicación de protocolo de resguardo RICE.",
    status: "Enviado",
    sentDate: "2026-05-22",
    folioNumber: "OF-2026-041",
    observations: "Pendiente respuesta formal de OPD Concepción respecto a medidas de protección familiar.",
    professionalId: "14.230.119-K",
    professionalName: "María Paz Toledo Bascuñán",
    createdAt: "2026-05-22T10:00:00Z"
  }
];

const getLocalData = <T>(key: string, initial: T[]): T[] => {
  // Firestore data must never be copied to persistent browser storage.
  // localStorage is exclusively available in the explicitly enabled demo mode.
  if (!useMock) return [];
  const data = localStorage.getItem(`conexia_${key}`);
  if (!data) {
    localStorage.setItem(`conexia_${key}`, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveLocalData = <T>(key: string, data: T[]) => {
  if (!useMock) return;
  localStorage.setItem(`conexia_${key}`, JSON.stringify(data));
};

const studentCacheKey = (school: SchoolType) =>
  `conexia_students_server_sync_${encodeURIComponent(school)}`;

const localDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const invalidateStudentCache = (school?: SchoolType) => {
  if (school) {
    localStorage.removeItem(studentCacheKey(school));
    return;
  }
  Object.keys(localStorage)
    .filter(key => key.startsWith('conexia_students_server_sync_'))
    .forEach(key => localStorage.removeItem(key));
};

export const dbService = {
  // --- FIRESTORE SEEDER ---
  async seedFirestoreData(): Promise<void> {
    if (useMock) return;
    try {
      console.log("Seeding Firestore with initial demo data...");
      
      // Seed schools
      for (const sch of INITIAL_SCHOOLS) {
        await setDoc(doc(db, 'schools', sch.id), sch);
      }
      
      // Seed staff
      for (const st of MOCK_STAFF) {
        await setDoc(doc(db, 'staff', st.id || st.rut), st);
      }

      // Seed students
      for (const std of MOCK_STUDENTS) {
        await setDoc(doc(db, 'students', std.id || std.rut), std);
      }

      // Seed coexistence cases
      for (const cs of INITIAL_COEXISTENCE_CASES) {
        await setDoc(doc(db, 'coexistence_cases', cs.id), cs);
      }

      // Seed objectives
      for (const obj of INITIAL_OBJECTIVES) {
        await setDoc(doc(db, 'objectives', obj.id), obj);
      }

      // Seed referrals
      for (const ref of INITIAL_REFERRALS) {
        await setDoc(doc(db, 'referrals', ref.id), ref);
      }
      
      console.log("Firestore successfully seeded with schools, staff, students, cases, objectives and referrals!");
    } catch (err) {
      console.error("Error during Firestore seeding:", err);
    }
  },

  // --- COLEGIO CRUD ---
  async getSchools(): Promise<School[]> {
    if (!useMock) {
      try {
        let snap = await getDocs(collection(db, 'schools'));
        if (snap.empty) {
          await dbService.seedFirestoreData();
          snap = await getDocs(collection(db, 'schools'));
        }
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as School));
      } catch (err) {
        console.error("Firestore error loading schools:", err);
      }
    }
    return getLocalData<School>('schools', INITIAL_SCHOOLS);
  },

  async createSchool(sch: Omit<School, 'id' | 'createdAt'>): Promise<School> {
    const newSch: School = {
      ...sch,
      id: `school-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'schools', newSch.id), newSch);
      } catch (e) {
        console.error("Firestore school create failed:", e);
      }
    }
    const all = getLocalData<School>('schools', INITIAL_SCHOOLS);
    all.push(newSch);
    saveLocalData('schools', all);

    // Seed some initial staff for new school so the user can log in
    const staff = getLocalData<Staff>('staff', MOCK_STAFF);
    staff.push(
      { id: `doc-${Date.now()}`, rut: `15.990.${Math.floor(Math.random()*900)+100}-9`, firstName: "Coordinador", lastName: "Nuevo", school: sch.name, role: "Convivencia", email: "coordinador@colegio.cl" },
      { id: `psy-${Date.now()}`, rut: `16.880.${Math.floor(Math.random()*900)+100}-2`, firstName: "Psicólogo(a)", lastName: "Nuevo", school: sch.name, role: "Psicólogo", email: "psicologo@colegio.cl" }
    );
    saveLocalData('staff', staff);

    return newSch;
  },

  async updateSchool(id: string, updates: Partial<School>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'schools', id), updates);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<School>('schools', INITIAL_SCHOOLS);
    const idx = all.findIndex(s => s.id === id);
    if (idx !== -1) {
      // Also update school names in students and staff if name changed
      const oldName = all[idx].name;
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('schools', all);

      if (updates.name && oldName !== updates.name) {
        const students = getLocalData<Student>('students', MOCK_STUDENTS);
        students.forEach(s => { if (s.school === oldName) s.school = updates.name!; });
        saveLocalData('students', students);

        const staff = getLocalData<Staff>('staff', MOCK_STAFF);
        staff.forEach(st => { if (st.school === oldName) st.school = updates.name!; });
        saveLocalData('staff', staff);
      }
    }
  },

  async deleteSchool(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'schools', id));
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<School>('schools', INITIAL_SCHOOLS);
    const target = all.find(s => s.id === id);
    if (target) {
      const filtered = all.filter(s => s.id !== id);
      saveLocalData('schools', filtered);

      // Remove students of deleted school
      const students = getLocalData<Student>('students', MOCK_STUDENTS).filter(s => s.school !== target.name);
      saveLocalData('students', students);
    }
  },

  // --- ESTUDIANTES CRUD & IMPORT ---
  async getStudents(school: SchoolType, forceRefresh = false): Promise<Student[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'students'), where('school', '==', school));
        const cacheMetadataRaw = localStorage.getItem(studentCacheKey(school));
        let cacheMetadata: { day: string; count: number } | null = null;
        try {
          cacheMetadata = cacheMetadataRaw ? JSON.parse(cacheMetadataRaw) : null;
        } catch {
          cacheMetadata = null;
        }
        const alreadySyncedToday = cacheMetadata?.day === localDayKey();
        if (!forceRefresh && alreadySyncedToday) {
          try {
            const cachedSnap = await getDocsFromCache(q);
            if (cachedSnap.size === cacheMetadata?.count) {
              return cachedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
            }
          } catch {
            // A cache miss falls through to the server.
          }
        }
        const snap = await getDocs(q);
        localStorage.setItem(studentCacheKey(school), JSON.stringify({
          day: localDayKey(),
          count: snap.size
        }));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      } catch (err) {
        console.error("Firestore error loading students:", err);
        throw err;
      }
    }
    const all = getLocalData<Student>('students', MOCK_STUDENTS);
    return all.filter(s => s.school === school);
  },

  async createStudent(s: Omit<Student, 'id'>): Promise<Student> {
    const newStd: Student = {
      ...s,
      id: s.rut
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'students', newStd.id), newStd);
        invalidateStudentCache(newStd.school);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Student>('students', MOCK_STUDENTS);
    const idx = all.findIndex(st => st.rut === s.rut);
    if (idx !== -1) {
      all[idx] = newStd; // Overwrite
    } else {
      all.push(newStd);
    }
    saveLocalData('students', all);
    return newStd;
  },

  async importStudentsCSV(schoolName: SchoolType, csvRows: any[]): Promise<number> {
    const all = getLocalData<Student>('students', MOCK_STUDENTS);
    let count = 0;
    
    csvRows.forEach(row => {
      if (!row.rut || !row.nombre || !row.apellido || !row.curso) return;
      
      const newStd: Student = {
        id: row.rut.trim(),
        rut: row.rut.trim(),
        firstName: row.nombre.trim(),
        lastName: row.apellido.trim(),
        school: schoolName,
        grade: row.curso.trim(),
        conductScore: 100,
        email: row.email ? row.email.trim() : `${row.nombre.trim().toLowerCase()}@conexia.cl`
      };

      const existingIdx = all.findIndex(s => s.rut === newStd.rut);
      if (existingIdx !== -1) {
        all[existingIdx] = newStd;
      } else {
        all.push(newStd);
      }
      count++;
    });

    saveLocalData('students', all);
    
    if (!useMock) {
      // Batched sync is substantially faster than one network round-trip per student.
      try {
        const validRows = csvRows.filter(row => row.rut && row.nombre && row.apellido && row.curso);
        for (let offset = 0; offset < validRows.length; offset += 450) {
          const batch = writeBatch(db);
          validRows.slice(offset, offset + 450).forEach(row => {
            const rutKey = row.rut.trim();
            batch.set(doc(db, 'students', rutKey), {
              id: rutKey,
              rut: rutKey,
              firstName: row.nombre.trim(),
              lastName: row.apellido.trim(),
              school: schoolName,
              grade: row.curso.trim(),
              conductScore: 100,
              email: row.email ? row.email.trim() : ''
            });
          });
          await batch.commit();
        }
        invalidateStudentCache(schoolName);
      } catch (e) {
        console.error("Could not sync CSV to Firestore:", e);
        throw e;
      }
    }

    return count;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'students', id), updates);
        invalidateStudentCache(updates.school);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Student>('students', MOCK_STUDENTS);
    const idx = all.findIndex(s => s.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('students', all);
    }
  },

  async deleteStudent(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'students', id));
        invalidateStudentCache();
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Student>('students', MOCK_STUDENTS);
    const filtered = all.filter(s => s.id !== id);
    saveLocalData('students', filtered);
  },

  // --- STAFF ---
  async getStaff(school: SchoolType): Promise<Staff[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'staff'), where('school', '==', school));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      } catch (err) {
        console.error("Firestore error loading staff:", err);
      }
    }
    const all = getLocalData<Staff>('staff', MOCK_STAFF);
    return all.filter(st => st.school === school);
  },

  async getAllStaff(): Promise<Staff[]> {
    if (!useMock) {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      } catch (err) {
        console.error("Firestore error loading all staff:", err);
      }
    }
    return getLocalData<Staff>('staff', MOCK_STAFF);
  },

  async createStaff(staff: Omit<Staff, 'id'>): Promise<Staff> {
    const newStaff: Staff = {
      ...staff,
      id: staff.rut.trim()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'staff', newStaff.id), newStaff);
      } catch (err) {
        console.error("Firestore staff create failed:", err);
      }
    }
    const all = getLocalData<Staff>('staff', MOCK_STAFF);
    const existingIdx = all.findIndex(st => st.rut === newStaff.rut);
    if (existingIdx !== -1) {
      all[existingIdx] = newStaff;
    } else {
      all.push(newStaff);
    }
    saveLocalData('staff', all);
    return newStaff;
  },

  async updateStaff(id: string, updates: Partial<Staff>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'staff', id), updates);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Staff>('staff', MOCK_STAFF);
    const idx = all.findIndex(st => st.id === id || st.rut === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('staff', all);
    }
  },

  async deleteStaff(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'staff', id));
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Staff>('staff', MOCK_STAFF);
    const filtered = all.filter(st => st.id !== id && st.rut !== id);
    saveLocalData('staff', filtered);
  },

  // --- INCIDENCIAS CRUD (CONVIVENCIA) ---
  async getCoexistenceCases(
    school: SchoolType, 
    limitCount: number = 5, 
    lastDocSnap: any = null
  ): Promise<{ data: CoexistenceCase[]; lastDoc: any; hasMore: boolean }> {
    if (!useMock) {
      try {
        const q = query(
          collection(db, 'coexistence_cases'),
          where('school', '==', school)
        );
        const snap = await getDocs(q);
        const allCases = snap.docs.map(d => ({ id: d.id, ...d.data() } as CoexistenceCase));
        
        // Sort in memory by createdAt descending
        allCases.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        
        const startIndex = lastDocSnap ? (lastDocSnap as number) : 0;
        const paginated = allCases.slice(startIndex, startIndex + limitCount);
        const nextIndex = startIndex + limitCount;
        const hasMore = nextIndex < allCases.length;

        return { 
          data: paginated, 
          lastDoc: hasMore ? nextIndex : null, 
          hasMore 
        };
      } catch (err) {
        console.error("Firestore error loading cases:", err);
      }
    }

    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES)
      .filter(c => c.school === school)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const startIndex = lastDocSnap ? (lastDocSnap as number) : 0;
    const paginated = all.slice(startIndex, startIndex + limitCount);
    const nextIndex = startIndex + limitCount;
    const hasMore = nextIndex < all.length;

    return {
      data: paginated,
      lastDoc: hasMore ? nextIndex : null,
      hasMore
    };
  },

  async getAllCoexistenceCases(school: SchoolType): Promise<CoexistenceCase[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'coexistence_cases'), where('school', '==', school));
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as CoexistenceCase));
        return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } catch (err) {
        console.error("Firestore error loading all cases:", err);
      }
    }
    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    return all.filter(c => c.school === school).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async updateStudentScore(studentId: string, score: number): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'students', studentId), { conductScore: score });
      } catch (err) {
        console.error("Firestore error updating student score:", err);
      }
    }
    const students = getLocalData<Student>('students', MOCK_STUDENTS);
    const idx = students.findIndex(s => s.id === studentId);
    if (idx !== -1) {
      students[idx].conductScore = score;
      saveLocalData('students', students);
    }
  },

  async recalculateStudentScore(studentId: string): Promise<number> {
    let cases: CoexistenceCase[] = [];
    if (!useMock) {
      try {
        const q = query(collection(db, 'coexistence_cases'), where('studentId', '==', studentId));
        const snap = await getDocs(q);
        cases = snap.docs.map(d => d.data() as CoexistenceCase);
      } catch (err) {
        console.error("Error fetching cases for score recalculation:", err);
      }
    } else {
      const allCases = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
      cases = allCases.filter(c => c.studentId === studentId);
    }

    let deltaSum = 0;
    cases.forEach(c => {
      if (c.type === 'Positiva') deltaSum += 5;
      else if (c.type === 'Leve') deltaSum -= 5;
      else if (c.type === 'Grave') deltaSum -= 15;
      else if (c.type === 'Gravísima') deltaSum -= 25;
    });

    const finalScore = Math.max(0, Math.min(100, 100 + deltaSum));
    await this.updateStudentScore(studentId, finalScore);
    return finalScore;
  },

  async createCoexistenceCase(c: Omit<CoexistenceCase, 'id' | 'createdAt'>): Promise<CoexistenceCase> {
    const newCase: CoexistenceCase = {
      ...c,
      id: `case-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    if (!useMock) {
      try {
        await setDoc(doc(db, 'coexistence_cases', newCase.id), newCase);
      } catch (err) {
        console.error("Firestore save failed:", err);
      }
    }

    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    all.push(newCase);
    saveLocalData('coexistence_cases', all);

    // Recalculate score in DB
    await this.recalculateStudentScore(c.studentId);

    if (c.referredToPsychosocial) {
      let studentGrade = 'N/A';
      if (!useMock) {
        try {
          const studentSnap = await getDoc(doc(db, 'students', c.studentId));
          if (studentSnap.exists()) {
            studentGrade = studentSnap.data().grade || 'N/A';
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        const students = getLocalData<Student>('students', MOCK_STUDENTS);
        const index = students.findIndex(s => s.id === c.studentId);
        if (index !== -1) {
          studentGrade = students[index].grade || 'N/A';
        }
      }

      await this.createPsychosocialCase({
        studentId: c.studentId,
        studentName: c.studentName,
        grade: studentGrade,
        school: c.school,
        status: 'Ingresado',
        referredDate: c.date,
        reason: `Derivación automática tras reporte de conducta (${c.type}): ${c.description.substring(0, 100)}...`,
        riskLevel: c.type === 'Gravísima' ? 'Crítico' : c.type === 'Grave' ? 'Alto' : 'Medio'
      });
    }

    return newCase;
  },

  async updateCoexistenceCase(id: string, updates: Partial<CoexistenceCase>): Promise<void> {
    let studentId = '';
    
    // Find in mock data
    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      studentId = all[idx].studentId;
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('coexistence_cases', all);
    }

    if (!useMock) {
      try {
        const caseSnap = await getDoc(doc(db, 'coexistence_cases', id));
        if (caseSnap.exists()) {
          studentId = caseSnap.data().studentId;
        }
        await updateDoc(doc(db, 'coexistence_cases', id), updates);
      } catch (e) {
        console.error(e);
      }
    }

    // Recalculate score
    if (studentId) {
      await this.recalculateStudentScore(studentId);
    }
  },

  async deleteCoexistenceCase(id: string): Promise<void> {
    let studentId = '';
    
    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      studentId = all[idx].studentId;
      const filtered = all.filter(c => c.id !== id);
      saveLocalData('coexistence_cases', filtered);
    }

    if (!useMock) {
      try {
        const caseSnap = await getDoc(doc(db, 'coexistence_cases', id));
        if (caseSnap.exists()) {
          studentId = caseSnap.data().studentId;
        }
        await deleteDoc(doc(db, 'coexistence_cases', id));
      } catch (e) {
        console.error(e);
      }
    }

    // Recalculate score
    if (studentId) {
      await this.recalculateStudentScore(studentId);
    }
  },

  // --- ACTIVITIES ---
  async getActivities(school: SchoolType): Promise<Activity[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'activities'), where('school', '==', school));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (err) {
        console.error("Firestore error loading activities:", err);
      }
    }
    const all = getLocalData<Activity>('activities', INITIAL_ACTIVITIES);
    return all.filter(a => a.school === school).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createActivity(act: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const newAct: Activity = {
      ...act,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'activities', newAct.id), newAct);
      } catch (err) {
        console.error(err);
      }
    }
    const all = getLocalData<Activity>('activities', INITIAL_ACTIVITIES);
    all.push(newAct);
    saveLocalData('activities', all);
    return newAct;
  },

  async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'activities', id), updates);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Activity>('activities', INITIAL_ACTIVITIES);
    const idx = all.findIndex(a => a.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('activities', all);
    }
  },

  async deleteActivity(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'activities', id));
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<Activity>('activities', INITIAL_ACTIVITIES);
    const filtered = all.filter(a => a.id !== id);
    saveLocalData('activities', filtered);
  },

  // --- PSYCHOSOCIAL ---
  async getPsychosocialCases(school: SchoolType): Promise<PsychosocialCase[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'psychosocial_cases'), where('school', '==', school));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PsychosocialCase));
      } catch (err) {
        console.error("Firestore error loading psychosocial cases:", err);
      }
    }
    return getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES).filter(pc => pc.school === school);
  },

  async createPsychosocialCase(pc: Omit<PsychosocialCase, 'id' | 'createdAt'>): Promise<PsychosocialCase> {
    const all = getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    const existing = all.find(c => c.studentId === pc.studentId && c.school === pc.school && c.status !== 'Alta Clínica');
    if (existing) return existing;

    const newPC: PsychosocialCase = {
      ...pc,
      id: `psy-case-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'psychosocial_cases', newPC.id), newPC);
      } catch (err) {
        console.error(err);
      }
    }
    all.push(newPC);
    saveLocalData('psychosocial_cases', all);
    return newPC;
  },

  async updatePsychosocialCase(id: string, updates: Partial<PsychosocialCase>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'psychosocial_cases', id), updates);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('psychosocial_cases', all);
    }
  },

  async updatePsychosocialCaseStatus(id: string, status: PsychosocialStatus): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'psychosocial_cases', id), { status });
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx].status = status;
      saveLocalData('psychosocial_cases', all);
    }
  },

  async deletePsychosocialCase(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'psychosocial_cases', id));
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    const filtered = all.filter(c => c.id !== id);
    saveLocalData('psychosocial_cases', filtered);

    // Delete sessions
    const sessions = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    const filteredSessions = sessions.filter(s => s.caseId !== id);
    saveLocalData('clinical_sessions', filteredSessions);
  },

  async cleanOrphanedCases(activeStudentIds: string[]): Promise<number> {
    const all = getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    const orphans = all.filter(c => !activeStudentIds.includes(c.studentId));
    if (orphans.length === 0) return 0;

    const kept = all.filter(c => activeStudentIds.includes(c.studentId));
    saveLocalData('psychosocial_cases', kept);

    if (!useMock) {
      try {
        for (const orphan of orphans) {
          await deleteDoc(doc(db, 'psychosocial_cases', orphan.id));
        }
      } catch (e) {
        console.warn("Firestore orphaned cleanup error:", e);
      }
    }
    return orphans.length;
  },

  // --- CLINICAL SESSIONS ---
  async getClinicalSessions(caseId: string): Promise<ClinicalSession[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'clinical_sessions'), where('caseId', '==', caseId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicalSession));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (err) {
        console.error(err);
      }
    }
    const all = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    return all.filter(s => s.caseId === caseId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getAllClinicalSessionsForSchool(school: SchoolType): Promise<(ClinicalSession & { studentName?: string })[]> {
    const cases = await dbService.getPsychosocialCases(school);
    const caseIds = cases.map(c => c.id);
    const caseMap = new Map(cases.map(c => [c.id, c.studentName]));

    if (!useMock) {
      try {
        const snap = await getDocs(collection(db, 'clinical_sessions'));
        const allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicalSession));
        const filtered = allSessions.filter(s => caseIds.includes(s.caseId));
        return filtered.map(s => ({
          ...s,
          studentName: caseMap.get(s.caseId) || 'Estudiante'
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (err) {
        console.error("Error fetching all clinical sessions:", err);
      }
    }
    const all = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    return all
      .filter(s => caseIds.includes(s.caseId))
      .map(s => ({
        ...s,
        studentName: caseMap.get(s.caseId) || 'Estudiante'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createClinicalSession(sess: Omit<ClinicalSession, 'id' | 'createdAt'>): Promise<ClinicalSession> {
    const newSess: ClinicalSession = {
      ...sess,
      id: `sess-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'clinical_sessions', newSess.id), newSess);
      } catch (err) {
        console.error(err);
      }
    }
    const all = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    all.push(newSess);
    saveLocalData('clinical_sessions', all);
    return newSess;
  },

  async updateClinicalSession(id: string, updates: Partial<ClinicalSession>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'clinical_sessions', id), updates);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    const idx = all.findIndex(s => s.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('clinical_sessions', all);
    }
  },

  async deleteClinicalSession(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'clinical_sessions', id));
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    const filtered = all.filter(s => s.id !== id);
    saveLocalData('clinical_sessions', filtered);
  },

  // --- MESSAGES ---
  async getMessages(school: string): Promise<ChatMessage[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'messages'), where('school', '==', school));
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
        return results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    const all = getLocalData<ChatMessage>('messages', []);
    return all.filter(m => m.school === school).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'messages', newMsg.id), newMsg);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
    const all = getLocalData<ChatMessage>('messages', []);
    all.push(newMsg);
    saveLocalData('messages', all);
    return newMsg;
  },

  // --- MEETINGS ---
  async getMeetings(school: string): Promise<Meeting[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'meetings'), where('school', '==', school));
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting));
        return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } catch (err) {
        console.error("Error fetching meetings:", err);
      }
    }
    const all = getLocalData<Meeting>('meetings', []);
    return all.filter(m => m.school === school).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'meetings', newMeeting.id), newMeeting);
      } catch (err) {
        console.error("Error creating meeting:", err);
      }
    }
    const all = getLocalData<Meeting>('meetings', []);
    all.push(newMeeting);
    saveLocalData('meetings', all);
    return newMeeting;
  },

  async deleteMeeting(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'meetings', id));
      } catch (err) {
        console.error("Error deleting meeting:", err);
      }
    }
    const all = getLocalData<Meeting>('meetings', []);
    const filtered = all.filter(m => m.id !== id);
    saveLocalData('meetings', filtered);
  },

  // --- PROTOCOLS ---
  async getRiceProtocols(school: SchoolType): Promise<RiceProtocol[]> {
    if (!useMock && db) {
      try {
        const q = query(collection(db, 'rice_protocols'), where('school', '==', school));
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as RiceProtocol));
        return results;
      } catch (err) {
        console.error("Error fetching rice protocols:", err);
        return [];
      }
    }
    return getLocalData<RiceProtocol>('rice_protocols', INITIAL_RICE_PROTOCOLS).filter(p => p.school === school);
  },

  async createRiceProtocol(proto: Omit<RiceProtocol, 'id' | 'createdAt'>): Promise<RiceProtocol> {
    const newProto: RiceProtocol = {
      ...proto,
      id: "proto-" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    if (!useMock && db) {
      try {
        await setDoc(doc(db, 'rice_protocols', newProto.id), newProto);
        return newProto;
      } catch (err) {
        console.error("Error creating rice protocol:", err);
      }
    }
    const all = getLocalData<RiceProtocol>('rice_protocols', INITIAL_RICE_PROTOCOLS);
    all.push(newProto);
    saveLocalData('rice_protocols', all);
    return newProto;
  },

  async updateRiceProtocol(id: string, updates: Partial<RiceProtocol>): Promise<void> {
    if (!useMock && db) {
      try {
        await updateDoc(doc(db, 'rice_protocols', id), updates);
        return;
      } catch (err) {
        console.error("Error updating rice protocol:", err);
      }
    }
    const all = getLocalData<RiceProtocol>('rice_protocols', INITIAL_RICE_PROTOCOLS);
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('rice_protocols', all);
    }
  },

  async deleteRiceProtocol(id: string): Promise<void> {
    if (!useMock && db) {
      try {
        await deleteDoc(doc(db, 'rice_protocols', id));
        return;
      } catch (err) {
        console.error("Error deleting rice protocol:", err);
      }
    }
    const all = getLocalData<RiceProtocol>('rice_protocols', INITIAL_RICE_PROTOCOLS);
    const filtered = all.filter(p => p.id !== id);
    saveLocalData('rice_protocols', filtered);
  },

  // --- AUTHENTICATION ---
  async signIn(emailOrRut: string, checkPassword: string): Promise<Staff> {
    const inputCleaned = emailOrRut.trim().toLowerCase();
    const isEmailInput = inputCleaned.includes('@');

    if (!useMock && auth) {
      if (!isEmailInput) {
        throw new Error('Por seguridad, el acceso en línea requiere correo electrónico.');
      }
      try {
        const userCredential = await signInWithEmailAndPassword(auth, inputCleaned, checkPassword);
        const uid = userCredential.user.uid;
        const staffQuery = query(
          collection(db, 'staff'),
          where('email', '==', userCredential.user.email)
        );
        const staffQuerySnap = await getDocs(staffQuery);
        const staffDocument = staffQuerySnap.docs[0];
        if (!staffDocument) {
          await fbSignOut(auth);
          throw new Error('No existe una ficha de funcionario habilitada para esta cuenta.');
        }
        const matchedStaff = { id: staffDocument.id, ...staffDocument.data() } as Staff;
        if (matchedStaff.email.toLowerCase() !== userCredential.user.email?.toLowerCase()) {
          await fbSignOut(auth);
          throw new Error('El correo autenticado no coincide con el perfil autorizado.');
        }
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            staffId: staffDocument.id,
            rut: matchedStaff.rut,
            email: matchedStaff.email,
            role: matchedStaff.role,
            school: matchedStaff.school
          });
        } else {
          const userData = userSnap.data() as Pick<Staff, 'rut' | 'email' | 'role' | 'school'>;
          if (
            userData.rut !== matchedStaff.rut ||
            userData.email.toLowerCase() !== matchedStaff.email.toLowerCase() ||
            userData.role !== matchedStaff.role ||
            userData.school !== matchedStaff.school
          ) {
            await fbSignOut(auth);
            throw new Error('El perfil de acceso no coincide con la ficha funcionaria.');
          }
        }
        return matchedStaff;
      } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new Error('No fue posible iniciar sesión.');
      }
    }

    const staffList = getLocalData<Staff>('staff', MOCK_STAFF);
    const cleanInputRut = emailOrRut.replace(/[^0-9kK]/g, '').toUpperCase();
    const matchedStaff = staffList.find(st =>
      isEmailInput
        ? st.email.toLowerCase().trim() === inputCleaned
        : st.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanInputRut
    );
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
    if (!matchedStaff || !demoPassword || checkPassword !== demoPassword) {
      throw new Error('Credenciales de demostración incorrectas.');
    }
    return matchedStaff;
  },

  async signOut(): Promise<void> {
    if (!useMock && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error(err);
      }
    }
  },

  async createSurveyAnswer(ans: Omit<SurveyAnswer, 'id'>): Promise<SurveyAnswer> {
    const newAns: SurveyAnswer = {
      ...ans,
      id: `ans-${Date.now()}`
    };

    if (!useMock) {
      try {
        await setDoc(doc(db, 'survey_answers', newAns.id), newAns);
      } catch (err) {
        console.error("Firestore save survey answer failed:", err);
      }
    }

    const all = getLocalData<SurveyAnswer>('survey_answers', []);
    all.push(newAns);
    saveLocalData('survey_answers', all);
    return newAns;
  },

  async createSurveyAccess(
    surveyId: string,
    school: string,
    grade: string,
    students: Student[],
    createdBy: string
  ): Promise<SurveyAccess> {
    const token = crypto.randomUUID();
    const access: SurveyAccess = {
      id: token,
      surveyId,
      school,
      grade,
      createdBy,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      participants: students
        .filter(student => student.school === school && student.grade === grade)
        .map(({ id, firstName, lastName }) => ({ id, firstName, lastName }))
    };
    if (!useMock) {
      await setDoc(doc(db, 'survey_access', token), access);
      return access;
    }
    const all = getLocalData<SurveyAccess>('survey_access', []);
    all.push(access);
    saveLocalData('survey_access', all);
    return access;
  },

  async getSurveyAccess(token: string): Promise<SurveyAccess> {
    if (!useMock) {
      const snap = await getDoc(doc(db, 'survey_access', token));
      if (!snap.exists()) throw new Error('Enlace de cuestionario inválido.');
      const access = { id: snap.id, ...snap.data() } as SurveyAccess;
      if (access.expiresAt <= Date.now()) throw new Error('El enlace de cuestionario expiró.');
      return access;
    }
    const access = getLocalData<SurveyAccess>('survey_access', []).find(item => item.id === token);
    if (!access || access.expiresAt <= Date.now()) throw new Error('Enlace de cuestionario inválido o expirado.');
    return access;
  },

  async getSurveyAnswers(surveyId: string, school: string, grade: string): Promise<SurveyAnswer[]> {
    if (!useMock) {
      try {
        const q = query(
          collection(db, 'survey_answers'),
          where('surveyId', '==', surveyId),
          where('school', '==', school),
          where('grade', '==', grade)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SurveyAnswer));
      } catch (err) {
        console.error("Firestore error loading survey answers:", err);
      }
    }
    const all = getLocalData<SurveyAnswer>('survey_answers', []);
    return all.filter(a => a.surveyId === surveyId && a.school === school && a.grade === grade);
  },

  // --- MANAGEMENT OBJECTIVES CRUD ---
  async getManagementObjectives(school: string): Promise<ManagementObjective[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'objectives'), where('school', '==', school));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ManagementObjective));
      } catch (err) {
        console.error("Firestore error loading objectives:", err);
      }
    }
    const all = getLocalData<ManagementObjective>('objectives', INITIAL_OBJECTIVES);
    return all.filter(o => o.school === school);
  },

  async createManagementObjective(obj: Omit<ManagementObjective, 'id' | 'createdAt'>): Promise<ManagementObjective> {
    const newObj: ManagementObjective = {
      ...obj,
      id: `obj-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'objectives', newObj.id), newObj);
      } catch (err) {
        console.error("Firestore create objective failed:", err);
      }
    }
    const all = getLocalData<ManagementObjective>('objectives', INITIAL_OBJECTIVES);
    all.push(newObj);
    saveLocalData('objectives', all);
    return newObj;
  },

  async updateManagementObjective(id: string, data: Partial<ManagementObjective>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'objectives', id), data);
      } catch (err) {
        console.error("Firestore update objective failed:", err);
      }
    }
    const all = getLocalData<ManagementObjective>('objectives', INITIAL_OBJECTIVES);
    const updated = all.map(o => o.id === id ? { ...o, ...data } : o);
    saveLocalData('objectives', updated);
  },

  async deleteManagementObjective(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'objectives', id));
      } catch (err) {
        console.error("Firestore delete objective failed:", err);
      }
    }
    const all = getLocalData<ManagementObjective>('objectives', INITIAL_OBJECTIVES);
    const filtered = all.filter(o => o.id !== id);
    saveLocalData('objectives', filtered);
  },

  // --- EXTERNAL REFERRALS CRUD ---
  async getExternalReferrals(school: string): Promise<ExternalReferral[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'referrals'), where('school', '==', school));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExternalReferral));
      } catch (err) {
        console.error("Firestore error loading referrals:", err);
      }
    }
    const all = getLocalData<ExternalReferral>('referrals', INITIAL_REFERRALS);
    return all.filter(r => r.school === school);
  },

  async createExternalReferral(ref: Omit<ExternalReferral, 'id' | 'createdAt'>): Promise<ExternalReferral> {
    const newRef: ExternalReferral = {
      ...ref,
      id: `ref-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock) {
      try {
        await setDoc(doc(db, 'referrals', newRef.id), newRef);
      } catch (err) {
        console.error("Firestore create referral failed:", err);
      }
    }
    const all = getLocalData<ExternalReferral>('referrals', INITIAL_REFERRALS);
    all.push(newRef);
    saveLocalData('referrals', all);
    return newRef;
  },

  async updateExternalReferral(id: string, data: Partial<ExternalReferral>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'referrals', id), data);
      } catch (err) {
        console.error("Firestore update referral failed:", err);
      }
    }
    const all = getLocalData<ExternalReferral>('referrals', INITIAL_REFERRALS);
    const updated = all.map(r => r.id === id ? { ...r, ...data } : r);
    saveLocalData('referrals', updated);
  },

  async deleteExternalReferral(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'referrals', id));
      } catch (err) {
        console.error("Firestore delete referral failed:", err);
      }
    }
    const all = getLocalData<ExternalReferral>('referrals', INITIAL_REFERRALS);
    const filtered = all.filter(r => r.id !== id);
    saveLocalData('referrals', filtered);
  },

  // --- PARENT SUMMONS ---
  async getParentSummons(school: SchoolType): Promise<ParentSummons[]> {
    if (!useMock && db) {
      try {
        const q = query(collection(db, 'parent_summons'), where('school', '==', school));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ParentSummons));
      } catch (err) {
        console.error("Firestore error loading parent summons:", err);
      }
    }
    const all = getLocalData<ParentSummons>('parent_summons', []);
    return all.filter(s => s.school === school);
  },

  async createParentSummons(summons: Omit<ParentSummons, 'id' | 'createdAt'>): Promise<ParentSummons> {
    const newSummons: ParentSummons = {
      ...summons,
      id: `summons-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (!useMock && db) {
      try {
        await setDoc(doc(db, 'parent_summons', newSummons.id), newSummons);
      } catch (err) {
        console.error("Firestore summons create failed:", err);
      }
    }
    const all = getLocalData<ParentSummons>('parent_summons', []);
    all.push(newSummons);
    saveLocalData('parent_summons', all);
    return newSummons;
  },

  async updateParentSummons(id: string, updates: Partial<ParentSummons>): Promise<void> {
    if (!useMock && db) {
      try {
        await updateDoc(doc(db, 'parent_summons', id), updates);
      } catch (err) {
        console.error("Firestore summons update failed:", err);
      }
    }
    const all = getLocalData<ParentSummons>('parent_summons', []);
    const idx = all.findIndex(s => s.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('parent_summons', all);
    }
  },

  async deleteParentSummons(id: string): Promise<void> {
    if (!useMock && db) {
      try {
        await deleteDoc(doc(db, 'parent_summons', id));
      } catch (err) {
        console.error("Firestore summons delete failed:", err);
      }
    }
    const all = getLocalData<ParentSummons>('parent_summons', []);
    const filtered = all.filter(s => s.id !== id);
    saveLocalData('parent_summons', filtered);
  },

  async seedSanNicolasDemoData(actor: Staff): Promise<number> {
    const school = 'Colegio San Nicolás';
    const now = new Date().toISOString();
    const students: Student[] = [
      { id: '19.230.450-K', rut: '19.230.450-K', firstName: 'Diego', lastName: 'Valenzuela Jara', school, grade: '1° Medio A', conductScore: 88, email: 'diego.valenzuela@sannicolas.cl', parentName: 'Claudia Jara', parentPhone: '+56 9 6111 2201' },
      { id: '20.114.892-2', rut: '20.114.892-2', firstName: 'Martina', lastName: 'Soto Villagrán', school, grade: '1° Medio A', conductScore: 96, email: 'martina.soto@sannicolas.cl', parentName: 'Marcela Villagrán', parentPhone: '+56 9 6222 3402' },
      { id: '20.455.918-4', rut: '20.455.918-4', firstName: 'Sebastián', lastName: 'Pérez Muñoz', school, grade: '2° Medio B', conductScore: 70, email: 'sebastian.perez@sannicolas.cl', parentName: 'Carolina Muñoz', parentPhone: '+56 9 6333 4503' },
      { id: '21.002.394-1', rut: '21.002.394-1', firstName: 'Valentina', lastName: 'Rojas Gatica', school, grade: '2° Medio B', conductScore: 82, email: 'valentina.rojas@sannicolas.cl', parentName: 'Patricio Rojas', parentPhone: '+56 9 6444 5604' },
      { id: '22.333.410-7', rut: '22.333.410-7', firstName: 'Emilia', lastName: 'Navarro Leiva', school, grade: '2° Medio B', conductScore: 94, email: 'emilia.navarro@sannicolas.cl', parentName: 'Daniela Leiva', parentPhone: '+56 9 6777 8107' },
      { id: '22.444.521-2', rut: '22.444.521-2', firstName: 'Mateo', lastName: 'Araya Contreras', school, grade: '2° Medio B', conductScore: 76, email: 'mateo.araya@sannicolas.cl', parentName: 'Paula Contreras', parentPhone: '+56 9 6888 9208' },
      { id: '22.555.632-8', rut: '22.555.632-8', firstName: 'Lucas', lastName: 'Sepúlveda Ortiz', school, grade: '2° Medio B', conductScore: 86, email: 'lucas.sepulveda@sannicolas.cl', parentName: 'Rodrigo Sepúlveda', parentPhone: '+56 9 6999 1309' },
      { id: '22.666.743-3', rut: '22.666.743-3', firstName: 'Isidora', lastName: 'Mella Sanhueza', school, grade: '2° Medio B', conductScore: 91, email: 'isidora.mella@sannicolas.cl', parentName: 'Natalia Sanhueza', parentPhone: '+56 9 7000 2410' },
      { id: '22.777.854-9', rut: '22.777.854-9', firstName: 'Tomás', lastName: 'Carrasco Peña', school, grade: '2° Medio B', conductScore: 79, email: 'tomas.carrasco@sannicolas.cl', parentName: 'Mónica Peña', parentPhone: '+56 9 7111 3511' },
      { id: '22.888.965-4', rut: '22.888.965-4', firstName: 'Fernanda', lastName: 'Lagos Vidal', school, grade: '2° Medio B', conductScore: 89, email: 'fernanda.lagos@sannicolas.cl', parentName: 'Cristian Lagos', parentPhone: '+56 9 7222 4612' },
      { id: '21.564.912-3', rut: '21.564.912-3', firstName: 'Benjamín', lastName: 'Cortés Salinas', school, grade: '3° Medio A', conductScore: 55, email: 'benjamin.cortes@sannicolas.cl', parentName: 'Andrea Salinas', parentPhone: '+56 9 6555 6705' },
      { id: '22.122.344-9', rut: '22.122.344-9', firstName: 'Antonia', lastName: 'Fuentes Riquelme', school, grade: '3° Medio A', conductScore: 100, email: 'antonia.fuentes@sannicolas.cl', parentName: 'Jorge Fuentes', parentPhone: '+56 9 6666 7806' }
    ];
    const additionalCourseNames = [
      ['Agustina', 'Morales Silva'], ['Vicente', 'Contreras Díaz'], ['Josefa', 'Henríquez Soto'],
      ['Joaquín', 'Salazar Muñoz'], ['Amanda', 'Vega Arriagada'], ['Martín', 'Cáceres Rojas'],
      ['Florencia', 'Bustamante Reyes'], ['Gaspar', 'Sandoval Leiva'], ['Trinidad', 'Figueroa Peña'],
      ['Benicio', 'Espinoza Torres'], ['Catalina', 'Pino Valdés'], ['Máximo', 'González Vera'],
      ['Renata', 'Alarcón Medina'], ['Santiago', 'Parra Fuentes'], ['Julieta', 'Navarrete Castro'],
      ['Alonso', 'Rivera Saavedra'], ['Dominga', 'Vargas Cid'], ['Facundo', 'Campos Ulloa'],
      ['Antonella', 'Bravo Tapia'], ['Bautista', 'Méndez Jara'], ['Maite', 'Cifuentes Lagos'],
      ['León', 'Miranda Ortiz'], ['Rafaela', 'Godoy Palma'], ['Dante', 'Molina Araya'],
      ['Sofía', 'Valdés Carrasco'], ['Nicolás', 'Reyes Sanhueza'], ['Laura', 'Silva Sepúlveda']
    ];
    additionalCourseNames.forEach(([firstName, lastName], index) => {
      const serial = String(index + 1).padStart(3, '0');
      const rut = `30.000.${serial}-${(index + 1) % 10}`;
      students.push({
        id: rut,
        rut,
        firstName,
        lastName,
        school,
        grade: '2° Medio B',
        conductScore: 72 + ((index * 7) % 27),
        email: `${firstName.toLowerCase()}.${lastName.split(' ')[0].toLowerCase()}${index + 1}@sannicolas.cl`,
        parentName: `Apoderado de ${firstName}`,
        parentPhone: `+56 9 73${String(index + 1).padStart(2, '0')} 55${String(index + 10).padStart(2, '0')}`
      });
    });
    const records: Array<{ collectionName: string; id: string; data: Record<string, unknown> }> = [
      ...students.map(student => ({ collectionName: 'students', id: student.id, data: student as unknown as Record<string, unknown> })),
      {
        collectionName: 'coexistence_cases', id: 'demo-sn-case-positive', data: {
          id: 'demo-sn-case-positive', studentId: '22.122.344-9', studentName: 'Antonia Fuentes Riquelme',
          school, date: '2026-07-22', type: 'Positiva', description: 'Lidera una iniciativa de bienvenida e integración para estudiantes nuevos del nivel.',
          reporterId: '12.441.902-8', reporterName: 'Carlos Mendoza Allende', protocolActivated: false,
          referredToPsychosocial: false, actionPlan: 'Reconocimiento en consejo de curso y registro de la acción como práctica positiva.',
          commitments: 'Continuar apoyando actividades de buen trato.', status: 'Resuelto', createdAt: '2026-07-22T13:15:00.000Z'
        }
      },
      {
        collectionName: 'coexistence_cases', id: 'demo-sn-case-followup', data: {
          id: 'demo-sn-case-followup', studentId: '20.455.918-4', studentName: 'Sebastián Pérez Muñoz',
          school, date: '2026-07-18', type: 'Grave', description: 'Conflicto verbal reiterado durante trabajo colaborativo, con desregulación emocional.',
          reporterId: '16.441.229-3', reporterName: 'Patricia Venegas Soto', protocolActivated: true,
          protocolName: 'Violencia Escolar', referredToPsychosocial: true,
          actionPlan: 'Entrevista individual, citación de apoderado y acompañamiento semanal durante un mes.',
          commitments: 'Aplicar pausa de autorregulación y participar en mediación.', status: 'En Proceso', createdAt: '2026-07-18T10:30:00.000Z'
        }
      },
      {
        collectionName: 'activities', id: 'demo-sn-activity-buentrato', data: {
          id: 'demo-sn-activity-buentrato', title: 'Taller de buen trato y resolución colaborativa',
          date: '2026-08-05', speaker: 'María Paz Toledo Bascuñán', location: 'Biblioteca',
          status: 'Programada', audienceType: 'Masiva', targetGrades: ['1° Medio A', '2° Medio B'],
          summary: 'Actividad preventiva basada en comunicación asertiva, empatía y reparación.', school, createdAt: now
        }
      },
      {
        collectionName: 'activities', id: 'demo-sn-activity-ciber', data: {
          id: 'demo-sn-activity-ciber', title: 'Prevención del ciberacoso y ciudadanía digital',
          date: '2026-07-10', speaker: 'Equipo de Convivencia Educativa', location: 'Sala audiovisual',
          status: 'Realizada', audienceType: 'Focalizada', targetStudentIds: ['20.455.918-4', '21.002.394-1', '21.564.912-3'],
          summary: 'Se revisaron rutas de ayuda, privacidad digital y rol de observadores activos.', school, createdAt: now
        }
      },
      {
        collectionName: 'psychosocial_cases', id: 'demo-sn-psy-sebastian', data: {
          id: 'demo-sn-psy-sebastian', studentId: '20.455.918-4', studentName: 'Sebastián Pérez Muñoz',
          grade: '2° Medio B', school, status: 'En Intervención', referredDate: '2026-07-18',
          reason: 'Derivación desde Convivencia Educativa por desregulación emocional y conflicto reiterado.',
          riskLevel: 'Medio', createdAt: '2026-07-18T11:00:00.000Z'
        }
      },
      {
        collectionName: 'clinical_sessions', id: 'demo-sn-session-1', data: {
          id: 'demo-sn-session-1', caseId: 'demo-sn-psy-sebastian', date: '2026-07-21',
          contactType: 'Estudiante', notes: 'Entrevista de acogida. Se identifican detonantes y recursos personales de regulación.',
          agreements: 'Registrar emociones durante una semana y solicitar pausa cuando detecte escalada.',
          professionalId: '14.230.119-K', professionalName: 'María Paz Toledo Bascuñán',
          createdAt: '2026-07-21T12:00:00.000Z'
        }
      },
      {
        collectionName: 'rice_protocols', id: 'demo-sn-rice-1', data: {
          id: 'demo-sn-rice-1', caseId: 'demo-sn-case-followup', studentId: '20.455.918-4',
          studentName: 'Sebastián Pérez Muñoz', grade: '2° Medio B', school,
          protocolType: 'Violencia Escolar', status: 'Abierto', startedAt: '2026-07-18',
          dueDate: '2026-08-01', createdAt: '2026-07-18T10:45:00.000Z',
          steps: [
            { id: 'detection', name: 'Detección y Registro', description: 'Registro del incidente y medidas inmediatas.', status: 'Completado', completedAt: '2026-07-18', completedBy: 'Carlos Mendoza Allende', notes: 'Se separa a los involucrados y se brinda contención.' },
            { id: 'notification', name: 'Notificación', description: 'Comunicación con apoderados.', status: 'Completado', completedAt: '2026-07-18', completedBy: 'Carlos Mendoza Allende' },
            { id: 'investigation', name: 'Investigación', description: 'Entrevistas y recopilación de antecedentes.', status: 'En Proceso' },
            { id: 'resolution', name: 'Resolución', description: 'Medidas formativas y disciplinarias.', status: 'Pendiente' },
            { id: 'followup', name: 'Seguimiento', description: 'Monitoreo y cierre.', status: 'Pendiente' }
          ],
          measures: [{ id: 'demo-measure-1', description: 'Acompañamiento en recreos y entrevista semanal.', responsibleName: 'María Paz Toledo', startDate: '2026-07-21', endDate: '2026-08-14', complianceLog: { '2026-07-21': true, '2026-07-22': true } }]
        }
      },
      {
        collectionName: 'objectives', id: 'demo-sn-objective-1', data: {
          id: 'demo-sn-objective-1', title: 'Fortalecer el buen trato y la participación estudiantil',
          category: 'Prevención', target: '1° a 3° Medio',
          description: 'Implementar actividades preventivas y espacios de participación para mejorar el clima de aula.',
          status: 'En Proceso', associatedActivityIds: ['demo-sn-activity-buentrato', 'demo-sn-activity-ciber'],
          school, createdAt: '2026-03-05T09:00:00.000Z'
        }
      },
      {
        collectionName: 'referrals', id: 'demo-sn-referral-1', data: {
          id: 'demo-sn-referral-1', studentId: '21.564.912-3', studentName: 'Benjamín Cortés Salinas',
          grade: '3° Medio A', school, institution: 'CESFAM',
          reason: 'Solicitud de evaluación complementaria por síntomas ansiosos persistentes.',
          previousMeasures: 'Entrevistas con estudiante y apoderado, seguimiento de profesor jefe y apoyo psicosocial.',
          status: 'En Revisión', sentDate: '2026-07-15', folioNumber: 'SN-CESFAM-2026-014',
          observations: 'Familia informada y de acuerdo con la derivación.', professionalId: '14.230.119-K',
          professionalName: 'María Paz Toledo Bascuñán', createdAt: '2026-07-15T10:00:00.000Z'
        }
      },
      {
        collectionName: 'parent_summons', id: 'demo-sn-summons-1', data: {
          id: 'demo-sn-summons-1', studentId: '20.455.918-4', studentName: 'Sebastián Pérez Muñoz',
          grade: '2° Medio B', apoderadoName: 'Carolina Muñoz', interviewerId: '12.441.902-8',
          interviewerName: 'Carlos Mendoza Allende', interviewerRole: 'Convivencia', date: '2026-07-24',
          time: '09:30', location: 'Oficina de Convivencia Educativa',
          reason: 'Revisión de medidas de apoyo y acuerdos de acompañamiento.', status: 'Asistió',
          notes: 'Apoderada acuerda reforzar rutinas y mantener comunicación semanal.', school, createdAt: now
        }
      },
      {
        collectionName: 'meetings', id: 'demo-sn-meeting-1', data: {
          id: 'demo-sn-meeting-1', title: 'Consejo de seguimiento de casos',
          date: '2026-08-03', time: '16:00', type: 'Reunión Técnica',
          description: 'Revisión interdisciplinaria de apoyos, plazos RICE y derivaciones activas.',
          school, createdAt: now
        }
      }
    ];
    const sociogramStudents = students.filter(student => student.grade === '2° Medio B');
    const surveyIds = [
      'dia-clima-aula',
      'dia-bienestar-autoestima',
      'dia-relaciones-bullying',
      'dia-vinculo-familia',
      'convivencia-rice',
      'resolucion-conflictos'
    ];
    surveyIds.forEach((surveyId, surveyIndex) => {
      const accessToken = surveyId === 'dia-clima-aula'
        ? 'demo-sn-diagnostic-access'
        : `demo-sn-${surveyId}-access`;
      records.push({
        collectionName: 'survey_access', id: accessToken, data: {
          id: accessToken, surveyId, school, grade: '2° Medio B',
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, createdBy: actor.id,
          participants: sociogramStudents.map(({ id, firstName, lastName }) => ({ id, firstName, lastName }))
        }
      });

      sociogramStudents.forEach((student, studentIndex) => {
        const normalizedValues = Array.from({ length: 10 }, (_, questionIndex) => {
          const riskBase = studentIndex < 4 ? 2 : studentIndex < 10 ? 3 : studentIndex < 25 ? 4 : 5;
          const variation = ((studentIndex + questionIndex * 2 + surveyIndex) % 3) - 1;
          return Math.max(1, Math.min(5, riskBase + variation));
        });
        const rawValues = normalizedValues.map((value, questionIndex) =>
          surveyId === 'dia-relaciones-bullying' && questionIndex === 4 ? 6 - value : value
        );
        const score = Number((normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length).toFixed(1));
        const riskStatus = score < 2.5 ? 'Crítico' : score < 3.2 ? 'Alto' : score < 4 ? 'Medio' : 'Bajo';
        const answerId = surveyId === 'dia-clima-aula'
          ? `demo-sn-answer-${studentIndex + 1}`
          : `demo-sn-${surveyId}-answer-${studentIndex + 1}`;
        records.push({
          collectionName: 'survey_answers', id: answerId, data: {
            id: answerId, accessToken, surveyId, studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`, grade: '2° Medio B', school,
            responses: Object.fromEntries(rawValues.map((value, valueIndex) => [`q${valueIndex + 1}`, value])),
            score, riskStatus, submittedAt: now
          }
        });
      });
    });

    const sociogramAccessToken = 'demo-sn-sociogram-access';
    records.push({
      collectionName: 'survey_access', id: sociogramAccessToken, data: {
        id: sociogramAccessToken, surveyId: 'dia-sociograma', school, grade: '2° Medio B',
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, createdBy: actor.id,
        participants: sociogramStudents.map(({ id, firstName, lastName }) => ({ id, firstName, lastName }))
      }
    });
    sociogramStudents.forEach((student, index) => {
      const clusterStart = Math.floor(index / 7) * 7;
      const clusterSize = Math.min(7, sociogramStudents.length - clusterStart);
      const clusterMember = (offset: number) => sociogramStudents[clusterStart + ((index - clusterStart + offset + clusterSize) % clusterSize)].id;
      const rejectedStudentId = sociogramStudents[34].id;
      const isolatedStudentId = sociogramStudents[33].id;
      const clusterCandidates = sociogramStudents
        .slice(clusterStart, clusterStart + clusterSize)
        .map(candidate => candidate.id)
        .filter(id => id !== student.id && id !== isolatedStudentId);
      const buildPositiveChoices = (direction: -1 | 1) => {
        const choices = [...new Set([
          sociogramStudents[clusterStart].id,
          sociogramStudents[Math.min(clusterStart + 1, sociogramStudents.length - 1)].id,
          clusterMember(direction)
        ])].filter(id => id !== student.id && id !== isolatedStudentId);
        clusterCandidates.forEach(id => {
          if (choices.length < 3 && !choices.includes(id)) choices.push(id);
        });
        return choices;
      };
      const workChoices = buildPositiveChoices(1);
      const playChoices = buildPositiveChoices(-1);
      const primaryRejected = rejectedStudentId === student.id ? sociogramStudents[32].id : rejectedStudentId;
      const leaderIndex = Math.min(clusterStart, sociogramStudents.length - 1);
      const leaderId = sociogramStudents[leaderIndex].id === student.id
        ? sociogramStudents[Math.min(leaderIndex + 1, sociogramStudents.length - 1)].id
        : sociogramStudents[leaderIndex].id;
      const responses = {
        q1: workChoices.join(','),
        q2: primaryRejected,
        q3: playChoices.join(','),
        q4: primaryRejected,
        q5: leaderId,
        q6: isolatedStudentId === student.id ? sociogramStudents[32].id : isolatedStudentId
      };
      const answerId = `demo-sn-sociogram-answer-${index + 1}`;
      records.push({
        collectionName: 'survey_answers', id: answerId, data: {
          id: answerId, accessToken: sociogramAccessToken,
          surveyId: 'dia-sociograma', studentId: student.id, studentName: `${student.firstName} ${student.lastName}`,
          grade: '2° Medio B', school, responses, score: 0,
          riskStatus: 'Bajo', submittedAt: now
        }
      });
    });
    records.push({
      collectionName: 'messages', id: 'demo-sn-message-admin', data: {
        id: 'demo-sn-message-admin', senderId: actor.rut, senderName: `${actor.firstName} ${actor.lastName}`,
        recipientId: '12.441.902-8', recipientName: 'Carlos Mendoza Allende', school,
        message: 'Mensaje demostrativo: revisar avances del plan preventivo y los acuerdos de seguimiento.',
        createdAt: now
      }
    });

    if (!useMock && db) {
      // Messages are intentionally immutable in Firestore. Keep the demo load
      // idempotent by preserving the existing sample message on subsequent runs.
      const writableRecords = [];
      for (const record of records) {
        if (record.collectionName === 'messages') {
          const existingMessage = await getDoc(doc(db, record.collectionName, record.id));
          if (existingMessage.exists()) continue;
        }
        writableRecords.push(record);
      }

      for (let offset = 0; offset < writableRecords.length; offset += 450) {
        const batch = writeBatch(db);
        writableRecords.slice(offset, offset + 450).forEach(record => {
          batch.set(doc(db, record.collectionName, record.id), record.data);
        });
        await batch.commit();
      }
      invalidateStudentCache(school);
      return records.length;
    }

    throw new Error('La carga demostrativa está disponible únicamente con Firebase conectado.');
  },

  async clearSchoolEnrollmentData(school: SchoolType): Promise<{ deleted: number; updatedActivities: number }> {
    if (!school.trim()) throw new Error('Debe seleccionar un establecimiento.');

    if (!useMock && db) {
      const schoolCollections = [
        'students',
        'coexistence_cases',
        'psychosocial_cases',
        'survey_answers',
        'survey_access',
        'rice_protocols',
        'referrals',
        'parent_summons'
      ];

      const snapshots = await Promise.all(
        schoolCollections.map(collectionName =>
          getDocs(query(collection(db, collectionName), where('school', '==', school)))
        )
      );

      const psychosocialSnapshot = snapshots[schoolCollections.indexOf('psychosocial_cases')];
      const caseIds = psychosocialSnapshot.docs.map(caseDoc => caseDoc.id);
      const sessionDocs = [];
      for (let offset = 0; offset < caseIds.length; offset += 30) {
        const ids = caseIds.slice(offset, offset + 30);
        if (ids.length === 0) continue;
        const sessionsSnapshot = await getDocs(
          query(collection(db, 'clinical_sessions'), where('caseId', 'in', ids))
        );
        sessionDocs.push(...sessionsSnapshot.docs);
      }

      const activitiesSnapshot = await getDocs(
        query(collection(db, 'activities'), where('school', '==', school))
      );
      const activityUpdates = activitiesSnapshot.docs
        .filter(activityDoc => {
          const targetIds = activityDoc.data().targetStudentIds;
          return Array.isArray(targetIds) && targetIds.length > 0;
        });

      const deleteRefs = [
        ...snapshots.flatMap(snapshot => snapshot.docs.map(item => item.ref)),
        ...sessionDocs.map(item => item.ref)
      ];

      const operations: Array<{ type: 'delete'; ref: typeof deleteRefs[number] } | {
        type: 'update';
        ref: typeof deleteRefs[number];
      }> = [
        ...deleteRefs.map(ref => ({ type: 'delete' as const, ref })),
        ...activityUpdates.map(item => ({ type: 'update' as const, ref: item.ref }))
      ];

      for (let offset = 0; offset < operations.length; offset += 450) {
        const batch = writeBatch(db);
        operations.slice(offset, offset + 450).forEach(operation => {
          if (operation.type === 'delete') batch.delete(operation.ref);
          else batch.update(operation.ref, { targetStudentIds: [] });
        });
        await batch.commit();
      }

      invalidateStudentCache(school);
      return { deleted: deleteRefs.length, updatedActivities: activityUpdates.length };
    }

    const students = getLocalData<Student>('students', MOCK_STUDENTS);
    const schoolStudentIds = new Set(students.filter(student => student.school === school).map(student => student.id));
    const psychosocial = getLocalData<PsychosocialCase>('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    const schoolCaseIds = new Set(psychosocial.filter(item => item.school === school).map(item => item.id));
    let deleted = students.filter(student => student.school === school).length;

    const filterSchoolData = <T extends { school: SchoolType }>(key: string, initial: T[]) => {
      const all = getLocalData<T>(key, initial);
      deleted += all.filter(item => item.school === school).length;
      saveLocalData(key, all.filter(item => item.school !== school));
    };

    saveLocalData('students', students.filter(student => student.school !== school));
    filterSchoolData('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    filterSchoolData('psychosocial_cases', INITIAL_PSYCHOSOCIAL_CASES);
    filterSchoolData<SurveyAnswer>('survey_answers', []);
    filterSchoolData<SurveyAccess>('survey_access', []);
    filterSchoolData('rice_protocols', INITIAL_RICE_PROTOCOLS);
    filterSchoolData('referrals', INITIAL_REFERRALS);
    filterSchoolData<ParentSummons>('parent_summons', []);

    const sessions = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    deleted += sessions.filter(session => schoolCaseIds.has(session.caseId)).length;
    saveLocalData('clinical_sessions', sessions.filter(session => !schoolCaseIds.has(session.caseId)));

    const activities = getLocalData<Activity>('activities', INITIAL_ACTIVITIES);
    let updatedActivities = 0;
    const cleanActivities = activities.map(activity => {
      if (activity.school !== school || !activity.targetStudentIds?.some(id => schoolStudentIds.has(id))) {
        return activity;
      }
      updatedActivities++;
      return { ...activity, targetStudentIds: [] };
    });
    saveLocalData('activities', cleanActivities);
    invalidateStudentCache(school);
    return { deleted, updatedActivities };
  },

  async clearAllData(): Promise<void> {
    // Clear LocalStorage
    localStorage.removeItem('conexia_schools');
    localStorage.removeItem('conexia_students');
    localStorage.removeItem('conexia_staff');
    localStorage.removeItem('conexia_coexistence_cases');
    localStorage.removeItem('conexia_activities');
    localStorage.removeItem('conexia_psychosocial_cases');
    localStorage.removeItem('conexia_clinical_sessions');
    localStorage.removeItem('conexia_messages');
    localStorage.removeItem('conexia_meetings');
    localStorage.removeItem('conexia_rice_protocols');
    localStorage.removeItem('conexia_objectives');
    localStorage.removeItem('conexia_referrals');
    localStorage.removeItem('conexia_parent_summons');

    const defaultAdmin: Staff = {
      id: "admin-2",
      rut: "8.888.888-8",
      firstName: "Francisco Javier",
      lastName: "Vidal",
      school: "Colegio BioBío",
      role: "Administrador",
      email: "franciscojavier.vidal.p@gmail.com"
    };

    // Re-seed admin locally
    const newStaffList = [defaultAdmin];
    saveLocalData('staff', newStaffList);

    if (!useMock && db) {
      try {
        console.log("Limpiando colecciones de Firestore...");
        const collections = ['schools', 'students', 'staff', 'coexistence_cases', 'activities', 'psychosocial_cases', 'clinical_sessions', 'messages', 'meetings', 'survey_answers', 'rice_protocols', 'objectives', 'referrals', 'parent_summons'];
        for (const colName of collections) {
          const snap = await getDocs(collection(db, colName));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, colName, d.id));
          }
        }
        // Re-create default admin in Firestore
        await setDoc(doc(db, 'staff', defaultAdmin.id), defaultAdmin);
        console.log("Firestore limpiado y administrador restablecido.");
      } catch (err) {
        console.error("Error limpiando base de datos Firestore:", err);
        throw err;
      }
    }
  }
};
