// Formato de cifras y fechas para toda la app (es-CO).

const monedaCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const cop = (n: number | null | undefined) => monedaCOP.format(n ?? 0);
export const pct = (n: number | null | undefined, decimales = 1) => (n ?? 0).toFixed(decimales) + '%';

/** "2026-10-28" -> "28 oct 2026". Sin pasar por Date para evitar corrimientos de zona horaria. */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return iso;
  return `${d} ${MESES[m - 1].slice(0, 3)} ${a}`;
}

/** "2026-10" -> "Octubre 2026". */
export function periodoLargo(periodo: string | null | undefined): string {
  if (!periodo) return '—';
  const [a, m] = periodo.split('-').map(Number);
  if (!a || !m) return periodo;
  const mes = MESES[m - 1];
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${a}`;
}

/** Hoy en "yyyy-MM-dd" según la hora local del navegador. */
export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const iniciales = (nombre: string, apellido: string) =>
  ((nombre?.[0] ?? '') + (apellido?.[0] ?? '')).toUpperCase();
