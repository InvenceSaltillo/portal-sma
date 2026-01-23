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
  selector: 'app-specimen-release-info-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, PopoverIconComponent],
  templateUrl: './specimen-release-info-section.component.html',
  styleUrl: './specimen-release-info-section.component.css',
})
export class SpecimenReleaseInfoSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  // Nombre del FormControl para el objetivo de la liberación
  @Input() releaseObjectiveControlName: string = 'release_objective';

  // Nombre del FormControl para cantidad
  @Input() quantityControlName: string = 'quantity';

  // Nombre del FormControl para especie
  @Input() speciesControlName: string = 'species';

  // Nombre del FormControl para edad
  @Input() ageControlName: string = 'age';

  // Nombre del FormControl para sexo
  @Input() sexControlName: string = 'sex';

  // Nombre del FormControl para número y tipo de marca
  @Input() markingControlName: string = 'marking_number_type';

  // Nombre del FormControl para control sanitario
  @Input() sanitaryControlControlName: string = 'sanitary_control';

  // Nombre del FormArray donde se almacenan los ejemplares agregados
  @Input() specimensArrayName: string = 'specimens_list';

  // Opciones para el dropdown de objetivo de liberación
  @Input() releaseObjectiveOptions: SelectOption[] = [
    { value: 'repoblacion', label: 'Repoblación' },
    { value: 'reintroduccion', label: 'Reintroducción' },
    { value: 'traslocacion', label: 'Traslocacion' },
    { value: 'medidacontrol', label: 'Medida de Control' },
  ];

  // Opciones para el dropdown de especies
  @Input() speciesOptions: SelectOption[] = [];

  private fb = inject(FormBuilder);

  editingIndex: number | null = null;

  // Opciones para el dropdown de sexo
  sexOptions: SelectOption[] = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Hembra' },
    { value: 'unsexed', label: 'Sin sexar' },
  ];

  get releaseObjectiveControl(): FormControl | null {
    return this.group.get(this.releaseObjectiveControlName) as FormControl | null;
  }

  get quantityControl(): FormControl | null {
    return this.group.get(this.quantityControlName) as FormControl | null;
  }

  get speciesControl(): FormControl | null {
    return this.group.get(this.speciesControlName) as FormControl | null;
  }

  get ageControl(): FormControl | null {
    return this.group.get(this.ageControlName) as FormControl | null;
  }

  get sexControl(): FormControl | null {
    return this.group.get(this.sexControlName) as FormControl | null;
  }

  get markingControl(): FormControl | null {
    return this.group.get(this.markingControlName) as FormControl | null;
  }

  get sanitaryControlControl(): FormControl | null {
    return this.group.get(this.sanitaryControlControlName) as FormControl | null;
  }

  get specimensArray(): FormArray {
    return this.group.get(this.specimensArrayName) as FormArray;
  }

  ngOnInit(): void {
    // Asegurar control de objetivo de liberación
    if (!this.group.get(this.releaseObjectiveControlName)) {
      this.group.addControl(this.releaseObjectiveControlName, this.fb.control('', Validators.required));
    }

    // Asegurar controles temporales
    if (!this.group.get(this.quantityControlName)) {
      this.group.addControl(this.quantityControlName, this.fb.control('', [Validators.required, Validators.min(1)]));
    }
    if (!this.group.get(this.speciesControlName)) {
      this.group.addControl(this.speciesControlName, this.fb.control('', Validators.required));
    }
    if (!this.group.get(this.ageControlName)) {
      this.group.addControl(this.ageControlName, this.fb.control('', Validators.required));
    }
    if (!this.group.get(this.sexControlName)) {
      this.group.addControl(this.sexControlName, this.fb.control('unsexed', Validators.required));
    }
    if (!this.group.get(this.markingControlName)) {
      this.group.addControl(this.markingControlName, this.fb.control('', Validators.required));
    }
    if (!this.group.get(this.sanitaryControlControlName)) {
      this.group.addControl(this.sanitaryControlControlName, this.fb.control('', Validators.required));
    }

    // Asegurar FormArray de ejemplares
    if (!this.group.get(this.specimensArrayName)) {
      this.group.addControl(this.specimensArrayName, this.fb.array([]));
    }
  }

  addSpecimen(): void {
    const quantityCtrl = this.quantityControl;
    const speciesCtrl = this.speciesControl;
    const ageCtrl = this.ageControl;
    const sexCtrl = this.sexControl;
    const markingCtrl = this.markingControl;
    const sanitaryCtrl = this.sanitaryControlControl;

    if (!quantityCtrl || !speciesCtrl || !ageCtrl || !sexCtrl || !markingCtrl || !sanitaryCtrl) return;

    // Marcar todos los campos como touched y dirty para mostrar errores
    quantityCtrl.markAsTouched();
    quantityCtrl.markAsDirty();
    speciesCtrl.markAsTouched();
    speciesCtrl.markAsDirty();
    ageCtrl.markAsTouched();
    ageCtrl.markAsDirty();
    sexCtrl.markAsTouched();
    sexCtrl.markAsDirty();
    markingCtrl.markAsTouched();
    markingCtrl.markAsDirty();
    sanitaryCtrl.markAsTouched();
    sanitaryCtrl.markAsDirty();

    // Forzar validación de todos los campos
    quantityCtrl.updateValueAndValidity({ emitEvent: false });
    speciesCtrl.updateValueAndValidity({ emitEvent: false });
    ageCtrl.updateValueAndValidity({ emitEvent: false });
    sexCtrl.updateValueAndValidity({ emitEvent: false });
    markingCtrl.updateValueAndValidity({ emitEvent: false });
    sanitaryCtrl.updateValueAndValidity({ emitEvent: false });

    // Validar que todos los campos estén llenos
    const hasQuantity = quantityCtrl.value && quantityCtrl.value !== '';
    const hasSpecies = speciesCtrl.value && speciesCtrl.value !== '';
    const hasAge = ageCtrl.value && ageCtrl.value.trim() !== '';
    const hasSex = sexCtrl.value && sexCtrl.value !== '';
    const hasMarking = markingCtrl.value && markingCtrl.value.trim() !== '';
    const hasSanitary = sanitaryCtrl.value && sanitaryCtrl.value.trim() !== '';

    if (!hasQuantity || !hasSpecies || !hasAge || !hasSex || !hasMarking || !hasSanitary) {
      // Establecer errores manualmente si es necesario
      if (!hasQuantity && !quantityCtrl.hasError('required')) {
        quantityCtrl.setErrors({ required: true });
      }
      if (!hasSpecies && !speciesCtrl.hasError('required')) {
        speciesCtrl.setErrors({ required: true });
      }
      if (!hasAge && !ageCtrl.hasError('required')) {
        ageCtrl.setErrors({ required: true });
      }
      if (!hasSex && !sexCtrl.hasError('required')) {
        sexCtrl.setErrors({ required: true });
      }
      if (!hasMarking && !markingCtrl.hasError('required')) {
        markingCtrl.setErrors({ required: true });
      }
      if (!hasSanitary && !sanitaryCtrl.hasError('required')) {
        sanitaryCtrl.setErrors({ required: true });
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
      age: [ageCtrl.value, Validators.required],
      sex: [sexCtrl.value, Validators.required],
      marking_number_type: [markingCtrl.value, Validators.required],
      sanitary_control: [sanitaryCtrl.value, Validators.required],
    });

    this.specimensArray.push(rowGroup);

    // Limpiar campos
    this.clearFields();
  }

  editSpecimen(index: number): void {
    if (index < 0 || index >= this.specimensArray.length) return;

    const rowGroup = this.getSpecimenRow(index);
    const quantityCtrl = this.quantityControl;
    const speciesCtrl = this.speciesControl;
    const ageCtrl = this.ageControl;
    const sexCtrl = this.sexControl;
    const markingCtrl = this.markingControl;
    const sanitaryCtrl = this.sanitaryControlControl;

    if (!quantityCtrl || !speciesCtrl || !ageCtrl || !sexCtrl || !markingCtrl || !sanitaryCtrl) return;

    // Cargar valores en los controles temporales
    quantityCtrl.setValue(rowGroup.get('quantity')?.value);
    speciesCtrl.setValue(rowGroup.get('species_id')?.value);
    ageCtrl.setValue(rowGroup.get('age')?.value);
    sexCtrl.setValue(rowGroup.get('sex')?.value);
    markingCtrl.setValue(rowGroup.get('marking_number_type')?.value);
    sanitaryCtrl.setValue(rowGroup.get('sanitary_control')?.value);

    // Marcar como editando
    this.editingIndex = index;
  }

  updateSpecimen(): void {
    if (this.editingIndex === null) return;

    const quantityCtrl = this.quantityControl;
    const speciesCtrl = this.speciesControl;
    const ageCtrl = this.ageControl;
    const sexCtrl = this.sexControl;
    const markingCtrl = this.markingControl;
    const sanitaryCtrl = this.sanitaryControlControl;

    if (!quantityCtrl || !speciesCtrl || !ageCtrl || !sexCtrl || !markingCtrl || !sanitaryCtrl) return;

    // Marcar todos los campos como touched y dirty para mostrar errores
    quantityCtrl.markAsTouched();
    quantityCtrl.markAsDirty();
    speciesCtrl.markAsTouched();
    speciesCtrl.markAsDirty();
    ageCtrl.markAsTouched();
    ageCtrl.markAsDirty();
    sexCtrl.markAsTouched();
    sexCtrl.markAsDirty();
    markingCtrl.markAsTouched();
    markingCtrl.markAsDirty();
    sanitaryCtrl.markAsTouched();
    sanitaryCtrl.markAsDirty();

    // Forzar validación de todos los campos
    quantityCtrl.updateValueAndValidity({ emitEvent: false });
    speciesCtrl.updateValueAndValidity({ emitEvent: false });
    ageCtrl.updateValueAndValidity({ emitEvent: false });
    sexCtrl.updateValueAndValidity({ emitEvent: false });
    markingCtrl.updateValueAndValidity({ emitEvent: false });
    sanitaryCtrl.updateValueAndValidity({ emitEvent: false });

    // Validar que todos los campos estén llenos
    const hasQuantity = quantityCtrl.value && quantityCtrl.value !== '';
    const hasSpecies = speciesCtrl.value && speciesCtrl.value !== '';
    const hasAge = ageCtrl.value && ageCtrl.value.trim() !== '';
    const hasSex = sexCtrl.value && sexCtrl.value !== '';
    const hasMarking = markingCtrl.value && markingCtrl.value.trim() !== '';
    const hasSanitary = sanitaryCtrl.value && sanitaryCtrl.value.trim() !== '';

    if (!hasQuantity || !hasSpecies || !hasAge || !hasSex || !hasMarking || !hasSanitary) {
      // Establecer errores manualmente si es necesario
      if (!hasQuantity && !quantityCtrl.hasError('required')) {
        quantityCtrl.setErrors({ required: true });
      }
      if (!hasSpecies && !speciesCtrl.hasError('required')) {
        speciesCtrl.setErrors({ required: true });
      }
      if (!hasAge && !ageCtrl.hasError('required')) {
        ageCtrl.setErrors({ required: true });
      }
      if (!hasSex && !sexCtrl.hasError('required')) {
        sexCtrl.setErrors({ required: true });
      }
      if (!hasMarking && !markingCtrl.hasError('required')) {
        markingCtrl.setErrors({ required: true });
      }
      if (!hasSanitary && !sanitaryCtrl.hasError('required')) {
        sanitaryCtrl.setErrors({ required: true });
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

    const rowGroup = this.getSpecimenRow(this.editingIndex);
    rowGroup.patchValue({
      species_id: speciesId,
      species_label: speciesLabel,
      common_name: commonName,
      scientific_name: scientificName,
      quantity: quantityCtrl.value,
      age: ageCtrl.value,
      sex: sexCtrl.value,
      marking_number_type: markingCtrl.value,
      sanitary_control: sanitaryCtrl.value,
    });

    // Limpiar y salir del modo edición
    this.clearFields();
  }

  removeSpecimen(index: number): void {
    if (index < 0 || index >= this.specimensArray.length) return;
    this.specimensArray.removeAt(index);
    if (this.editingIndex === index) {
      this.clearFields();
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }
  }

  clearFields(): void {
    const quantityCtrl = this.quantityControl;
    const speciesCtrl = this.speciesControl;
    const ageCtrl = this.ageControl;
    const sexCtrl = this.sexControl;
    const markingCtrl = this.markingControl;
    const sanitaryCtrl = this.sanitaryControlControl;

    if (quantityCtrl) {
      quantityCtrl.setValue('');
      quantityCtrl.markAsUntouched();
    }
    if (speciesCtrl) {
      speciesCtrl.setValue('');
      speciesCtrl.markAsUntouched();
    }
    if (ageCtrl) {
      ageCtrl.setValue('');
      ageCtrl.markAsUntouched();
    }
    if (sexCtrl) {
      sexCtrl.setValue('unsexed');
      sexCtrl.markAsUntouched();
    }
    if (markingCtrl) {
      markingCtrl.setValue('');
      markingCtrl.markAsUntouched();
    }
    if (sanitaryCtrl) {
      sanitaryCtrl.setValue('');
      sanitaryCtrl.markAsUntouched();
    }

    this.editingIndex = null;
  }

  getSpecimenRow(index: number): FormGroup {
    return this.specimensArray.at(index) as FormGroup;
  }

  isEditing(): boolean {
    return this.editingIndex !== null;
  }

  getSexLabel(value: string): string {
    const option = this.sexOptions.find(o => o.value === value);
    return option?.label || value;
  }
}
