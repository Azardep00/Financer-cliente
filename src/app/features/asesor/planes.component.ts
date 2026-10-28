import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { mensajeError } from '../../core/errores';
import { ToastService } from '../../core/toast.service';
import { CierreResponse, Cliente, Diagnostico, Meta, MetaRequest, Plan } from '../../core/models';
import { cop, fechaCorta, hoyIso, periodoLargo } from '../../core/formato';
import { ETIQ_TIPO, MetaFormComponent } from './meta-form.component';

type Panel = 'ninguno' | 'cerrar' | 'cancelar';

/** Planes y metas de un cliente, vistos por el asesor (F6). */
@Component({
  selector: 'app-planes-asesor',
  standalone: true,
  imports: [FormsModule, MetaFormComponent],
  styleUrl: './planes.css',
  template: `
    <section aria-labelledby="t-planes">
      <h2 id="t-planes" class="sec">Plan del mes</h2>

      @if (cargando()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando planes…</div>
      } @else {

        @if (resultado(); as r) {
          <div class="aviso aviso-ok" role="status">
            Mes {{ periodo(r.cierre.periodo) }} cerrado con {{ r.cierre.progreso.toFixed(0) }}% de avance:
            {{ r.cierre.metasCumplidas }} de {{ r.cierre.metasTotal }} metas cumplidas.
            @if (r.siguientePlan) { Se creó el plan de {{ periodo(r.siguientePlan.periodo) }}
              @if (r.cierre.metasArrastradas > 0) { con {{ r.cierre.metasArrastradas }} meta(s) pendiente(s) arrastrada(s) }.
            } @else { No se creó plan para el mes siguiente. }
            <button type="button" class="btn btn-fantasma btn-sm" (click)="resultado.set(null)">Cerrar aviso</button>
          </div>
        }

        @if (activo(); as p) {
          <div class="card" [class.sep]="resultado()">
            <div class="plan-cab">
              <div>
                @if (editandoPlan()) {
                  <form class="form-plan" (submit)="$event.preventDefault(); guardarPlan()" novalidate>
                    <div class="campo ancho-total"><label for="p-tit">Título</label>
                      <input id="p-tit" class="entrada" name="tit" [(ngModel)]="edTitulo" maxlength="150" [class.invalida]="!edTitulo.trim()" /></div>
                    <div class="campo ancho-total"><label for="p-desc">Descripción (opcional)</label>
                      <textarea id="p-desc" class="entrada" rows="2" name="desc" [(ngModel)]="edDesc"></textarea></div>
                    <div class="acciones ancho-total">
                      <button type="submit" class="btn btn-primario btn-sm" [disabled]="ocupado()">Guardar cambios</button>
                      <button type="button" class="btn btn-fantasma btn-sm" (click)="editandoPlan.set(false)">Cancelar</button>
                    </div>
                  </form>
                } @else {
                  <h3>{{ p.titulo }}</h3>
                  <p class="texto-suave peq">{{ periodo(p.periodo) }} · {{ fecha(p.periodoInicio) }} al {{ fecha(p.periodoFin) }}</p>
                  @if (p.descripcion) { <p>{{ p.descripcion }}</p> }
                }
              </div>
              <span class="etiqueta-estado etiqueta-ok">Activo</span>
            </div>

            <div class="sep" role="group" [attr.aria-label]="'Avance del plan: ' + p.progreso.toFixed(0) + '%'">
              <div class="vivo-fila" style="display:flex;justify-content:space-between"><span class="texto-suave peq">Avance del plan</span><b>{{ p.progreso.toFixed(0) }}%</b></div>
              <div class="barra"><span [style.width.%]="p.progreso"></span></div>
            </div>

            @if (p.metas.length === 0) {
              <div class="vacio sep"><strong>Sin metas</strong>Agrega la primera meta para que el cliente tenga qué cumplir este mes.</div>
            } @else {
              <ul class="metas">
                @for (m of p.metas; track m.idMeta) {
                  <li class="meta" [class.hecha]="m.completada">
                    @if (metaEditando() === m.idMeta) {
                      <app-meta-form [meta]="m" [ultimo]="ultimo" etiqueta="Guardar meta" [ocupado]="ocupado()"
                        [min]="p.periodoInicio" [max]="p.periodoFin" (guardar)="guardarMeta(m, $event)" (cancelar)="metaEditando.set(null)" />
                    } @else {
                      <div class="meta-fila">
                        <input type="checkbox" [checked]="m.completada" [disabled]="!puede || ocupado()"
                               [attr.aria-label]="'Marcar como cumplida: ' + m.descripcion" (change)="alternar(m)" />
                        <div class="meta-texto">
                          <b>{{ m.descripcion }}</b>
                          <small>{{ detalleMeta(m) }}</small>
                          @if (vencida(m)) { <small class="texto-mal">Vencida el {{ fecha(m.fechaLimite) }}</small> }
                          @else if (m.fechaLimite) { <small>Fecha límite: {{ fecha(m.fechaLimite) }}</small> }
                          @if (m.origenMetaId) { <small>Arrastrada del mes anterior</small> }
                        </div>
                        @if (puede) {
                          <div class="meta-acc">
                            <button type="button" class="btn btn-fantasma btn-sm" (click)="metaEditando.set(m.idMeta); agregando.set(false)"
                                    [attr.aria-label]="'Editar meta: ' + m.descripcion">Editar</button>
                            <button type="button" class="btn btn-fantasma btn-sm texto-mal" (click)="quitar(m)"
                                    [attr.aria-label]="'Quitar meta: ' + m.descripcion">Quitar</button>
                          </div>
                        }
                      </div>
                      @if (m.medible) { <div class="barra fina" role="img" [attr.aria-label]="'Avance de la meta ' + m.progreso.toFixed(0) + '%'"><span [style.width.%]="m.progreso"></span></div> }
                    }
                  </li>
                }
              </ul>
            }

            @if (puede) {
              @if (agregando()) {
                <app-meta-form etiqueta="Agregar meta" [ultimo]="ultimo" [ocupado]="ocupado()" [min]="p.periodoInicio" [max]="p.periodoFin"
                  (guardar)="agregarMeta(p, $event)" (cancelar)="agregando.set(false)" />
              }
              <div class="acciones sep">
                @if (!agregando()) { <button type="button" class="btn btn-secundario btn-sm" (click)="agregando.set(true); metaEditando.set(null)">+ Agregar meta</button> }
                @if (!editandoPlan()) { <button type="button" class="btn btn-fantasma btn-sm" (click)="editarPlan(p)">Editar título y descripción</button> }
                <span style="flex:1"></span>
                <button type="button" class="btn btn-primario btn-sm" (click)="abrir('cerrar', p)">Cerrar mes</button>
                <button type="button" class="btn btn-fantasma btn-sm texto-mal" (click)="abrir('cancelar', p)">Cancelar plan</button>
              </div>

              @if (panel() === 'cerrar') {
                <form class="panel-cierre" (submit)="$event.preventDefault(); cerrar(p)" novalidate aria-label="Cerrar mes">
                  <strong>Cerrar {{ periodo(p.periodo) }}</strong>
                  <p class="texto-suave peq">Quedan {{ pendientes(p) }} meta(s) pendiente(s) de {{ p.metas.length }}. Al cerrar, este plan queda en solo lectura.</p>
                  <div class="campo"><label for="c-nota">Nota de cierre (opcional)</label>
                    <textarea id="c-nota" class="entrada" rows="3" name="nota" [(ngModel)]="cierre.nota" placeholder="Cómo le fue al cliente este mes…"></textarea></div>
                  <label class="check"><input type="checkbox" name="sig" [(ngModel)]="cierre.crearSiguiente" /> Crear el plan del mes siguiente</label>
                  @if (cierre.crearSiguiente) {
                    <label class="check"><input type="checkbox" name="arr" [(ngModel)]="cierre.arrastrar" /> Arrastrar las metas pendientes al nuevo plan</label>
                    <div class="campo"><label for="c-tit">Título del siguiente plan (opcional)</label>
                      <input id="c-tit" class="entrada" name="tit" [(ngModel)]="cierre.titulo" placeholder="Si lo dejas vacío: «Plan aaaa-mm»" /></div>
                  }
                  <div class="acciones">
                    <button type="submit" class="btn btn-primario btn-sm" [disabled]="ocupado()">Confirmar cierre</button>
                    <button type="button" class="btn btn-fantasma btn-sm" (click)="panel.set('ninguno')">Volver</button>
                  </div>
                </form>
              }
              @if (panel() === 'cancelar') {
                <form class="panel-cierre peligro" (submit)="$event.preventDefault(); cancelar(p)" novalidate aria-label="Cancelar plan">
                  <strong>Cancelar el plan de {{ periodo(p.periodo) }}</strong>
                  <p class="peq">El plan se descarta y deja de contar. Después podrás crear otro para el mismo mes.</p>
                  <div class="campo"><label for="x-mot">Motivo (opcional)</label>
                    <textarea id="x-mot" class="entrada" rows="2" name="mot" [(ngModel)]="motivo"></textarea></div>
                  <div class="acciones">
                    <button type="submit" class="btn btn-peligro btn-sm" [disabled]="ocupado()">Sí, cancelar plan</button>
                    <button type="button" class="btn btn-fantasma btn-sm" (click)="panel.set('ninguno')">Volver</button>
                  </div>
                </form>
              }
            } @else {
              <p class="texto-suave peq sep">Solo el asesor responsable puede modificar el plan.</p>
            }
          </div>
        } @else {
          <div class="card" [class.sep]="resultado()">
            <p class="texto-suave">Este cliente no tiene un plan activo.</p>
            @if (!puede) {
              <p class="texto-suave peq">Solo el asesor responsable puede crear planes.</p>
            } @else if (!creando()) {
              <button type="button" class="btn btn-primario" (click)="iniciarCreacion()">Crear plan del mes</button>
            } @else {
              @if (!cliente.asesorAsignado) { <div class="aviso aviso-info">Este cliente no tiene asesor: al crear el plan quedará asignado a ti.</div> }
              @if (cliente.estadoCliente === 'PROSPECTO') { <div class="aviso aviso-info sep">Al crear el primer plan, el prospecto pasa a cliente activo.</div> }
              <form class="form-plan sep" (submit)="$event.preventDefault(); crear()" novalidate>
                <div class="campo"><label for="n-tit">Título</label>
                  <input id="n-tit" class="entrada" name="tit" [(ngModel)]="nuevo.titulo" maxlength="150" [class.invalida]="intento() && !nuevo.titulo.trim()" /></div>
                <div class="campo"><label for="n-per">Mes del plan</label>
                  <input id="n-per" class="entrada" type="month" name="per" [(ngModel)]="nuevo.periodo" [class.invalida]="intento() && !nuevo.periodo" /></div>
                <div class="campo ancho-total"><label for="n-desc">Descripción (opcional)</label>
                  <textarea id="n-desc" class="entrada" rows="2" name="desc" [(ngModel)]="nuevo.descripcion"></textarea></div>

                <div class="ancho-total">
                  <h3 class="sec">Metas del plan ({{ borrador().length }})</h3>
                  @if (borrador().length === 0) { <p class="texto-suave peq">Puedes crear el plan sin metas y agregarlas después.</p> }
                  <ul class="borrador">
                    @for (m of borrador(); track $index) {
                      <li><span><b>{{ m.descripcion }}</b><br><small class="texto-suave">{{ resumenBorrador(m) }}</small></span>
                        <button type="button" class="btn btn-fantasma btn-sm texto-mal" (click)="quitarBorrador($index)" [attr.aria-label]="'Quitar ' + m.descripcion">Quitar</button></li>
                    }
                  </ul>
                </div>
                @if (agregandoBorrador()) {
                  <div class="ancho-total"><app-meta-form etiqueta="Añadir al plan" [ultimo]="ultimo" (guardar)="anadirBorrador($event)" (cancelar)="agregandoBorrador.set(false)" /></div>
                } @else {
                  <div class="ancho-total"><button type="button" class="btn btn-secundario btn-sm" (click)="agregandoBorrador.set(true)">+ Añadir meta</button></div>
                }
                @if (errorForm()) { <p class="campo-error ancho-total" role="alert">{{ errorForm() }}</p> }
                <div class="acciones ancho-total">
                  <button type="submit" class="btn btn-primario" [disabled]="ocupado()">Crear plan</button>
                  <button type="button" class="btn btn-fantasma" (click)="creando.set(false)">Cancelar</button>
                </div>
              </form>
            }
          </div>
        }

        <section class="sep" aria-labelledby="t-hplanes">
          <h2 id="t-hplanes" class="sec">Historial de planes</h2>
          @if (anteriores().length === 0) {
            <div class="vacio"><strong>Sin planes anteriores</strong>Los planes cerrados o cancelados aparecerán aquí.</div>
          } @else {
            <div class="hist">
              @for (p of anteriores(); track p.idPlan) {
                <details>
                  <summary>
                    <b>{{ periodo(p.periodo) }} · {{ p.titulo }}</b>
                    <span class="etiqueta-estado" [class]="p.estado === 'CERRADO' ? 'etiqueta-info' : 'etiqueta-warn'">{{ p.estado === 'CERRADO' ? 'Cerrado' : 'Cancelado' }}</span>
                    <span class="texto-suave peq">{{ p.progreso.toFixed(0) }}%</span>
                  </summary>
                  <div class="det">
                    @if (p.fechaCierre) { <p class="texto-suave peq">{{ p.estado === 'CERRADO' ? 'Cerrado' : 'Cancelado' }} el {{ fecha(p.fechaCierre) }}</p> }
                    @if (p.notaCierre) { <p><b>{{ p.estado === 'CERRADO' ? 'Nota de cierre' : 'Motivo' }}:</b> {{ p.notaCierre }}</p> }
                    <div class="barra fina"><span [style.width.%]="p.progreso"></span></div>
                    @if (p.metas.length === 0) { <p class="texto-suave peq">Sin metas.</p> }
                    <ul>
                      @for (m of p.metas; track m.idMeta) {
                        <li>{{ m.completada ? '✔' : '○' }} {{ m.descripcion }} <span class="texto-suave">— {{ detalleMeta(m) }}</span></li>
                      }
                    </ul>
                  </div>
                </details>
              }
            </div>
          }
        </section>
      }
    </section>`,
})
export class PlanesAsesorComponent implements OnInit {
  constructor(private api: ApiService, private toasts: ToastService) {}

  @Input({ required: true }) cliente!: Cliente;
  /** Solo el asesor responsable (o cualquiera si no hay asesor) puede modificar. */
  @Input() puede = false;
  @Input() ultimo: Diagnostico | null = null;
  /** Avisa a la ficha para que refresque estado, asesor e indicadores. */
  @Output() cambio = new EventEmitter<void>();

  cop = cop; fecha = fechaCorta; periodo = periodoLargo;

  cargando = signal(true);
  ocupado = signal(false);
  activo = signal<Plan | null>(null);
  anteriores = signal<Plan[]>([]);
  resultado = signal<CierreResponse | null>(null);

  panel = signal<Panel>('ninguno');
  editandoPlan = signal(false);
  agregando = signal(false);
  metaEditando = signal<number | null>(null);
  creando = signal(false);
  agregandoBorrador = signal(false);
  borrador = signal<MetaRequest[]>([]);
  intento = signal(false);
  errorForm = signal('');

  edTitulo = ''; edDesc = ''; motivo = '';
  cierre = { nota: '', crearSiguiente: true, arrastrar: true, titulo: '' };
  nuevo = { titulo: '', descripcion: '', periodo: hoyIso().slice(0, 7) };

  ngOnInit() { this.cargar(); }

  cargar(silencioso = false) {
    if (!silencioso) this.cargando.set(true);
    forkJoin({
      activo: this.api.planActivo(this.cliente.idUsuario).pipe(catchError(() => of(null))),
      todos: this.api.historialPlanes(this.cliente.idUsuario).pipe(catchError(() => of([] as Plan[]))),
    }).subscribe(r => {
      this.activo.set(r.activo);
      this.anteriores.set(r.todos.filter(p => p.estado !== 'ACTIVO'));
      this.cargando.set(false);
    });
  }

  /** Vuelve a cargar y avisa a la ficha (el estado del cliente o su asesor pueden haber cambiado). */
  private refrescar() {
    this.panel.set('ninguno'); this.agregando.set(false); this.metaEditando.set(null); this.editandoPlan.set(false);
    this.cargar(true); this.cambio.emit();
  }

  detalleMeta(m: Meta): string {
    if (!m.medible) return m.completada ? 'Meta de texto · cumplida' : 'Meta de texto · pendiente';
    const t = ETIQ_TIPO[m.tipo];
    return `${t} · de ${cop(m.valorInicial)} a ${cop(m.montoObjetivo)} · actual ${cop(m.valorActual ?? m.valorInicial)} (${m.progreso.toFixed(0)}%)`;
  }
  resumenBorrador(m: MetaRequest) {
    return !m.tipo || m.tipo === 'TEXTO' ? 'Meta de texto' : `${ETIQ_TIPO[m.tipo]} · de ${cop(m.valorInicial)} a ${cop(m.montoObjetivo)}`;
  }
  vencida = (m: Meta) => !m.completada && !!m.fechaLimite && m.fechaLimite < hoyIso();
  pendientes = (p: Plan) => p.metas.filter(m => !m.completada).length;

  // ---------- Crear ----------
  iniciarCreacion() {
    this.creando.set(true); this.intento.set(false); this.errorForm.set(''); this.borrador.set([]);
    this.nuevo = { titulo: '', descripcion: '', periodo: hoyIso().slice(0, 7) };
  }
  anadirBorrador(m: MetaRequest) { this.borrador.update(l => [...l, m]); this.agregandoBorrador.set(false); }
  quitarBorrador(i: number) { this.borrador.update(l => l.filter((_, k) => k !== i)); }

  crear() {
    this.intento.set(true); this.errorForm.set('');
    if (!this.nuevo.titulo.trim()) { this.errorForm.set('Escribe un título para el plan.'); return; }
    if (!this.nuevo.periodo) { this.errorForm.set('Elige el mes del plan.'); return; }
    this.ocupado.set(true);
    this.api.crearPlan(this.cliente.idUsuario, {
      titulo: this.nuevo.titulo.trim(), descripcion: this.nuevo.descripcion.trim() || null,
      periodo: this.nuevo.periodo + '-01', metas: this.borrador(),
    }).subscribe({
      next: () => { this.toasts.ok('Plan creado.'); this.creando.set(false); this.ocupado.set(false); this.refrescar(); },
      error: e => { this.errorForm.set(mensajeError(e, 'No se pudo crear el plan.')); this.ocupado.set(false); },
    });
  }

  // ---------- Editar plan ----------
  editarPlan(p: Plan) { this.edTitulo = p.titulo; this.edDesc = p.descripcion ?? ''; this.editandoPlan.set(true); }
  guardarPlan() {
    const p = this.activo(); if (!p || !this.edTitulo.trim()) return;
    this.ocupado.set(true);
    this.api.actualizarPlan(p.idPlan, { titulo: this.edTitulo.trim(), descripcion: this.edDesc.trim() || null }).subscribe({
      next: n => { this.activo.set(n); this.editandoPlan.set(false); this.ocupado.set(false); this.toasts.ok('Plan actualizado.'); },
      error: () => this.ocupado.set(false),
    });
  }

  // ---------- Metas ----------
  agregarMeta(p: Plan, req: MetaRequest) {
    this.ocupado.set(true);
    this.api.agregarMeta(p.idPlan, req).subscribe({
      next: () => { this.toasts.ok('Meta agregada.'); this.ocupado.set(false); this.agregando.set(false); this.cargar(true); this.cambio.emit(); },
      error: () => this.ocupado.set(false),
    });
  }
  guardarMeta(m: Meta, req: MetaRequest) {
    this.ocupado.set(true);
    this.api.editarMeta(m.idMeta, req).subscribe({
      next: () => { this.toasts.ok('Meta actualizada.'); this.ocupado.set(false); this.metaEditando.set(null); this.cargar(true); this.cambio.emit(); },
      error: () => this.ocupado.set(false),
    });
  }
  quitar(m: Meta) {
    if (!confirm(`¿Quitar la meta «${m.descripcion}»? Esta acción no se puede deshacer.`)) return;
    this.ocupado.set(true);
    this.api.eliminarMeta(m.idMeta).subscribe({
      next: () => { this.toasts.ok('Meta eliminada.'); this.ocupado.set(false); this.cargar(true); this.cambio.emit(); },
      error: () => this.ocupado.set(false),
    });
  }
  alternar(m: Meta) {
    this.ocupado.set(true);
    const llamada = m.completada ? this.api.pendienteMeta(m.idMeta) : this.api.completarMeta(m.idMeta);
    llamada.subscribe({
      next: () => { this.ocupado.set(false); this.cargar(true); this.cambio.emit(); },
      error: () => { this.ocupado.set(false); this.cargar(true); },
    });
  }

  // ---------- Cerrar / cancelar ----------
  abrir(p: Panel, plan: Plan) {
    this.panel.set(p);
    if (p === 'cerrar') this.cierre = { nota: '', crearSiguiente: true, arrastrar: plan.metas.some(m => !m.completada), titulo: '' };
    else this.motivo = '';
  }
  cerrar(p: Plan) {
    this.ocupado.set(true);
    this.api.cerrarPlan(p.idPlan, {
      notaCierre: this.cierre.nota.trim() || undefined,
      crearSiguiente: this.cierre.crearSiguiente,
      arrastrarPendientes: this.cierre.crearSiguiente && this.cierre.arrastrar,
      tituloSiguiente: this.cierre.crearSiguiente ? this.cierre.titulo.trim() || undefined : undefined,
    }).subscribe({
      next: r => { this.resultado.set(r); this.ocupado.set(false); this.refrescar(); },
      error: () => this.ocupado.set(false),
    });
  }
  cancelar(p: Plan) {
    this.ocupado.set(true);
    this.api.cancelarPlan(p.idPlan, this.motivo.trim() || undefined).subscribe({
      next: () => { this.toasts.ok('Plan cancelado.'); this.ocupado.set(false); this.refrescar(); },
      error: () => this.ocupado.set(false),
    });
  }
}