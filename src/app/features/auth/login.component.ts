import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { AuthMarcoComponent } from './auth-marco.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthMarcoComponent],
  styleUrl: './auth-form.css',
  template: `
    <app-auth-marco titulo="Ingresar" subtitulo="Accede a tu panel de Financer KSD.">
      <form #f="ngForm" (ngSubmit)="entrar()" novalidate>
        <div class="campo">
          <label for="correo">Correo</label>
          <input id="correo" name="correo" type="email" class="entrada" autocomplete="username"
                 [(ngModel)]="correo" required email [class.invalida]="c.invalid && c.touched" #c="ngModel" />
          @if (c.invalid && c.touched) { <span class="campo-error">Escribe un correo válido.</span> }
        </div>

        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <div class="con-boton">
            <input id="contrasena" name="contrasena" class="entrada" autocomplete="current-password"
                   [type]="ver() ? 'text' : 'password'" [(ngModel)]="contrasena" required
                   [class.invalida]="p.invalid && p.touched" #p="ngModel" />
            <button type="button" class="btn btn-fantasma btn-sm" (click)="ver.set(!ver())" [attr.aria-pressed]="ver()">
              {{ ver() ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          @if (p.invalid && p.touched) { <span class="campo-error">Escribe tu contraseña.</span> }
        </div>

        @if (error()) { <div class="aviso aviso-mal" role="alert">{{ error() }}</div> }

        <button class="btn btn-primario btn-bloque" [disabled]="f.invalid || cargando()">
          {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <p class="pie">¿No tienes cuenta? <a routerLink="/registro">Regístrate</a> · <a routerLink="/">Volver al inicio</a></p>
    </app-auth-marco>`,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  correo = ''; contrasena = '';
  ver = signal(false);
  error = signal('');
  cargando = signal(false);

  entrar() {
    this.cargando.set(true);
    this.error.set('');
    this.auth.login(this.correo.trim(), this.contrasena).subscribe({
      next: () => this.router.navigateByUrl(this.destino()),
      error: e => { this.error.set(mensajeError(e, 'Correo o contraseña incorrectos.')); this.cargando.set(false); },
    });
  }

  /** Vuelve a donde iba el usuario si es una ruta interna de su rol; si no, a su inicio. */
  private destino(): string {
    const v = this.ruta.snapshot.queryParamMap.get('volver') ?? '';
    const base = this.auth.rol() === 'Asesor' ? '/asesor' : '/cliente';
    return v.startsWith(base + '/') ? v : this.auth.inicio;
  }
}
