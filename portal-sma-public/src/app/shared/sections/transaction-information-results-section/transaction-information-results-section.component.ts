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
  selector: 'app-transaction-information-results-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, PopoverIconComponent],
  templateUrl: './transaction-information-results-section.component.html',
  styleUrl: './transaction-information-results-section.component.css',
})
export class TransactionInformationResultsSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  // Nombre del FormControl para el dropdown de especie
  @Input() speciesControlName: string = 'species';

  // Nombre del FormControl para cantidad de ejemplares
  @Input() quantityControlName: string = 'quantity';

  // Nombre del FormControl para medida de control
  @Input() controlMeasureControlName: string = 'control_measure';

  // Nombre del FormArray donde se almacenan los resultados agregados
  @Input() resultsArrayName: string = 'results_list';

  // Opciones para el dropdown de especies
  @Input() speciesOptions: SelectOption[] = [];

  private fb = inject(FormBuilder);

  editingIndex: number | null = null;

  get speciesControl(): FormControl | null {
    return this.group.get(this.speciesControlName) as FormControl | null;
  }

  get quantityControl(): FormControl | null {
    return this.group.get(this.quantityControlName) as FormControl | null;
  }

  get controlMeasureControl(): FormControl | null {
    return this.group.get(this.controlMeasureControlName) as FormControl | null;
  }

  get resultsArray(): FormArray {
    return this.group.get(this.resultsArrayName) as FormArray;
  }

  ngOnInit(): void {
    // Asegurar controles temporales
    if (!this.group.get(this.speciesControlName)) {
      this.group.addControl(this.speciesControlName, this.fb.control('', Validators.required));
    }
    if (!this.group.get(this.quantityControlName)) {
      this.group.addControl(this.quantityControlName, this.fb.control('', [Validators.required, Validators.min(1)]));
    }
    if (!this.group.get(this.controlMeasureControlName)) {
      this.group.addControl(this.controlMeasureControlName, this.fb.control('', Validators.required));
    }

    // Asegurar FormArray de resultados
    if (!this.group.get(this.resultsArrayName)) {
      this.group.addControl(this.resultsArrayName, this.fb.array([]));
    }
  }

  addResult(): void {
    const speciesCtrl = this.speciesControl;
    const quantityCtrl = this.quantityControl;
    const controlMeasureCtrl = this.controlMeasureControl;

    if (!speciesCtrl || !quantityCtrl || !controlMeasureCtrl) return;

    // Marcar todos los campos como touched y dirty para mostrar errores
    speciesCtrl.markAsTouched();
    speciesCtrl.markAsDirty();
    quantityCtrl.markAsTouched();
    quantityCtrl.markAsDirty();
    controlMeasureCtrl.markAsTouched();
    controlMeasureCtrl.markAsDirty();

    // Forzar validación de todos los campos
    speciesCtrl.updateValueAndValidity({ emitEvent: false });
    quantityCtrl.updateValueAndValidity({ emitEvent: false });
    controlMeasureCtrl.updateValueAndValidity({ emitEvent: false });

    // Validar que todos los campos estén llenos
    const hasSpecies = speciesCtrl.value && speciesCtrl.value !== '';
    const hasQuantity = quantityCtrl.value && quantityCtrl.value !== '';
    const hasControlMeasure = controlMeasureCtrl.value && controlMeasureCtrl.value.trim() !== '';

    if (!hasSpecies || !hasQuantity || !hasControlMeasure) {
      // Establecer errores manualmente si es necesario
      if (!hasSpecies && !speciesCtrl.hasError('required')) {
        speciesCtrl.setErrors({ required: true });
      }
      if (!hasQuantity && !quantityCtrl.hasError('required')) {
        quantityCtrl.setErrors({ required: true });
      }
      if (!hasControlMeasure && !controlMeasureCtrl.hasError('required')) {
        controlMeasureCtrl.setErrors({ required: true });
      }
      return;
    }

    // Validar cantidad mínima
    const quantityValue = Number(quantityCtrl.value);
    if (isNaN(quantityValue) || quantityValue < 1) {
      quantityCtrl.setErrors({ min: true });
      quantityCtrl.updateValueAndValidity({ emitEvent: false });
      return;
    }

    const speciesId: string = speciesCtrl.value;
    const opt = this.speciesOptions.find(o => o.value === speciesId);
    const speciesLabel = opt?.label ?? '';

    // Separar "Nombre común - Nombre científico"
    const [commonName, scientificName] = speciesLabel.split(' - ').map(s => s?.trim() ?? '');

    const rowGroup = this.fb.group({
      species_id: [speciesId, Validators.required],
      species_label: [speciesLabel],
      common_name: [commonName],
      scientific_name: [scientificName],
      quantity: [quantityCtrl.value, [Validators.required, Validators.min(1)]],
      control_measure: [controlMeasureCtrl.value, Validators.required],
    });

    this.resultsArray.push(rowGroup);

    // Limpiar campos
    this.clearFields();
  }

  editResult(index: number): void {
    if (index < 0 || index >= this.resultsArray.length) return;

    const rowGroup = this.getResultRow(index);
    const speciesCtrl = this.speciesControl;
    const quantityCtrl = this.quantityControl;
    const controlMeasureCtrl = this.controlMeasureControl;

    if (!speciesCtrl || !quantityCtrl || !controlMeasureCtrl) return;

    // Cargar valores en los controles temporales
    speciesCtrl.setValue(rowGroup.get('species_id')?.value);
    quantityCtrl.setValue(rowGroup.get('quantity')?.value);
    controlMeasureCtrl.setValue(rowGroup.get('control_measure')?.value);

    // Marcar como editando
    this.editingIndex = index;
  }

  updateResult(): void {
    if (this.editingIndex === null) return;

    const speciesCtrl = this.speciesControl;
    const quantityCtrl = this.quantityControl;
    const controlMeasureCtrl = this.controlMeasureControl;

    if (!speciesCtrl || !quantityCtrl || !controlMeasureCtrl) return;

    // Marcar todos los campos como touched y dirty para mostrar errores
    speciesCtrl.markAsTouched();
    speciesCtrl.markAsDirty();
    quantityCtrl.markAsTouched();
    quantityCtrl.markAsDirty();
    controlMeasureCtrl.markAsTouched();
    controlMeasureCtrl.markAsDirty();

    // Forzar validación de todos los campos
    speciesCtrl.updateValueAndValidity({ emitEvent: false });
    quantityCtrl.updateValueAndValidity({ emitEvent: false });
    controlMeasureCtrl.updateValueAndValidity({ emitEvent: false });

    // Validar que todos los campos estén llenos
    const hasSpecies = speciesCtrl.value && speciesCtrl.value !== '';
    const hasQuantity = quantityCtrl.value && quantityCtrl.value !== '';
    const hasControlMeasure = controlMeasureCtrl.value && controlMeasureCtrl.value.trim() !== '';

    if (!hasSpecies || !hasQuantity || !hasControlMeasure) {
      // Establecer errores manualmente si es necesario
      if (!hasSpecies && !speciesCtrl.hasError('required')) {
        speciesCtrl.setErrors({ required: true });
      }
      if (!hasQuantity && !quantityCtrl.hasError('required')) {
        quantityCtrl.setErrors({ required: true });
      }
      if (!hasControlMeasure && !controlMeasureCtrl.hasError('required')) {
        controlMeasureCtrl.setErrors({ required: true });
      }
      return;
    }

    // Validar cantidad mínima
    const quantityValue = Number(quantityCtrl.value);
    if (isNaN(quantityValue) || quantityValue < 1) {
      quantityCtrl.setErrors({ min: true });
      quantityCtrl.updateValueAndValidity({ emitEvent: false });
      return;
    }

    const speciesId: string = speciesCtrl.value;
    const opt = this.speciesOptions.find(o => o.value === speciesId);
    const speciesLabel = opt?.label ?? '';

    // Separar "Nombre común - Nombre científico"
    const [commonName, scientificName] = speciesLabel.split(' - ').map(s => s?.trim() ?? '');

    const rowGroup = this.getResultRow(this.editingIndex);
    rowGroup.patchValue({
      species_id: speciesId,
      species_label: speciesLabel,
      common_name: commonName,
      scientific_name: scientificName,
      quantity: quantityCtrl.value,
      control_measure: controlMeasureCtrl.value,
    });

    // Limpiar y salir del modo edición
    this.clearFields();
  }

  removeResult(index: number): void {
    if (index < 0 || index >= this.resultsArray.length) return;
    this.resultsArray.removeAt(index);
    if (this.editingIndex === index) {
      this.clearFields();
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }
  }

  clearFields(): void {
    const speciesCtrl = this.speciesControl;
    const quantityCtrl = this.quantityControl;
    const controlMeasureCtrl = this.controlMeasureControl;

    if (speciesCtrl) {
      speciesCtrl.setValue('');
      speciesCtrl.markAsUntouched();
    }
    if (quantityCtrl) {
      quantityCtrl.setValue('');
      quantityCtrl.markAsUntouched();
    }
    if (controlMeasureCtrl) {
      controlMeasureCtrl.setValue('');
      controlMeasureCtrl.markAsUntouched();
    }

    this.editingIndex = null;
  }

  getResultRow(index: number): FormGroup {
    return this.resultsArray.at(index) as FormGroup;
  }

  isEditing(): boolean {
    return this.editingIndex !== null;
  }
}
