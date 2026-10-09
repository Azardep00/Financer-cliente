import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent } from '../core/banner';
import { FASES, INDICADORES, PLANES } from '../core/contenido';

@Component({
  selector: 'app-landing', standalone: true, imports: [RouterLink, BannerComponent],
  styleUrl: './landing.component.css',
  template: `
  <header class="nav" [class.oculto]="oculto">
    <strong class="logo">Financer <span>KSD</span></strong>
    <nav><a routerLink="/login" class="btn sec">Iniciar Sesion</a><a routerLink="/registro" class="btn">Registrame</a></nav>
  </header>

  <section class="hero">
    <span class="pill">Asesoría financiera personal</span>
    <h1>Tus finanzas, <em>claras</em> y con un plan que sí se mide</h1>
    <p>Un asesor analiza tu situación real, define metas con fecha y te acompaña hasta que veas tu mejora en números.</p>
    <a routerLink="/registro" class="btn">Quiero mi diagnóstico</a>
    <a href="#metodo" class="btn sec">Ver cómo funciona</a>
  </section>

  <app-banner>
    <h2 class="bt">Tus finanzas suben y bajan.<br>Con un plan, tú decides hacia dónde.</h2>
    <p class="bs">Medimos tu avance diagnóstico tras diagnóstico.</p>
  </app-banner>

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
  fases = FASES; indicadores = INDICADORES; planes = PLANES;
  oculto = false; private y = 0;

  // Al bajar se oculta el navbar; al subir vuelve a aparecer.
  @HostListener('window:scroll') onScroll() {
    const y = window.scrollY, dif = y - this.y;
    if (Math.abs(dif) < 6) return;          // ignora temblores minimos
    this.oculto = dif > 0 && y > 90;
    this.y = y;
  }
}
