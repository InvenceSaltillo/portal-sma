import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Si ya hay sesión y perfil `users`, no mostrar login (ir al inicio). */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const session = await auth.getSession();
  if (!session) {
    return true;
  }

  const profileOk = await auth.ensureAppUserLoaded();
  if (profileOk) {
    return router.createUrlTree(['/home']);
  }

  await auth.logout();
  return true;
};
