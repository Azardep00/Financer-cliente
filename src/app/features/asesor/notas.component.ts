import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Nota } from '../../core/models';
import { fechaCorta } from '../../core/formato';

/** Notas privadas del asesor sobre un cliente (el cliente nunca las ve). */
@Component({
  selector: 'app-notas-asesor',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .lista { list-style: none; margin: .75rem 0 0; padding: 0; display: grid; gap: .6rem; }
    .nota { border: 1px solid var(--borde); border-radius: var(--radio); padding: .75rem; background: var(--superficie); }
    .nota p { margin: 0 0 .4rem; white-space: pre-wrap; overflow-wrap: anywhere; }
    .nota footer { display: flex; justify-content: space-between; gap: .5rem; align-items: center; font-size: .8125rem; color: var(--suave); }
    .contador { font-size: .75rem; color: var(--suave); text-align: right; }
  `],
  template: `
    <section class="card" aria-labelledby="t-notas">
      <h2 id="t-notas" class="card-titulo">Notas privadas</h2>
      <p class="texto-suave" style="font-size:.8125rem">Solo las ve el asesor responsable. El cliente no tiene acceso.</p>
      <form (submit)="$event.preventDefault(); guardar()" novalidate>
        <div class="campo">
          <label for="nota-texto">Nueva nota</label>
          <textarea id="nota-texto" class="entrada" rows="3" name="texto" [(ngModel)]="texto" maxlength="1000"
                    placeholder="Acuerdos de la llamada, riesgos, ideas para el próximo mes…" [class.invalida]="intento() && !texto.trim()"></textarea>
          <div class="contador">{{ texto.length }}/1000</div>
        </div>
        <button type="submit" class="btn btn-primario btn-sm" [disabled]="ocupado()">Guardar nota</button>
      </form>

      @if (cargando()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando notas…</div>
      } @else if (error()) {
        <div class="aviso aviso-warn" style="margin-top:.75rem">No se pudieron cargar las notas.
          <button type="button" class="btn btn-fantasma btn-sm" (click)="cargar()">Reintentar</button></div>
      } @else if (notas().length === 0) {
        <div class="vacio" style="margin-top:.75rem"><strong>Sin notas</strong>Aún no has escrito ninguna nota sobre este cliente.</div>
      } @else {
        <ul class="lista">
          @for (n of notas(); track n.idNota) {
            <li class="nota">
              <p>{{ n.texto }}</p>
              <footer>
                <span>{{ n.asesor.nombre }} {{ n.asesor.apellido }} · {{ fecha(n.fechaCreacion) }}</span>
                @if (n.asesor.idUsuario === miId()) {
                  <button type="button" class="btn btn-fantasma btn-sm texto-mal" (click)="eliminar(n)" [attr.aria-label]="'Eliminar nota del ' + fecha(n.fechaCreacion)">Eliminar</button>
                }
              </footer>
            </li>
          }
        </ul>
      }
    </section>`,
})
export class NotasAsesorComponent implements OnChanges {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toasts = inject(ToastService);

  @Input({ required: true }) idCliente!: number;

  fecha = fechaCorta;
  notas = signal<Nota[]>([]);
  cargando = signal(true);
  error = signal(false);
  ocupado = signal(false);
  intento = signal(false);
  texto = '';
  miId = () => this.auth.sesion()?.idUsuario ?? -1;

  ngOnChanges(c: SimpleChanges) { if (c['idCliente']) this.cargar(); }

  cargar() {
    this.cargando.set(true); this.error.set(false);
    this.api.notas(this.idCliente).subscribe({
      // Más reciente primero.
      next: l => { this.notas.set([...l].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.idNota - a.idNota)); this.cargando.set(false); },
      error: () => { this.error.set(true); this.cargando.set(false); },
    });
  }

  guardar() {
    this.intento.set(true);
    const t = this.texto.trim();
    if (!t) return;
    this.ocupado.set(true);
    this.api.crearNota(this.idCliente, t).subscribe({
      next: () => { this.toasts.ok('Nota guardada.'); this.texto = ''; this.intento.set(false); this.ocupado.set(false); this.cargar(); },
      error: () => this.ocupado.set(false),
    });
  }

  eliminar(n: Nota) {
    if (!confirm('¿Eliminar esta nota? No se puede deshacer.')) return;
    this.api.eliminarNota(n.idNota).subscribe({
      next: () => { this.toasts.ok('Nota eliminada.'); this.notas.update(l => l.filter(x => x.idNota !== n.idNota)); },
    });
  }
}
