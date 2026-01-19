import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TitleBarComponent } from '../../../../shared/title-bar/title-bar.component';
import { RequestService } from '../../../../services/request/request.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

/**
 * Componente para el trámite: REGISTRO O RENOVACIÓN DE UNIDADES DE MANEJO (UMA)
 * SEMARNAT-08-022
 * 
 * Este es un ejemplo de componente de trámite con formulario fijo.
 * Cada trámite tendrá su propio componente con campos específicos.
 */
@Component({
  selector: 'app-registro-renovacion-uma',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TitleBarComponent,
  ],
  templateUrl: './registro-renovacion-uma.component.html',
  styleUrl: './registro-renovacion-uma.component.css'
})
export class RegistroRenovacionUmaComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private requestService = inject(RequestService);
  private toastr = inject(ToastrService);
  private spinnerService = inject(NgxSpinnerService);

  form!: FormGroup;
  serviceId: string | null = null;
  loading = false;

  ngOnInit() {
    // Obtener serviceId de los query params
    this.serviceId = this.route.snapshot.queryParamMap.get('serviceId');
    
    if (!this.serviceId) {
      this.toastr.error('No se especificó el trámite', 'Error');
      this.router.navigate(['/dashboard/request']);
      return;
    }

    // Inicializar formulario con campos específicos del trámite
    this.form = this.formBuilder.group({
      // Datos generales
      nombre_predio: ['', Validators.required],
      superficie_total: ['', [Validators.required, Validators.min(0)]],
      ubicacion: ['', Validators.required],
      municipio: ['', Validators.required],
      
      // Datos del solicitante
      nombre_solicitante: ['', Validators.required],
      rfc: ['', Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      
      // Especies
      especies: this.formBuilder.array([]),
      
      // Aceptación de privacidad
      privacyAccepted: [false, Validators.requiredTrue]
    });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Por favor complete todos los campos requeridos', 'Formulario incompleto');
      return;
    }

    if (!this.serviceId) {
      this.toastr.error('No se especificó el trámite', 'Error');
      return;
    }

    try {
      this.loading = true;
      this.spinnerService.show();

      // Obtener usuario autenticado
      const userString = localStorage.getItem('user');
      if (!userString) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const user = JSON.parse(userString);

      // Crear solicitud usando el servicio
      const result = await this.requestService.submitRequest({
        form: this.form,
        formFields: [], // Ya no usamos campos dinámicos
        serviceId: this.serviceId,
        userId: user.id
      });

      this.toastr.success(`Trámite creado exitosamente. Folio: ${result.folio}`, 'Éxito');
      this.router.navigate(['/dashboard/home']);
    } catch (error: any) {
      console.error('Error al enviar trámite:', error);
      this.toastr.error(error.message || 'Error al enviar el trámite', 'Error');
    } finally {
      this.loading = false;
      this.spinnerService.hide();
    }
  }
}
