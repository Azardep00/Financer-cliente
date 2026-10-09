import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Centro negro; a cada lado una malla fina (public/malla.svg) que se desvanece hacia el centro.
@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet],
  template: `<div class="fondo" aria-hidden="true"><div class="malla izq"></div><div class="malla der"></div></div>
    <div class="contenido"><router-outlet /></div>`,
  styles: [`
    .fondo { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
      background: radial-gradient(ellipse 55% 40% at 50% 0%, rgba(116,100,200,.14), transparent 70%), #060204; }
    .malla { position: absolute; top: 0; bottom: 0; width: clamp(40px, 11vw, 190px); background-color: #060204;
      background-image: url('/malla.svg'); background-size: 24px 24px; animation: deriva 14s linear infinite; }
    .izq { left: 0; -webkit-mask-image: linear-gradient(to right, #000 50%, transparent); mask-image: linear-gradient(to right, #000 50%, transparent); }
    .der { right: 0; -webkit-mask-image: linear-gradient(to left, #000 50%, transparent); mask-image: linear-gradient(to left, #000 50%, transparent); }
    @keyframes deriva { to { background-position: 24px 24px; } }
    .contenido { position: relative; z-index: 1; }
    @media (prefers-reduced-motion: reduce) { .malla { animation: none; } }`],
})
export class AppComponent {}
