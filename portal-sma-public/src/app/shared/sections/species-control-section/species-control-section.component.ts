import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-species-control-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, PopoverIconComponent],
  templateUrl: './species-control-section.component.html',
  styleUrl: './species-control-section.component.css',
})
export class SpeciesControlSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  // Nombre del FormControl para el dropdown de especie
  @Input() speciesControlName: string = 'species';

  // Nombre del FormArray donde se almacenan las especies agregadas
  @Input() speciesListArrayName: string = 'species_list';

  // Opciones para el dropdown de especies
  @Input() speciesOptions: SelectOption[] = [];

  private fb = inject(FormBuilder);

  get speciesControl(): FormControl | null {
    return this.group.get(this.speciesControlName) as FormControl | null;
  }

  get speciesListArray(): FormArray {
    return this.group.get(this.speciesListArrayName) as FormArray;
  }

  ngOnInit(): void {
    // Asegurar control de especie
    if (!this.group.get(this.speciesControlName)) {
      this.group.addControl(this.speciesControlName, this.fb.control('', Validators.required));
    }

    // Asegurar FormArray de lista de especies
    if (!this.group.get(this.speciesListArrayName)) {
      this.group.addControl(this.speciesListArrayName, this.fb.array([]));
    }

    // Asegurar controles de texto para información del trámite
    const textFields = [
      'reasons_consider_harmful',
      'damage_type_magnitude',
      'control_methods_techniques',
      'control_period_stages',
      'technical_responsible',
      'disposal_method',
      'prevention_control_measures',
    ];

    textFields.forEach(fieldName => {
      if (!this.group.get(fieldName)) {
        this.group.addControl(fieldName, this.fb.control('', Validators.required));
      }
    });
  }

  getControl(controlName: string): FormControl | null {
    return this.group.get(controlName) as FormControl | null;
  }

  addSpecies(): void {
    const speciesCtrl = this.speciesControl;
    if (!speciesCtrl) return;

    if (!speciesCtrl.value) {
      speciesCtrl.markAsTouched();
      return;
    }

    const speciesId: string = speciesCtrl.value;
    const opt = this.speciesOptions.find(o => o.value === speciesId);
    const speciesLabel = opt?.label ?? '';

    // Separar "Nombre común - Nombre científico"
    const [commonName, scientificName] = speciesLabel.split(' - ').map(s => s?.trim() ?? '');

    // Evitar duplicados por id
    const alreadyExists = this.speciesListArray.controls.some(ctrl => ctrl.get('species_id')?.value === speciesId);
    if (alreadyExists) {
      return;
    }

    const rowGroup = this.fb.group({
      species_id: [speciesId, Validators.required],
      species_label: [speciesLabel],
      common_name: [commonName],
      scientific_name: [scientificName],
    });

    this.speciesListArray.push(rowGroup);

    // Limpiar selección
    speciesCtrl.setValue('');
    speciesCtrl.markAsUntouched();
  }

  removeSpecies(index: number): void {
    if (index < 0 || index >= this.speciesListArray.length) return;
    this.speciesListArray.removeAt(index);
  }

  getSpeciesRow(index: number): FormGroup {
    return this.speciesListArray.at(index) as FormGroup;
  }
}

