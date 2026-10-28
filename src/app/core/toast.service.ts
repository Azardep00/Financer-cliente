import { Injectable, signal } from '@angular/core';

export type TipoToast = 'info' | 'ok' | 'warn' | 'mal';
export interface Toast { id: number; tipo: TipoToast; texto: string; }

/** Avisos visibles en pantalla (esquina superior derecha). Se cierran solos o con la X. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly lista = signal<Toast[]>([]);
  private siguiente = 1;

  mostrar(tipo: TipoToast, texto: string, ms = 6000) {
    // Evita apilar el mismo aviso varias veces (por ejemplo, varias peticiones fallando a la vez).
    if (this.lista().some(t => t.texto === texto)) return;
    const id = this.siguiente++;
    this.lista.update(l => [...l, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), ms);
  }

  info(texto: string) { this.mostrar('info', texto); }
  ok(texto: string) { this.mostrar('ok', texto, 4000); }
  warn(texto: string) { this.mostrar('warn', texto); }
  error(texto: string) { this.mostrar('mal', texto, 8000); }

  cerrar(id: number) { this.lista.update(l => l.filter(t => t.id !== id)); }
}
