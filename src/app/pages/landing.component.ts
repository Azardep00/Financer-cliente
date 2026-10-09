import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FASES, INDICADORES, PLANES } from '../core/contenido';

@Component({
  selector: 'app-landing', standalone: true, imports: [RouterLink],
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

  <section class="video-banda" aria-label="Video: tus finanzas suben y bajan, con un plan tú decides hacia dónde">
    <video #vid src="/banner.mp4?v=3" poster="/banner-poster.jpg?v=3" [muted]="true" autoplay loop playsinline preload="auto" disablepictureinpicture></video>
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
export class LandingComponent implements AfterViewInit {
  fases = FASES; indicadores = INDICADORES; planes = PLANES;
  oculto = false; private y = 0;
  @ViewChild('vid', { static: true }) vid!: ElementRef<HTMLVideoElement>;

  // Angular no aplica bien el atributo "muted" y Chrome bloquea el autoplay con sonido:
  // se silencia por propiedad y se arranca por codigo.
  ngAfterViewInit() {
    const v = this.vid.nativeElement;
    v.muted = true; v.defaultMuted = true;
    const arrancar = () => v.play().then(() => true, () => false);
    arrancar().then(ok => {
      if (ok) return;
      // Si el navegador bloqueo el autoplay (ahorro de energia, etc.), reintenta al primer gesto.
      const evs = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
      const reintento = () => { evs.forEach(e => removeEventListener(e, reintento)); arrancar(); };
      evs.forEach(e => addEventListener(e, reintento, { passive: true }));
    });
  }

  // Al bajar se oculta el navbar; al subir vuelve a aparecer.
  @HostListener('window:scroll') onScroll() {
    const y = window.scrollY, dif = y - this.y;
    if (Math.abs(dif) < 6) return;          // ignora temblores minimos
    this.oculto = dif > 0 && y > 90;
    this.y = y;
  }
}
