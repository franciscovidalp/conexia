export interface StudentImportRow {
  rut: string;
  nombre: string;
  apellido: string;
  curso: string;
  email: string;
}

export const normalizeRut = (value: string): string => {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return value.trim();
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
};

export const isValidRut = (value: string): boolean => {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const result = 11 - (sum % 11);
  const verifier = result === 11 ? '0' : result === 10 ? 'K' : String(result);
  return verifier === clean.slice(-1);
};

export const isValidEmail = (value: string): boolean =>
  value === '' || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254);

export const hasSpreadsheetFormulaPrefix = (value: string): boolean => /^[=+\-@]/.test(value.trim());

export const validateStudentImportRows = (rows: StudentImportRow[]): StudentImportRow[] => {
  if (rows.length > 5000) throw new Error('El archivo supera el límite de 5.000 estudiantes.');
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const line = index + 2;
    const normalizedRut = normalizeRut(row.rut);
    if (!isValidRut(normalizedRut)) throw new Error(`RUT inválido en la fila ${line}.`);
    if (!row.nombre.trim() || !row.apellido.trim() || !row.curso.trim()) throw new Error(`Faltan datos obligatorios en la fila ${line}.`);
    if (![row.nombre, row.apellido, row.curso, row.email].every(value => value.length <= 150 && !hasSpreadsheetFormulaPrefix(value))) throw new Error(`Contenido no permitido en la fila ${line}.`);
    if (!isValidEmail(row.email.trim())) throw new Error(`Correo inválido en la fila ${line}.`);
    if (seen.has(normalizedRut)) throw new Error(`RUT duplicado dentro del archivo en la fila ${line}.`);
    seen.add(normalizedRut);
    return { ...row, rut: normalizedRut, nombre: row.nombre.trim(), apellido: row.apellido.trim(), curso: row.curso.trim(), email: row.email.trim().toLowerCase() };
  });
};
