import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

/**
 * Misma paleta que `--color-brand-*` en `styles.css` (color principal #006341 y escala).
 * Aura usa otro color por defecto; sin esto, PrimeNG no coincide con Tailwind.
 */
const PortalSmaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#ecf7f3',
      100: '#d8efe6',
      200: '#b0dfcb',
      300: '#7cc8a8',
      400: '#3dad7e',
      500: '#006341',
      600: '#005238',
      700: '#00422d',
      800: '#003224',
      900: '#00221a',
      950: '#0a1512',
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
