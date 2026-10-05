import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';

// Placeholder: aqui van "Mi diagnostico", "Mi plan" y el dashboard de progreso.
@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
  <div class="auth">
    <form>
      <h2>¡Hola, {{ auth.sesion()?.nombre }}!</h2>
      <p>Tu sesión funciona ({{ auth.sesion()?.tipoUsuario }}). Pronto verás aquí tu diagnóstico, tu plan y tu progreso.</p>
      <button type="button" class="btn sec" (click)="auth.logout()">Cerrar sesión</button>
    </form>
  </div>`,
})
export class PanelComponent { auth = inject(AuthService); }
