import { Component, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getComponentNameForService, hasSpecificComponent } from '../../../config/service-to-component.map';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ServiceTypeService } from '../../../services/service-type/service-type.service';
import { ServiceService } from '../../../services/service/service.service';
import { Service } from '../../../interfaces/service.interface';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { User } from '../../../interfaces/user.interface';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { firstValueFrom } from 'rxjs';

/**
 * Componente wrapper que carga dinámicamente el componente específico del trámite
 * según el service ID proporcionado en la ruta
 */
@Component({
  selector: 'app-tramite-wrapper',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TitleBarComponent],
  template: `
    <app-title-bar
      [title]="'Solicitud de Trámite'"
      [subTitle]="'Trámite seleccionado: ' + (serviceSelected?.name || 'ninguno')"
    />

    <div class="text-3xl text-black relative p-3 border border-slate-100 rounded-md mt-4 mx-2 sm:mx-20 shadow-md">
      <!-- Dropdowns de Tipo de Trámite y Trámite -->
      <div class="text-3xl text-black relative p-3 border border-slate-100 mb-4 rounded-md shadow-md">
        <h3 class="text-xl font-bold">Datos del Trámite</h3>
        <form [formGroup]="processForm" (ngSubmit)="onSubmitForm()">
          <div class="flex flex-wrap mt-2 -mx-2">
            <div class="w-full md:w-1/2 px-2 mb-4 md:mb-0">
              <label for="serviceType" class="block text-gray-700 text-lg">
                <span class="text-red-600 text-lg font-bold">*</span> Tipo de trámite/Servicio:
              </label>
              <select
                formControlName="serviceType"
                class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                autocomplete="off"
              >
                @if (serviceTypeService.serviceTypes()?.length) {
                  <option value="">-- Seleccione --</option>
                }
                @for (serviceType of serviceTypeService.serviceTypes(); track serviceType.id) {
                  <option [value]="serviceType.id">{{serviceType.name}}</option>
                }@empty {
                  <option value="">Cargando...</option>
                }
              </select>
              @if (
                (processForm.hasError('required', 'serviceType')) && processForm.controls['serviceType'].touched
              ) {
                <div class="text-sm text-red-500">
                  <p>Este campo es requerido.</p>
                </div>
              }
            </div>
            <div class="w-full md:w-1/2 px-2">
              <label for="service" class="block text-gray-700 text-lg">
                <span class="text-red-600 text-lg font-bold">*</span> Trámite:
              </label>
              <select
                formControlName="service"
                class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                autocomplete="off"
              >
                @if (serviceService.services()?.length) {
                  <option value="">-- Seleccione --</option>
                }
                @for (service of serviceService.services(); track service) {
                  <option [value]="service.id">{{service.name}}</option>
                }@empty {
                  <option value="">-- Sin opción --</option>
                }
              </select>
              @if (
                (processForm.hasError('required', 'service')) && processForm.controls['service'].touched
              ) {
                <div class="text-sm text-red-500">
                  <p>Este campo es requerido.</p>
                </div>
              }
            </div>
          </div>
        </form>
      </div>

      <!-- Componente específico del trámite -->
      @if (loading) {
        <div class="flex items-center justify-center min-h-[400px]">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Cargando formulario del trámite...</p>
          </div>
        </div>
      }
      @if (error) {
        <div class="flex items-center justify-center min-h-[400px]">
          <div class="text-center">
            <p class="text-red-600 mb-4">{{ error }}</p>
            <button
              (click)="goBack()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export default class TramiteWrapperComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private viewContainer = inject(ViewContainerRef);
  private formBuilder = inject(FormBuilder);
  serviceTypeService = inject(ServiceTypeService); // Público para acceso desde template
  serviceService = inject(ServiceService); // Público para acceso desde template
  private localStorageService = inject(LocalStorageService);

  loading = true;
  error: string | null = null;
  private componentRef: ComponentRef<any> | null = null;
  processForm!: FormGroup;
  serviceSelected?: Service;
  clientId = '';

  async ngOnInit() {
    // Inicializar formulario
    const userString = localStorage.getItem('user');
    if (!userString) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const user: User = JSON.parse(userString);
    this.clientId = user.client_id;

    this.processForm = this.formBuilder.group({
      serviceType: new FormControl('', [Validators.required]),
      service: new FormControl('', [Validators.required]),
    });

    // Cargar tipos de servicio
    await this.serviceTypeService.getByClientId(user.client_id);

    // Suscribirse a cambios en tipo de servicio
    this.processForm.get('serviceType')?.valueChanges.subscribe(serviceTypeId => {
      if (!serviceTypeId) {
        this.processForm.get('service')?.setValue('', { emitEvent: false });
        this.serviceSelected = undefined;
        this.clearComponent();
        return;
      }
      this.serviceSelected = undefined;
      this.getByServiceType(serviceTypeId);
    });

    // Suscribirse a cambios en servicio
    this.processForm.get('service')?.valueChanges.subscribe(async (serviceId) => {
      if (!serviceId) {
        this.serviceSelected = undefined;
        this.clearComponent();
        return;
      }

      const services = this.serviceService.services();
      this.serviceSelected = services?.find(service => service.id === serviceId);

      // Verificar si tiene componente específico y cargarlo
      if (hasSpecificComponent(serviceId)) {
        const componentName = getComponentNameForService(serviceId);
        if (componentName) {
          await this.loadComponent(componentName, serviceId);
          return;
        }
      }

      // Si no tiene componente específico, limpiar y mostrar mensaje
      this.clearComponent();
      this.error = 'Este trámite aún no tiene formulario específico implementado.';
      this.loading = false;
    });

    // Obtener serviceId de la ruta y cargar si existe
    this.route.paramMap.subscribe(async params => {
      const serviceId = params.get('serviceId');
      if (serviceId) {
        // Primero intentar obtener el servicio desde los servicios ya cargados
        const loadedServices = this.serviceService.services();
        let service = loadedServices?.find(s => s.id === serviceId);

        if (!service) {
          // Si no está en los servicios cargados, obtenerlo desde la API
          try {
            const serviceObservable = this.serviceService.getById(serviceId);
            if (serviceObservable) {
              service = await firstValueFrom(serviceObservable);
            }
          } catch (error) {
            console.error('Error loading service:', error);
            // Si no se puede obtener, intentar cargar directamente el componente
            if (hasSpecificComponent(serviceId)) {
              const componentName = getComponentNameForService(serviceId);
              if (componentName) {
                await this.loadComponent(componentName, serviceId);
              }
            }
            return;
          }
        }

        if (service && service.service_type_id) {
          // Establecer tipo de servicio y cargar servicios de ese tipo
          this.processForm.get('serviceType')?.setValue(service.service_type_id, { emitEvent: false });
          await this.getByServiceType(service.service_type_id);

          // Esperar un momento para que se carguen los servicios y luego establecer el servicio
          setTimeout(() => {
            this.serviceSelected = service;
            this.processForm.get('service')?.setValue(serviceId, { emitEvent: true });
          }, 200);
        }
      }
    });
  }

  private async getByServiceType(serviceTypeId: string) {
    try {
      await this.serviceService.getByServiceTypeAndClient(serviceTypeId, this.clientId);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  private clearComponent() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.error = null;
  }

  async onSubmitForm(): Promise<void> {
    // No hacer nada, solo mantener el formulario
  }

  private async loadComponent(componentName: string, serviceId: string) {
    try {
      // Limpiar componente anterior si existe
      if (this.componentRef) {
        this.componentRef.destroy();
      }

      // Mapeo de nombres de componentes a sus rutas de importación
      // Solo incluir componentes que realmente existen
      const componentMap: Record<string, () => Promise<any>> = {
        'registro-renovacion-uma': () => import('./registro-renovacion-uma/registro-renovacion-uma.component'),
        'autorizacion-aprovechamiento-extractivo-cinegetico': () => import('./autorizacion-aprovechamiento-extractivo-cinegetico/cinegetic-extractive-authorization.component'),
        'autorizacion-aprovechamiento-extractivo-comercial': () => import('./autorizacion-aprovechamiento-extractivo-comercial/commercial-extractive-authorization.component'),
        'autorizacion-aprovechamiento-no-extractivo': () => import('./autorizacion-aprovechamiento-no-extractivo/non-extractive-authorization.component'),
        'licencia-caza-deportiva-indefinida': () => import('./licencia-caza-deportiva-indefinida/licencia-caza-deportiva-indefinida.component'),
        'autorizacion-ejemplares-perjudiciales': () => import('./autorizacion-ejemplares-perjudiciales/harmful-specimens-authorization.component'),
        'autorizacion-ejemplares-perjudiciales-fuera-uma': () => import('./autorizacion-ejemplares-perjudiciales-fuera-uma/harmful-specimens-outside-uma-authorization.component'),
        'informe-resultados-perjudiciales': () => import('./informe-resultados-perjudiciales/results-report-harmful-specimens.component'),
        'aviso-aprovechamiento-exoticos': () => import('./aviso-aprovechamiento-exoticos/exotic-species-exploitation-notice.component'),
        'autorizacion-liberacion-ejemplares': () => import('./autorizacion-liberacion-ejemplares/specimen-release-authorization.component'),
        // Agregar más componentes aquí cuando se creen
      };

      const importFn = componentMap[componentName];
      if (!importFn) {
        // Si el componente no existe aún, redirigir al formulario genérico
        console.warn(`Componente ${componentName} aún no está implementado, usando formulario genérico`);
        this.router.navigate(['/dashboard/request'], {
          queryParams: { serviceId },
          replaceUrl: true
        });
        return;
      }

      const componentModule = await importFn();
      if (!componentModule) {
        throw new Error(`No se pudo importar el componente ${componentName}`);
      }

      // Buscar el componente exportado (puede ser default o named export)
      const ComponentClass = componentModule.default ||
                            Object.values(componentModule).find((exp: any) =>
                              exp && typeof exp === 'function' && exp.name?.includes('Component')
                            ) as any;

      if (!ComponentClass) {
        throw new Error(`Componente ${componentName} no encontrado en el módulo`);
      }

      // Crear instancia del componente
      this.componentRef = this.viewContainer.createComponent(ComponentClass);

      // Pasar serviceId al componente si tiene esa propiedad
      if (this.componentRef.instance && 'serviceId' in this.componentRef.instance) {
        this.componentRef.instance.serviceId = serviceId;
      }

      this.loading = false;
    } catch (err: any) {
      console.error(`Error loading component ${componentName}:`, err);
      // Si no se puede cargar el componente, redirigir al formulario genérico
      this.router.navigate(['/dashboard/request'], {
        queryParams: { serviceId },
        replaceUrl: true
      });
    }
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  goBack() {
    this.router.navigate(['/dashboard/request']);
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
