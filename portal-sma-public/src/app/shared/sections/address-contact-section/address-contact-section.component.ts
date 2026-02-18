import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';
import { DropdownModule } from 'primeng/dropdown';

interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-address-contact-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, DropdownModule],
  templateUrl: './address-contact-section.component.html',
  styleUrl: './address-contact-section.component.css',
})
export class AddressContactSectionComponent {
  @Input({ required: true }) group!: FormGroup;

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

  // Getters para acceder a los controles
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
}
