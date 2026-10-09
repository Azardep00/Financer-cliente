import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Centro negro; a cada lado una malla de rombos redondeados (rojo sobre negro) que se desvanece hacia el centro.
@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet],
  template: `<div class="fondo" aria-hidden="true"><div class="malla izq"></div><div class="malla der"></div></div>
    <div class="contenido"><router-outlet /></div>`,
  styles: [`
    .fondo { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
      background: radial-gradient(ellipse 55% 40% at 50% 0%, rgba(225,29,46,.14), transparent 70%), #060204; }
    .malla { position: absolute; top: 0; bottom: 0; width: clamp(40px, 11vw, 190px);
      background-color: #060204;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23060204'/%3E%3Cg fill='%23d4141f'%3E%3Crect x='-10' y='-10' width='20' height='20' rx='5.5' transform='rotate(45)'/%3E%3Crect x='-10' y='-10' width='20' height='20' rx='5.5' transform='translate(40 0) rotate(45)'/%3E%3Crect x='-10' y='-10' width='20' height='20' rx='5.5' transform='translate(0 40) rotate(45)'/%3E%3Crect x='-10' y='-10' width='20' height='20' rx='5.5' transform='translate(40 40) rotate(45)'/%3E%3Crect x='-10' y='-10' width='20' height='20' rx='5.5' transform='translate(20 20) rotate(45)'/%3E%3C/g%3E%3C/svg%3E");
      animation: deriva 14s linear infinite; }
    .izq { left: 0; -webkit-mask-image: linear-gradient(to right, #000 50%, transparent); mask-image: linear-gradient(to right, #000 50%, transparent); }
    .der { right: 0; -webkit-mask-image: linear-gradient(to left, #000 50%, transparent); mask-image: linear-gradient(to left, #000 50%, transparent); }
    @keyframes deriva { to { background-position: 40px 40px; } }
    .contenido { position: relative; z-index: 1; }
    @media (prefers-reduced-motion: reduce) { .malla { animation: none; } }`],
})
export class AppComponent {}
