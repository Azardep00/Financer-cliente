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
      { path: 'resumen', loadComponent: () => import('./features/shell/proximamente.component').then(m => m.ProximamenteComponent),
        data: { titulo: 'Resumen financiero', descripcion: 'Tus indicadores, la evolución de tus diagnósticos y tu asesor.', checkpoint: 'F3' } },
      { path: 'plan', loadComponent: () => import('./features/shell/proximamente.component').then(m => m.ProximamenteComponent),
        data: { titulo: 'Plan del mes', descripcion: 'Tus metas del mes, con montos y avance.', checkpoint: 'F3' } },
      { path: 'historial', loadComponent: () => import('./features/shell/proximamente.component').then(m => m.ProximamenteComponent),
        data: { titulo: 'Historial de planes', descripcion: 'Planes de meses anteriores, en solo lectura.', checkpoint: 'F3' } },
    ],
  },
  {
    path: 'asesor',
    component: ShellComponent,
    canActivate: [rolGuard('Asesor')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      { path: 'clientes', loadComponent: () => import('./features/shell/proximamente.component').then(m => m.ProximamenteComponent),
        data: { titulo: 'Clientes', descripcion: 'Panel con resumen, alertas, búsqueda y filtros.', checkpoint: 'F4' } },
      { path: 'clientes/:id', loadComponent: () => import('./features/shell/proximamente.component').then(m => m.ProximamenteComponent),
        data: { titulo: 'Ficha del cliente', descripcion: 'Datos, diagnósticos, planes, metas y notas.', checkpoint: 'F5 y F6' } },
      { path: 'asesores', loadComponent: () => import('./features/shell/proximamente.component').then(m => m.ProximamenteComponent),
        data: { titulo: 'Asesores', descripcion: 'Equipo de asesores y alta de nuevos asesores.', checkpoint: 'F7' } },
    ],
  },

  { path: 'panel', canActivate: [inicioGuard], children: [] },
  { path: '**', redirectTo: '' },
];
