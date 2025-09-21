import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { RequestInquiryResult, RequestTimelineItem } from '../../../interfaces/request.interface';
import { RequestService } from '../../../services/request/request.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-inquiry',
  standalone: true,
  imports: [
    TitleBarComponent,
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './inquiry.component.html',
  styleUrl: './inquiry.component.css'
})
export default class InquiryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private requestService = inject(RequestService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  inquiryForm: FormGroup;
  searchResult: RequestInquiryResult | null = null;
  isLoading = false;

  constructor() {
    this.inquiryForm = this.fb.group({
      registrationNumber: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {
    // Verificar si hay un parámetro 'folio' en la URL
    this.route.queryParams.subscribe(params => {
      if (params['folio']) {
        const folio = params['folio'];
        this.inquiryForm.patchValue({ registrationNumber: folio });
        // Ejecutar búsqueda automáticamente
        this.onSearch();
      }
    });
  }

  async onSearch() {
    if (this.inquiryForm.valid) {
      this.isLoading = true;
      const folio = this.inquiryForm.get('registrationNumber')?.value;

      try {
        const result = await this.requestService.getRequestByFolio(folio);

        if (result && result.id && result.service_name) {
          this.searchResult = result;
          this.toastr.success('Trámite encontrado');
        } else {
          this.searchResult = null;
          this.toastr.warning('No se encontró ningún trámite con ese folio');
        }
      } catch (error) {
        console.error('Error al buscar trámite:', error);
        this.searchResult = null;
        this.toastr.error('Error al buscar el trámite. Inténtelo de nuevo.');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.toastr.error('Por favor ingrese un número de registro válido');
    }
  }

  onCancel() {
    this.inquiryForm.reset();
    this.searchResult = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
