import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Pantalla provisional de las secciones que se construyen en los siguientes checkpoints. */
@Component({
  selector: 'app-proximamente',
  standalone: true,
  template: `
    <div class="pagina">
      <div class="pagina-encabezado">
        <div><h1>{{ d['titulo'] }}</h1><p>{{ d['descripcion'] }}</p></div>
      </div>
      <div class="vacio">
        <strong>Esta pantalla se construye en el checkpoint {{ d['checkpoint'] }}</strong>
        La estructura, los permisos y la conexión con el backend ya están listos.
      </div>
    </div>`,
})
export class ProximamenteComponent {
  d = inject(ActivatedRoute).snapshot.data;
}
