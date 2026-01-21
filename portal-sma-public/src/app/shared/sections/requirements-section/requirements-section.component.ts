import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';
import { RequirementItemComponent } from '../requirement-item/requirement-item.component';

export interface Requirement {
  controlName: string;
  title: string;
  legalReference: string;
}

@Component({
  selector: 'app-requirements-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, RequirementItemComponent],
  templateUrl: './requirements-section.component.html',
  styleUrl: './requirements-section.component.css',
})
export class RequirementsSectionComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) requirements: Requirement[] = [];
  @Input() maxSizeMB: number = 10;
}
