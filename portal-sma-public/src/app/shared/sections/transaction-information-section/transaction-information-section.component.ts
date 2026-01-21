import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';
import { NgSelectModule } from '@ng-select/ng-select';

interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-transaction-information-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, NgSelectModule],
  templateUrl: './transaction-information-section.component.html',
  styleUrl: './transaction-information-section.component.css',
})
export class TransactionInformationSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  // Nombres de controles - configurables para reutilización
  @Input() exploitationLocationControlName: string = 'exploitation_location';
  @Input() placeDataControlName: string = 'place_data';
  @Input() exploitationPurposeControlName: string = 'exploitation_purpose';

  // Opciones para el dropdown de ubicación de aprovechamiento
  @Input() exploitationLocationOptions: SelectOption[] = [];

  // Getters para acceder a los controles
  get exploitationLocationControl() {
    return this.group?.get(this.exploitationLocationControlName);
  }

  get placeDataControl() {
    return this.group?.get(this.placeDataControlName);
  }

  get exploitationPurposeControl() {
    return this.group?.get(this.exploitationPurposeControlName);
  }
}
