import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
    <div class="pila" aria-live="polite">
      @for (t of toasts.lista(); track t.id) {
        <div class="toast" [class]="'toast ' + t.tipo" [attr.role]="t.tipo === 'mal' ? 'alert' : 'status'">
          <span class="texto">{{ t.texto }}</span>
          <button type="button" class="cerrar" (click)="toasts.cerrar(t.id)" aria-label="Cerrar aviso">×</button>
        </div>
      }
    </div>`,
  styles: [`
    .pila { position: fixed; top: 1rem; right: 1rem; z-index: 1000; display: grid; gap: .5rem;
      width: min(380px, calc(100vw - 2rem)); pointer-events: none; }
    .toast { pointer-events: auto; display: flex; gap: .75rem; align-items: flex-start; padding: .75rem .9rem;
      background: #fff; border: 1px solid var(--borde); border-left-width: 4px; border-radius: 8px;
      box-shadow: var(--sombra-alta); font-size: .875rem; }
    .toast.info { border-left-color: var(--primario); }
    .toast.ok { border-left-color: var(--ok); }
    .toast.warn { border-left-color: var(--warn); }
    .toast.mal { border-left-color: var(--mal); }
    .texto { flex: 1; }
    .cerrar { border: 0; background: transparent; font-size: 1.25rem; line-height: 1; cursor: pointer; color: var(--suave); padding: 0 .1rem; }
    .cerrar:hover { color: var(--texto); }
  `],
})
export class ToastComponent {
  toasts = inject(ToastService);
}
