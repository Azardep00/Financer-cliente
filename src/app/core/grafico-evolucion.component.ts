import { Component, Input } from '@angular/core';

/** Gráfica de línea sobria: sin degradados ni animaciones. Es lo único "llamativo" de la app. */
@Component({
  selector: 'app-grafico-evolucion',
  standalone: true,
  template: `
    <figure>
      <figcaption class="solo-lectores">{{ titulo }}: {{ resumen }}</figcaption>
      @if (vals.length === 0) {
        <p class="sin-datos">Sin datos todavía.</p>
      } @else {
        <svg viewBox="0 0 320 150" role="img" [attr.aria-label]="titulo + ': ' + resumen">
          @for (y of [25, 60, 95]; track y) { <line x1="8" [attr.y1]="y" x2="312" [attr.y2]="y" stroke="#e6ebf1" /> }
          @if (refY !== null) {
            <line x1="8" [attr.y1]="refY" x2="312" [attr.y2]="refY" stroke="#0f8f6b" stroke-dasharray="4 4" />
            <text x="312" [attr.y]="refY! - 4" text-anchor="end" font-size="9" fill="#0b6e52">meta {{ fmt(ref!) }}</text>
          }
          <path [attr.d]="linea" fill="none" [attr.stroke]="color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          @for (p of pts; track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" [attr.fill]="color" stroke="#fff" stroke-width="1.5"><title>{{ p.t }}</title></circle>
          }
          <text x="8" y="144" font-size="10" fill="#5b6878">{{ fechas[0] }}</text>
          <text x="312" y="144" font-size="10" fill="#5b6878" text-anchor="end">{{ fechas[fechas.length - 1] }}</text>
        </svg>
      }
    </figure>`,
  styles: [`
    figure { margin: 0; }
    svg { width: 100%; display: block; }
    .sin-datos { color: var(--suave); font-size: .875rem; padding: 2rem 0; text-align: center; }
  `],
})
export class GraficoEvolucionComponent {
  @Input() titulo = '';
  @Input() vals: number[] = [];
  @Input() fechas: string[] = [];
  @Input() color = '#1f4e8c';
  /** Línea de referencia opcional (por ejemplo, la meta). */
  @Input() ref: number | null = null;
  @Input() fmt: (n: number) => string = n => n.toFixed(1);

  private get min() { return Math.min(...this.vals, ...(this.ref !== null ? [this.ref] : [])); }
  private get rango() { return (Math.max(...this.vals, ...(this.ref !== null ? [this.ref] : [])) - this.min) || 1; }
  private y(v: number) { return 105 - ((v - this.min) / this.rango) * 80; }

  get refY() { return this.ref === null || !this.vals.length ? null : this.y(this.ref); }
  get pts() {
    const n = this.vals.length;
    return this.vals.map((v, i) => ({ x: n > 1 ? 8 + (304 * i) / (n - 1) : 160, y: this.y(v), t: `${this.fechas[i]}: ${this.fmt(v)}` }));
  }
  get linea() { return this.pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' '); }
  get resumen() {
    const n = this.vals.length;
    return n ? `${n} registros, de ${this.fmt(this.vals[0])} a ${this.fmt(this.vals[n - 1])}` : 'sin datos';
  }
}
