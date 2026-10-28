// Modelos que reflejan el JSON del backend (Financer KSD API).
// Las fechas llegan como texto: "yyyy-MM-dd" (LocalDate) o ISO (LocalDateTime).

export type Rol = 'Cliente' | 'Asesor';
export type EstadoCliente = 'PROSPECTO' | 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
export type EstadoPlan = 'ACTIVO' | 'CERRADO' | 'CANCELADO';
export type TipoMeta = 'TEXTO' | 'AHORRO' | 'REDUCCION_DEUDA' | 'REDUCCION_GASTO';
export type TipoAlerta =
  'SIN_DIAGNOSTICO' | 'DIAGNOSTICO_VIEJO' | 'SIN_PLAN_ACTIVO' | 'MES_SIN_CERRAR' | 'METAS_VENCIDAS';

export const ESTADOS_CLIENTE: EstadoCliente[] = ['PROSPECTO', 'ACTIVO', 'PAUSADO', 'FINALIZADO'];

/** Cuerpo de error del backend. */
export interface ErrorApi { mensaje: string; }

// ---------- Usuarios ----------

export interface Sesion {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoUsuario: Rol;
  token: string | null;
}

export interface RegistroCliente {
  nombre: string; apellido: string; telefono: string; correo: string; contrasena: string;
}

export interface RegistroAsesor {
  nombre: string; apellido: string; especialidad?: string; correo: string; contrasena: string;
}

export interface Asesor {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoUsuario: 'Asesor';
  especialidad: string | null;
}

export interface Cliente {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoUsuario: 'Cliente';
  telefono: string;
  estadoCliente: EstadoCliente;
  asesorAsignado: Asesor | null;
}

// ---------- Diagnósticos ----------

export interface Diagnostico {
  idDiagnostico: number;
  fecha: string;
  ingresoMensual: number;
  gastoMensual: number;
  deudaTotal: number;
  ahorroActual: number;
  // Derivadas (las calcula el backend)
  flujoLibreMensual: number;
  tasaAhorro: number;
  relacionDeudaIngreso: number;
  mesesFondoEmergencia: number;
}

export interface DiagnosticoRequest {
  fecha?: string;
  ingresoMensual: number;
  gastoMensual: number;
  deudaTotal: number;
  ahorroActual: number;
}

// ---------- Planes y metas ----------

export interface Meta {
  idMeta: number;
  descripcion: string;
  fechaLimite: string | null;
  completada: boolean;
  fechaCompletada: string | null;
  tipo: TipoMeta;
  montoObjetivo: number | null;
  valorInicial: number | null;
  valorActual: number | null;
  origenMetaId: number | null;
  medible: boolean;
  /** 0 a 100. Las metas de texto cuentan 0 o 100. */
  progreso: number;
}

export interface Plan {
  idPlan: number;
  cliente: Cliente;
  asesor: Asesor;
  titulo: string;
  descripcion: string | null;
  fechaCreacion: string;
  periodoInicio: string;
  periodoFin: string;
  /** yyyy-MM */
  periodo: string;
  estado: EstadoPlan;
  fechaCierre: string | null;
  notaCierre: string | null;
  metas: Meta[];
  /** 0 a 100 */
  progreso: number;
}

export interface MetaRequest {
  descripcion: string;
  fechaLimite?: string | null;
  /** Sin tipo, o TEXTO: meta que se marca a mano. */
  tipo?: TipoMeta;
  montoObjetivo?: number | null;
  valorInicial?: number | null;
}

export interface PlanRequest {
  titulo: string;
  descripcion?: string | null;
  metas?: MetaRequest[];
  /** Cualquier día del mes del plan. Si falta, es el mes actual. */
  periodo?: string;
}

export interface CierreRequest {
  notaCierre?: string;
  crearSiguiente?: boolean;
  arrastrarPendientes?: boolean;
  tituloSiguiente?: string;
}

export interface CierreResponse {
  cierre: {
    idPlan: number;
    periodo: string;
    progreso: number;
    metasTotal: number;
    metasCumplidas: number;
    metasPendientes: number;
    metasArrastradas: number;
  };
  siguientePlan: Plan | null;
}

// ---------- Progreso ----------

export interface PuntoHistorico {
  fecha: string;
  ingresoMensual: number;
  gastoMensual: number;
  deudaTotal: number;
  ahorroActual: number;
  tasaAhorro: number;
  relacionDeudaIngreso: number;
  mesesFondoEmergencia: number;
}

export interface Progreso {
  idCliente: number;
  /** De más antiguo a más reciente. */
  historial: PuntoHistorico[];
  /** Último menos primero. null si hay menos de 2 diagnósticos. */
  variacion: {
    tasaAhorro: number;
    relacionDeudaIngreso: number;
    mesesFondoEmergencia: number;
    deudaTotal: number;
    ahorroActual: number;
  } | null;
  metasCompletadas: number;
  metasTotales: number;
  progresoPlan: number;
}

// ---------- Panel del asesor ----------

export interface Alerta { tipo: TipoAlerta; mensaje: string; }

export interface PlanResumen {
  idPlan: number;
  titulo: string;
  periodo: string;
  progreso: number;
  metasTotal: number;
  metasPendientes: number;
  metasVencidas: number;
}

export interface ClientePanel {
  idCliente: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  estadoCliente: EstadoCliente;
  idAsesor: number | null;
  nombreAsesor: string | null;
  planActivo: PlanResumen | null;
  ultimoDiagnostico: string | null;
  diasSinDiagnostico: number | null;
  cantidadNotas: number;
  alertas: Alerta[];
}

export interface PanelResponse {
  resumen: {
    totalClientes: number;
    porEstado: Partial<Record<EstadoCliente, number>>;
    conAlertas: number;
    sinAsesor: number;
    alertasPorTipo: Partial<Record<TipoAlerta, number>>;
  };
  clientes: ClientePanel[];
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}

export type OrdenPanel = 'alertas' | 'nombre' | 'diagnostico';

export interface FiltrosPanel {
  q?: string;
  estado?: EstadoCliente | '';
  mios?: boolean;
  sinAsesor?: boolean;
  conAlertas?: boolean;
  orden?: OrdenPanel;
  pagina?: number;
  tamano?: number;
}

// ---------- Notas privadas ----------

export interface Nota {
  idNota: number;
  asesor: Asesor;
  texto: string;
  /** ISO local, sin zona. */
  fechaCreacion: string;
}
