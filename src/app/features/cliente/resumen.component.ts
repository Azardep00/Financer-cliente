import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Cliente, Diagnostico, Plan, Progreso } from '../../core/models';
import { cop, fechaCorta, periodoLargo } from '../../core/formato';
import { indicadores } from '../../core/indicadores';
import { GraficoEvolucionComponent } from '../../core/grafico-evolucion.component';

@Component({
  selector: 'app-cliente-resumen',
  standalone: true,
  imports: [RouterLink, GraficoEvolucionComponent],
  styleUrl: './cliente.css',
  template: `
    <div class="pagina">
      <div class="pagina-encabezado">
        <div><h1>Hola, {{ auth.sesion()?.nombre }}</h1><p>Tu resumen financiero.</p></div>
      </div>

      @if (cargando()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando tu información…</div>
      } @else if (fallo()) {
        <div class="aviso aviso-mal">No se pudo cargar tu resumen. Revisa tu conexión e intenta de nuevo.
          <button type="button" class="btn btn-secundario btn-sm" (click)="cargar()">Reintentar</button></div>
      } @else {
        @if (!diag()) {
          <div class="vacio"><strong>Aún no tienes un diagnóstico</strong>
            Tu asesor lo registrará en la primera sesión y aquí verás tus indicadores.</div>
        } @else {
          <section aria-label="Indicadores" class="rejilla rejilla-3">
            @for (i of inds(); track i.clave) {
              <article class="card ind">
                <div class="card-titulo">{{ i.nombre }}</div>
                <div class="cifra-grande">{{ i.valor }}</div>
                <div class="ind-pie">
                  <span class="etiqueta-estado" [class]="'etiqueta-' + i.estado">{{ i.texto }}</span>
                  <span class="texto-suave">{{ i.meta }}</span>
                </div>
              </article>
            }
          </section>

          <section aria-label="Cifras del último diagnóstico" class="card bloque">
            <div class="card-titulo">Último diagnóstico · {{ fecha(diag()!.fecha) }}</div>
            <dl class="cifras">
              <div><dt>Ingreso mensual</dt><dd>{{ cop(diag()!.ingresoMensual) }}</dd></div>
              <div><dt>Gasto mensual</dt><dd>{{ cop(diag()!.gastoMensual) }}</dd></div>
              <div><dt>Flujo libre mensual</dt><dd [class.texto-mal]="diag()!.flujoLibreMensual < 0">{{ cop(diag()!.flujoLibreMensual) }}</dd></div>
              <div><dt>Deuda total</dt><dd>{{ cop(diag()!.deudaTotal) }}</dd></div>
              <div><dt>Ahorro actual</dt><dd>{{ cop(diag()!.ahorroActual) }}</dd></div>
            </dl>
          </section>
        }

        <div class="rejilla rejilla-2 bloque">
          <section class="card" aria-label="Plan del mes">
            <div class="card-titulo">Plan del mes</div>
            @if (plan(); as p) {
              <h3>{{ p.titulo }}</h3>
              <p class="texto-suave">{{ periodo(p.periodo) }}</p>
              <div class="barra grande" role="progressbar" [attr.aria-valuenow]="p.progreso" aria-valuemin="0" aria-valuemax="100" aria-label="Avance del plan">
                <span [style.width.%]="p.progreso"></span></div>
              <p class="texto-suave">{{ p.progreso.toFixed(0) }}% · {{ cumplidas(p) }} de {{ p.metas.length }} metas cumplidas</p>
              <a routerLink="/cliente/plan" class="btn btn-secundario btn-sm">Ver mis metas</a>
            } @else {
              <p class="texto-suave">No tienes un plan activo. Tu asesor creará el plan de este mes.</p>
            }
          </section>

          <section class="card" aria-label="Tu asesor">
            <div class="card-titulo">Tu asesor</div>
            @if (cliente()?.asesorAsignado; as a) {
              <h3>{{ a.nombre }} {{ a.apellido }}</h3>
              @if (a.especialidad) { <p class="texto-suave">{{ a.especialidad }}</p> }
              <p><a [href]="'mailto:' + a.correo">{{ a.correo }}</a></p>
            } @else {
              <p class="texto-suave">Aún no tienes un asesor asignado. Te contactarán pronto.</p>
            }
          </section>
        </div>

        @if (prog() && prog()!.historial.length > 0) {
          <section aria-label="Evolución" class="bloque">
            <h2 class="sec">Evolución</h2>
            @if (prog()!.historial.length < 2) {
              <p class="texto-suave">Con tu segundo diagnóstico verás aquí cómo evolucionan tus indicadores.</p>
            }
            <div class="rejilla rejilla-2">
              <div class="card"><div class="card-titulo">Tasa de ahorro (%)</div>
                <app-grafico-evolucion titulo="Tasa de ahorro" [vals]="serie('tasaAhorro')" [fechas]="fechas()" [ref]="20" color="#0f8f6b" /></div>
              <div class="card"><div class="card-titulo">Deuda / ingreso anual (%)</div>
                <app-grafico-evolucion titulo="Deuda sobre ingreso anual" [vals]="serie('relacionDeudaIngreso')" [fechas]="fechas()" [ref]="36" color="#c0392b" /></div>
              <div class="card"><div class="card-titulo">Fondo de emergencia (meses)</div>
                <app-grafico-evolucion titulo="Fondo de emergencia" [vals]="serie('mesesFondoEmergencia')" [fechas]="fechas()" [ref]="3" /></div>
              <div class="card"><div class="card-titulo">Ahorro actual</div>
                <app-grafico-evolucion titulo="Ahorro actual" [vals]="serie('ahorroActual')" [fechas]="fechas()" [fmt]="cop" /></div>
            </div>
            @if (prog()!.variacion; as v) {
              <p class="texto-suave nota">Desde tu primer diagnóstico: ahorro {{ signo(v.ahorroActual) }}{{ cop(v.ahorroActual) }},
                deuda {{ signo(v.deudaTotal) }}{{ cop(v.deudaTotal) }}, tasa de ahorro {{ signo(v.tasaAhorro) }}{{ v.tasaAhorro.toFixed(1) }} pts.</p>
            }
          </section>
        }
      }
    </div>`,
})
export class ResumenClienteComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  cargando = signal(true);
  fallo = signal(false);
  diag = signal<Diagnostico | null>(null);
  plan = signal<Plan | null>(null);
  prog = signal<Progreso | null>(null);
  cliente = signal<Cliente | null>(null);

  inds = computed(() => (this.diag() ? indicadores(this.diag()!) : []));
  fechas = computed(() => (this.prog()?.historial ?? []).map(p => fechaCorta(p.fecha)));

  cop = cop; fecha = fechaCorta; periodo = periodoLargo;

  ngOnInit() { this.cargar(); }

  cargar() {
    const id = this.auth.sesion()!.idUsuario;
    this.cargando.set(true); this.fallo.set(false);
    forkJoin({
      cliente: this.api.cliente(id),
      diag: this.api.ultimoDiagnostico(id).pipe(catchError(() => of(null))),
      plan: this.api.planActivo(id).pipe(catchError(() => of(null))),
      prog: this.api.progreso(id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: r => {
        this.cliente.set(r.cliente); this.diag.set(r.diag); this.plan.set(r.plan); this.prog.set(r.prog);
        this.cargando.set(false);
      },
      error: () => { this.fallo.set(true); this.cargando.set(false); },
    });
  }

  serie(k: 'tasaAhorro' | 'relacionDeudaIngreso' | 'mesesFondoEmergencia' | 'ahorroActual') {
    return (this.prog()?.historial ?? []).map(p => p[k]);
  }
  cumplidas = (p: Plan) => p.metas.filter(m => m.completada).length;
  signo = (n: number) => (n > 0 ? '+' : '');
}
