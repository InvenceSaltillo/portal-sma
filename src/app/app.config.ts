import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { NgxSpinnerModule } from 'ngx-spinner';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpClientModule, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { authInterceptor } from './auth.interceptor';
import { NgxTippyModule } from 'ngx-tippy-wrapper';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
    ),
    provideClientHydration(),
    importProvidersFrom(NgxSpinnerModule.forRoot({ type: 'timer' })),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
      ]),
    ),
    importProvidersFrom(
      HttpClientModule,
      NgxTippyModule,
    ),
    provideToastr(),
  ]
};
