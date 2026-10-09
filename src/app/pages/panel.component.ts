import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of, catchError, Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ApiService, Diagnostico, Meta, Plan, Progreso } from '../core/api.service';
import { DonutComponent, LineaComponent } from '../core/graficos';
import { cop, semaforo } from '../core/metricas';

@Component({
  selector: 'app-panel', standalone: true, imports: [DonutComponent, LineaComponent],
  styleUrl: './panel.component.css',
  template: `
  <header class="top glass">
    <strong class="logo">Financer <span>KSD</span></strong>
    <div>Hola, {{ auth.sesion()?.nombre }} <button class="btn sec" (click)="auth.logout()">Salir</button></div>
  </header>
  <main class="wrap">
  @if (cargando()) { <p class="vacio glass">Cargando tu información…</p> } @else {

    <h2>Mi situación financiera</h2>
    @if (!diag()) { <p class="vacio glass">Tu asesor aún no ha registrado tu diagnóstico. Cuando lo haga, verás aquí tus métricas.</p> }
    @else {
      <div class="metricas">
        @for (m of tarjetas(); track m.nombre) {
          <div [class]="'card glass ' + m.color"><small>{{ m.nombre }}</small><div class="valor">{{ m.valor }}</div><span>{{ m.ayuda }}</span></div>
        }
      </div>
      <div class="fila">
        <div class="glass dona">
          <app-donut [gasto]="gastoPct()" />
          <div><h3>¿A dónde va tu ingreso?</h3>
            <p><i class="d1"></i>Gastos: <b>{{ cop(diag()!.gastoMensual) }}</b></p>
            <p><i class="d2"></i>Libre: <b>{{ cop(diag()!.flujoLibreMensual) }}</b></p></div>
        </div>
        <div class="glass cifras">
          <div><small>Ingreso mensual</small><b>{{ cop(diag()!.ingresoMensual) }}</b></div>
          <div><small>Deuda total</small><b>{{ cop(diag()!.deudaTotal) }}</b></div>
          <div><small>Ahorro actual</small><b>{{ cop(diag()!.ahorroActual) }}</b></div>
          <div><small>Último diagnóstico</small><b>{{ diag()!.fecha }}</b></div>
        </div>
      </div>
    }

    <h2>Mi plan de mejora</h2>
    @if (!plan()) { <p class="vacio glass">Aún no tienes un plan. Tu asesor lo armará contigo.</p> }
    @else {
      <div class="plan glass">
        <h3>{{ plan()!.titulo }}</h3>
        @if (plan()!.descripcion) { <p class="desc">{{ plan()!.descripcion }}</p> }
        <div class="barra"><div [style.width.%]="plan()!.progreso"></div></div>
        <small>{{ completadas() }} de {{ plan()!.metas.length }} metas cumplidas · {{ plan()!.progreso.toFixed(0) }}%</small>
        @for (m of plan()!.metas; track m.idMeta) {
          <label class="meta" [class.hecha]="m.completada">
            <input type="checkbox" [checked]="m.completada" [disabled]="guardando() === m.idMeta" (change)="alternar(m)" />
            <span class="txt">{{ m.descripcion }}</span>
            @if (vencida(m)) { <em class="venc">Vencida</em> } @else if (m.fechaLimite) { <em>Para el {{ m.fechaLimite }}</em> }
          </label>
        } @empty { <p class="vacio">Tu plan todavía no tiene metas.</p> }
      </div>
    }

    <h2>Mi progreso</h2>
    @if (series().length === 0) { <p class="vacio glass">Con dos diagnósticos o más verás aquí tu evolución real.</p> }
    @else {
      <div class="graficas">
        @for (s of series(); track s.titulo) {
          <div class="graf glass"><small>{{ s.titulo }}</small>
            <div class="ult">{{ s.fmt(s.vals[s.vals.length - 1]) }}</div>
            <app-linea [vals]="s.vals" [fechas]="fechas()" [color]="s.color" [fmt]="s.fmt" />
            <div class="cambio" [class.bien]="s.mejora" [class.mal]="!s.mejora">{{ s.cambio }}</div></div>
        }
      </div>
    }
  }
  </main>`,
})
export class PanelComponent implements OnInit {
  auth = inject(AuthService); private api = inject(ApiService); cop = cop;
  cargando = signal(true); guardando = signal<number | null>(null);
  diag = signal<Diagnostico | null>(null); plan = signal<Plan | null>(null); prog = signal<Progreso | null>(null);

  ngOnInit() { this.cargar(); }
  cargar() {
    const id = this.auth.sesion()!.idUsuario;
    const o = <T>(s: Observable<T>) => s.pipe(catchError(() => of(null))); // 404 = aun no hay datos
    forkJoin({ d: o(this.api.ultimoDiagnostico(id)), p: o(this.api.planActivo(id)), g: o(this.api.progreso(id)) })
      .subscribe(r => { this.diag.set(r.d); this.plan.set(r.p); this.prog.set(r.g); this.cargando.set(false); });
  }

  completadas() { return this.plan()?.metas.filter(m => m.completada).length ?? 0; }
  vencida(m: Meta) { return !m.completada && !!m.fechaLimite && m.fechaLimite < new Date().toISOString().slice(0, 10); }
  alternar(m: Meta) {
    this.guardando.set(m.idMeta);
    (m.completada ? this.api.pendienteMeta(m.idMeta) : this.api.completarMeta(m.idMeta))
      .subscribe({ next: () => { this.guardando.set(null); this.cargar(); }, error: () => this.guardando.set(null) });
  }

  gastoPct() { const d = this.diag()!; return d.ingresoMensual > 0 ? Math.min(100, (d.gastoMensual / d.ingresoMensual) * 100) : 0; }
  tarjetas() { const d = this.diag()!; return semaforo({ tasa: d.tasaAhorro, rel: d.relacionDeudaIngreso, meses: d.mesesFondoEmergencia }); }
  fechas() { return this.prog()?.historial.map(p => p.fecha) ?? []; }

  // Series reales del historial de diagnosticos (solo si hay 2 o mas).
  series() {
    const h = this.prog()?.historial ?? [];
    if (h.length < 2) return [];
    const pct = (n: number) => n.toFixed(1) + '%';
    const def = [
      { titulo: 'Tasa de ahorro', vals: h.map(p => p.tasaAhorro), sube: true, color: '#7464c8', fmt: pct },
      { titulo: 'Deuda / ingreso anual', vals: h.map(p => p.relacionDeudaIngreso), sube: false, color: '#d4d4d8', fmt: pct },
      { titulo: 'Fondo de emergencia', vals: h.map(p => p.mesesFondoEmergencia), sube: true, color: '#34d399', fmt: (n: number) => n.toFixed(1) + ' meses' },
      { titulo: 'Ahorro acumulado', vals: h.map(p => p.ahorroActual), sube: true, color: '#fbbf24', fmt: cop },
    ];
    return def.map(g => {
      const dif = g.vals[g.vals.length - 1] - g.vals[0];
      return { ...g, mejora: g.sube ? dif >= 0 : dif <= 0,
        cambio: (dif > 0 ? '▲ +' : dif < 0 ? '▼ ' : '') + g.fmt(Math.abs(dif) * (dif < 0 ? -1 : 1)).replace('--', '-') + ' desde tu primer diagnóstico' };
    });
  }
}
