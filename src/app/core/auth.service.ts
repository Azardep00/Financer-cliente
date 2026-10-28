import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { Rol, Sesion, RegistroCliente } from './models';
import { SILENCIAR_ERRORES } from './http-contexto';
import { ToastService } from './toast.service';

const CLAVE = 'financer_sesion';

/** Lee el vencimiento ("exp", en segundos) del JWT sin verificar la firma (eso lo hace el backend). */
function vencimientoMs(token: string): number | null {
  try {
    const carga = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(carga)).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function leerGuardada(): Sesion | null {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
    if (!s?.token || (s.tipoUsuario !== 'Cliente' && s.tipoUsuario !== 'Asesor')) return null;
    const vence = vencimientoMs(s.token);
    return vence !== null && vence <= Date.now() ? null : s;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toasts = inject(ToastService);

  readonly sesion = signal<Sesion | null>(leerGuardada());
  readonly rol = computed<Rol | null>(() => this.sesion()?.tipoUsuario ?? null);
  readonly esAsesor = computed(() => this.rol() === 'Asesor');
  readonly esCliente = computed(() => this.rol() === 'Cliente');

  get token(): string | null { return this.sesion()?.token ?? null; }

  /** True si hay sesión y el token no ha vencido. Si venció, la limpia. */
  get logueado(): boolean {
    const s = this.sesion();
    if (!s?.token) return false;
    const vence = vencimientoMs(s.token);
    if (vence !== null && vence <= Date.now()) {
      this.limpiar();
      return false;
    }
    return true;
  }

  /** Pantalla de inicio según el rol. */
  get inicio(): string {
    return this.rol() === 'Asesor' ? '/asesor/clientes' : this.rol() === 'Cliente' ? '/cliente/resumen' : '/login';
  }

  login(correo: string, contrasena: string) {
    return this.http.post<Sesion>(`${API_URL}/usuarios/login`, { correo, contrasena },
      { context: new HttpContext().set(SILENCIAR_ERRORES, true) }).pipe(
      tap(s => {
        try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* modo privado: la sesión vive en memoria */ }
        this.sesion.set(s);
      })
    );
  }

  registrar(datos: RegistroCliente) {
    return this.http.post<Sesion>(`${API_URL}/usuarios/clientes`, datos,
      { context: new HttpContext().set(SILENCIAR_ERRORES, true) });
  }

  /** Cierra la sesión por decisión del usuario. */
  logout() {
    this.limpiar();
    this.router.navigate(['/']);
  }

  /** El servidor rechazó el token (401): vuelve al login avisando. */
  sesionExpirada() {
    if (!this.sesion()) return;
    this.limpiar();
    this.toasts.warn('Tu sesión expiró. Ingresa de nuevo para continuar.');
    this.router.navigate(['/login'], { queryParams: { volver: this.router.url } });
  }

  private limpiar() {
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    this.sesion.set(null);
  }
}
