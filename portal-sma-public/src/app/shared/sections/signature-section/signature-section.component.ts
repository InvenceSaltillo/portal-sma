import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';
import { SignatureItemComponent } from '../signature-item/signature-item.component';

export interface Signature {
  controlName: string;
  title?: string;
  description?: string;
}

@Component({
  selector: 'app-signature-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent, SignatureItemComponent],
  templateUrl: './signature-section.component.html',
  styleUrl: './signature-section.component.css',
})
export class SignatureSectionComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) signatures: Signature[] = [];
  @Input() maxSizeMB: number = 10;
}
