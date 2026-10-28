import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import {
  ESTADOS_CLIENTE, EstadoCliente, FiltrosPanel, OrdenPanel, PanelResponse, TipoAlerta,
} from '../../core/models';
import { fechaCorta, periodoLargo } from '../../core/formato';

export const ETIQ_ESTADO: Record<EstadoCliente, { t: string; c: string }> = {
  PROSPECTO: { t: 'Prospecto', c: 'etiqueta-info' },
  ACTIVO: { t: 'Activo', c: 'etiqueta-ok' },
  PAUSADO: { t: 'Pausado', c: 'etiqueta-warn' },
  FINALIZADO: { t: 'Finalizado', c: '' },
};

export const ETIQ_ALERTA: Record<TipoAlerta, string> = {
  SIN_DIAGNOSTICO: 'Sin diagnóstico',
  DIAGNOSTICO_VIEJO: 'Diagnóstico viejo',
  SIN_PLAN_ACTIVO: 'Sin plan activo',
  MES_SIN_CERRAR: 'Mes sin cerrar',
  METAS_VENCIDAS: 'Metas vencidas',
};

@Component({
  selector: 'app-asesor-clientes',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrl: './clientes.css',
  template: `
    <div class="pagina ancha">
      <div class="pagina-encabezado">
        <div><h1>Clientes</h1><p>Resumen de tu cartera, alertas y seguimiento.</p></div>
      </div>

      @if (datos(); as d) {
        <section class="rejilla rejilla-4" aria-label="Resumen">
          <article class="card kpi"><div class="card-titulo">Clientes</div><div class="cifra-grande">{{ d.resumen.totalClientes }}</div>
            <div class="texto-suave pie">
              @for (e of estados; track e) { <span>{{ etq[e].t }}: <b>{{ d.resumen.porEstado[e] ?? 0 }}</b></span> }
            </div></article>
          <article class="card kpi"><div class="card-titulo">Con alertas</div>
            <div class="cifra-grande" [class.texto-mal]="d.resumen.conAlertas > 0">{{ d.resumen.conAlertas }}</div>
            <button type="button" class="btn btn-fantasma btn-sm" (click)="soloAlertas()">Ver clientes con alertas</button></article>
          <article class="card kpi"><div class="card-titulo">Sin asesor</div>
            <div class="cifra-grande" [class.texto-warn]="d.resumen.sinAsesor > 0">{{ d.resumen.sinAsesor }}</div>
            <button type="button" class="btn btn-fantasma btn-sm" (click)="soloSinAsesor()">Ver sin asesor</button></article>
          <article class="card kpi"><div class="card-titulo">Alertas por tipo</div>
            @if (tiposAlerta().length === 0) { <p class="texto-ok">Sin alertas pendientes.</p> }
            <ul class="alertas-lista">
              @for (t of tiposAlerta(); track t.tipo) { <li><span>{{ t.etiqueta }}</span><b>{{ t.n }}</b></li> }
            </ul></article>
        </section>
      }

      <form class="filtros card" (submit)="$event.preventDefault(); buscarYa()" role="search" aria-label="Filtros de clientes">
        <div class="campo grande">
          <label for="q">Buscar</label>
          <input id="q" class="entrada" type="search" placeholder="Nombre, apellido o correo" [ngModel]="q()" name="q" (ngModelChange)="escribir($event)" />
        </div>
        <div class="campo">
          <label for="estado">Estado</label>
          <select id="estado" class="entrada" [ngModel]="estado()" name="estado" (ngModelChange)="cambiar('estado', $event)">
            <option value="">Todos</option>
            @for (e of estados; track e) { <option [value]="e">{{ etq[e].t }}</option> }
          </select>
        </div>
        <div class="campo">
          <label for="orden">Ordenar por</label>
          <select id="orden" class="entrada" [ngModel]="orden()" name="orden" (ngModelChange)="cambiar('orden', $event)">
            <option value="alertas">Más alertas primero</option>
            <option value="nombre">Nombre</option>
            <option value="diagnostico">Diagnóstico más antiguo</option>
          </select>
        </div>
        <fieldset class="checks">
          <legend class="solo-lectores">Filtros rápidos</legend>
          <label><input type="checkbox" [ngModel]="mios()" name="mios" (ngModelChange)="cambiar('mios', $event)" /> Míos</label>
          <label><input type="checkbox" [ngModel]="sinAsesor()" name="sinAsesor" (ngModelChange)="cambiar('sinAsesor', $event)" /> Sin asesor</label>
          <label><input type="checkbox" [ngModel]="conAlertas()" name="conAlertas" (ngModelChange)="cambiar('conAlertas', $event)" /> Con alertas</label>
        </fieldset>
        @if (hayFiltros()) { <button type="button" class="btn btn-secundario btn-sm limpiar" (click)="limpiar()">Limpiar filtros</button> }
      </form>

      @if (cargando() && !datos()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando clientes…</div>
      } @else if (fallo()) {
        <div class="aviso aviso-mal">No se pudo cargar el panel. <button type="button" class="btn btn-secundario btn-sm" (click)="cargar()">Reintentar</button></div>
      } @else if (datos(); as d) {
        @if (d.clientes.length === 0) {
          <div class="vacio">
            <strong>{{ hayFiltros() ? 'Ningún cliente coincide con los filtros' : 'Aún no hay clientes registrados' }}</strong>
            {{ hayFiltros() ? 'Prueba quitando algún filtro.' : 'Cuando un cliente se registre aparecerá aquí.' }}
          </div>
        } @else {
          <div class="tabla-contenedor" [class.recargando]="cargando()" [attr.aria-busy]="cargando()">
            <table class="tabla">
              <caption class="solo-lectores">Clientes</caption>
              <thead><tr>
                <th scope="col">Cliente</th><th scope="col">Estado</th><th scope="col">Asesor</th>
                <th scope="col">Plan activo</th><th scope="col">Último diagnóstico</th><th scope="col">Alertas</th>
              </tr></thead>
              <tbody>
                @for (c of d.clientes; track c.idCliente) {
                  <tr>
                    <td><a class="nombre" [routerLink]="['/asesor/clientes', c.idCliente]">{{ c.nombre }} {{ c.apellido }}</a>
                      <div class="texto-suave peq">{{ c.correo }}</div></td>
                    <td><span class="etiqueta-estado" [class]="etq[c.estadoCliente].c">{{ etq[c.estadoCliente].t }}</span></td>
                    <td>@if (c.nombreAsesor) { {{ c.nombreAsesor }} } @else { <span class="texto-warn">Sin asesor</span> }</td>
                    <td>
                      @if (c.planActivo; as p) {
                        <div>{{ periodo(p.periodo) }}</div>
                        <div class="mini" role="progressbar" [attr.aria-valuenow]="p.progreso" aria-valuemin="0" aria-valuemax="100"
                             [attr.aria-label]="'Avance del plan de ' + c.nombre"><span [style.width.%]="p.progreso"></span></div>
                        <div class="texto-suave peq">{{ p.progreso.toFixed(0) }}%
                          @if (p.metasVencidas > 0) { · <span class="texto-mal">{{ p.metasVencidas }} vencida{{ p.metasVencidas > 1 ? 's' : '' }}</span> }</div>
                      } @else { <span class="texto-suave">—</span> }
                    </td>
                    <td>
                      @if (c.ultimoDiagnostico) { {{ fecha(c.ultimoDiagnostico) }}
                        <div class="texto-suave peq">hace {{ c.diasSinDiagnostico }} día{{ c.diasSinDiagnostico === 1 ? '' : 's' }}</div>
                      } @else { <span class="texto-suave">Nunca</span> }
                    </td>
                    <td>
                      @if (c.alertas.length === 0) { <span class="texto-ok">Sin alertas</span> }
                      @else { <div class="chips">
                        @for (a of c.alertas; track a.tipo) { <span class="etiqueta-estado etiqueta-mal" [title]="a.mensaje">{{ alerta[a.tipo] }}</span> }
                      </div> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <nav class="paginacion" aria-label="Paginación">
            <span class="texto-suave">{{ desde() }}–{{ hasta() }} de {{ d.total }}</span>
            <div class="acciones">
              <button type="button" class="btn btn-secundario btn-sm" [disabled]="d.pagina <= 0 || cargando()" (click)="ir(d.pagina - 1)">Anterior</button>
              <span class="pag">Página {{ d.pagina + 1 }} de {{ d.totalPaginas || 1 }}</span>
              <button type="button" class="btn btn-secundario btn-sm" [disabled]="d.pagina + 1 >= d.totalPaginas || cargando()" (click)="ir(d.pagina + 1)">Siguiente</button>
            </div>
          </nav>
        }
      }
    </div>`,
})
export class AsesorClientesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);

  estados = ESTADOS_CLIENTE;
  etq = ETIQ_ESTADO;
  alerta = ETIQ_ALERTA;
  fecha = fechaCorta;
  periodo = periodoLargo;

  q = signal('');
  estado = signal<EstadoCliente | ''>('');
  orden = signal<OrdenPanel>('alertas');
  mios = signal(false);
  sinAsesor = signal(false);
  conAlertas = signal(false);
  pagina = signal(0);

  datos = signal<PanelResponse | null>(null);
  cargando = signal(true);
  fallo = signal(false);

  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private peticion = 0;

  hayFiltros = computed(() => !!(this.q().trim() || this.estado() || this.mios() || this.sinAsesor() || this.conAlertas()));
  desde = computed(() => (this.datos() && this.datos()!.total > 0 ? this.datos()!.pagina * this.datos()!.tamano + 1 : 0));
  hasta = computed(() => (this.datos() ? Math.min(this.datos()!.total, (this.datos()!.pagina + 1) * this.datos()!.tamano) : 0));
  tiposAlerta = computed(() => {
    const a = this.datos()?.resumen.alertasPorTipo ?? {};
    return (Object.keys(ETIQ_ALERTA) as TipoAlerta[]).filter(t => (a[t] ?? 0) > 0).map(t => ({ tipo: t, etiqueta: ETIQ_ALERTA[t], n: a[t]! }));
  });

  ngOnInit() { this.cargar(); }
  ngOnDestroy() { if (this.temporizador) clearTimeout(this.temporizador); }

  cargar() {
    const id = ++this.peticion;
    this.cargando.set(true); this.fallo.set(false);
    const f: FiltrosPanel = {
      q: this.q(), estado: this.estado(), mios: this.mios(), sinAsesor: this.sinAsesor(),
      conAlertas: this.conAlertas(), orden: this.orden(), pagina: this.pagina(), tamano: 15,
    };
    this.api.panel(f).subscribe({
      next: r => {
        if (id !== this.peticion) return; // llegó una respuesta vieja: se ignora
        this.datos.set(r); this.cargando.set(false);
        // Si borraron registros y la página ya no existe, vuelve a la última.
        if (r.clientes.length === 0 && r.total > 0 && this.pagina() > 0) { this.pagina.set(Math.max(0, r.totalPaginas - 1)); this.cargar(); }
      },
      error: () => { if (id === this.peticion) { this.fallo.set(true); this.cargando.set(false); } },
    });
  }

  /** Búsqueda con espera de 350 ms para no pedir en cada tecla. */
  escribir(v: string) {
    this.q.set(v);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => { this.pagina.set(0); this.cargar(); }, 350);
  }
  buscarYa() { if (this.temporizador) clearTimeout(this.temporizador); this.pagina.set(0); this.cargar(); }

  cambiar(campo: 'estado' | 'orden' | 'mios' | 'sinAsesor' | 'conAlertas', valor: any) {
    (this[campo] as any).set(valor);
    // "Míos" y "Sin asesor" se contradicen: activar uno apaga el otro.
    if (campo === 'mios' && valor) this.sinAsesor.set(false);
    if (campo === 'sinAsesor' && valor) this.mios.set(false);
    this.pagina.set(0); this.cargar();
  }

  soloAlertas() { this.limpiarSinCargar(); this.conAlertas.set(true); this.cargar(); }
  soloSinAsesor() { this.limpiarSinCargar(); this.sinAsesor.set(true); this.cargar(); }
  limpiar() { this.limpiarSinCargar(); this.cargar(); }
  private limpiarSinCargar() {
    this.q.set(''); this.estado.set(''); this.mios.set(false); this.sinAsesor.set(false); this.conAlertas.set(false); this.pagina.set(0);
  }

  ir(p: number) { this.pagina.set(p); this.cargar(); }
}
