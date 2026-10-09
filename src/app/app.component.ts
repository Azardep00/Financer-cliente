import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Fondo global: negro con "fluido" rosa en los bordes (simetrico) y burbujas que suben.
@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet],
  template: `<div class="fondo" aria-hidden="true">
      @for (b of burbujas; track $index) {
        <span class="b" [style.width.px]="b.s" [style.height.px]="b.s" [style.left.%]="b.x"
          [style.animation-duration.s]="b.d" [style.animation-delay.s]="b.de" [style.--o]="b.o"></span>
      }</div>
    <div class="contenido"><router-outlet /></div>`,
  styles: [`
    .fondo { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 28% 60% at 0% 50%, rgba(214,43,176,.55), transparent 70%),
        radial-gradient(ellipse 28% 60% at 100% 50%, rgba(214,43,176,.55), transparent 70%),
        radial-gradient(ellipse 40% 25% at 50% 50%, rgba(255,79,184,.10), transparent 70%), #06030a; }
    .b { position: absolute; bottom: -120px; border-radius: 50%; opacity: var(--o);
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.65), rgba(255,105,190,.28) 38%, rgba(150,20,120,.10) 68%, transparent 72%);
      border: 1px solid rgba(255,190,235,.35); box-shadow: inset 0 0 12px rgba(255,120,210,.25);
      animation: subir linear infinite; }
    @keyframes subir { 0% { transform: translate(0,0); } 50% { transform: translate(24px,-60vh); } 100% { transform: translate(-16px,-125vh); } }
    .contenido { position: relative; z-index: 1; }
    @media (prefers-reduced-motion: reduce) { .b { animation: none; bottom: 20%; } }`],
})
export class AppComponent {
  burbujas = Array.from({ length: 22 }, (_, i) => {
    const r = (n: number) => { const x = Math.sin(i * 97.3 + n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    return { s: 14 + r(1) * 74, x: r(2) * 100, d: 16 + r(3) * 20, de: -r(4) * 30, o: 0.3 + r(5) * 0.6 };
  });
}
