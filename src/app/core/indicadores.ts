// Semáforo de los tres indicadores. Mismos umbrales que la sección "Indicadores" de la landing.
export type Semaforo = 'ok' | 'warn' | 'mal';

export interface Indicador {
  clave: 'tasa' | 'deuda' | 'fondo';
  nombre: string;
  valor: string;
  meta: string;
  estado: Semaforo;
  texto: string;
}

const ETQ: Record<Semaforo, string> = { ok: 'En meta', warn: 'Atención', mal: 'Alerta' };

export function indicadores(d: { tasaAhorro: number; relacionDeudaIngreso: number; mesesFondoEmergencia: number }): Indicador[] {
  const t = d.tasaAhorro, r = d.relacionDeudaIngreso, m = d.mesesFondoEmergencia;
  const et = (s: Semaforo) => ETQ[s];
  const st: Semaforo = t >= 20 ? 'ok' : t >= 10 ? 'warn' : 'mal';
  const sd: Semaforo = r <= 20 ? 'ok' : r <= 36 ? 'warn' : 'mal';
  const sf: Semaforo = m >= 3 ? 'ok' : m >= 1 ? 'warn' : 'mal';
  return [
    { clave: 'tasa', nombre: 'Tasa de ahorro', valor: t.toFixed(1) + '%', meta: 'Meta: 20% o más', estado: st, texto: et(st) },
    { clave: 'deuda', nombre: 'Deuda / ingreso anual', valor: r.toFixed(1) + '%', meta: 'Alerta sobre 36%', estado: sd, texto: et(sd) },
    { clave: 'fondo', nombre: 'Fondo de emergencia', valor: m.toFixed(1) + ' meses', meta: 'Meta: 3 meses o más', estado: sf, texto: et(sf) },
  ];
}
