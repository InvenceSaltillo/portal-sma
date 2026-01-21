import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';
import { NgSelectModule } from '@ng-select/ng-select';

interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-notification-address-contact-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, NgSelectModule],
  templateUrl: './notification-address-contact-section.component.html',
  styleUrl: './notification-address-contact-section.component.css',
})
export class NotificationAddressContactSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  // Nombre del control del checkbox
  @Input() checkboxControlName: string = 'enable_notifications';

  // Nombres de controles - configurables para reutilización
  @Input() postalCodeControlName: string = 'postal_code';
  @Input() streetControlName: string = 'street';
  @Input() externalNumberControlName: string = 'external_number';
  @Input() internalNumberControlName: string = 'internal_number';
  @Input() neighborhoodControlName: string = 'neighborhood';
  @Input() cityControlName: string = 'city';
  @Input() stateControlName: string = 'state_id';
  @Input() municipalityControlName: string = 'municipality_id';
  @Input() areaCodeControlName: string = 'area_code';
  @Input() phoneControlName: string = 'phone';
  @Input() extensionControlName: string = 'extension';
  @Input() mobilePhoneControlName: string = 'mobile_phone';
  @Input() emailControlName: string = 'email';

  // Opciones para los selects
  @Input() stateOptions: SelectOption[] = [];
  @Input() municipalityOptions: SelectOption[] = [];

  // Estado de expansión
  isExpanded: boolean = false;

  ngOnInit(): void {
    // Inicializar el checkbox si no existe
    if (!this.group.get(this.checkboxControlName)) {
      this.group.addControl(this.checkboxControlName, new FormControl(false));
    }

    // Escuchar cambios en el checkbox
    const checkboxControl = this.group.get(this.checkboxControlName);
    if (checkboxControl) {
      this.isExpanded = checkboxControl.value || false;

      checkboxControl.valueChanges.subscribe((checked: boolean) => {
        this.isExpanded = checked;
        if (checked) {
          this.addRequiredValidators();
        } else {
          this.removeValidators();
        }
      });

      // Aplicar validadores iniciales si el checkbox está marcado
      if (this.isExpanded) {
        this.addRequiredValidators();
      } else {
        this.removeValidators();
      }
    }
  }

  // Getters para acceder a los controles
  get checkboxControl() {
    return this.group?.get(this.checkboxControlName);
  }

  get postalCodeControl() {
    return this.group?.get(this.postalCodeControlName);
  }

  get streetControl() {
    return this.group?.get(this.streetControlName);
  }

  get externalNumberControl() {
    return this.group?.get(this.externalNumberControlName);
  }

  get internalNumberControl() {
    return this.group?.get(this.internalNumberControlName);
  }

  get neighborhoodControl() {
    return this.group?.get(this.neighborhoodControlName);
  }

  get cityControl() {
    return this.group?.get(this.cityControlName);
  }

  get stateControl() {
    return this.group?.get(this.stateControlName);
  }

  get municipalityControl() {
    return this.group?.get(this.municipalityControlName);
  }

  get areaCodeControl() {
    return this.group?.get(this.areaCodeControlName);
  }

  get phoneControl() {
    return this.group?.get(this.phoneControlName);
  }

  get extensionControl() {
    return this.group?.get(this.extensionControlName);
  }

  get mobilePhoneControl() {
    return this.group?.get(this.mobilePhoneControlName);
  }

  get emailControl() {
    return this.group?.get(this.emailControlName);
  }

  private addRequiredValidators(): void {
    const emailValidators = [Validators.required, Validators.email];
    const requiredValidators = [Validators.required];

    this.postalCodeControl?.setValidators(requiredValidators);
    this.streetControl?.setValidators(requiredValidators);
    this.externalNumberControl?.setValidators(requiredValidators);
    this.internalNumberControl?.setValidators(requiredValidators);
    this.neighborhoodControl?.setValidators(requiredValidators);
    this.cityControl?.setValidators(requiredValidators);
    this.stateControl?.setValidators(requiredValidators);
    this.municipalityControl?.setValidators(requiredValidators);
    this.areaCodeControl?.setValidators(requiredValidators);
    this.phoneControl?.setValidators(requiredValidators);
    this.extensionControl?.setValidators(requiredValidators);
    this.mobilePhoneControl?.setValidators(requiredValidators);
    this.emailControl?.setValidators(emailValidators);

    // Actualizar validación
    this.postalCodeControl?.updateValueAndValidity();
    this.streetControl?.updateValueAndValidity();
    this.externalNumberControl?.updateValueAndValidity();
    this.internalNumberControl?.updateValueAndValidity();
    this.neighborhoodControl?.updateValueAndValidity();
    this.cityControl?.updateValueAndValidity();
    this.stateControl?.updateValueAndValidity();
    this.municipalityControl?.updateValueAndValidity();
    this.areaCodeControl?.updateValueAndValidity();
    this.phoneControl?.updateValueAndValidity();
    this.extensionControl?.updateValueAndValidity();
    this.mobilePhoneControl?.updateValueAndValidity();
    this.emailControl?.updateValueAndValidity();
  }

  private removeValidators(): void {
    this.postalCodeControl?.clearValidators();
    this.streetControl?.clearValidators();
    this.externalNumberControl?.clearValidators();
    this.internalNumberControl?.clearValidators();
    this.neighborhoodControl?.clearValidators();
    this.cityControl?.clearValidators();
    this.stateControl?.clearValidators();
    this.municipalityControl?.clearValidators();
    this.areaCodeControl?.clearValidators();
    this.phoneControl?.clearValidators();
    this.extensionControl?.clearValidators();
    this.mobilePhoneControl?.clearValidators();
    this.emailControl?.clearValidators();

    // Actualizar validación
    this.postalCodeControl?.updateValueAndValidity();
    this.streetControl?.updateValueAndValidity();
    this.externalNumberControl?.updateValueAndValidity();
    this.internalNumberControl?.updateValueAndValidity();
    this.neighborhoodControl?.updateValueAndValidity();
    this.cityControl?.updateValueAndValidity();
    this.stateControl?.updateValueAndValidity();
    this.municipalityControl?.updateValueAndValidity();
    this.areaCodeControl?.updateValueAndValidity();
    this.phoneControl?.updateValueAndValidity();
    this.extensionControl?.updateValueAndValidity();
    this.mobilePhoneControl?.updateValueAndValidity();
    this.emailControl?.updateValueAndValidity();
  }
}
