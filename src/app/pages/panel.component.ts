import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ApiService, Diagnostico, Meta, Plan, Progreso } from '../core/api.service';

type Color = 'verde' | 'amarillo' | 'rojo';

@Component({
  selector: 'app-panel',
  standalone: true,
  styleUrl: './panel.component.css',
  template: `
  <header class="top">
    <strong class="logo">Financer <span>KSD</span></strong>
    <div>Hola, {{ auth.sesion()?.nombre }} <button class="btn sec" (click)="auth.logout()">Salir</button></div>
  </header>

  <main class="wrap">
    @if (cargando()) { <p class="vacio">Cargando tu información…</p> }
    @else {

    <!-- ============ RESUMEN ============ -->
    <h2>Mi situación financiera</h2>
    @if (!diag()) {
      <p class="vacio">Tu asesor aún no ha registrado tu diagnóstico. Cuando lo haga, verás aquí tus métricas.</p>
    } @else {
      <div class="metricas">
        @for (m of tarjetas(); track m.nombre) {
          <div class="card" [class]="'card ' + m.color">
            <small>{{ m.nombre }}</small>
            <div class="valor">{{ m.valor }}</div>
            <span class="ayuda">{{ m.ayuda }}</span>
          </div>
        }
      </div>
      <div class="cifras">
        <div><small>Ingreso mensual</small><b>{{ moneda(diag()!.ingresoMensual) }}</b></div>
        <div><small>Gasto mensual</small><b>{{ moneda(diag()!.gastoMensual) }}</b></div>
        <div><small>Deuda total</small><b>{{ moneda(diag()!.deudaTotal) }}</b></div>
        <div><small>Ahorro actual</small><b>{{ moneda(diag()!.ahorroActual) }}</b></div>
      </div>
      <p class="fecha">Último diagnóstico: {{ diag()!.fecha }}</p>
    }

    <!-- ============ MI PLAN ============ -->
    <h2>Mi plan de mejora</h2>
    @if (!plan()) {
      <p class="vacio">Aún no tienes un plan. Tu asesor lo armará contigo.</p>
    } @else {
      <div class="plan">
        <h3>{{ plan()!.titulo }}</h3>
        @if (plan()!.descripcion) { <p class="desc">{{ plan()!.descripcion }}</p> }
        <div class="barra"><div [style.width.%]="plan()!.progreso"></div></div>
        <small>{{ completadas() }} de {{ plan()!.metas.length }} metas cumplidas · {{ plan()!.progreso.toFixed(0) }}%</small>

        @for (m of plan()!.metas; track m.idMeta) {
          <label class="meta" [class.hecha]="m.completada">
            <input type="checkbox" [checked]="m.completada" [disabled]="guardando() === m.idMeta" (change)="alternar(m)" />
            <span class="txt">{{ m.descripcion }}</span>
            @if (vencida(m)) { <em class="venc">Vencida</em> }
            @else if (m.fechaLimite) { <em>Para el {{ m.fechaLimite }}</em> }
          </label>
        } @empty { <p class="vacio">Tu plan todavía no tiene metas.</p> }
      </div>
    }

    <!-- ============ PROGRESO ============ -->
    <h2>Mi progreso</h2>
    @if (!prog() || prog()!.historial.length < 2) {
      <p class="vacio">Necesitas al menos dos diagnósticos para ver tu evolución. ¡Pronto verás tus gráficas aquí!</p>
    } @else {
      <div class="graficas">
        @for (g of graficas(); track g.titulo) {
          <div class="graf">
            <small>{{ g.titulo }}</small>
            <svg viewBox="0 0 300 110" role="img" [attr.aria-label]="g.titulo">
              <line x1="10" y1="100" x2="290" y2="100" stroke="#e5e7eb"/>
              <polyline fill="none" [attr.stroke]="g.color" stroke-width="3" stroke-linejoin="round" [attr.points]="g.puntos"/>
              @for (p of g.circulos; track $index) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" [attr.fill]="g.color"/> }
            </svg>
            <div class="cambio" [class.bien]="g.mejora" [class.mal]="!g.mejora">{{ g.cambio }}</div>
          </div>
        }
      </div>
    }
    }
  </main>`,
})
export class PanelComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  cargando = signal(true);
  guardando = signal<number | null>(null);
  diag = signal<Diagnostico | null>(null);
  plan = signal<Plan | null>(null);
  prog = signal<Progreso | null>(null);

  ngOnInit() { this.cargar(); }

  cargar() {
    const id = this.auth.sesion()!.idUsuario;
    // Un 404 (aun no hay diagnostico o plan) no es un error: se muestra el estado vacio.
    const o = <T>(s: import('rxjs').Observable<T>) => s.pipe(catchError(() => of(null)));
    forkJoin({ d: o(this.api.ultimoDiagnostico(id)), p: o(this.api.planActivo(id)), g: o(this.api.progreso(id)) })
      .subscribe(r => { this.diag.set(r.d); this.plan.set(r.p); this.prog.set(r.g); this.cargando.set(false); });
  }

  completadas() { return this.plan()?.metas.filter(m => m.completada).length ?? 0; }
  vencida(m: Meta) { return !m.completada && !!m.fechaLimite && m.fechaLimite < new Date().toISOString().slice(0, 10); }

  alternar(m: Meta) {
    this.guardando.set(m.idMeta);
    const peticion = m.completada ? this.api.pendienteMeta(m.idMeta) : this.api.completarMeta(m.idMeta);
    peticion.subscribe({
      next: () => { this.guardando.set(null); this.cargar(); }, // recarga plan y progreso
      error: () => this.guardando.set(null),
    });
  }

  moneda(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  }

  // Semaforo de las 3 metricas clave.
  tarjetas(): { nombre: string; valor: string; color: Color; ayuda: string }[] {
    const d = this.diag()!;
    const ahorro: Color = d.tasaAhorro >= 20 ? 'verde' : d.tasaAhorro >= 10 ? 'amarillo' : 'rojo';
    const deuda: Color = d.relacionDeudaIngreso <= 20 ? 'verde' : d.relacionDeudaIngreso <= 36 ? 'amarillo' : 'rojo';
    const fondo: Color = d.mesesFondoEmergencia >= 3 ? 'verde' : d.mesesFondoEmergencia >= 1 ? 'amarillo' : 'rojo';
    return [
      { nombre: 'Tasa de ahorro', valor: d.tasaAhorro.toFixed(1) + '%', color: ahorro, ayuda: 'Meta sana: 20% o más' },
      { nombre: 'Deuda / ingreso anual', valor: d.relacionDeudaIngreso.toFixed(1) + '%', color: deuda, ayuda: 'Alerta sobre 36%' },
      { nombre: 'Fondo de emergencia', valor: d.mesesFondoEmergencia.toFixed(1) + ' meses', color: fondo, ayuda: 'Meta: 3 meses o más' },
    ];
  }

  // Dos mini-graficas SVG (sin librerias) a partir del historial.
  graficas() {
    const h = this.prog()!.historial;
    const def = [
      { titulo: 'Tasa de ahorro (%)', vals: h.map(p => p.tasaAhorro), subeEsBueno: true, color: '#0f766e', suf: ' pts' },
      { titulo: 'Deuda / ingreso (%)', vals: h.map(p => p.relacionDeudaIngreso), subeEsBueno: false, color: '#f59e0b', suf: ' pts' },
    ];
    return def.map(g => {
      const min = Math.min(...g.vals), max = Math.max(...g.vals), rango = max - min || 1;
      const pts = g.vals.map((v, i) => ({ x: 10 + (280 * i) / (g.vals.length - 1), y: 90 - ((v - min) / rango) * 75 }));
      const dif = g.vals[g.vals.length - 1] - g.vals[0];
      return {
        titulo: g.titulo, color: g.color, circulos: pts,
        puntos: pts.map(p => `${p.x},${p.y}`).join(' '),
        mejora: g.subeEsBueno ? dif >= 0 : dif <= 0,
        cambio: (dif > 0 ? '+' : '') + dif.toFixed(1) + g.suf + ' desde tu primer diagnóstico',
      };
    });
  }
}
