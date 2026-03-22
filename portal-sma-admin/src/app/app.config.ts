import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

/**
 * Misma paleta que `--color-brand-*` en `styles.css` (sidebar activo, checkboxes, etc.).
 * Aura usa `emerald` por defecto; sin esto, botones y paginador no coinciden con el menú.
 */
const PortalSmaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f2f7ff',
      100: '#dde9ff',
      200: '#c2d6ff',
      300: '#9cb9ff',
      400: '#7592ff',
      500: '#465fff',
      600: '#3641f5',
      700: '#2a31d8',
      800: '#252dae',
      900: '#262e89',
      950: '#161950',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    /** Necesario para PrimeNG (Overlay, Select del paginador, etc.): `@overlayContentAnimation` */
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: PortalSmaPreset,
        /** Mismo criterio que Tailwind / ThemeService: solo oscuro si `html` tiene clase `dark`. */
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
  ]
};
