import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  <div class="auth">
    <form (ngSubmit)="entrar()">
      <h2>Ingresar</h2>
      <input type="email" name="correo" [(ngModel)]="correo" placeholder="Correo" required />
      <input type="password" name="contrasena" [(ngModel)]="contrasena" placeholder="Contraseña" required />
      @if (error()) { <div class="error">{{ error() }}</div> }
      <button class="btn" [disabled]="cargando()">{{ cargando() ? 'Entrando…' : 'Ingresar' }}</button>
      <small>¿No tienes cuenta? <a routerLink="/registro">Regístrate</a> · <a routerLink="/">Inicio</a></small>
    </form>
  </div>`,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  correo = ''; contrasena = '';
  error = signal(''); cargando = signal(false);

  entrar() {
    this.cargando.set(true); this.error.set('');
    this.auth.login(this.correo, this.contrasena).subscribe({
      next: () => this.router.navigate(['/panel']),
      error: e => { this.error.set(e.error?.mensaje ?? 'No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }
}
