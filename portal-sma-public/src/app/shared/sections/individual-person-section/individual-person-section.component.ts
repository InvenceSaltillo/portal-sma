import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-individual-person-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './individual-person-section.component.html',
  styleUrl: './individual-person-section.component.css',
})
export class IndividualPersonSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  @Input() nameControlName: string = 'nombre';
  @Input() paternalLastNameControlName: string = 'apellido_paterno';
  @Input() maternalLastNameControlName: string = 'apellido_materno';
  @Input() genderControlName: string = 'sexo';

  get nameControl() {
    return this.group?.get(this.nameControlName);
  }

  get paternalLastNameControl() {
    return this.group?.get(this.paternalLastNameControlName);
  }

  get maternalLastNameControl() {
    return this.group?.get(this.maternalLastNameControlName);
  }

  get genderControl() {
    return this.group?.get(this.genderControlName);
  }
}
