import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { iniciales } from '../../core/formato';
import { IconoComponent } from '../../core/icono.component';

interface ItemMenu { ruta: string; etiqueta: string; icono: string; }

const MENU: Record<'Cliente' | 'Asesor', ItemMenu[]> = {
  Cliente: [
    { ruta: '/cliente/resumen', etiqueta: 'Resumen', icono: 'resumen' },
    { ruta: '/cliente/plan', etiqueta: 'Plan del mes', icono: 'plan' },
    { ruta: '/cliente/historial', etiqueta: 'Historial de planes', icono: 'historial' },
    { ruta: '/cliente/cuenta', etiqueta: 'Mi cuenta', icono: 'cuenta' },
  ],
  Asesor: [
    { ruta: '/asesor/clientes', etiqueta: 'Clientes', icono: 'clientes' },
    { ruta: '/asesor/asesores', etiqueta: 'Asesores', icono: 'asesores' },
    { ruta: '/asesor/cuenta', etiqueta: 'Mi cuenta', icono: 'cuenta' },
  ],
};
/** Marco de las pantallas con sesión: barra lateral azul tinta + contenido claro. */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconoComponent],
  styleUrl: './shell.component.css',
  template: `
    <a class="saltar" href="#contenido" (click)="irAlContenido($event)">Saltar al contenido</a>

    <header class="barra-movil">
      <button type="button" class="icono-btn" (click)="abierto.set(true)" aria-label="Abrir menú"
              [attr.aria-expanded]="abierto()" aria-controls="lateral">
        <app-icono nombre="menu" [tamano]="22" />
      </button>
      <span class="marca-texto">Financer <b>KSD</b></span>
    </header>

    <div class="velo" [class.visible]="abierto()" (click)="abierto.set(false)" aria-hidden="true"></div>

    <aside id="lateral" class="lateral" [class.abierto]="abierto()">
      <div class="marca">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#fff" fill-opacity=".12"/>
          <path d="M8 22v-5M14 22v-9M20 22v-6M26 22V9" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <span class="marca-texto">Financer <b>KSD</b></span>
        <button type="button" class="icono-btn cerrar-movil" (click)="abierto.set(false)" aria-label="Cerrar menú">
          <app-icono nombre="cerrar" />
        </button>
      </div>

      <nav aria-label="Principal">
        @for (item of menu(); track item.ruta) {
          <a [routerLink]="item.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page" class="enlace">
            <app-icono [nombre]="item.icono" /> {{ item.etiqueta }}
          </a>
        }
      </nav>

      <div class="usuario">
        <div class="avatar" aria-hidden="true">{{ iniciales() }}</div>
        <div class="datos">
          <strong>{{ auth.sesion()?.nombre }} {{ auth.sesion()?.apellido }}</strong>
          <span>{{ auth.rol() }}</span>
        </div>
        <button type="button" class="icono-btn" (click)="auth.logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
          <app-icono nombre="salir" />
        </button>
      </div>
    </aside>

    <main id="contenido" tabindex="-1"><router-outlet /></main>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  abierto = signal(false);
  menu = computed(() => MENU[this.auth.rol() ?? 'Cliente']);
  iniciales = computed(() => iniciales(this.auth.sesion()?.nombre ?? '', this.auth.sesion()?.apellido ?? ''));

  constructor() {
    // En móvil el menú se cierra al navegar.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.abierto.set(false));
  }

  @HostListener('document:keydown.escape') cerrarConEscape() { this.abierto.set(false); }

  irAlContenido(ev: Event) {
    ev.preventDefault();
    document.getElementById('contenido')?.focus();
  }
}
