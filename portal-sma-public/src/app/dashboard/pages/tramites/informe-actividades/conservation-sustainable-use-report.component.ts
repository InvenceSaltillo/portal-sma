import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RequirementsSectionComponent, Requirement } from '../../../../shared/sections/requirements-section/requirements-section.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';

@Component({
  selector: 'app-conservation-sustainable-use-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RequirementsSectionComponent, SignatureSectionComponent],
  templateUrl: './conservation-sustainable-use-report.component.html',
  styleUrl: './conservation-sustainable-use-report.component.css',
})
export default class ConservationSustainableUseReportComponent {
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    requirements: this.fb.group({
      additional_information_document: [null, Validators.required],
      official_id_document: [null, Validators.required],
    }),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
  });

  requirementsList: Requirement[] = [
    {
      controlName: 'additional_information_document',
      title: 'INFORMACIÓN ADICIONAL AL TRÁMITE',
      legalReference: 'Artículos 42 párrafo segundo, 91 párrafo segundo y 103, Ley General de Vida Silvestre, publicado en el DOF el 3 de julio de 2000. Artículo 44, 50 fracción I y artículos 51, 96, 105 y 122, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'official_id_document',
      title: 'ACREDITAR PERSONALIDAD (Identificación Oficial)',
      legalReference: 'Artículo 12, párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
  ];

  signaturesList: Signature[] = [
    {
      controlName: 'signature_file',
      title: 'Foto de la Firma',
      description: 'Esta firma es la que aparecerá en la Solicitud de Trámite.',
    },
  ];

  get requirementsGroup(): FormGroup {
    return this.form.get('requirements') as FormGroup;
  }

  get signatureGroup(): FormGroup {
    return this.form.get('signature') as FormGroup;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Formulario informe de actividades:', this.form.value);
  }
}
