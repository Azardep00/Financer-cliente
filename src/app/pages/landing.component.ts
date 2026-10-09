import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DonutComponent } from '../core/graficos';
import { FASES, INDICADORES, PLANES } from '../core/contenido';
import { calcular, cop, pctGasto, semaforo } from '../core/metricas';

type K = 'ingreso' | 'gasto' | 'deuda' | 'ahorro';

@Component({
  selector: 'app-landing', standalone: true, imports: [RouterLink, FormsModule, DonutComponent],
  styleUrl: './landing.component.css',
  template: `
  <header class="nav glass">
    <strong class="logo">Financer <span>KSD</span></strong>
    <nav><a href="#calculadora">Calculadora</a><a href="#metodo">Método</a><a href="#planes">Planes</a>
      <a routerLink="/login">Ingresar</a><a routerLink="/registro" class="btn">Empezar</a></nav>
  </header>

  <section class="hero">
    <span class="pill">Asesoría financiera personal</span>
    <h1>Tus finanzas, <em>claras</em> y con un plan que sí se mide</h1>
    <p>Un asesor analiza tu situación real, define metas con fecha y te acompaña hasta que veas tu mejora en números.</p>
    <a routerLink="/registro" class="btn">Quiero mi diagnóstico</a>
    <a href="#calculadora" class="btn sec">Probar la calculadora</a>
  </section>

  <section id="calculadora" class="sec">
    <h2>Calcula tu diagnóstico en 10 segundos</h2>
    <p class="sub">Escribe tus cifras mensuales y mira tus tres indicadores al instante. No guardamos nada.</p>
    <div class="calc glass">
      <div class="campos">
        @for (c of campos; track c.k) {
          <label>{{ c.t }}<input type="number" min="0" [(ngModel)]="v[c.k]" /></label>
        }
      </div>
      <div class="res">
        <div class="don">
          <app-donut [gasto]="gastoPct" />
          <small><i class="d1"></i>Gastos {{ gastoPct.toFixed(0) }}% &nbsp; <i class="d2"></i>Libre</small>
        </div>
        <div class="tarj">
          @for (t of tarjetas; track t.nombre) {
            <div class="t" [class]="'t ' + t.color"><small>{{ t.nombre }}</small><b>{{ t.valor }}</b><span>{{ t.ayuda }}</span></div>
          }
        </div>
      </div>
      <p class="libre">Te quedan libres cada mes: <b>{{ cop(m.libre) }}</b></p>
    </div>
  </section>

  <section id="metodo" class="sec">
    <h2>El método Financer KSD</h2>
    <p class="sub">Cinco fases, un orden lógico y resultados que se comparan en el tiempo.</p>
    <div class="linea">
      @for (f of fases; track f.n) {
        <div class="fase glass"><div class="num">{{ f.n }}</div><div><h3>{{ f.t }}</h3><p>{{ f.d }}</p></div></div>
      }
    </div>
    <h3 class="sub2">Los tres indicadores que medimos</h3>
    <div class="ind">
      @for (i of indicadores; track i.n) {
        <div class="glass i"><h4>{{ i.n }}</h4><code>{{ i.f }}</code>
          <p><span class="ok">Meta: {{ i.meta }}</span><span class="mal">Alerta: {{ i.alerta }}</span></p></div>
      }
    </div>
    <small class="nota">Umbrales de referencia en finanzas personales. Información educativa; no es asesoría de inversión regulada.</small>
  </section>

  <section id="planes" class="sec">
    <h2>Planes</h2>
    <div class="planes">
      @for (p of planes; track p.nombre) {
        <div class="plan glass" [class.dest]="p.destacado">
          @if (p.destacado) { <span class="pill">Recomendado</span> }
          <h3>{{ p.nombre }}</h3><div class="precio">{{ p.precio ?? 'Por definir' }}</div>
          <ul>@for (i of p.incluye; track i) { <li>{{ i }}</li> }</ul>
          <a routerLink="/registro" class="btn" [class.sec]="!p.destacado">Elegir</a>
        </div>
      }
    </div>
  </section>
  <footer>© 2026 Financer KSD</footer>`,
})
export class LandingComponent {
  fases = FASES; indicadores = INDICADORES; planes = PLANES; cop = cop;
  v: Record<K, number> = { ingreso: 4000000, gasto: 3000000, deuda: 12000000, ahorro: 6000000 };
  campos: { k: K; t: string }[] = [
    { k: 'ingreso', t: 'Ingreso mensual' }, { k: 'gasto', t: 'Gasto mensual' },
    { k: 'deuda', t: 'Deuda total' }, { k: 'ahorro', t: 'Ahorro actual' },
  ];
  get m() { return calcular(this.v); }
  get tarjetas() { return semaforo(this.m); }
  get gastoPct() { return pctGasto(this.v); }
}
