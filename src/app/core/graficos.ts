import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-donut', standalone: true,
  template: `<svg viewBox="0 0 100 100" class="donut" role="img" aria-label="Distribución del ingreso">
    <circle cx="50" cy="50" r="40" fill="none" stroke="#7464c8" stroke-width="12"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="#d4d4d8" stroke-width="12" stroke-linecap="butt"
      [attr.stroke-dasharray]="gasto * 2.513 + ' 251.3'" transform="rotate(-90 50 50)"/>
    <text x="50" y="52" text-anchor="middle" fill="#fff" font-size="15" font-weight="800">{{ (100 - gasto).toFixed(0) }}%</text>
    <text x="50" y="65" text-anchor="middle" fill="#b9a6c4" font-size="7">libre</text></svg>`,
  styles: ['.donut{width:100%;max-width:170px}'],
})
export class DonutComponent { @Input() gasto = 0; }

let uid = 0;
@Component({
  selector: 'app-linea', standalone: true,
  template: `<svg viewBox="0 0 320 140" role="img">
    <defs><linearGradient [attr.id]="id" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" [attr.stop-color]="color" stop-opacity=".5"/><stop offset="1" [attr.stop-color]="color" stop-opacity="0"/></linearGradient></defs>
    @for (y of [30, 65, 100]; track y) { <line x1="8" [attr.y1]="y" x2="312" [attr.y2]="y" stroke="rgba(255,255,255,.08)"/> }
    <path [attr.d]="area" [attr.fill]="'url(#' + id + ')'"/>
    <path [attr.d]="linea" fill="none" [attr.stroke]="color" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    @for (p of pts; track $index) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4.5" [attr.fill]="color" stroke="#0a0410" stroke-width="2"><title>{{ p.t }}</title></circle> }
    <text x="8" y="134" fill="#b9a6c4" font-size="10">{{ fechas[0] }}</text>
    <text x="312" y="134" fill="#b9a6c4" font-size="10" text-anchor="end">{{ fechas[fechas.length - 1] }}</text></svg>`,
  styles: ['svg{width:100%;display:block}'],
})
export class LineaComponent {
  @Input() vals: number[] = [];
  @Input() fechas: string[] = [];
  @Input() color = '#7464c8';
  @Input() fmt: (n: number) => string = n => n.toFixed(1);
  id = 'g' + uid++;

  get pts() {
    const v = this.vals, n = v.length, min = Math.min(...v), r = Math.max(...v) - min || 1;
    return v.map((x, i) => ({ x: n > 1 ? 8 + (304 * i) / (n - 1) : 160, y: 100 - ((x - min) / r) * 70, t: `${this.fechas[i]}: ${this.fmt(x)}` }));
  }
  get linea() { return this.pts.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' '); }
  get area() { const p = this.pts; return p.length ? `${this.linea} L${p[p.length - 1].x} 100 L${p[0].x} 100 Z` : ''; }
}
