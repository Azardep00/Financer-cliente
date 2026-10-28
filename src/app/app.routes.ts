import { Routes } from '@angular/router';
import { inicioGuard, invitadoGuard, rolGuard } from './core/auth.guard';
import { ShellComponent } from './features/shell/shell.component';

// Estructura de la app:
//   /                      landing pública
//   /login, /registro      solo para quien NO tiene sesión
//   /cliente/...           solo rol Cliente (dentro del shell con barra lateral)
//   /asesor/...            solo rol Asesor
//   /panel                 ruta heredada: redirige según el rol
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent) },
  { path: 'login', canActivate: [invitadoGuard], loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'registro', canActivate: [invitadoGuard], loadComponent: () => import('./features/auth/registro.component').then(m => m.RegistroComponent) },

  {
    path: 'cliente',
    component: ShellComponent,
    canActivate: [rolGuard('Cliente')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      { path: 'resumen', loadComponent: () => import('./features/cliente/resumen.component').then(m => m.ResumenClienteComponent) },
      { path: 'plan', loadComponent: () => import('./features/cliente/plan.component').then(m => m.PlanClienteComponent) },
      { path: 'historial', loadComponent: () => import('./features/cliente/historial.component').then(m => m.HistorialClienteComponent) },
      { path: 'cuenta', loadComponent: () => import('./features/cuenta/cuenta.component').then(m => m.CuentaComponent) },
    ],
  },
  {
    path: 'asesor',
    component: ShellComponent,
    canActivate: [rolGuard('Asesor')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      { path: 'clientes', loadComponent: () => import('./features/asesor/clientes.component').then(m => m.AsesorClientesComponent) },
      { path: 'clientes/:id', loadComponent: () => import('./features/asesor/ficha.component').then(m => m.AsesorFichaComponent) },
      { path: 'asesores', loadComponent: () => import('./features/asesor/asesores.component').then(m => m.AsesoresComponent) },
      { path: 'cuenta', loadComponent: () => import('./features/cuenta/cuenta.component').then(m => m.CuentaComponent) },
    ],
  },

  { path: 'panel', canActivate: [inicioGuard], children: [] },
  { path: '**', redirectTo: '' },
];
