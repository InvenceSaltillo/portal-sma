import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-signature-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signature-item.component.html',
  styleUrl: './signature-item.component.css',
})
export class SignatureItemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) controlName!: string;
  @Input() title: string = 'Foto de la Firma';
  @Input() description: string = 'Esta firma es la que aparecerá en la Solicitud de Trámite.';
  @Input() maxSizeMB: number = 10;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  ngOnInit(): void {
    // Inicializar el control si no existe
    if (!this.group.get(this.controlName)) {
      this.group.addControl(this.controlName, new FormControl(null, Validators.required));
    }

    // Si ya hay un archivo cargado, mostrarlo
    const currentValue = this.control?.value;
    if (currentValue instanceof File) {
      this.selectedFile = currentValue;
      this.previewUrl = URL.createObjectURL(currentValue);
    }
  }

  ngOnDestroy(): void {
    // Limpiar URL de objeto
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  get control() {
    return this.group.get(this.controlName);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const dt = event.dataTransfer;
    if (!dt || !dt.files?.length) return;

    this.handleFiles(Array.from(dt.files));
  }

  onDropzoneClick(event: MouseEvent): void {
    // Evita que un click dentro de botones internos duplique la acción
    if ((event.target as HTMLElement).closest('button')) return;
    this.onBrowseClick();
  }

  onBrowseClick(): void {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFiles(Array.from(input.files));
    input.value = ''; // Limpia para permitir el mismo archivo otra vez
  }

  private handleFiles(files: File[]): void {
    const accept = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxBytes = this.maxSizeMB * 1024 * 1024;

    const file = files[0]; // Solo un archivo
    if (!file) return;

    const okType = accept.includes(file.type);
    const okSize = file.size <= maxBytes;

    if (!okType) {
      this.control?.setErrors({ fileType: true });
      this.control?.markAsTouched();
      return;
    }

    if (!okSize) {
      this.control?.setErrors({ fileSize: true });
      this.control?.markAsTouched();
      return;
    }

    // Limpiar preview anterior
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    // Archivo válido
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.control?.setValue(file);
    this.control?.setErrors(null);
    this.control?.updateValueAndValidity({ emitEvent: false });
    this.control?.markAsDirty();
    this.control?.markAsTouched();
  }

  removeFile(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    this.selectedFile = null;
    this.control?.setValue(null);
    this.control?.markAsTouched();
  }

  readableSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
