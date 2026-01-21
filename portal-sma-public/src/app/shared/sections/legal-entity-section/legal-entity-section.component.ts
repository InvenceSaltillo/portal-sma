import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-legal-entity-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './legal-entity-section.component.html',
  styleUrl: './legal-entity-section.component.css',
})
export class LegalEntitySectionComponent {
  @Input({ required: true }) group!: FormGroup;

  @Input() businessNameControlName: string = 'denominacion_razon_social';

  get businessNameControl() {
    return this.group?.get(this.businessNameControlName);
  }
}
