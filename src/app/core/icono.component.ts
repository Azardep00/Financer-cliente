import { Component, Input } from '@angular/core';

// Íconos de trazo simple (24x24). Se agregan aquí a medida que las pantallas los piden.
const RUTAS: Record<string, string[]> = {
  resumen: ['M3 3v18h18', 'M7 15l4-4 3 3 5-6'],
  plan: ['M9 11l3 3 7-7', 'M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9'],
  historial: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5', 'M12 7v5l3 2'],
  clientes: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  asesores: ['M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z', 'M9 12l2 2 4-4'],
  salir: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  cerrar: ['M6 6l12 12', 'M18 6L6 18'],
  cuenta: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  obras: ['M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z'],
};

@Component({
  selector: 'app-icono',
  standalone: true,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" [attr.width]="tamano" [attr.height]="tamano">
      @for (d of rutas; track d) { <path [attr.d]="d" /> }</svg>`,
  styles: [':host { display: inline-flex; flex: none; } svg { display: block; }'],
})
export class IconoComponent {
  @Input({ required: true }) nombre = '';
  @Input() tamano = 18;
  get rutas() { return RUTAS[this.nombre] ?? []; }
}
