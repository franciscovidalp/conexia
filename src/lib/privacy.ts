export const maskRut = (rut?: string): string => {
  if (!rut) return 'No informado';
  const compact = rut.replace(/\s/g, '');
  const visible = compact.slice(-5);
  return `••.•••.${visible}`;
};

export const safePersonFileName = (firstName: string, lastName: string): string =>
  `${firstName}-${lastName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
