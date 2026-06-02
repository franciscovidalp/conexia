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
