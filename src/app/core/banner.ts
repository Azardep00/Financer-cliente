import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

// Banner tipo video: grafica de finanzas que sube y baja, con flechas en maximos y minimos.
// Si algun dia tienes un video real, usa <app-banner video="/banner.mp4"> y se pone detras de la animacion.
@Component({
  selector: 'app-banner', standalone: true,
  template: `<div class="banner">
    @if (video) { <video class="vid" [src]="video" [muted]="true" autoplay loop playsinline></video> }
    <canvas #c></canvas>
    <div class="txt"><ng-content /></div></div>`,
  styles: [`
    :host { display: block; }
    .banner { position: relative; height: clamp(280px, 34vw, 420px); overflow: hidden; border-block: 1px solid rgba(116,100,200,.45);
      background: radial-gradient(ellipse 60% 120% at 50% 50%, rgba(116,100,200,.22), #05030a 70%), #05030a; box-shadow: 0 0 60px rgba(116,100,200,.25); }
    canvas, .vid { position: absolute; inset: 0; width: 100%; height: 100%; }
    .vid { object-fit: cover; opacity: .5; }
    .txt { position: relative; z-index: 2; height: 100%; display: grid; place-content: center; text-align: center; padding: 0 6%;
      text-shadow: 0 2px 20px #000; background: radial-gradient(ellipse 45% 50% at 50% 50%, rgba(5,3,10,.78), transparent 80%); }`],
})
export class BannerComponent implements AfterViewInit, OnDestroy {
  @Input() video = '';
  @ViewChild('c', { static: true }) c!: ElementRef<HTMLCanvasElement>;
  private raf = 0; private ro?: ResizeObserver;

  ngAfterViewInit() {
    const cv = this.c.nativeElement, ctx = cv.getContext('2d')!;
    let W = 0, H = 0;
    const fit = () => { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    fit(); this.ro = new ResizeObserver(fit); this.ro.observe(cv);

    const MAIN = '#7464c8', LIGHT = '#b3a6f5';
    const precio = (x: number, t: number, k: number) => {
      const u = (x / W) * 5 + t * 0.4 * k;
      return H * 0.52 - H * 0.2 * (Math.sin(u * 1.3 + k) + 0.6 * Math.sin(u * 2.9 + 1.7 * k) + 0.3 * Math.sin(u * 5.3 + 0.5));
    };
    // Flecha hacia arriba (up) o hacia abajo, centrada en (x, y).
    const flecha = (x: number, y: number, s: number, up: boolean, color: string, alpha: number) => {
      const k = up ? -1 : 1;
      ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(x, y + k * s); ctx.lineTo(x + .75 * s, y); ctx.lineTo(x + .28 * s, y); ctx.lineTo(x + .28 * s, y - k * .9 * s);
      ctx.lineTo(x - .28 * s, y - k * .9 * s); ctx.lineTo(x - .28 * s, y); ctx.lineTo(x - .75 * s, y); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(116,100,200,.10)'; ctx.lineWidth = 1;
      for (let gy = H / 6; gy < H; gy += H / 6) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      const off = (t * 30) % 60;
      for (let gx = -off; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }

      // Flechas grandes y tenues que suben y bajan de fondo.
      for (let i = 0; i < 8; i++) {
        const ph = t * 0.6 + i * 1.7;
        flecha((i + .5) * W / 8, H * (.5 + .34 * Math.sin(ph)), 16 + (i % 3) * 9, Math.cos(ph) < 0, MAIN, .16);
      }
      // Linea secundaria (mas tenue).
      ctx.beginPath(); for (let x = 0; x <= W; x += 3) ctx[x ? 'lineTo' : 'moveTo'](x, precio(x, t, 1.7));
      ctx.strokeStyle = 'rgba(116,100,200,.35)'; ctx.lineWidth = 2; ctx.stroke();

      // Linea principal con relleno degradado.
      const pts: [number, number][] = [];
      for (let x = 0; x <= W; x += 2) pts.push([x, precio(x, t, 1)]);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(116,100,200,.38)'); g.addColorStop(1, 'rgba(116,100,200,0)');
      ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
      ctx.strokeStyle = LIGHT; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.shadowColor = MAIN; ctx.shadowBlur = 16; ctx.stroke(); ctx.shadowBlur = 0;

      // Flechas en cada maximo (baja) y minimo (sube).
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1][1], b = pts[i][1], n = pts[i + 1][1], x = pts[i][0];
        if (b < a && b < n) { flecha(x, b - 26, 11, false, LIGHT, .95); }
        else if (b > a && b > n) { flecha(x, b + 26, 11, true, LIGHT, .95); }
      }
    };

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(2); return; }
    const loop = (ms: number) => { draw(ms / 1000); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  ngOnDestroy() { cancelAnimationFrame(this.raf); this.ro?.disconnect(); }
}
