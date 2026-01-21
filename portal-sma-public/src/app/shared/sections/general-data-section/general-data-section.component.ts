import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-general-data-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './general-data-section.component.html',
  styleUrl: './general-data-section.component.css',
})
export class GeneralDataSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  @Input() curpControlName: string = 'curp';
  @Input() rfcControlName: string = 'rfc';
  @Input() rupaControlName: string = 'rupa';

  get curpControl() {
    return this.group?.get(this.curpControlName);
  }

  get rfcControl() {
    return this.group?.get(this.rfcControlName);
  }

  get rupaControl() {
    return this.group?.get(this.rupaControlName);
  }
}
