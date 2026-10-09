import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegistroCliente } from '../core/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  <div class="auth">
    <form (ngSubmit)="registrar()">
      <h2>Crea tu cuenta</h2>
      <input name="nombre" [(ngModel)]="d.nombre" placeholder="Nombre" required />
      <input name="apellido" [(ngModel)]="d.apellido" placeholder="Apellido" required />
      <input name="telefono" [(ngModel)]="d.telefono" placeholder="Teléfono" required />
      <input type="email" name="correo" [(ngModel)]="d.correo" placeholder="Correo" required />
      <input type="password" name="contrasena" [(ngModel)]="d.contrasena" placeholder="Contraseña (mín. 6)" minlength="6" required />
      @if (error()) { <div class="error">{{ error() }}</div> }
      <button class="btn" [disabled]="cargando()">{{ cargando() ? 'Creando…' : 'Registrarme' }}</button>
      <small>¿Ya tienes cuenta? <a routerLink="/login">Ingresa</a> · <a routerLink="/">Inicio</a></small>
    </form>
  </div>`,
})
export class RegistroComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  d: RegistroCliente = { nombre: '', apellido: '', telefono: '', correo: '', contrasena: '' };
  error = signal(''); cargando = signal(false);

  registrar() {
    this.cargando.set(true); this.error.set('');
    this.auth.registrar(this.d).subscribe({
      // Tras registrarse, inicia sesion automaticamente.
      next: () => this.auth.login(this.d.correo, this.d.contrasena).subscribe({
        next: () => this.router.navigate(['/panel']),
        error: () => this.router.navigate(['/login']),
      }),
      error: e => { this.error.set(e.error?.mensaje ?? 'No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }
}
