import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from './config';
import { AuthService } from './auth.service';
import { SILENCIAR_ERRORES } from './http-contexto';
import { ToastService } from './toast.service';

/**
 * 1) Agrega "Authorization: Bearer <token>" a las peticiones a la API.
 * 2) 401 (token vencido o inválido) -> sesión expirada, vuelve al login.
 * 3) Traduce el resto de errores a avisos visibles:
 *    403 y 400 -> el mensaje del backend |
 *    404 -> el mensaje del backend | sin conexión y 5xx -> aviso genérico.
 *    Con SILENCIAR_ERRORES el error se propaga sin aviso.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const toasts = inject(ToastService);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((e: HttpErrorResponse) => {
      // Un token rechazado siempre saca al login, aunque la pantalla maneje sus propios errores.
      if (e.status === 401 && !req.url.endsWith('/usuarios/login')) {
        auth.sesionExpirada();
        return throwError(() => e);
      }
      if (req.context.get(SILENCIAR_ERRORES)) return throwError(() => e);

      const mensaje = typeof e.error?.mensaje === 'string' ? e.error.mensaje : '';
      switch (e.status) {
        case 0:
          toasts.error('No se pudo conectar con el servidor. Revisa que el backend esté corriendo en ' + API_URL.replace(/\/api$/, '') + '.');
          break;
        case 403:
          toasts.error(mensaje || 'No tienes permiso para realizar esta acción.');
          break;
        case 400:
        case 404:
          toasts.error(mensaje || 'La solicitud no se pudo completar.');
          break;
        default:
          toasts.error(e.status >= 500
            ? 'El servidor tuvo un problema. Intenta de nuevo en un momento.'
            : mensaje || 'Ocurrió un error inesperado.');
      }
      return throwError(() => e);
    })
  );
};
