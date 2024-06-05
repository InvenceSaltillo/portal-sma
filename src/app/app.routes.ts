import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';

export const routes: Routes = [
  {
      path: '',
      loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '404' },
];
