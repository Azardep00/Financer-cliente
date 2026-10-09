import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LandingComponent } from './pages/landing.component';
import { LoginComponent } from './pages/login.component';
import { RegistroComponent } from './pages/registro.component';
import { PanelComponent } from './pages/panel.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'panel', component: PanelComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
