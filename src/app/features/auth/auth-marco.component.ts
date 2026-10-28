import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Marco compartido de login y registro: panel de marca a la izquierda, formulario a la derecha. */
@Component({
  selector: 'app-auth-marco',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './auth-marco.component.css',
  template: `
    <div class="marco">
      <aside class="marca">
        <a routerLink="/" class="logo">
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#fff" fill-opacity=".12"/>
            <path d="M8 22v-5M14 22v-9M20 22v-6M26 22V9" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <span>Financer <b>KSD</b></span>
        </a>
        <div class="mensaje">
          <h2>Tus finanzas, con un plan que se mide.</h2>
          <ul>
            <li>Diagnóstico con tres indicadores claros</li>
            <li>Plan mensual con metas y fechas</li>
            <li>Seguimiento de tu avance mes a mes</li>
          </ul>
        </div>
        <small>© 2026 Financer KSD</small>
      </aside>

      <main class="formulario">
        <div class="caja">
          <h1>{{ titulo }}</h1>
          <p class="sub">{{ subtitulo }}</p>
          <ng-content />
        </div>
      </main>
    </div>`,
})
export class AuthMarcoComponent {
  @Input({ required: true }) titulo = '';
  @Input() subtitulo = '';
}
