import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TramiteRequirementsBlockComponent } from '../../../../shared/components/tramite-requirements-block/tramite-requirements-block.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';

@Component({
  selector: 'app-conservation-sustainable-use-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TramiteRequirementsBlockComponent, SignatureSectionComponent],
  templateUrl: './conservation-sustainable-use-report.component.html',
  styleUrl: './conservation-sustainable-use-report.component.css',
})
export default class ConservationSustainableUseReportComponent {
  private fb = inject(FormBuilder);

  readonly tramiteServiceId = signal('');
  onServiceIdBound(serviceId: string): void {
    this.tramiteServiceId.set(serviceId);
  }

  form: FormGroup = this.fb.group({
    requirements: this.fb.group({}),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
  });

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
