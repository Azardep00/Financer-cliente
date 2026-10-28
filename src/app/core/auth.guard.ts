import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './models';
import { ToastService } from './toast.service';

/** Exige sesión; si no hay, manda al login recordando a dónde iba. */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  return auth.logueado ? true : inject(Router).createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

/** Exige sesión Y un rol concreto. Quien tiene otro rol vuelve a su propio inicio con un aviso. */
export const rolGuard = (rol: Rol): CanActivateFn => (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.logueado) return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
  if (auth.rol() === rol) return true;
  inject(ToastService).warn('No tienes acceso a esa sección.');
  return router.createUrlTree([auth.inicio]);
};

/** Login y registro: si ya hay sesión, no tiene sentido mostrarlos. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logueado ? inject(Router).createUrlTree([auth.inicio]) : true;
};

/** /panel (ruta heredada): redirige al inicio que corresponde al rol. */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.logueado ? auth.inicio : '/login']);
};
