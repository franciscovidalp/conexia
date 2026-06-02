import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  limit, 
  startAfter, 
  orderBy,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut 
} from 'firebase/auth';
import type { Student, Staff, CoexistenceCase, Activity, PsychosocialCase, ClinicalSession, SchoolType, PsychosocialStatus, School } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "conexia-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "conexia-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "conexia-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

let useMock = true;
let db: any = null;
let auth: any = null;

if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "mock-api-key") {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    useMock = false;
    console.log("Firebase conectado.");
  } catch (error) {
    console.warn("Usando Mock Engine:", error);
    useMock = true;
  }
} else {
  useMock = true;
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
  { id: "10.992.812-4", rut: "10.992.812-4", firstName: "Sofía", lastName: "Castro Ruiz", school: "Colegio San Nicolás", role: "Director", email: "sofia.castro@sannicolas.cl" },
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

const getLocalData = <T>(key: string, initial: T[]): T[] => {
  const data = localStorage.getItem(`conexia_${key}`);
  if (!data) {
    localStorage.setItem(`conexia_${key}`, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(`conexia_${key}`, JSON.stringify(data));
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
      
      console.log("Firestore successfully seeded with schools, staff, students, and cases!");
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
  async getStudents(school: SchoolType): Promise<Student[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'students'), where('school', '==', school));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      } catch (err) {
        console.error("Firestore error loading students:", err);
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
      // Background sync to Firestore
      try {
        for (const row of csvRows) {
          if (!row.rut) continue;
          const rutKey = row.rut.trim();
          await setDoc(doc(db, 'students', rutKey), {
            id: rutKey,
            rut: rutKey,
            firstName: row.nombre.trim(),
            lastName: row.apellido.trim(),
            school: schoolName,
            grade: row.curso.trim(),
            conductScore: 100,
            email: row.email ? row.email.trim() : ''
          });
        }
      } catch (e) {
        console.warn("Could not sync CSV to Firestore:", e);
      }
    }

    return count;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'students', id), updates);
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
        let q = query(
          collection(db, 'coexistence_cases'),
          where('school', '==', school),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        if (lastDocSnap) {
          q = query(
            collection(db, 'coexistence_cases'),
            where('school', '==', school),
            orderBy('createdAt', 'desc'),
            startAfter(lastDocSnap),
            limit(limitCount)
          );
        }
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CoexistenceCase));
        const lastSnapshot = snap.docs[snap.docs.length - 1];
        
        let hasMore = false;
        if (lastSnapshot) {
          let checkQ = query(
            collection(db, 'coexistence_cases'),
            where('school', '==', school),
            orderBy('createdAt', 'desc'),
            startAfter(lastSnapshot),
            limit(1)
          );
          const checkSnap = await getDocs(checkQ);
          hasMore = !checkSnap.empty;
        }
        return { data, lastDoc: lastSnapshot, hasMore };
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

    // Adjust conduct score
    const students = getLocalData<Student>('students', MOCK_STUDENTS);
    const index = students.findIndex(s => s.id === c.studentId);
    if (index !== -1) {
      let delta = 0;
      if (c.type === 'Positiva') delta = 5;
      else if (c.type === 'Leve') delta = -5;
      else if (c.type === 'Grave') delta = -15;
      else if (c.type === 'Gravísima') delta = -25;
      
      students[index].conductScore = Math.max(0, Math.min(100, students[index].conductScore + delta));
      saveLocalData('students', students);

    }

    if (c.referredToPsychosocial) {
      await this.createPsychosocialCase({
        studentId: c.studentId,
        studentName: c.studentName,
        grade: students[index]?.grade || 'N/A',
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
    if (!useMock) {
      try {
        await updateDoc(doc(db, 'coexistence_cases', id), updates);
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      saveLocalData('coexistence_cases', all);
    }
  },

  async deleteCoexistenceCase(id: string): Promise<void> {
    if (!useMock) {
      try {
        await deleteDoc(doc(db, 'coexistence_cases', id));
      } catch (e) {
        console.error(e);
      }
    }
    const all = getLocalData<CoexistenceCase>('coexistence_cases', INITIAL_COEXISTENCE_CASES);
    const filtered = all.filter(c => c.id !== id);
    saveLocalData('coexistence_cases', filtered);
  },

  // --- ACTIVITIES ---
  async getActivities(school: SchoolType): Promise<Activity[]> {
    if (!useMock) {
      try {
        const q = query(collection(db, 'activities'), where('school', '==', school), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
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
        const q = query(collection(db, 'clinical_sessions'), where('caseId', '==', caseId), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicalSession));
      } catch (err) {
        console.error(err);
      }
    }
    const all = getLocalData<ClinicalSession>('clinical_sessions', INITIAL_SESSIONS);
    return all.filter(s => s.caseId === caseId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  // --- AUTHENTICATION ---
  async signIn(emailOrRut: string, checkPassword: string): Promise<Staff> {
    const staffList = await dbService.getAllStaff();
    
    const inputCleaned = emailOrRut.trim().toLowerCase();
    const isEmailInput = inputCleaned.includes('@');
    const cleanInputRut = emailOrRut.replace(/[^0-9kK]/g, '').toUpperCase();

    // Look for user
    let matchedStaff = staffList.find(st => {
      if (isEmailInput) {
        return st.email.toLowerCase().trim() === inputCleaned;
      } else {
        const cleanStaffRut = st.rut.replace(/[^0-9kK]/g, '').toUpperCase();
        return cleanStaffRut === cleanInputRut;
      }
    });

    // Special admin registration fallback
    if (!matchedStaff && inputCleaned === 'franciscojavier.vidal.p@gmail.com') {
      matchedStaff = {
        id: "admin-2",
        rut: "8.888.888-8",
        firstName: "Francisco Javier",
        lastName: "Vidal",
        school: "Colegio BioBío",
        role: "Administrador",
        email: "franciscojavier.vidal.p@gmail.com"
      };
      
      const all = getLocalData<Staff>('staff', MOCK_STAFF);
      all.push(matchedStaff);
      saveLocalData('staff', all);
      
      if (!useMock) {
        try {
          await setDoc(doc(db, 'staff', matchedStaff.id), matchedStaff);
        } catch (e) {
          console.warn("Could not sync admin registration to Firestore:", e);
        }
      }
    }

    if (!matchedStaff) {
      throw new Error('El usuario ingresado no está registrado en el sistema.');
    }

    if (!useMock && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, matchedStaff.email, checkPassword);
        console.log("Firebase Auth success for user:", userCredential.user.email);
      } catch (err: any) {
        console.warn("Firebase Auth failed, checking local credentials fallback:", err);
        throw new Error(err.message || 'Contraseña incorrecta.');
      }
    } else {
      const normalizedPassword = checkPassword.trim();
      let isPassValid = false;

      const isAdminEmail = matchedStaff.email.toLowerCase().trim() === 'admin@colegiobiobiola.cl' || 
                           matchedStaff.email.toLowerCase().trim() === 'franciscojavier.vidal.p@gmail.com';

      if (isAdminEmail) {
        isPassValid = normalizedPassword === '04121988' || normalizedPassword === 'conexia123';
      } else {
        isPassValid = normalizedPassword === 'conexia123' || 
                      normalizedPassword === matchedStaff.rut.replace(/[^0-9kK]/g, '');
      }

      if (!isPassValid) {
        throw new Error('Contraseña incorrecta.');
      }
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

  async clearAllData(): Promise<void> {
    // Clear LocalStorage
    localStorage.removeItem('conexia_schools');
    localStorage.removeItem('conexia_students');
    localStorage.removeItem('conexia_staff');
    localStorage.removeItem('conexia_coexistence_cases');
    localStorage.removeItem('conexia_activities');
    localStorage.removeItem('conexia_psychosocial_cases');
    localStorage.removeItem('conexia_clinical_sessions');

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
        const collections = ['schools', 'students', 'staff', 'coexistence_cases', 'activities', 'psychosocial_cases', 'clinical_sessions'];
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
