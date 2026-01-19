import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getComponentNameForService, hasSpecificComponent } from '../../../config/service-to-component.map';

/**
 * Componente wrapper que redirige al componente específico del trámite
 * según el service ID proporcionado en la ruta
 */
@Component({
  selector: 'app-tramite-wrapper',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando formulario del trámite...</p>
      </div>
    </div>
  `
})
export class TramiteWrapperComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  async ngOnInit() {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    
    if (!serviceId) {
      this.router.navigate(['/dashboard/request']);
      return;
    }

    // Verificar si existe un componente específico para este servicio
    if (hasSpecificComponent(serviceId)) {
      const componentName = getComponentNameForService(serviceId);
      if (componentName) {
        // Redirigir al componente específico
        this.router.navigate([`/dashboard/tramites/${componentName}`], {
          queryParams: { serviceId },
          replaceUrl: true
        });
        return;
      }
    }

    // Si no hay componente específico, redirigir al formulario genérico (temporal)
    // TODO: Esto se eliminará cuando todos los trámites tengan su componente
    this.router.navigate(['/dashboard/request'], {
      queryParams: { serviceId },
      replaceUrl: true
    });
  }
}
