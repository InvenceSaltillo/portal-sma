import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-privacy-acceptance-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './privacy-acceptance-section.component.html',
  styleUrl: './privacy-acceptance-section.component.css',
})
export class PrivacyAcceptanceSectionComponent implements AfterViewInit {
  @Input({ required: true }) group!: FormGroup;
  @Input() controlName: string = 'privacyAccepted';
  @ViewChild('modalToggleButton') modalToggleButton!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    // Flowbite solo engancha listeners sobre el DOM existente; como esto es render dinámico,
    // inicializamos de nuevo cuando la vista del componente ya existe.
    setTimeout(() => initFlowbite());
  }

  get control() {
    return this.group.get(this.controlName);
  }

  openPrivacyModal(): void {
    this.modalToggleButton?.nativeElement?.click();
  }
}
