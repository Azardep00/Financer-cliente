// ===== EDITA AQUI: metodologia, indicadores y planes de la landing =====
export const FASES = [
  { n: 1, t: 'Diagnóstico 360°', d: 'Mapeamos ingresos, gastos, deudas y ahorro, y los convertimos en tres indicadores comparables en el tiempo.' },
  { n: 2, t: 'Priorización en cascada', d: 'Ordenamos qué atacar primero: flujo mensual positivo, fondo mínimo, deudas más caras, fondo completo y, al final, metas de ahorro e inversión.' },
  { n: 3, t: 'Plan con metas SMART', d: 'Cada meta es específica, medible y con fecha. Nada de "ahorrar más": "reunir $3.000.000 antes del 31 de marzo".' },
  { n: 4, t: 'Seguimiento y ajustes', d: 'Marcas tus avances y tu asesor revisa el plan contigo; si cambia tu realidad, el plan cambia.' },
  { n: 5, t: 'Medición y nueva ronda', d: 'Repetimos el diagnóstico y comparamos contra el anterior: ves tu mejora en gráficas reales, no en sensaciones.' },
];
export const INDICADORES = [
  { n: 'Tasa de ahorro', f: '(ingreso − gasto) ÷ ingreso', meta: '20% o más', alerta: 'menos de 10%' },
  { n: 'Deuda / ingreso anual', f: 'deuda total ÷ (ingreso × 12)', meta: '20% o menos', alerta: 'más de 36%' },
  { n: 'Fondo de emergencia', f: 'ahorro ÷ gasto mensual', meta: '3 meses o más', alerta: 'menos de 1 mes' },
];
// precio: null => "Por definir". Pon aqui el texto real, ej: '$120.000 / mes'.
export const PLANES = [
  { nombre: 'Esencial', precio: null as string | null, destacado: false,
    incluye: ['Diagnóstico financiero inicial', 'Plan de mejora con metas', 'Panel de progreso'] },
  { nombre: 'Acompañamiento', precio: null as string | null, destacado: true,
    incluye: ['Todo lo del plan Esencial', 'Seguimiento periódico con tu asesor', 'Ajustes al plan', 'Nuevos diagnósticos para medir tu avance'] },
  { nombre: 'Integral', precio: null as string | null, destacado: false,
    incluye: ['Todo lo del plan Acompañamiento', 'Estrategia de salida de deudas', 'Metas de ahorro e inversión'] },
];
