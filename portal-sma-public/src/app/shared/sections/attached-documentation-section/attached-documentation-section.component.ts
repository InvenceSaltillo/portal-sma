import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface DocumentationItem {
  controlName: string;
  description: string;
  hasNotApplicable: boolean; // Si tiene opción "No Aplica"
}

@Component({
  selector: 'app-attached-documentation-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './attached-documentation-section.component.html',
  styleUrl: './attached-documentation-section.component.css',
})
export class AttachedDocumentationSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  // Lista de documentos
  @Input() documentationItems: DocumentationItem[] = [];

  // Nombre del control para "Otros"
  @Input() othersControlName: string = 'others';

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    // Crear controles para cada documento
    this.documentationItems.forEach(item => {
      if (!this.group.get(item.controlName)) {
        this.group.addControl(item.controlName, this.fb.control('', Validators.required));
      }

      // Si tiene "No Aplica", crear control para el texto
      if (item.hasNotApplicable) {
        const notApplicableControlName = `${item.controlName}_not_applicable_reason`;
        if (!this.group.get(notApplicableControlName)) {
          this.group.addControl(notApplicableControlName, this.fb.control(''));
        }
      }
    });

    // Crear control para "Otros"
    if (!this.group.get(this.othersControlName)) {
      this.group.addControl(this.othersControlName, this.fb.control(''));
    }
  }

  getControl(controlName: string): FormControl | null {
    return this.group.get(controlName) as FormControl | null;
  }

  getNotApplicableControl(controlName: string): FormControl | null {
    return this.group.get(`${controlName}_not_applicable_reason`) as FormControl | null;
  }

  getOthersControl(): FormControl | null {
    return this.group.get(this.othersControlName) as FormControl | null;
  }

  isNotApplicableSelected(controlName: string): boolean {
    const control = this.getControl(controlName);
    return control?.value === 'not_applicable';
  }
}
