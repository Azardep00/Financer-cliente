import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/errores';
import { ToastService } from '../../core/toast.service';
import { Asesor, Cliente, Diagnostico, EstadoCliente, ESTADOS_CLIENTE, Progreso } from '../../core/models';
import { cop, fechaCorta, hoyIso } from '../../core/formato';
import { indicadores } from '../../core/indicadores';
import { GraficoEvolucionComponent } from '../../core/grafico-evolucion.component';
import { ETIQ_ESTADO } from './clientes.component';
import { PlanesAsesorComponent } from './planes.component';
import { NotasAsesorComponent } from './notas.component';

@Component({
  selector: 'app-asesor-ficha',
  standalone: true,
  imports: [FormsModule, RouterLink, GraficoEvolucionComponent, PlanesAsesorComponent, NotasAsesorComponent],
  styleUrl: './ficha.css',
  template: `
    <div class="pagina ancha">
      <a routerLink="/asesor/clientes" class="volver">← Volver a clientes</a>

      @if (cargando()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando ficha…</div>
      } @else if (!cliente()) {
        <div class="vacio"><strong>No se pudo cargar el cliente</strong>Puede que no exista o que no tengas acceso.
          <div><a routerLink="/asesor/clientes" class="btn btn-secundario btn-sm">Volver al panel</a></div></div>
      } @else {
        @let c = cliente()!;
        <div class="pagina-encabezado">
          <div>
            <h1>{{ c.nombre }} {{ c.apellido }}</h1>
            <p>{{ c.correo }} · {{ c.telefono }}</p>
          </div>
          <span class="etiqueta-estado" [class]="etq[c.estadoCliente].c">{{ etq[c.estadoCliente].t }}</span>
        </div>

        @if (!puedeGestionar()) {
          <div class="aviso aviso-warn sep">Este cliente lo atiende {{ c.asesorAsignado?.nombre }} {{ c.asesorAsignado?.apellido }}.
            Puedes ver su información, pero solo su asesor responsable puede cambiar el estado, traspasarlo o registrar diagnósticos.</div>
        }

        <div class="rejilla rejilla-2 sep">
          <section class="card" aria-labelledby="t-gestion">
            <h2 id="t-gestion" class="card-titulo">Gestión</h2>
            <div class="campo">
              <label for="estado">Estado del cliente</label>
              <div class="en-linea">
                <select id="estado" class="entrada" [(ngModel)]="estadoNuevo" [disabled]="!puedeGestionar()">
                  @for (e of estados; track e) { <option [value]="e">{{ etq[e].t }}</option> }
                </select>
                <button type="button" class="btn btn-primario btn-sm" [disabled]="!puedeGestionar() || estadoNuevo === c.estadoCliente || guardando()"
                        (click)="cambiarEstado()">Guardar</button>
              </div>
            </div>

            <div class="campo sep">
              <label for="asesor">Asesor asignado</label>
              <p class="texto-suave">
                @if (c.asesorAsignado) { Actual: <b>{{ c.asesorAsignado.nombre }} {{ c.asesorAsignado.apellido }}</b>
                  @if (c.asesorAsignado.idUsuario === miId()) { (tú) } }
                @else { Sin asesor asignado. }
              </p>
              @if (puedeGestionar()) {
                <div class="en-linea">
                  <select id="asesor" class="entrada" [(ngModel)]="asesorNuevo">
                    <option [ngValue]="null">Elegir asesor…</option>
                    @for (a of asesores(); track a.idUsuario) {
                      <option [ngValue]="a.idUsuario">{{ a.nombre }} {{ a.apellido }}{{ a.especialidad ? ' · ' + a.especialidad : '' }}</option>
                    }
                  </select>
                  <button type="button" class="btn btn-secundario btn-sm" [disabled]="asesorNuevo === null || asesorNuevo === c.asesorAsignado?.idUsuario || guardando()"
                          (click)="asignar()">{{ c.asesorAsignado ? 'Traspasar' : 'Asignar' }}</button>
                </div>
                @if (c.asesorAsignado && asesorNuevo !== null && asesorNuevo !== miId()) {
                  <p class="campo-ayuda">Al traspasarlo dejarás de poder gestionar a este cliente.</p>
                }
                @if (errorAsesores()) { <p class="campo-error">No se pudo cargar la lista de asesores. ¿El backend tiene el endpoint GET /api/asesores?</p> }
              }
            </div>
          </section>

          <section class="card" aria-labelledby="t-ind">
            <h2 id="t-ind" class="card-titulo">Indicadores{{ ultimo() ? ' · ' + fecha(ultimo()!.fecha) : '' }}</h2>
            @if (ultimo()) {
              <ul class="inds">
                @for (i of indsUltimo(); track i.clave) {
                  <li><span>{{ i.nombre }}<small class="texto-suave">{{ i.meta }}</small></span>
                    <b>{{ i.valor }}</b><span class="etiqueta-estado" [class]="'etiqueta-' + i.estado">{{ i.texto }}</span></li>
                }
              </ul>
              @if (progreso()?.variacion; as v) {
                <p class="texto-suave peq">Variación desde el primer diagnóstico: tasa de ahorro {{ v.tasaAhorro > 0 ? '+' : '' }}{{ v.tasaAhorro.toFixed(1) }} pts,
                  deuda {{ v.deudaTotal > 0 ? '+' : '' }}{{ cop(v.deudaTotal) }}, ahorro {{ v.ahorroActual > 0 ? '+' : '' }}{{ cop(v.ahorroActual) }}.</p>
              }
            } @else {
              <p class="texto-suave">Este cliente aún no tiene diagnósticos. Registra el primero abajo.</p>
            }
          </section>
        </div>

        @if (progreso() && progreso()!.historial.length > 0) {
          <section class="sep" aria-labelledby="t-prog">
            <h2 id="t-prog" class="sec">Progreso</h2>
            <p class="texto-suave peq">Metas cumplidas: {{ progreso()!.metasCompletadas }} de {{ progreso()!.metasTotales }} · Avance del plan activo: {{ progreso()!.progresoPlan.toFixed(0) }}%</p>
            <div class="rejilla rejilla-3">
              <div class="card"><div class="card-titulo">Tasa de ahorro (%)</div>
                <app-grafico-evolucion titulo="Tasa de ahorro" [vals]="serie('tasaAhorro')" [fechas]="fechas()" [ref]="20" color="#0f8f6b" /></div>
              <div class="card"><div class="card-titulo">Deuda / ingreso anual (%)</div>
                <app-grafico-evolucion titulo="Deuda sobre ingreso anual" [vals]="serie('relacionDeudaIngreso')" [fechas]="fechas()" [ref]="36" color="#c0392b" /></div>
              <div class="card"><div class="card-titulo">Ahorro actual</div>
                <app-grafico-evolucion titulo="Ahorro actual" [vals]="serie('ahorroActual')" [fechas]="fechas()" [fmt]="cop" /></div>
            </div>
          </section>
        }

        <section class="card sep" aria-labelledby="t-nuevo">
          <h2 id="t-nuevo" class="card-titulo">Nuevo diagnóstico</h2>
          @if (!puedeGestionar()) {
            <p class="texto-suave">Solo el asesor responsable puede registrar diagnósticos.</p>
          } @else {
            @if (!c.asesorAsignado) { <div class="aviso aviso-info sep">Este cliente no tiene asesor: al guardar el diagnóstico quedará asignado a ti.</div> }
            <form (submit)="$event.preventDefault(); guardarDiagnostico()" novalidate class="form-diag">
              <div class="campo"><label for="f-fecha">Fecha</label>
                <input id="f-fecha" class="entrada" type="date" name="fecha" [(ngModel)]="f.fecha" [max]="hoy" /></div>
              <div class="campo"><label for="f-ing">Ingreso mensual (COP)</label>
                <input id="f-ing" class="entrada" type="number" min="0" step="1000" name="ing" [ngModel]="f.ingreso" (ngModelChange)="poner('ingreso', $event)" [class.invalida]="intento() && !(f.ingreso! > 0)" /></div>
              <div class="campo"><label for="f-gas">Gasto mensual (COP)</label>
                <input id="f-gas" class="entrada" type="number" min="0" step="1000" name="gas" [ngModel]="f.gasto" (ngModelChange)="poner('gasto', $event)" [class.invalida]="intento() && !valido(f.gasto)" /></div>
              <div class="campo"><label for="f-deu">Deuda total (COP)</label>
                <input id="f-deu" class="entrada" type="number" min="0" step="1000" name="deu" [ngModel]="f.deuda" (ngModelChange)="poner('deuda', $event)" [class.invalida]="intento() && !valido(f.deuda)" /></div>
              <div class="campo"><label for="f-aho">Ahorro actual (COP)</label>
                <input id="f-aho" class="entrada" type="number" min="0" step="1000" name="aho" [ngModel]="f.ahorro" (ngModelChange)="poner('ahorro', $event)" [class.invalida]="intento() && !valido(f.ahorro)" /></div>

              <div class="vivo" aria-live="polite">
                <div class="card-titulo">Vista previa (se calcula al escribir)</div>
                @if (vivo(); as v) {
                  <div class="vivo-fila"><span>Flujo libre mensual</span><b [class.texto-mal]="v.libre < 0">{{ cop(v.libre) }}</b></div>
                  @for (i of v.inds; track i.clave) {
                    <div class="vivo-fila"><span>{{ i.nombre }}</span><b>{{ i.valor }}</b>
                      <span class="etiqueta-estado" [class]="'etiqueta-' + i.estado">{{ i.texto }}</span></div>
                  }
                  @if (v.libre < 0) { <p class="campo-error">El gasto supera al ingreso: el cliente se está endeudando cada mes.</p> }
                } @else { <p class="texto-suave">Ingresa el ingreso y el gasto para ver el cálculo.</p> }
              </div>

              @if (errorForm()) { <p class="campo-error ancho-total" role="alert">{{ errorForm() }}</p> }
              <div class="ancho-total"><button type="submit" class="btn btn-primario" [disabled]="guardando()">Guardar diagnóstico</button>
                <span class="campo-ayuda"> Al guardar, las metas medibles del plan activo toman estos valores.</span></div>
            </form>
          }
        </section>

        <section class="sep" aria-labelledby="t-hist">
          <h2 id="t-hist" class="sec">Historial de diagnósticos</h2>
          @if (diagnosticos().length === 0) {
            <div class="vacio"><strong>Sin diagnósticos</strong>Aún no se ha registrado ninguno.</div>
          } @else {
            <div class="tabla-contenedor">
              <table class="tabla">
                <caption class="solo-lectores">Diagnósticos del cliente</caption>
                <thead><tr><th scope="col">Fecha</th><th scope="col" class="der">Ingreso</th><th scope="col" class="der">Gasto</th>
                  <th scope="col" class="der">Deuda</th><th scope="col" class="der">Ahorro</th><th scope="col" class="der">Tasa ahorro</th>
                  <th scope="col" class="der">Deuda/ingreso</th><th scope="col" class="der">Fondo (meses)</th></tr></thead>
                <tbody>
                  @for (d of diagnosticos(); track d.idDiagnostico) {
                    <tr><td>{{ fecha(d.fecha) }}</td><td class="der">{{ cop(d.ingresoMensual) }}</td><td class="der">{{ cop(d.gastoMensual) }}</td>
                      <td class="der">{{ cop(d.deudaTotal) }}</td><td class="der">{{ cop(d.ahorroActual) }}</td>
                      <td class="der">{{ d.tasaAhorro.toFixed(1) }}%</td><td class="der">{{ d.relacionDeudaIngreso.toFixed(1) }}%</td>
                      <td class="der">{{ d.mesesFondoEmergencia.toFixed(1) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <div class="sep">
          <app-planes-asesor [cliente]="c" [puede]="puedeGestionar()" [ultimo]="ultimo()" (cambio)="refrescar()" />
        </div>

        <div class="sep">
          @if (puedeGestionar()) { <app-notas-asesor [idCliente]="c.idUsuario" /> }
          @else { <div class="aviso aviso-info">Las notas privadas solo las ve el asesor responsable de este cliente.</div> }
        </div>
      }
    </div>`,
})
export class AsesorFichaComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toasts = inject(ToastService);
  private idRuta = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  estados = ESTADOS_CLIENTE;
  etq = ETIQ_ESTADO;
  cop = cop; fecha = fechaCorta; hoy = hoyIso();

  cargando = signal(true);
  guardando = signal(false);
  cliente = signal<Cliente | null>(null);
  diagnosticos = signal<Diagnostico[]>([]);
  progreso = signal<Progreso | null>(null);
  asesores = signal<Asesor[]>([]);
  errorAsesores = signal(false);
  intento = signal(false);
  errorForm = signal('');

  estadoNuevo: EstadoCliente = 'PROSPECTO';
  asesorNuevo: number | null = null;
  f: { fecha: string; ingreso: number | null; gasto: number | null; deuda: number | null; ahorro: number | null } =
    { fecha: hoyIso(), ingreso: null, gasto: null, deuda: null, ahorro: null };

  miId = computed(() => this.auth.sesion()?.idUsuario ?? -1);
  /** El backend solo deja gestionar al asesor responsable, o a cualquiera si el cliente no tiene asesor. */
  puedeGestionar = computed(() => {
    const a = this.cliente()?.asesorAsignado;
    return !a || a.idUsuario === this.miId();
  });
  ultimo = computed(() => this.diagnosticos()[0] ?? null);
  indsUltimo = computed(() => (this.ultimo() ? indicadores(this.ultimo()!) : []));
  fechas = computed(() => (this.progreso()?.historial ?? []).map(p => fechaCorta(p.fecha)));

  private tick = signal(0);
  poner(k: 'ingreso' | 'gasto' | 'deuda' | 'ahorro', v: number | null) { this.f[k] = v; this.tick.update(n => n + 1); }

  /** Mismas fórmulas del backend, para la vista previa mientras se escribe. */
  vivo = computed(() => {
    this.tick();
    const ing = Number(this.f.ingreso), gas = Number(this.f.gasto);
    if (!(ing > 0) || this.f.gasto === null || this.f.gasto === undefined || isNaN(gas)) return null;
    const deu = Number(this.f.deuda) || 0, aho = Number(this.f.ahorro) || 0;
    const libre = ing - gas;
    return {
      libre,
      inds: indicadores({ tasaAhorro: (libre / ing) * 100, relacionDeudaIngreso: (deu / (ing * 12)) * 100, mesesFondoEmergencia: gas > 0 ? aho / gas : 0 }),
    };
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    forkJoin({
      cliente: this.api.cliente(this.idRuta).pipe(catchError(() => of(null))),
      diags: this.api.historialDiagnosticos(this.idRuta).pipe(catchError(() => of([] as Diagnostico[]))),
      prog: this.api.progreso(this.idRuta).pipe(catchError(() => of(null))),
    }).subscribe(r => {
      this.cliente.set(r.cliente);
      // Más reciente primero.
      this.diagnosticos.set([...r.diags].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.idDiagnostico - a.idDiagnostico));
      this.progreso.set(r.prog);
      if (r.cliente) {
        this.estadoNuevo = r.cliente.estadoCliente;
        this.asesorNuevo = r.cliente.asesorAsignado?.idUsuario ?? null;
        this.cargarAsesores();
      }
      this.cargando.set(false);
    });
  }

  /** Recarga los datos sin mostrar el spinner (tras crear, cerrar o editar planes y metas). */
  refrescar() {
    forkJoin({
      cliente: this.api.cliente(this.idRuta).pipe(catchError(() => of(this.cliente()))),
      prog: this.api.progreso(this.idRuta).pipe(catchError(() => of(null))),
    }).subscribe(r => {
      if (r.cliente) { this.cliente.set(r.cliente); this.estadoNuevo = r.cliente.estadoCliente; this.asesorNuevo = r.cliente.asesorAsignado?.idUsuario ?? null; }
      this.progreso.set(r.prog);
    });
  }

  private cargarAsesores() {
    this.api.listarAsesores().subscribe({
      next: l => this.asesores.set(l),
      error: () => this.errorAsesores.set(true),
    });
  }

  serie(k: 'tasaAhorro' | 'relacionDeudaIngreso' | 'ahorroActual') { return (this.progreso()?.historial ?? []).map(p => p[k]); }
  valido = (n: number | null) => n !== null && n !== undefined && !isNaN(n as number) && (n as number) >= 0;

  cambiarEstado() {
    this.guardando.set(true);
    this.api.cambiarEstado(this.idRuta, this.estadoNuevo).subscribe({
      next: c => { this.cliente.set(c); this.toasts.ok('Estado actualizado.'); this.guardando.set(false); },
      error: () => { this.estadoNuevo = this.cliente()!.estadoCliente; this.guardando.set(false); },
    });
  }

  asignar() {
    if (this.asesorNuevo === null) return;
    const traspaso = !!this.cliente()?.asesorAsignado;
    this.guardando.set(true);
    this.api.asignarAsesor(this.idRuta, this.asesorNuevo).subscribe({
      next: c => {
        this.cliente.set(c); this.asesorNuevo = c.asesorAsignado?.idUsuario ?? null;
        this.toasts.ok(traspaso ? 'Cliente traspasado.' : 'Asesor asignado.');
        this.guardando.set(false);
      },
      error: () => this.guardando.set(false),
    });
  }

  guardarDiagnostico() {
    this.intento.set(true); this.errorForm.set('');
    const { ingreso, gasto, deuda, ahorro } = this.f;
    if (!(ingreso! > 0)) { this.errorForm.set('El ingreso mensual debe ser mayor que cero.'); return; }
    if (![gasto, deuda, ahorro].every(this.valido)) { this.errorForm.set('Completa gasto, deuda y ahorro con valores de cero o más.'); return; }
    if (this.f.fecha > this.hoy) { this.errorForm.set('La fecha no puede ser futura.'); return; }
    this.guardando.set(true);
    this.api.crearDiagnostico(this.idRuta, {
      fecha: this.f.fecha || undefined, ingresoMensual: ingreso!, gastoMensual: gasto!, deudaTotal: deuda!, ahorroActual: ahorro!,
    }).subscribe({
      next: () => {
        this.toasts.ok('Diagnóstico guardado.');
        this.f = { fecha: hoyIso(), ingreso: null, gasto: null, deuda: null, ahorro: null }; this.tick.update(n => n + 1);
        this.intento.set(false); this.guardando.set(false);
        this.cargar();
      },
      error: e => { this.errorForm.set(mensajeError(e, 'No se pudo guardar el diagnóstico.')); this.guardando.set(false); },
    });
  }
}
