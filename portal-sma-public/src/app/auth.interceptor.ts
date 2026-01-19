import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { inject } from '@angular/core';
import { supabaseClient } from './core/supabase.client';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Verificar si es una petición a nuestra nueva API
  const isApiRequest = req.url.includes('localhost:3000') || req.url.includes('/api/');
  
  if (!isApiRequest) {
    // Si no es una petición a nuestra API, continuar sin modificar
    return next(req);
  }

  // Obtener token de Supabase
  // Primero intentar desde localStorage (apiToken)
  let authToken = localStorage.getItem('apiToken');
  
  // Si no hay apiToken, intentar obtenerlo de la sesión de Supabase
  if (!authToken) {
    // Buscar en localStorage la clave de Supabase
    // Supabase guarda la sesión con una clave específica
    const supabaseKey = Object.keys(localStorage).find(key => 
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );
    
    if (supabaseKey) {
      try {
        const sessionData = localStorage.getItem(supabaseKey);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          authToken = session?.access_token;
          // Guardar en apiToken para futuras peticiones
          if (authToken) {
            localStorage.setItem('apiToken', authToken);
          }
        }
      } catch (e) {
        console.warn('Error al parsear sesión de Supabase:', e);
      }
    }
  }

  // Si hay token, agregar header de Authorization
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
          // Token inválido, limpiar y redirigir
          localStorage.removeItem('apiToken');
          authService.logout();
        }

        return throwError(() => error);
      })
    );
  }

  // Si no hay token pero es petición a nuestra API, continuar sin header
  // (algunos endpoints pueden ser públicos)
  return next(req);
}
