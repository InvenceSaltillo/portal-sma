import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';
import { DropdownModule } from 'primeng/dropdown';

interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-product-detail-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, DropdownModule],
  templateUrl: './product-detail-section.component.html',
  styleUrl: './product-detail-section.component.css',
})
export class ProductDetailSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;
  private fb = inject(FormBuilder);

  // Nombre del FormArray dentro del grupo
  @Input() productsArrayName: string = 'products';

  // Opciones para el dropdown de especies
  @Input() speciesOptions: SelectOption[] = [];

  get productsArray(): FormArray {
    return this.group.get(this.productsArrayName) as FormArray;
  }

  ngOnInit(): void {
    // Inicializar el FormArray si no existe
    if (!this.group.get(this.productsArrayName)) {
      this.group.addControl(this.productsArrayName, this.fb.array([]));
    }

    // Agregar un producto inicial si el array está vacío
    if (this.productsArray.length === 0) {
      this.addProduct();
    }
  }

  addProduct(): void {
    const productGroup = this.fb.group({
      species: ['', Validators.required],
      requested_quantity: ['', Validators.required],
      sampled_surface: ['', Validators.required],
      total_surface: ['', Validators.required],
      marking_system: ['', Validators.required],
      parts_derivatives_determination: ['', Validators.required],
      migratory_species: [false, Validators.required],
    });

    this.productsArray.push(productGroup);
  }

  removeProduct(index: number): void {
    if (this.productsArray.length > 1) {
      this.productsArray.removeAt(index);
    }
  }

  getProductGroup(index: number): FormGroup {
    return this.productsArray.at(index) as FormGroup;
  }

  getProductControl(index: number, controlName: string) {
    return this.getProductGroup(index)?.get(controlName);
  }
}
