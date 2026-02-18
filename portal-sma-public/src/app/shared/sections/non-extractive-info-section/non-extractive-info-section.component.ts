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
  selector: 'app-non-extractive-info-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, DropdownModule],
  templateUrl: './non-extractive-info-section.component.html',
  styleUrl: './non-extractive-info-section.component.css',
})
export class NonExtractiveInfoSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  @Input() exploitationObjectControlName: string = 'exploitation_object';
  @Input() exploitationSiteControlName: string = 'exploitation_site';
  @Input() exploitationTemporalityControlName: string = 'exploitation_temporality';

  @Input() exploitationSiteOptions: SelectOption[] = [];

  get exploitationObjectControl() {
    return this.group?.get(this.exploitationObjectControlName);
  }

  get exploitationSiteControl() {
    return this.group?.get(this.exploitationSiteControlName);
  }

  get exploitationTemporalityControl() {
    return this.group?.get(this.exploitationTemporalityControlName);
  }
}

