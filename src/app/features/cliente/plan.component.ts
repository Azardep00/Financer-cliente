import { Component, OnInit, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Meta, Plan } from '../../core/models';
import { fechaCorta, periodoLargo } from '../../core/formato';
import { MetasListaComponent } from './metas-lista.component';

@Component({
  selector: 'app-cliente-plan',
  standalone: true,
  imports: [MetasListaComponent],
  styleUrl: './cliente.css',
  template: `
    <div class="pagina">
      <div class="pagina-encabezado">
        <div><h1>Plan del mes</h1><p>Tus metas, con montos y avance.</p></div>
      </div>

      @if (cargando()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando tu plan…</div>
      } @else if (!plan()) {
        <div class="vacio"><strong>No tienes un plan activo</strong>
          Tu asesor creará el plan del mes y aparecerá aquí. Los planes anteriores están en «Historial de planes».</div>
      } @else {
        <section class="card bloque">
          <div class="encabezado-plan">
            <div>
              <div class="card-titulo">{{ periodo(plan()!.periodo) }}</div>
              <h2>{{ plan()!.titulo }}</h2>
              @if (plan()!.descripcion) { <p class="texto-suave">{{ plan()!.descripcion }}</p> }
              <p class="texto-suave">Del {{ fecha(plan()!.periodoInicio) }} al {{ fecha(plan()!.periodoFin) }} · Asesor: {{ plan()!.asesor.nombre }} {{ plan()!.asesor.apellido }}</p>
            </div>
            <div class="avance">
              <div class="cifra-grande">{{ plan()!.progreso.toFixed(0) }}%</div>
              <div class="texto-suave">{{ cumplidas() }} de {{ plan()!.metas.length }} metas</div>
            </div>
          </div>
          <div class="barra grande" role="progressbar" [attr.aria-valuenow]="plan()!.progreso" aria-valuemin="0" aria-valuemax="100" aria-label="Avance del plan">
            <span [style.width.%]="plan()!.progreso"></span></div>
        </section>

        <div class="aviso aviso-info bloque">Las metas con monto se actualizan solas cuando tu asesor registra un nuevo diagnóstico. Las metas de texto las marcas tú.</div>

        <h2 class="sec">Metas</h2>
        <app-metas-lista [metas]="plan()!.metas" [editable]="true" [ocupada]="ocupada()" (alternar)="alternar($event)" />
      }
    </div>`,
})
export class PlanClienteComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  cargando = signal(true);
  plan = signal<Plan | null>(null);
  ocupada = signal<number | null>(null);

  periodo = periodoLargo; fecha = fechaCorta;

  ngOnInit() {
    this.api.planActivo(this.auth.sesion()!.idUsuario).pipe(catchError(() => of(null))).subscribe(p => {
      this.plan.set(p); this.cargando.set(false);
    });
  }

  cumplidas = () => this.plan()?.metas.filter(m => m.completada).length ?? 0;

  alternar(m: Meta) {
    this.ocupada.set(m.idMeta);
    const op = m.completada ? this.api.pendienteMeta(m.idMeta) : this.api.completarMeta(m.idMeta);
    op.subscribe({
      // El progreso del plan cambia con la meta, así que se vuelve a pedir el plan completo.
      next: () => this.api.plan(this.plan()!.idPlan).subscribe({
        next: p => { this.plan.set(p); this.ocupada.set(null); },
        error: () => this.ocupada.set(null),
      }),
      error: () => this.ocupada.set(null), // el aviso de error lo muestra el interceptor
    });
  }
}
