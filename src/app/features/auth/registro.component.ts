import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { RegistroCliente } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { AuthMarcoComponent } from './auth-marco.component';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthMarcoComponent],
  styleUrl: './auth-form.css',
  template: `
    <app-auth-marco titulo="Crea tu cuenta" subtitulo="Regístrate como cliente. Un asesor te acompañará en el proceso.">
      <form #f="ngForm" (ngSubmit)="registrar()" novalidate>
        <div class="dos">
          <div class="campo">
            <label for="nombre">Nombre</label>
            <input id="nombre" name="nombre" class="entrada" autocomplete="given-name" [(ngModel)]="d.nombre" required
                   [class.invalida]="n.invalid && n.touched" #n="ngModel" />
            @if (n.invalid && n.touched) { <span class="campo-error">Obligatorio.</span> }
          </div>
          <div class="campo">
            <label for="apellido">Apellido</label>
            <input id="apellido" name="apellido" class="entrada" autocomplete="family-name" [(ngModel)]="d.apellido" required
                   [class.invalida]="a.invalid && a.touched" #a="ngModel" />
            @if (a.invalid && a.touched) { <span class="campo-error">Obligatorio.</span> }
          </div>
        </div>

        <div class="campo">
          <label for="telefono">Teléfono</label>
          <input id="telefono" name="telefono" type="tel" class="entrada" autocomplete="tel" [(ngModel)]="d.telefono" required
                 [class.invalida]="t.invalid && t.touched" #t="ngModel" />
          @if (t.invalid && t.touched) { <span class="campo-error">Obligatorio.</span> }
        </div>

        <div class="campo">
          <label for="correo">Correo</label>
          <input id="correo" name="correo" type="email" class="entrada" autocomplete="email" [(ngModel)]="d.correo" required email
                 [class.invalida]="c.invalid && c.touched" #c="ngModel" />
          @if (c.invalid && c.touched) { <span class="campo-error">Escribe un correo válido.</span> }
        </div>

        <div class="campo">
          <label for="contrasena">Contraseña</label>
          <div class="con-boton">
            <input id="contrasena" name="contrasena" class="entrada" autocomplete="new-password"
                   [type]="ver() ? 'text' : 'password'" [(ngModel)]="d.contrasena" required minlength="6"
                   [class.invalida]="p.invalid && p.touched" #p="ngModel" aria-describedby="ayuda-clave" />
            <button type="button" class="btn btn-fantasma btn-sm" (click)="ver.set(!ver())" [attr.aria-pressed]="ver()">
              {{ ver() ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          <span id="ayuda-clave" class="campo-ayuda" [class.campo-error]="p.invalid && p.touched">Mínimo 6 caracteres.</span>
        </div>

        @if (error()) { <div class="aviso aviso-mal" role="alert">{{ error() }}</div> }

        <button class="btn btn-primario btn-bloque" [disabled]="f.invalid || cargando()">
          {{ cargando() ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="pie">¿Ya tienes cuenta? <a routerLink="/login">Ingresa</a> · <a routerLink="/">Volver al inicio</a></p>
    </app-auth-marco>`,
  styles: ['.dos { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; } @media (max-width: 460px) { .dos { grid-template-columns: 1fr; } }'],
})
export class RegistroComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toasts = inject(ToastService);

  d: RegistroCliente = { nombre: '', apellido: '', telefono: '', correo: '', contrasena: '' };
  ver = signal(false);
  error = signal('');
  cargando = signal(false);

  registrar() {
    this.cargando.set(true);
    this.error.set('');
    const datos = { ...this.d, nombre: this.d.nombre.trim(), apellido: this.d.apellido.trim(),
      telefono: this.d.telefono.trim(), correo: this.d.correo.trim() };

    this.auth.registrar(datos).subscribe({
      // Tras registrarse entra directo a su panel.
      next: () => this.auth.login(datos.correo, datos.contrasena).subscribe({
        next: () => this.router.navigateByUrl(this.auth.inicio),
        error: () => {
          this.toasts.ok('Cuenta creada. Ingresa con tu correo y contraseña.');
          this.router.navigate(['/login']);
        },
      }),
      error: e => { this.error.set(mensajeError(e, 'No se pudo crear la cuenta.')); this.cargando.set(false); },
    });
  }
}
