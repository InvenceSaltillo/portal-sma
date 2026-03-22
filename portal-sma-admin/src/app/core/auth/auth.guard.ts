import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Exige sesión Supabase y fila `users`; si no hay, envía al login (/) con returnUrl. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const session = await auth.getSession();
  if (!session) {
    return router.createUrlTree(['/'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const profileOk = await auth.ensureAppUserLoaded();
  if (!profileOk) {
    await auth.logout();
    return router.createUrlTree(['/'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return true;
};
