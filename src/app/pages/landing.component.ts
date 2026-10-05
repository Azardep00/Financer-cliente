import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// BORRADOR: textos, nombres de planes y precios son de ejemplo. Ajustalos aqui.
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './landing.component.css',
  template: `
  <header class="nav">
    <strong class="logo">Financer <span>KSD</span></strong>
    <nav>
      <a href="#metodologia">Metodología</a>
      <a href="#planes">Planes</a>
      <a routerLink="/login">Ingresar</a>
      <a routerLink="/registro" class="btn">Empezar</a>
    </nav>
  </header>

  <section class="hero">
    <h1>Ordena tus finanzas con un plan hecho para ti</h1>
    <p>Un asesor revisa tu situación real, te arma metas concretas y te acompaña hasta que veas tu progreso en números.</p>
    <a routerLink="/registro" class="btn">Quiero mi diagnóstico</a>
    <a href="#metodologia" class="btn sec">Ver cómo funciona</a>
  </section>

  <section id="metodologia" class="seccion">
    <h2>Nuestra metodología en 4 pasos</h2>
    <div class="pasos">
      @for (p of pasos; track p.n) {
        <div class="paso">
          <div class="num">{{ p.n }}</div>
          <h3>{{ p.titulo }}</h3>
          <p>{{ p.texto }}</p>
        </div>
      }
    </div>
  </section>

  <section class="seccion alt">
    <h2>Medimos lo que importa</h2>
    <div class="metricas">
      @for (m of metricas; track m.nombre) {
        <div class="metrica">
          <div class="valor">{{ m.valor }}</div>
          <h3>{{ m.nombre }}</h3>
          <p>{{ m.texto }}</p>
        </div>
      }
    </div>

    <h3 class="sub">Así se ve tu mejora en el tiempo (ejemplo)</h3>
    <svg viewBox="0 0 400 170" class="grafica" role="img" aria-label="Gráfica de ejemplo: la tasa de ahorro sube y la deuda baja">
      <g stroke="#e5e7eb"><line x1="30" y1="20" x2="390" y2="20"/><line x1="30" y1="70" x2="390" y2="70"/><line x1="30" y1="120" x2="390" y2="120"/><line x1="30" y1="150" x2="390" y2="150"/></g>
      <polyline fill="none" stroke="#0f766e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="40,135 110,115 180,95 250,70 320,45 380,28"/>
      <polyline fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="40,30 110,45 180,70 250,95 320,115 380,132"/>
      <g font-size="11" fill="#6b7280" text-anchor="middle"><text x="40" y="165">Mes 1</text><text x="180" y="165">Mes 3</text><text x="320" y="165">Mes 5</text></g>
    </svg>
    <p class="leyenda"><span class="dot v"></span> Ahorro sube &nbsp; <span class="dot d"></span> Deuda baja</p>
  </section>

  <section id="planes" class="seccion">
    <h2>Planes (borrador)</h2>
    <div class="planes">
      @for (pl of planes; track pl.nombre) {
        <div class="plan" [class.dest]="pl.destacado">
          <h3>{{ pl.nombre }}</h3>
          <div class="precio">{{ pl.precio }}</div>
          <ul>@for (i of pl.incluye; track i) { <li>{{ i }}</li> }</ul>
          <a routerLink="/registro" class="btn" [class.sec]="!pl.destacado">Elegir</a>
        </div>
      }
    </div>
  </section>

  <footer>© 2026 Financer KSD · Asesoría financiera personal</footer>
  `,
})
export class LandingComponent {
  pasos = [
    { n: 1, titulo: 'Diagnóstico', texto: 'Revisamos tus ingresos, gastos, deudas y ahorro para ver dónde estás hoy.' },
    { n: 2, titulo: 'Plan personalizado', texto: 'Tu asesor define metas claras con fecha: fondo de emergencia, reducir deudas, bajar gastos.' },
    { n: 3, titulo: 'Acompañamiento', texto: 'Das seguimiento, marcas avances y tu asesor ajusta el plan contigo.' },
    { n: 4, titulo: 'Progreso medible', texto: 'Nuevos diagnósticos con el tiempo muestran en gráficas cuánto has mejorado.' },
  ];
  metricas = [
    { valor: '%', nombre: 'Tasa de ahorro', texto: 'Qué parte de tu ingreso logras guardar cada mes.' },
    { valor: '÷', nombre: 'Deuda / ingreso', texto: 'Cuánto pesa tu deuda frente a lo que ganas al año. Sobre 36% es zona de alerta.' },
    { valor: 'm', nombre: 'Fondo de emergencia', texto: 'Cuántos meses de gastos puedes cubrir con tu ahorro.' },
  ];
  planes = [
    { nombre: 'Esencial', precio: 'Por definir', destacado: false,
      incluye: ['Diagnóstico financiero inicial', 'Plan de mejora con metas', 'Panel de progreso'] },
    { nombre: 'Acompañamiento', precio: 'Por definir', destacado: true,
      incluye: ['Todo lo del plan Esencial', 'Seguimiento periódico con tu asesor', 'Ajustes al plan', 'Nuevos diagnósticos para medir avance'] },
    { nombre: 'Integral', precio: 'Por definir', destacado: false,
      incluye: ['Todo lo del plan Acompañamiento', 'Estrategia de deudas', 'Metas de ahorro e inversión'] },
  ];
}
