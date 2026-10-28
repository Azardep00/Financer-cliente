import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensajeError } from '../../core/errores';
import { ToastService } from '../../core/toast.service';
import { Asesor } from '../../core/models';

/** Equipo de asesores y alta de nuevos asesores (solo un asesor puede crear otros). */
@Component({
  selector: 'app-asesores',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem 1rem; }
    .ancho { grid-column: 1 / -1; }
    .equipo { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
    .equipo li { display: flex; gap: .75rem; align-items: center; border: 1px solid var(--borde); border-radius: var(--radio); padding: .6rem .9rem; background: var(--superficie); }
    .equipo .av { width: 2.2rem; height: 2.2rem; border-radius: 50%; background: var(--primario-bg); color: var(--primario-osc); display: grid; place-items: center; font-weight: 600; flex: none; }
    .equipo .dat { min-width: 0; } .equipo .dat small { display: block; color: var(--suave); overflow-wrap: anywhere; }
    @media (max-width: 780px) { .form { grid-template-columns: minmax(0, 1fr); } }
  `],
  template: `
    <div class="pagina">
      <div class="pagina-encabezado"><div><h1>Asesores</h1><p>Equipo de asesores y alta de nuevos asesores.</p></div></div>

      <section class="card" aria-labelledby="t-nuevo-as">
        <h2 id="t-nuevo-as" class="card-titulo">Crear asesor</h2>
        <form class="form" (submit)="$event.preventDefault(); crear()" novalidate>
          <div class="campo"><label for="a-nom">Nombre</label>
            <input id="a-nom" class="entrada" name="nom" autocomplete="off" [(ngModel)]="f.nombre" [class.invalida]="intento() && !f.nombre.trim()" /></div>
          <div class="campo"><label for="a-ape">Apellido</label>
            <input id="a-ape" class="entrada" name="ape" autocomplete="off" [(ngModel)]="f.apellido" [class.invalida]="intento() && !f.apellido.trim()" /></div>
          <div class="campo"><label for="a-esp">Especialidad (opcional)</label>
            <input id="a-esp" class="entrada" name="esp" autocomplete="off" [(ngModel)]="f.especialidad" placeholder="Ej.: Manejo de deuda" /></div>
          <div class="campo"><label for="a-cor">Correo</label>
            <input id="a-cor" class="entrada" type="email" name="cor" autocomplete="off" [(ngModel)]="f.correo" [class.invalida]="intento() && !correoValido()" /></div>
          <div class="campo ancho"><label for="a-pas">Contraseña temporal</label>
            <input id="a-pas" class="entrada" type="password" name="pas" autocomplete="new-password" [(ngModel)]="f.contrasena" [class.invalida]="intento() && f.contrasena.length < 6" />
            <span class="campo-ayuda">Mínimo 6 caracteres. Compártela con el nuevo asesor por un canal seguro.</span></div>
          @if (error()) { <p class="campo-error ancho" role="alert">{{ error() }}</p> }
          <div class="ancho"><button type="submit" class="btn btn-primario" [disabled]="ocupado()">Crear asesor</button></div>
        </form>
      </section>

      <section style="margin-top:1rem" aria-labelledby="t-eq">
        <h2 id="t-eq" style="font-size:1.05rem;margin:0 0 .5rem">Equipo ({{ asesores().length }})</h2>
        @if (cargando()) {
          <div class="cargando" role="status"><span class="giro"></span> Cargando asesores…</div>
        } @else if (errorLista()) {
          <div class="aviso aviso-warn">No se pudo cargar la lista de asesores. <button type="button" class="btn btn-fantasma btn-sm" (click)="cargar()">Reintentar</button></div>
        } @else if (asesores().length === 0) {
          <div class="vacio"><strong>Sin asesores</strong>Crea el primero con el formulario de arriba.</div>
        } @else {
          <ul class="equipo">
            @for (a of asesores(); track a.idUsuario) {
              <li><span class="av" aria-hidden="true">{{ (a.nombre[0] || '') + (a.apellido[0] || '') }}</span>
                <span class="dat"><b>{{ a.nombre }} {{ a.apellido }}</b><small>{{ a.correo }}{{ a.especialidad ? ' · ' + a.especialidad : '' }}</small></span></li>
            }
          </ul>
        }
      </section>
    </div>`,
})
export class AsesoresComponent implements OnInit {
  private api = inject(ApiService);
  private toasts = inject(ToastService);

  asesores = signal<Asesor[]>([]);
  cargando = signal(true);
  errorLista = signal(false);
  ocupado = signal(false);
  intento = signal(false);
  error = signal('');
  f = { nombre: '', apellido: '', especialidad: '', correo: '', contrasena: '' };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true); this.errorLista.set(false);
    this.api.listarAsesores().subscribe({
      next: l => { this.asesores.set([...l].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))); this.cargando.set(false); },
      error: () => { this.errorLista.set(true); this.cargando.set(false); },
    });
  }

  correoValido = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.f.correo.trim());

  crear() {
    this.intento.set(true); this.error.set('');
    const f = this.f;
    if (!f.nombre.trim() || !f.apellido.trim()) { this.error.set('Completa nombre y apellido.'); return; }
    if (!this.correoValido()) { this.error.set('Escribe un correo válido.'); return; }
    if (f.contrasena.length < 6) { this.error.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    this.ocupado.set(true);
    this.api.registrarAsesor({
      nombre: f.nombre.trim(), apellido: f.apellido.trim(), especialidad: f.especialidad.trim() || undefined,
      correo: f.correo.trim(), contrasena: f.contrasena,
    }).subscribe({
      next: s => {
        this.toasts.ok(`Asesor ${s.nombre} ${s.apellido} creado.`);
        this.f = { nombre: '', apellido: '', especialidad: '', correo: '', contrasena: '' };
        this.intento.set(false); this.ocupado.set(false); this.cargar();
      },
      error: e => { this.error.set(mensajeError(e, 'No se pudo crear el asesor.')); this.ocupado.set(false); },
    });
  }
}
