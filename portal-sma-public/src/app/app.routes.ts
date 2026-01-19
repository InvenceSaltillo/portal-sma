import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    children: [
      {
        path: 'home',
        title: 'Inicio',
        loadComponent: () => import('./dashboard/pages/home/home.component'),
      },
      {
        path: 'request',
        title: 'Solicitud de trámite',
        loadComponent: () => import('./dashboard/pages/request/request.component'),
      },
      {
        path: 'tramites/:serviceId',
        title: 'Trámite',
        loadComponent: () => import('./dashboard/pages/tramites/tramite-wrapper.component'),
      },
      {
        path: 'inquiry',
        title: 'Consulta tu trámite',
        loadComponent: () => import('./dashboard/pages/inquiry/inquiry.component'),
      },
      {
        path: 'report',
        title: 'Informe anual',
        loadComponent: () => import('./dashboard/pages/report/report.component'),
      },
      {
        path:'', redirectTo: 'home', pathMatch: 'full',
      }
    ],
  },
  {
    path: '',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '404' },
];
