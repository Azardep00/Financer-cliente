import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoPlan, Plan } from '../../core/models';
import { fechaCorta, periodoLargo } from '../../core/formato';
import { MetasListaComponent } from './metas-lista.component';

const ESTADO: Record<EstadoPlan, { t: string; c: string }> = {
  ACTIVO: { t: 'Activo', c: 'etiqueta-info' }, CERRADO: { t: 'Cerrado', c: 'etiqueta-ok' }, CANCELADO: { t: 'Cancelado', c: 'etiqueta-warn' },
};

@Component({
  selector: 'app-cliente-historial',
  standalone: true,
  imports: [MetasListaComponent],
  styleUrl: './cliente.css',
  template: `
    <div class="pagina">
      <div class="pagina-encabezado">
        <div><h1>Historial de planes</h1><p>Planes de meses anteriores, en solo lectura.</p></div>
      </div>

      @if (cargando()) {
        <div class="cargando" role="status"><span class="giro"></span> Cargando historial…</div>
      } @else if (fallo()) {
        <div class="aviso aviso-mal">No se pudo cargar el historial.</div>
      } @else if (planes().length === 0) {
        <div class="vacio"><strong>Aún no hay planes</strong>Cuando tu asesor cree tu primer plan mensual aparecerá aquí.</div>
      } @else {
        <div class="tabla-contenedor">
          <table class="tabla">
            <caption class="solo-lectores">Planes mensuales</caption>
            <thead><tr><th>Periodo</th><th>Plan</th><th>Estado</th><th class="der">Avance</th><th class="der">Metas</th><th><span class="solo-lectores">Detalle</span></th></tr></thead>
            <tbody>
              @for (p of planes(); track p.idPlan) {
                <tr>
                  <td>{{ periodo(p.periodo) }}</td>
                  <td>{{ p.titulo }}</td>
                  <td><span class="etiqueta-estado" [class]="estado(p).c">{{ estado(p).t }}</span></td>
                  <td class="der">{{ p.progreso.toFixed(0) }}%</td>
                  <td class="der">{{ cumplidas(p) }}/{{ p.metas.length }}</td>
                  <td class="der"><button type="button" class="btn btn-fantasma btn-sm" (click)="alternar(p.idPlan)"
                        [attr.aria-expanded]="abierto() === p.idPlan">{{ abierto() === p.idPlan ? 'Ocultar' : 'Ver detalle' }}</button></td>
                </tr>
                @if (abierto() === p.idPlan) {
                  <tr class="detalle"><td colspan="6">
                    @if (p.descripcion) { <p class="texto-suave">{{ p.descripcion }}</p> }
                    @if (p.fechaCierre) { <p class="texto-suave">Cerrado el {{ fecha(p.fechaCierre) }}</p> }
                    @if (p.notaCierre) { <div class="aviso aviso-info nota-cierre"><b>Nota de cierre:</b> {{ p.notaCierre }}</div> }
                    <app-metas-lista [metas]="p.metas" [editable]="false" />
                  </td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>`,
})
export class HistorialClienteComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  cargando = signal(true);
  fallo = signal(false);
  planes = signal<Plan[]>([]);
  abierto = signal<number | null>(null);

  periodo = periodoLargo; fecha = fechaCorta;

  ngOnInit() {
    this.api.historialPlanes(this.auth.sesion()!.idUsuario).subscribe({
      next: l => {
        // Más reciente primero.
        this.planes.set([...l].sort((a, b) => b.periodo.localeCompare(a.periodo)));
        this.cargando.set(false);
      },
      error: () => { this.fallo.set(true); this.cargando.set(false); },
    });
  }

  estado = (p: Plan) => ESTADO[p.estado];
  cumplidas = (p: Plan) => p.metas.filter(m => m.completada).length;
  alternar(id: number) { this.abierto.set(this.abierto() === id ? null : id); }
}
