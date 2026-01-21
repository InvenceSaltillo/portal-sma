import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-legal-representative-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './legal-representative-section.component.html',
  styleUrl: './legal-representative-section.component.css',
})
export class LegalRepresentativeSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  @Input() nameControlName: string = 'representante_nombre';
  @Input() paternalLastNameControlName: string = 'representante_apellido_paterno';
  @Input() maternalLastNameControlName: string = 'representante_apellido_materno';

  get nameControl() {
    return this.group?.get(this.nameControlName);
  }

  get paternalLastNameControl() {
    return this.group?.get(this.paternalLastNameControlName);
  }

  get maternalLastNameControl() {
    return this.group?.get(this.maternalLastNameControlName);
  }
}
