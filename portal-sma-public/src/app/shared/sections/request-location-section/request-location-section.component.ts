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
  selector: 'app-request-location-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, DropdownModule],
  templateUrl: './request-location-section.component.html',
  styleUrl: './request-location-section.component.css',
})
export class RequestLocationSectionComponent {
  /** FormGroup padre que contiene los controles de ubicación */
  @Input({ required: true }) group!: FormGroup;

  /** Nombres de los controles dentro del grupo */
  @Input() stateControlName: string = 'state_id';
  @Input() municipalityControlName: string = 'municipality_id';

  /** Opciones para los selects (para poder reutilizar en otros trámites) */
  @Input() stateOptions: SelectOption[] = [];
  @Input() municipalityOptions: SelectOption[] = [];

  get stateControl() {
    return this.group?.get(this.stateControlName);
  }

  get municipalityControl() {
    return this.group?.get(this.municipalityControlName);
  }
}

