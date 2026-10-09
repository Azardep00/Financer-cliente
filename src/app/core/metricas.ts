export type Color = 'verde' | 'amarillo' | 'rojo';
export interface Entrada { ingreso: number; gasto: number; deuda: number; ahorro: number; }

export const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export function calcular(e: Entrada) {
  const ing = e.ingreso || 0, gas = e.gasto || 0;
  return {
    libre: ing - gas,
    tasa: ing > 0 ? ((ing - gas) / ing) * 100 : 0,
    rel: ing > 0 ? ((e.deuda || 0) / (ing * 12)) * 100 : 0,
    meses: gas > 0 ? (e.ahorro || 0) / gas : 0,
  };
}
export const pctGasto = (e: Entrada) => (e.ingreso > 0 ? Math.min(100, Math.max(0, (e.gasto / e.ingreso) * 100)) : 0);

// Semaforo: mismos umbrales que muestra la seccion "Indicadores" de la landing.
export function semaforo(m: { tasa: number; rel: number; meses: number }) {
  return [
    { nombre: 'Tasa de ahorro', valor: m.tasa.toFixed(1) + '%', ayuda: 'Meta: 20% o más',
      color: (m.tasa >= 20 ? 'verde' : m.tasa >= 10 ? 'amarillo' : 'rojo') as Color },
    { nombre: 'Deuda / ingreso anual', valor: m.rel.toFixed(1) + '%', ayuda: 'Alerta sobre 36%',
      color: (m.rel <= 20 ? 'verde' : m.rel <= 36 ? 'amarillo' : 'rojo') as Color },
    { nombre: 'Fondo de emergencia', valor: m.meses.toFixed(1) + ' meses', ayuda: 'Meta: 3 meses o más',
      color: (m.meses >= 3 ? 'verde' : m.meses >= 1 ? 'amarillo' : 'rojo') as Color },
  ];
}
