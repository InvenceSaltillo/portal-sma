import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-authorized-person-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './authorized-person-section.component.html',
  styleUrl: './authorized-person-section.component.css',
})
export class AuthorizedPersonSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  @Input() nameControlName: string = 'autorizada_nombre';
  @Input() paternalLastNameControlName: string = 'autorizada_apellido_paterno';
  @Input() maternalLastNameControlName: string = 'autorizada_apellido_materno';

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
