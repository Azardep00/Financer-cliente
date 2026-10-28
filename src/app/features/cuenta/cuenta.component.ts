import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

/** Datos de la cuenta con sesión iniciada (cliente o asesor). */
@Component({
  selector: 'app-cuenta',
  standalone: true,
  styles: [`.datos { display: grid; grid-template-columns: max-content 1fr; gap: .5rem 1.25rem; margin: 0 0 1rem; }
    .datos dt { color: var(--suave); } .datos dd { margin: 0; overflow-wrap: anywhere; }
    @media (max-width: 480px) { .datos { grid-template-columns: minmax(0, 1fr); gap: .1rem; } .datos dd { margin-bottom: .5rem; } }`],
  template: `
    <div class="pagina">
      <div class="pagina-encabezado"><div><h1>Mi cuenta</h1><p>Datos de tu sesión.</p></div></div>
      <section class="card" aria-labelledby="t-cta">
        <h2 id="t-cta" class="card-titulo">Perfil</h2>
        @if (cargando()) { <div class="cargando" role="status"><span class="giro"></span> Cargando…</div> }
        @else if (s()) {
          @let u = s()!;
          <dl class="datos">
            <dt>Nombre</dt><dd>{{ u.nombre }} {{ u.apellido }}</dd>
            <dt>Correo</dt><dd>{{ u.correo }}</dd>
            <dt>Rol</dt><dd>{{ u.tipoUsuario }}</dd>
          </dl>
        } @else { <div class="aviso aviso-warn">No se pudieron cargar los datos de la cuenta.</div> }
        <button type="button" class="btn btn-secundario" (click)="auth.logout()">Cerrar sesión</button>
      </section>
    </div>`,
})
export class CuentaComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  cargando = signal(true);
  s = signal(this.auth.sesion());

  ngOnInit() {
    // Refresca con el servidor; si falla, queda lo guardado en la sesión.
    this.api.me().subscribe({
      next: u => { this.s.set({ ...u, token: this.auth.token }); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
}