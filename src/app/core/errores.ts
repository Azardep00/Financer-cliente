import { HttpErrorResponse } from '@angular/common/http';
import { API_URL } from './config';

/** Texto legible para mostrar en un formulario cuando una petición falla. */
export function mensajeError(e: unknown, porDefecto = 'No se pudo completar la acción.'): string {
  const err = e as HttpErrorResponse;
  if (err?.status === 0) {
    return 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo en ' + API_URL.replace(/\/api$/, '') + '.';
  }
  const m = err?.error?.mensaje;
  return typeof m === 'string' && m ? m : porDefecto;
}
