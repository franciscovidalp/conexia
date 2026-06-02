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

