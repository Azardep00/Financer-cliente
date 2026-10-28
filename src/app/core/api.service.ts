import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { API_URL } from './config';
import { SILENCIAR_ERRORES } from './http-contexto';
import {
  Asesor, CierreRequest, CierreResponse, Cliente, Diagnostico, DiagnosticoRequest, EstadoCliente,
  FiltrosPanel, Meta, MetaRequest, Nota, PanelResponse, Plan, PlanRequest, Progreso, RegistroAsesor, Sesion,
} from './models';

/**
 * Todos los endpoints del backend, agrupados como en la API.
 * `silencioso: true` evita el aviso automático de error (la pantalla lo maneja, p. ej. 404 = "aún no hay datos").
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private silencio(silencioso: boolean) {
    return silencioso ? { context: new HttpContext().set(SILENCIAR_ERRORES, true) } : {};
  }

  // ---------- Usuarios ----------
  me = () => this.http.get<Sesion>(`${API_URL}/usuarios/me`);
  /** Solo un asesor puede crear otros asesores. */
  registrarAsesor = (d: RegistroAsesor) => this.http.post<Sesion>(`${API_URL}/usuarios/asesores`, d);
  /** Pendiente en el backend (se agrega en F5). Solo asesores. */
  listarAsesores = () => this.http.get<Asesor[]>(`${API_URL}/asesores`);

  // ---------- Clientes ----------
  /** Asesor. Lista simple; el panel con filtros es `panel()`. */
  listarClientes = (soloMios = false) =>
    this.http.get<Cliente[]>(`${API_URL}/clientes`, { params: new HttpParams().set('soloMios', soloMios) });

  cliente = (id: number) => this.http.get<Cliente>(`${API_URL}/clientes/${id}`);

  asignarAsesor = (idCliente: number, idAsesor: number) =>
    this.http.patch<Cliente>(`${API_URL}/clientes/${idCliente}/asesor`, { idAsesor });

  cambiarEstado = (idCliente: number, estado: EstadoCliente) =>
    this.http.patch<Cliente>(`${API_URL}/clientes/${idCliente}/estado`, { estado });

  /** Panel del asesor: resumen, alertas, búsqueda, filtros, orden y paginación. */
  panel(f: FiltrosPanel = {}) {
    let p = new HttpParams();
    if (f.q?.trim()) p = p.set('q', f.q.trim());
    if (f.estado) p = p.set('estado', f.estado);
    if (f.mios) p = p.set('mios', true);
    if (f.sinAsesor) p = p.set('sinAsesor', true);
    if (f.conAlertas) p = p.set('conAlertas', true);
    if (f.orden) p = p.set('orden', f.orden);
    p = p.set('pagina', f.pagina ?? 0).set('tamano', f.tamano ?? 20);
    return this.http.get<PanelResponse>(`${API_URL}/clientes/panel`, { params: p });
  }

  // ---------- Diagnósticos ----------
  crearDiagnostico = (idCliente: number, d: DiagnosticoRequest) =>
    this.http.post<Diagnostico>(`${API_URL}/clientes/${idCliente}/diagnosticos`, d);

  historialDiagnosticos = (idCliente: number) =>
    this.http.get<Diagnostico[]>(`${API_URL}/clientes/${idCliente}/diagnosticos`);

  /** 404 si el cliente aún no tiene diagnóstico. */
  ultimoDiagnostico = (idCliente: number, silencioso = true) =>
    this.http.get<Diagnostico>(`${API_URL}/clientes/${idCliente}/diagnosticos/ultimo`, this.silencio(silencioso));

  // ---------- Planes mensuales ----------
  crearPlan = (idCliente: number, d: PlanRequest) =>
    this.http.post<Plan>(`${API_URL}/clientes/${idCliente}/planes`, d);

  historialPlanes = (idCliente: number) => this.http.get<Plan[]>(`${API_URL}/clientes/${idCliente}/planes`);

  /** 404 si el cliente no tiene plan activo. */
  planActivo = (idCliente: number, silencioso = true) =>
    this.http.get<Plan>(`${API_URL}/clientes/${idCliente}/planes/activo`, this.silencio(silencioso));

  plan = (id: number) => this.http.get<Plan>(`${API_URL}/planes/${id}`);

  /** Solo planes ACTIVOS (si no, el backend responde 400). */
  actualizarPlan = (id: number, d: PlanRequest) => this.http.put<Plan>(`${API_URL}/planes/${id}`, d);

  /** Cierre de mes. Por defecto crea el plan del mes siguiente arrastrando las metas pendientes. */
  cerrarPlan = (id: number, d: CierreRequest = {}) =>
    this.http.post<CierreResponse>(`${API_URL}/planes/${id}/cerrar`, d);

  cancelarPlan = (id: number, motivo?: string) =>
    this.http.post<Plan>(`${API_URL}/planes/${id}/cancelar`, { motivo });

  agregarMeta = (idPlan: number, d: MetaRequest) => this.http.post<Meta>(`${API_URL}/planes/${idPlan}/metas`, d);

  // ---------- Metas ----------
  editarMeta = (id: number, d: MetaRequest) => this.http.put<Meta>(`${API_URL}/metas/${id}`, d);
  eliminarMeta = (id: number) => this.http.delete<void>(`${API_URL}/metas/${id}`);
  completarMeta = (id: number) => this.http.patch<Meta>(`${API_URL}/metas/${id}/completar`, {});
  pendienteMeta = (id: number) => this.http.patch<Meta>(`${API_URL}/metas/${id}/pendiente`, {});

  // ---------- Progreso ----------
  progreso = (idCliente: number, silencioso = true) =>
    this.http.get<Progreso>(`${API_URL}/clientes/${idCliente}/progreso`, this.silencio(silencioso));

  // ---------- Notas privadas del asesor ----------
  notas = (idCliente: number) => this.http.get<Nota[]>(`${API_URL}/clientes/${idCliente}/notas`);
  crearNota = (idCliente: number, texto: string) =>
    this.http.post<Nota>(`${API_URL}/clientes/${idCliente}/notas`, { texto });
  eliminarNota = (id: number) => this.http.delete<void>(`${API_URL}/notas/${id}`);
}
