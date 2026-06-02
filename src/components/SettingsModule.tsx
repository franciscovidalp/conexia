import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Building2, 
  UserPlus, 
  FileSpreadsheet, 
  Palette,
  X,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { dbService } from '../firebase';
import type { School, Student, SchoolType, Staff, UserRole } from '../types';
import toast from 'react-hot-toast';

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentBg: string;
  previewBg: string;
}

export const THEMES: ColorTheme[] = [
  { id: 'indigo', name: 'Clásico Índigo', primary: '#4f46e5', primaryHover: '#4338ca', primaryLight: '#e0e7ff', accent: '#6366f1', accentBg: '#f5f3ff', previewBg: 'bg-indigo-600' },
  { id: 'emerald', name: 'Esmeralda Vital', primary: '#059669', primaryHover: '#047857', primaryLight: '#d1fae5', accent: '#10b981', accentBg: '#f0fdf4', previewBg: 'bg-emerald-600' },
  { id: 'rose', name: 'Rosa Afectivo', primary: '#e11d48', primaryHover: '#be123c', primaryLight: '#ffe4e6', accent: '#f43f5e', accentBg: '#fff1f2', previewBg: 'bg-rose-600' },
  { id: 'amber', name: 'Ámbar Energía', primary: '#d97706', primaryHover: '#b45309', primaryLight: '#fef3c7', accent: '#f59e0b', accentBg: '#fffbeb', previewBg: 'bg-amber-500' },
  { id: 'violet', name: 'Violeta Clínico', primary: '#7c3aed', primaryHover: '#6d28d9', primaryLight: '#ede9fe', accent: '#8b5cf6', accentBg: '#faf5ff', previewBg: 'bg-violet-600' },
  { id: 'blue', name: 'Azul Pacífico', primary: '#2563eb', primaryHover: '#1d4ed8', primaryLight: '#dbeafe', accent: '#3b82f6', accentBg: '#eff6ff', previewBg: 'bg-blue-600' },
  { id: 'cyan', name: 'Cian Tecnológico', primary: '#0891b2', primaryHover: '#0e7490', primaryLight: '#ecfeff', accent: '#06b6d4', accentBg: '#f0fdfa', previewBg: 'bg-cyan-500' },
  { id: 'teal', name: 'Teal Bienestar', primary: '#0d9488', primaryHover: '#0f766e', primaryLight: '#ccfbf1', accent: '#14b8a6', accentBg: '#f0fdfa', previewBg: 'bg-teal-600' },
  { id: 'slate', name: 'Slate Moderno', primary: '#475569', primaryHover: '#334155', primaryLight: '#f1f5f9', accent: '#64748b', accentBg: '#f8fafc', previewBg: 'bg-slate-600' },
  { id: 'gold', name: 'Bronce Académico', primary: '#854d0e', primaryHover: '#713f12', primaryLight: '#fef9c3', accent: '#a16207', accentBg: '#fefdf0', previewBg: 'bg-yellow-800' }
];

interface SettingsModuleProps {
  activeSchool: SchoolType;
  schools: School[];
  onRefreshSchools: () => void;
  students: Student[];
  onRefreshStudents: () => void;
  activeTheme: ColorTheme;
  setActiveTheme: (theme: ColorTheme) => void;
  loggedInUser: Staff | null;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  activeSchool,
  schools,
  onRefreshSchools,
  students,
  onRefreshStudents,
  activeTheme,
  setActiveTheme,
  loggedInUser
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'schools' | 'students' | 'staff'>('themes');

  const isAdmin = loggedInUser?.role === 'Administrador';

  // Redirect non-admins if they try to access admin tabs
  useEffect(() => {
    if (!isAdmin && (activeTab === 'schools' || activeTab === 'staff')) {
      setActiveTab('themes');
    }
  }, [isAdmin, activeTab]);

  // School Form State
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolRut, setSchoolRut] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');

  // Student Form State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentRut, setStudentRut] = useState('');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Staff Form State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffRut, setStaffRut] = useState('');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Docente');
  const [staffSchool, setStaffSchool] = useState<SchoolType>('');

  // CSV parsing state
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Student search filters
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('Todos');

  const grades = Array.from(new Set(students.map(s => s.grade))).sort();

  // Load staff list
  const loadStaffList = async () => {
    try {
      const list = await dbService.getAllStaff();
      setStaffList(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStaffList();
  }, []);

  // ----------------------------------------------------
  // SCHOOL METHODS
  // ----------------------------------------------------
  const handleOpenSchoolModal = (school: School | null = null) => {
    if (school) {
      setEditingSchool(school);
      setSchoolName(school.name);
      setSchoolRut(school.rut);
      setSchoolAddress(school.address || '');
    } else {
      setEditingSchool(null);
      setSchoolName('');
      setSchoolRut('');
      setSchoolAddress('');
    }
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !schoolRut.trim()) {
      toast.error('Nombre y RUT del establecimiento son requeridos.');
      return;
    }

    try {
      if (editingSchool) {
        await dbService.updateSchool(editingSchool.id, {
          name: schoolName,
          rut: schoolRut,
          address: schoolAddress
        });
        toast.success('Establecimiento actualizado con éxito.');
      } else {
        await dbService.createSchool({
          name: schoolName,
          rut: schoolRut,
          address: schoolAddress
        });
        toast.success('Nuevo establecimiento registrado con éxito.');
      }
      setIsSchoolModalOpen(false);
      onRefreshSchools();
    } catch (e) {
      toast.error('Error al guardar establecimiento.');
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (name === 'Colegio San Nicolás' || name === 'Colegio BioBío') {
      toast.error('No se pueden eliminar los colegios base del sistema.');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar el ${name}? Se borrarán todos sus alumnos asociados.`)) {
      try {
        await dbService.deleteSchool(id);
        toast.success('Establecimiento eliminado.');
        onRefreshSchools();
      } catch (e) {
        toast.error('Error al eliminar.');
      }
    }
  };

  // ----------------------------------------------------
  // STUDENT METHODS
  // ----------------------------------------------------
  const handleOpenStudentModal = (std: Student | null = null) => {
    if (std) {
      setEditingStudent(std);
      setStudentRut(std.rut);
      setStudentFirstName(std.firstName);
      setStudentLastName(std.lastName);
      setStudentGrade(std.grade);
      setStudentEmail(std.email || '');
    } else {
      setEditingStudent(null);
      setStudentRut('');
      setStudentFirstName('');
      setStudentLastName('');
      setStudentGrade('');
      setStudentEmail('');
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentRut.trim() || !studentFirstName.trim() || !studentLastName.trim() || !studentGrade.trim()) {
      toast.error('Complete todos los campos obligatorios.');
      return;
    }

    try {
      const payload = {
        rut: studentRut.trim(),
        firstName: studentFirstName.trim(),
        lastName: studentLastName.trim(),
        school: activeSchool,
        grade: studentGrade.trim(),
        conductScore: editingStudent ? editingStudent.conductScore : 100,
        email: studentEmail.trim() || `${studentFirstName.toLowerCase()}@conexia.cl`
      };

      if (editingStudent) {
        await dbService.updateStudent(editingStudent.id, payload);
        toast.success('Ficha de estudiante modificada.');
      } else {
        await dbService.createStudent(payload);
        toast.success('Estudiante ingresado con éxito.');
      }
      setIsStudentModalOpen(false);
      onRefreshStudents();
    } catch (e) {
      toast.error('Error al guardar estudiante.');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que desea eliminar la matrícula del alumno ${name}?`)) {
      try {
        await dbService.deleteStudent(id);
        toast.success('Estudiante eliminado del sistema.');
        onRefreshStudents();
      } catch (e) {
        toast.error('Error al eliminar estudiante.');
      }
    }
  };

  // ----------------------------------------------------
  // STAFF METHODS
  // ----------------------------------------------------
  const handleOpenStaffModal = (st: Staff | null = null) => {
    if (st) {
      setEditingStaff(st);
      setStaffRut(st.rut);
      setStaffFirstName(st.firstName);
      setStaffLastName(st.lastName);
      setStaffEmail(st.email);
      setStaffRole(st.role);
      setStaffSchool(st.school);
    } else {
      setEditingStaff(null);
      setStaffRut('');
      setStaffFirstName('');
      setStaffLastName('');
      setStaffEmail('');
      setStaffRole('Docente');
      setStaffSchool(schools.length > 0 ? schools[0].name : activeSchool);
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffRut.trim() || !staffFirstName.trim() || !staffLastName.trim() || !staffEmail.trim()) {
      toast.error('Complete todos los campos del formulario.');
      return;
    }

    try {
      const payload = {
        rut: staffRut.trim(),
        firstName: staffFirstName.trim(),
        lastName: staffLastName.trim(),
        email: staffEmail.trim(),
        role: staffRole,
        school: staffSchool
      };

      if (editingStaff) {
        await dbService.updateStaff(editingStaff.id, payload);
        toast.success('Funcionario actualizado.');
      } else {
        await dbService.createStaff(payload);
        toast.success('Nuevo funcionario registrado.');
      }
      setIsStaffModalOpen(false);
      loadStaffList();
    } catch (err) {
      toast.error('Error al registrar funcionario.');
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (name === 'Administrador General' || id === 'admin-1') {
      toast.error('No se puede eliminar la cuenta del Administrador.');
      return;
    }
    if (window.confirm(`¿Seguro que desea eliminar el acceso de ${name}?`)) {
      try {
        await dbService.deleteStaff(id);
        toast.success('Cuenta de acceso eliminada.');
        loadStaffList();
      } catch (err) {
        toast.error('Error al eliminar funcionario.');
      }
    }
  };

  // ----------------------------------------------------
  // CSV FILE PARSING
  // ----------------------------------------------------
  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Seleccione un archivo CSV primero.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          toast.error('El CSV está vacío o el formato es incorrecto.');
          return;
        }

        const count = await dbService.importStudentsCSV(activeSchool, rows);
        toast.success(`Carga masiva completada: ${count} alumnos importados.`);
        setCsvFile(null);
        onRefreshStudents();
      } catch (err) {
        toast.error('Error al procesar el archivo. Verifique el formato y delimitador.');
      }
    };
    reader.readAsText(csvFile);
  };

  const parseCSVText = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(delimiter).map(v => v.trim().replace(/["']/g, ''));
      const obj: any = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      const isExcelFormat = ('run' in obj) && ('nombres' in obj);

      let rut = '';
      let nombre = '';
      let apellido = '';
      let curso = '';
      let email = '';

      if (isExcelFormat) {
        const runVal = obj['run'] || '';
        const dvVal = obj['dígito ver.'] || obj['digito ver.'] || '';
        rut = runVal ? `${runVal}-${dvVal}` : '';
        nombre = obj['nombres'] || '';
        
        const apPaterno = obj['apellido paterno'] || '';
        const apMaterno = obj['apellido materno'] || '';
        apellido = `${apPaterno} ${apMaterno}`.trim();
        
        const descGrado = obj['desc grado'] || '';
        const letraCurso = obj['letra curso'] || '';
        curso = letraCurso ? `${descGrado} ${letraCurso}` : descGrado;
        
        email = obj['email'] || '';
      } else {
        rut = obj['rut'] || '';
        nombre = obj['nombre'] || '';
        apellido = obj['apellido'] || '';
        curso = obj['curso'] || '';
        email = obj['email'] || '';
      }

      if (rut && nombre) {
        result.push({
          rut,
          nombre,
          apellido,
          curso,
          email
        });
      }
    }
    return result;
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(studentSearch.toLowerCase()) || s.rut.includes(studentSearch);
    const matchesGrade = selectedGradeFilter === 'Todos' || s.grade === selectedGradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Palette className="text-primary" />
            <span>Ajustes del Sistema</span>
          </h2>
          <p className="text-sm text-slate-500">Configuración global del diseño de Conexia, gestión de matrícula y perfiles de acceso.</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('themes')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'themes' 
              ? 'text-primary border-b-2 border-primary font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Paleta de Colores (Temas)
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'students' 
              ? 'text-primary border-b-2 border-primary font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Gestión de Matrícula (Alumnos)
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('schools')}
              className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'schools' 
                  ? 'text-primary border-b-2 border-primary font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Colegios (Establecimientos)
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'staff' 
                  ? 'text-primary border-b-2 border-primary font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              4. Control de Usuarios (Personal)
            </button>
          </>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: THEMES CONFIGURATION */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'themes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Seleccionar Paleta de Colores</h3>
            <p className="text-xs text-slate-500">Cambia la colorimetría de la interfaz SPA de inmediato. Selecciona uno de los 10 esquemas de diseño:</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {THEMES.map(theme => {
              const isSelected = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme)}
                  className={`flex flex-col items-center p-4 border rounded-2xl text-center gap-3 transition-all relative group cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary-light/10 ring-2 ring-primary' 
                      : 'border-slate-200 hover:border-slate-355 bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${theme.previewBg} shadow-md flex items-center justify-center text-white`}>
                    {isSelected && <CheckCircle size={20} />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">{theme.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">{theme.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: MATRICULA / STUDENTS LIST & CSV IMPORT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in">
          
          {/* CSV File Uploader (Only visible to Admin) */}
          {isAdmin && (
            <div className="lg:col-span-4 space-y-6">
              {/* CSV Import card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileSpreadsheet className="text-primary" size={20} />
                  <h3 className="font-bold text-sm text-slate-800">Cargar Archivo CSV</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Puedes subir el listado completo de estudiantes usando el formato de nómina del Ministerio (Excel/CSV de matrícula del Biobío) o formato simple.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] space-y-2 text-slate-650">
                  <span className="font-bold text-slate-805 block uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle size={12} className="text-primary" /> Formatos Soportados:
                  </span>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">1. Formato Nómina Ministerial (Semicolon ;):</p>
                    <p className="text-slate-500 italic pl-2">Campos requeridos: Run, Dígito Ver., Nombres, Apellido Paterno, Apellido Materno, Desc Grado, Letra Curso, Email</p>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 space-y-1">
                    <p className="font-bold text-slate-700">2. Formato Simple (Coma ,):</p>
                    <code className="block bg-slate-900 text-white rounded p-1.5 font-mono text-[9px]">
                      rut,nombre,apellido,curso,email
                    </code>
                  </div>
                </div>

                <form onSubmit={handleCSVUpload} className="space-y-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-light file:text-primary hover:file:bg-primary-light/80 cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs py-2 rounded-xl shadow-sm transition-all"
                  >
                    <Upload size={14} />
                    <span>Procesar e Importar</span>
                  </button>
                </form>
              </div>

              {/* Quick manual Add student for Admin */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <UserPlus size={18} className="text-primary" />
                  <span>Ingreso Manual</span>
                </h3>
                <p className="text-xs text-slate-500">Registra un alumno de manera manual en este establecimiento:</p>
                <button
                  onClick={() => handleOpenStudentModal()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Inscribir Alumno
                </button>
              </div>
            </div>
          )}

          {/* MATRICULATED STUDENTS LIST (8 cols if Admin, 12 if normal staff) */}
          <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">Matrícula Escolar ({activeSchool})</h3>
                <p className="text-[11px] text-slate-500">Total alumnos: {students.length}</p>
              </div>
              
              {/* Filter controls */}
              <div className="flex gap-2 flex-wrap items-center">
                {!isAdmin && (
                  <button
                    onClick={() => handleOpenStudentModal()}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer mr-2"
                  >
                    <Plus size={14} />
                    <span>Inscribir Alumno</span>
                  </button>
                )}

                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-350 rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="Todos">Todos los Cursos</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar estudiante..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-350 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[450px] overflow-y-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">RUT</th>
                    <th className="p-3">Curso</th>
                    <th className="p-3">Conducta</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">No se registran alumnos matriculados bajo este filtro.</td>
                    </tr>
                  ) : (
                    filteredStudents.map(std => (
                      <tr key={std.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{std.firstName} {std.lastName}</td>
                        <td className="p-3 font-mono">{std.rut}</td>
                        <td className="p-3">{std.grade}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            std.conductScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            std.conductScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {std.conductScore} pts
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenStudentModal(std)}
                            className="text-primary hover:underline font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(std.id, `${std.firstName} ${std.lastName}`)}
                            className="text-red-650 hover:underline font-bold cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: SCHOOLS LIST CRUD (Admin Only) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'schools' && isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Colegios Asociados</h3>
              <p className="text-xs text-slate-500">Administra los establecimientos educacionales que operan sobre Conexia.</p>
            </div>
            <button
              onClick={() => handleOpenSchoolModal()}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Agregar Colegio</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Establecimiento</th>
                  <th className="p-4">RUT Jurídico</th>
                  <th className="p-4">Dirección</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schools.map(sch => (
                  <tr key={sch.id} className="hover:bg-slate-50/50">
                    <td className="p-4 flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-800">{sch.name}</span>
                    </td>
                    <td className="p-4 font-mono">{sch.rut}</td>
                    <td className="p-4 text-slate-500">{sch.address || 'Sin dirección registrada'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenSchoolModal(sch)}
                        className="text-primary hover:underline font-bold cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSchool(sch.id, sch.name)}
                        className="text-red-650 hover:underline font-bold cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: STAFF LIST CRUD (Admin Only) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'staff' && isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Control de Accesos y Usuarios (Personal)</h3>
              <p className="text-xs text-slate-500">Administra las cuentas de Encargado de Convivencia, Psicólogos, Asistentes Sociales y Orientadores.</p>
            </div>
            <button
              onClick={() => handleOpenStaffModal()}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Agregar Funcionario</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Nombre Funcionario</th>
                  <th className="p-4">RUT</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Rol / Permisos</th>
                  <th className="p-4">Establecimiento</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay funcionarios registrados en el sistema.</td>
                  </tr>
                ) : (
                  staffList.map(st => (
                    <tr key={st.rut} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">{st.firstName} {st.lastName}</td>
                      <td className="p-4 font-mono">{st.rut}</td>
                      <td className="p-4">{st.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          st.role === 'Administrador' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          st.role === 'Psicólogo' ? 'bg-violet-50 text-violet-750 border-violet-200' :
                          st.role === 'Convivencia' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          st.role === 'Trabajador Social' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                          st.role === 'Orientador' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {st.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{st.school}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenStaffModal(st)}
                          className="text-primary hover:underline font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(st.id, `${st.firstName} ${st.lastName}`)}
                          className="text-red-650 hover:underline font-bold cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL COLEGIO CRUD */}
      {/* ---------------------------------------------------- */}
      {isSchoolModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in">
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingSchool ? 'Editar Colegio' : 'Registrar Establecimiento'}</h3>
              <button onClick={() => setIsSchoolModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveSchool} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Nombre Oficial del Colegio</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ej: Colegio San Nicolás"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">RUT Corporativo</label>
                  <input
                    type="text"
                    value={schoolRut}
                    onChange={(e) => setSchoolRut(e.target.value)}
                    placeholder="Ej: 76.123.456-K"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Dirección / Sede</label>
                  <input
                    type="text"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    placeholder="Calle, Ciudad"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                >
                  {editingSchool ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL ESTUDIANTE CRUD */}
      {/* ---------------------------------------------------- */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in">
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingStudent ? 'Editar Estudiante' : 'Inscribir Alumno'}</h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    placeholder="Ej: Juan"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    placeholder="Ej: Pérez Soto"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">RUT Escolar</label>
                  <input
                    type="text"
                    value={studentRut}
                    disabled={editingStudent !== null}
                    onChange={(e) => setStudentRut(e.target.value)}
                    placeholder="Ej: 20.450.912-4"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Curso</label>
                  <input
                    type="text"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    placeholder="Ej: 2° Medio B"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Correo Electrónico (Apoderado / Alumno)</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="alumno@conexia.cl"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                >
                  {editingStudent ? 'Guardar Cambios' : 'Matricular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL FUNCIONARIO/USUARIO CRUD (Admin Only) */}
      {/* ---------------------------------------------------- */}
      {isStaffModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in">
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingStaff ? 'Editar Acceso Funcionario' : 'Registrar Nuevo Funcionario'}</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveStaff} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    value={staffFirstName}
                    onChange={(e) => setStaffFirstName(e.target.value)}
                    placeholder="Ej: Carolina"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Apellido</label>
                  <input
                    type="text"
                    value={staffLastName}
                    onChange={(e) => setStaffLastName(e.target.value)}
                    placeholder="Ej: Silva Rojas"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">RUT Funcionario</label>
                  <input
                    type="text"
                    value={staffRut}
                    disabled={editingStaff !== null}
                    onChange={(e) => setStaffRut(e.target.value)}
                    placeholder="Ej: 15.123.456-7"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Correo Institucional</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="ejemplo@colegio.cl"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Rol / Módulo Principal</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                  >
                    <option value="Convivencia">Encargado de Convivencia</option>
                    <option value="Psicólogo">Psicólogo(a)</option>
                    <option value="Trabajador Social">Asistente/Trabajador Social</option>
                    <option value="Orientador">Orientador(a)</option>
                    <option value="Docente">Docente / Profesor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Establecimiento Asignado</label>
                  <select
                    value={staffSchool}
                    onChange={(e) => setStaffSchool(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm cursor-pointer"
                  >
                    {schools.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                >
                  {editingStaff ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
