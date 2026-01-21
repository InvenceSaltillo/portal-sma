import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PopoverIconComponent } from '../../components/popover-icon/popover-icon.component';

@Component({
  selector: 'app-uma-registration-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopoverIconComponent],
  templateUrl: './uma-registration-section.component.html',
  styleUrl: './uma-registration-section.component.css',
})
export class UmaRegistrationSectionComponent {
  /** FormGroup que contiene el control de clave de registro */
  @Input({ required: true }) group!: FormGroup;

  /** Nombre del control dentro del grupo (por si en algún trámite cambia el nombre) */
  @Input() controlName: string = 'uma_registration_key';

  /** Evento para que el padre pueda ejecutar la búsqueda de UMA */
  @Output() buscarUma = new EventEmitter<void>();

  onBuscarUma(): void {
    this.buscarUma.emit();
  }

  get control() {
    return this.group?.get(this.controlName);
  }
}

