import type { UserRole } from '../types';

export type ModuleId = 'climate' | 'management' | 'activities' | 'calendar' | 'coexistence' | 'summons' | 'protocols' | 'psychosocial' | 'derivations' | 'messaging' | 'settings';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

const MODULE_ACCESS: Record<UserRole, ModuleId[]> = {
  Administrador: ['climate', 'management', 'activities', 'calendar', 'coexistence', 'summons', 'protocols', 'psychosocial', 'derivations', 'messaging', 'settings'],
  Directivo: ['climate', 'management', 'activities', 'calendar', 'coexistence', 'summons', 'protocols', 'derivations', 'messaging', 'settings'],
  Convivencia: ['climate', 'management', 'activities', 'calendar', 'coexistence', 'summons', 'protocols', 'derivations', 'messaging'],
  Orientador: ['climate', 'activities', 'calendar', 'psychosocial', 'derivations', 'messaging'],
  Psicólogo: ['climate', 'calendar', 'psychosocial', 'derivations', 'messaging'],
  'Trabajador Social': ['climate', 'calendar', 'psychosocial', 'derivations', 'messaging'],
  Docente: ['activities', 'calendar', 'coexistence', 'messaging']
};

export const canAccessModule = (role: UserRole, module: ModuleId): boolean => MODULE_ACCESS[role].includes(module);

export const ROLE_PERMISSION_SUMMARY: Record<UserRole, Record<PermissionAction, string>> = {
  Administrador: { view: 'Todos', create: 'Todos', edit: 'Todos', delete: 'Autorizado', export: 'Autorizado' },
  Directivo: { view: 'Gestión general', create: 'Gestión general', edit: 'Gestión general', delete: 'Restringido', export: 'No clínico' },
  Convivencia: { view: 'Convivencia', create: 'Convivencia', edit: 'Convivencia', delete: 'Restringido', export: 'No clínico' },
  Orientador: { view: 'Diagnóstico y apoyo', create: 'Derivaciones', edit: 'Casos asignados', delete: 'Sin acceso', export: 'Apoyo autorizado' },
  Psicólogo: { view: 'Clínico autorizado', create: 'Clínico', edit: 'Clínico', delete: 'Clínico', export: 'Clínico' },
  'Trabajador Social': { view: 'Clínico autorizado', create: 'Clínico', edit: 'Clínico', delete: 'Clínico', export: 'Clínico' },
  Docente: { view: 'Operación básica', create: 'Incidencias', edit: 'Propio flujo', delete: 'Sin acceso', export: 'Sin datos clínicos' }
};
