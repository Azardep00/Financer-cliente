import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './config';

export interface Diagnostico {
  fecha: string; ingresoMensual: number; gastoMensual: number; deudaTotal: number; ahorroActual: number;
  flujoLibreMensual: number; tasaAhorro: number; relacionDeudaIngreso: number; mesesFondoEmergencia: number;
}
export interface Meta { idMeta: number; descripcion: string; fechaLimite: string | null; completada: boolean; fechaCompletada: string | null; }
export interface Plan { idPlan: number; titulo: string; descripcion: string | null; fechaCreacion: string; metas: Meta[]; progreso: number; }
export interface Punto { fecha: string; tasaAhorro: number; relacionDeudaIngreso: number; mesesFondoEmergencia: number; deudaTotal: number; ahorroActual: number; }
export interface Progreso { historial: Punto[]; metasCompletadas: number; metasTotales: number; progresoPlan: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  ultimoDiagnostico = (id: number) => this.http.get<Diagnostico>(`${API_URL}/clientes/${id}/diagnosticos/ultimo`);
  planActivo = (id: number) => this.http.get<Plan>(`${API_URL}/clientes/${id}/planes/activo`);
  progreso = (id: number) => this.http.get<Progreso>(`${API_URL}/clientes/${id}/progreso`);
  completarMeta = (id: number) => this.http.patch<Meta>(`${API_URL}/metas/${id}/completar`, {});
  pendienteMeta = (id: number) => this.http.patch<Meta>(`${API_URL}/metas/${id}/pendiente`, {});
}
