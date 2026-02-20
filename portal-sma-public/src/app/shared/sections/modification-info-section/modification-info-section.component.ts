import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-modification-info-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './modification-info-section.component.html',
  styleUrl: './modification-info-section.component.css',
})
export class ModificationInfoSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  get modificationTypesGroup(): FormGroup {
    return this.group.get('modification_types') as FormGroup;
  }

  getControl(name: string) {
    return this.group.get(name);
  }
}

