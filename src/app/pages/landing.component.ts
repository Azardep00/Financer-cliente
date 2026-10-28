import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { FASES, INDICADORES, PLANES } from '../core/contenido';

// Datos de EJEMPLO para la vista previa del hero (no son de ningún cliente real).
const MESES = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
const TASA = [8, 11, 13, 15, 18, 21];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './landing.component.css',
  template: `
  <a class="saltar" href="#contenido-principal">Saltar al contenido</a>

  <header class="barra">
    <div class="contenedor barra-in">
      <a routerLink="/" class="marca" aria-label="Financer KSD, inicio">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#12263f"/>
          <path d="M8 22v-5M14 22v-9M20 22v-6M26 22V9" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <span>Financer <b>KSD</b></span>
      </a>
      <nav class="enlaces" aria-label="Secciones">
        <a [routerLink]="[]" fragment="metodo">Método</a>
        <a [routerLink]="[]" fragment="indicadores">Indicadores</a>
        <a [routerLink]="[]" fragment="planes">Planes</a>
      </nav>
      <div class="acciones">
        @if (auth.logueado) {
          <a [routerLink]="auth.inicio" class="btn btn-primario">Ir a mi panel</a>
        } @else {
          <a routerLink="/login" class="btn btn-secundario">Iniciar sesión</a>
          <a routerLink="/registro" class="btn btn-primario">Registrarme</a>
        }
      </div>
    </div>
  </header>

  <main id="contenido-principal">
    <section class="hero">
      <div class="contenedor hero-in">
        <div class="hero-texto">
          <span class="sello">Asesoría financiera personal</span>
          <h1>Tus finanzas, <em>claras</em> y con un plan que sí se mide</h1>
          <p>Un asesor analiza tu situación real, define metas con fecha y te acompaña hasta que veas tu mejora en números.</p>
          <div class="hero-botones">
            <a routerLink="/registro" class="btn-hero">Quiero mi diagnóstico</a>
            <a [routerLink]="[]" fragment="metodo" class="btn-hero btn-hero-sec">Ver cómo funciona</a>
          </div>
        </div>

        <figure class="vista" aria-label="Ejemplo ilustrativo del panel de seguimiento">
          <div class="vista-cab">
            <strong>Tu evolución</strong>
            <span class="etiqueta-estado">Ejemplo ilustrativo</span>
          </div>
          <div class="vista-cifras">
            <div><span class="rotulo">Tasa de ahorro</span><b class="cifra"><i class="punto ok"></i>21%</b></div>
            <div><span class="rotulo">Deuda / ingreso</span><b class="cifra"><i class="punto warn"></i>24%</b></div>
            <div><span class="rotulo">Fondo de emergencia</span><b class="cifra"><i class="punto warn"></i>2,1 meses</b></div>
          </div>
          <svg viewBox="0 0 320 150" role="img" aria-label="Ejemplo: la tasa de ahorro sube de 8% a 21% en seis meses">
            @for (y of [20, 70, 120]; track y) { <line x1="30" [attr.y1]="y" x2="304" [attr.y2]="y" stroke="#e6ebf1"/> }
            <line x1="30" [attr.y1]="metaY" x2="304" [attr.y2]="metaY" stroke="#0f8f6b" stroke-dasharray="4 4"/>
            <text x="34" [attr.y]="metaY - 5" font-size="10" fill="#0b6e52">Meta 20%</text>
            <polyline [attr.points]="puntos" fill="none" stroke="#1f4e8c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            @for (p of pts; track p.mes) {
              <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" [attr.fill]="p.ultimo ? '#1f4e8c' : '#fff'" stroke="#1f4e8c" stroke-width="2"/>
              <text [attr.x]="p.x" y="143" text-anchor="middle" font-size="10" fill="#5b6878">{{ p.mes }}</text>
            }
          </svg>
        </figure>
      </div>
    </section>

    <section id="metodo" class="seccion">
      <div class="contenedor">
        <div class="seccion-cab">
          <h2>El método Financer KSD</h2>
          <p>Cinco fases, un orden lógico y resultados que se comparan en el tiempo.</p>
        </div>
        <ol class="fases">
          @for (f of fases; track f.n) {
            <li>
              <span class="n" aria-hidden="true">{{ f.n }}</span>
              <div><h3>{{ f.t }}</h3><p>{{ f.d }}</p></div>
            </li>
          }
        </ol>
      </div>
    </section>

    <section id="indicadores" class="seccion alterna">
      <div class="contenedor">
        <div class="seccion-cab">
          <h2>Los tres indicadores que medimos</h2>
          <p>Los mismos que verás en tu panel, con sus umbrales de referencia.</p>
        </div>
        <div class="tabla-contenedor">
          <table class="tabla">
            <thead><tr><th scope="col">Indicador</th><th scope="col">Cómo se calcula</th><th scope="col">Meta</th><th scope="col">Alerta</th></tr></thead>
            <tbody>
              @for (i of indicadores; track i.n) {
                <tr>
                  <th scope="row" class="nombre">{{ i.n }}</th>
                  <td data-etiqueta="Cómo se calcula"><code>{{ i.f }}</code></td>
                  <td data-etiqueta="Meta"><span class="etiqueta-estado etiqueta-ok">{{ i.meta }}</span></td>
                  <td data-etiqueta="Alerta"><span class="etiqueta-estado etiqueta-mal">{{ i.alerta }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="nota">Umbrales de referencia en finanzas personales. Información educativa; no es asesoría de inversión regulada.</p>
      </div>
    </section>

    <section id="planes" class="seccion">
      <div class="contenedor">
        <div class="seccion-cab"><h2>Planes</h2><p>Elige el nivel de acompañamiento que necesitas.</p></div>
        <div class="planes">
          @for (p of planes; track p.nombre) {
            <article class="card plan" [class.destacado]="p.destacado">
              <div class="plan-cab">
                <h3>{{ p.nombre }}</h3>
                @if (p.destacado) { <span class="etiqueta-estado etiqueta-info">Recomendado</span> }
              </div>
              <div class="precio">{{ p.precio ?? 'Por definir' }}</div>
              <ul>@for (i of p.incluye; track i) { <li>{{ i }}</li> }</ul>
              <a routerLink="/registro" class="btn btn-bloque" [class.btn-primario]="p.destacado" [class.btn-secundario]="!p.destacado">Elegir {{ p.nombre }}</a>
            </article>
          }
        </div>
      </div>
    </section>

    <section class="cierre">
      <div class="contenedor cierre-in">
        <div><h2>Empieza con tu diagnóstico</h2><p>Crea tu cuenta y un asesor te acompañará con un plan claro, mes a mes.</p></div>
        <a routerLink="/registro" class="btn btn-primario">Crear mi cuenta</a>
      </div>
    </section>
  </main>

  <footer class="pie">
    <div class="contenedor pie-in">
      <span>© 2026 Financer KSD</span>
      <span class="pie-enlaces"><a routerLink="/login">Iniciar sesión</a><a routerLink="/registro">Registrarme</a></span>
    </div>
  </footer>`,
})
export class LandingComponent {
  auth = inject(AuthService);
  fases = FASES; indicadores = INDICADORES; planes = PLANES;

  // Geometría del gráfico de ejemplo: ahorro de 0 a 25 %, en un área de 120 px de alto.
  readonly metaY = 120 - (20 / 25) * 100;
  readonly pts = TASA.map((v, i) => ({
    mes: MESES[i], x: 40 + i * 52, y: 120 - (v / 25) * 100, ultimo: i === TASA.length - 1,
  }));
  readonly puntos = this.pts.map(p => `${p.x},${p.y}`).join(' ');
}
