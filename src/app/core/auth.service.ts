import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';

export interface Sesion {
  idUsuario: number; nombre: string; apellido: string;
  correo: string; tipoUsuario: 'Cliente' | 'Asesor'; token: string | null;
}
export interface RegistroCliente {
  nombre: string; apellido: string; telefono: string; correo: string; contrasena: string;
}

const CLAVE = 'financer_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly sesion = signal<Sesion | null>(JSON.parse(localStorage.getItem(CLAVE) ?? 'null'));

  get token(): string | null { return this.sesion()?.token ?? null; }
  get logueado(): boolean { return !!this.token; }

  login(correo: string, contrasena: string) {
    return this.http.post<Sesion>(`${API_URL}/usuarios/login`, { correo, contrasena }).pipe(
      tap(s => { localStorage.setItem(CLAVE, JSON.stringify(s)); this.sesion.set(s); })
    );
  }

  registrar(datos: RegistroCliente) {
    return this.http.post<Sesion>(`${API_URL}/usuarios/clientes`, datos);
  }

  logout() {
    localStorage.removeItem(CLAVE);
    this.sesion.set(null);
    this.router.navigate(['/']);
  }
}
