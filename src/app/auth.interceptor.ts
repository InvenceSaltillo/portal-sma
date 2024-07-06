import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { inject } from '@angular/core';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Inject the current `AuthService` and use it to get an authentication token:
  const authToken = localStorage.getItem('apiToken');
  // Clone the request to add the authentication header.
  if (authToken) {
    const newReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });

    const authService = inject(AuthService);
    return next(newReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          authService.logout();
        }

        return throwError(() => error);
      })
    );
  }


  return next(req);
}
