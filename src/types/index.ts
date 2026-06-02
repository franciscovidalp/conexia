export type SchoolType = string;

export type UserRole = 'Docente' | 'Convivencia' | 'Psicólogo' | 'Trabajador Social' | 'Director' | 'Administrador' | 'Orientador';

export interface School {
  id: string; // unique code/slug
  name: string;
  rut: string;
  address?: string;
  createdAt: string;
}

export interface Student {
  id: string; // RUT
  rut: string;
  firstName: string;
  lastName: string;
  school: SchoolType; // references School.name or School.id
  grade: string;
  conductScore: number; // 0 to 100
  email?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface Staff {
  id: string; // RUT
  rut: string;
  firstName: string;
  lastName: string;
  school: SchoolType;
  role: UserRole;
  email: string;
  password?: string;
}

export type CaseType = 'Positiva' | 'Leve' | 'Grave' | 'Gravísima';
export type CaseStatus = 'Borrador' | 'En Proceso' | 'Resuelto';

export interface CoexistenceCase {
  id: string;
  studentId: string; // RUT
  studentName: string; // cached join
  school: SchoolType;
  date: string; // YYYY-MM-DD
  type: CaseType;
  description: string;
  reporterId: string; // Staff RUT
  reporterName: string; // cached join
  protocolActivated: boolean;
  protocolName?: string;
  referredToPsychosocial: boolean;
  actionPlan?: string;
  commitments?: string;
  evidenceUrl?: string;
  status: CaseStatus;
  createdAt: string;
}

export type ActivityStatus = 'Programada' | 'Realizada' | 'Cancelada';
export type AudienceType = 'Masiva' | 'Focalizada';

export interface Activity {
  id: string;
  title: string;
  date: string;
  speaker: string;
  location: string;
  status: ActivityStatus;
  audienceType: AudienceType;
  targetGrades?: string[]; // Si es Masiva
  targetStudentIds?: string[]; // Si es Focalizada (RUTs)
  summary?: string;
  evidenceUrl?: string;
  school: SchoolType;
  createdAt: string;
}

export type PsychosocialStatus = 'Ingresado' | 'En Intervención' | 'Derivado a Redes' | 'Alta Clínica';
export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export interface PsychosocialCase {
  id: string; // unique ID or same as studentId if 1-to-1 active
  studentId: string; // RUT
  studentName: string; // cached join
  grade: string;
  school: SchoolType;
  status: PsychosocialStatus;
  referredDate: string;
  reason: string;
  riskLevel: RiskLevel;
  createdAt: string;
}

export type ContactType = 'Estudiante' | 'Apoderado' | 'Aula' | 'Redes';

export interface ClinicalSession {
  id: string;
  caseId: string; // PsychosocialCase id
  date: string;
  contactType: ContactType;
  notes: string; // rich text or markdown notes
  agreements: string;
  professionalId: string; // Staff RUT
  professionalName: string; // cached join
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  school: SchoolType;
  message: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  type: 'Citación Apoderado' | 'Reunión Técnica' | 'Consejo de Profesores' | 'Otro';
  description?: string;
  school: SchoolType;
  createdAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  target: 'Estudiantes' | 'Apoderados' | 'Docentes';
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  text: string;
  category: 'Clima Social' | 'Autoestima' | 'Seguridad' | 'Apoyo Docente';
}

export interface SurveyAnswer {
  id: string;
  surveyId: string;
  studentId: string;
  studentName: string;
  grade: string;
  school: SchoolType;
  responses: { [questionId: string]: number }; // 1 to 5 scale
  score: number; // 0 to 100
  riskStatus: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  submittedAt: string;
}

export interface ProtocolStep {
  id: string;
  name: string;
  description: string;
  status: 'Pendiente' | 'En Proceso' | 'Completado';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  fields?: { [key: string]: any };
}

export interface RiceProtocol {
  id: string;
  caseId?: string;
  studentId: string;
  studentName: string;
  grade: string;
  school: SchoolType;
  protocolType: 'Bullying' | 'Violencia Escolar' | 'Vulneración de Derechos' | 'Drogas/Alcohol' | 'Ciberacoso' | 'Riesgo Suicida';
  status: 'Abierto' | 'Cerrado';
  steps: ProtocolStep[];
  startedAt: string;
  closedAt?: string;
  dueDate: string;
  createdAt: string;
}

export interface ManagementObjective {
  id: string;
  title: string;
  category: 'Prevención' | 'Formación' | 'Intervención' | 'Redes' | 'Otro';
  target: string;
  description: string;
  status: 'No Iniciado' | 'En Proceso' | 'Completado';
  associatedActivityIds: string[];
  school: SchoolType;
  createdAt: string;
}

export interface ExternalReferral {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  school: SchoolType;
  institution: 'OPD' | 'CESFAM' | 'Tribunal de Familia' | 'Carabineros' | 'Oficina Local de Niñez (OLN)' | 'Otro';
  reason: string;
  previousMeasures: string;
  status: 'Pendiente' | 'Enviado' | 'En Revisión' | 'Resuelto' | 'Archivado';
  sentDate?: string;
  folioNumber?: string;
  observations?: string;
  professionalId: string;
  professionalName: string;
  createdAt: string;
}


