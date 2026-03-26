import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

/** Comprueba si el archivo cumple la lista `accept` (tipos MIME, wildcard tipo image/* y extensiones .ext). */
export function fileMatchesAcceptList(file: File, acceptStr: string): boolean {
  const tokens = acceptStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return false;
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;
    if (token.startsWith('.')) {
      if (name.endsWith(token.toLowerCase())) return true;
      continue;
    }
    if (token.endsWith('/*')) {
      const base = token.slice(0, -1).toLowerCase();
      if (mime.startsWith(base)) return true;
      continue;
    }
    if (mime === token.toLowerCase()) return true;
  }
  return false;
}

@Component({
  selector: 'app-requirement-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './requirement-item.component.html',
  styleUrl: './requirement-item.component.css',
})
export class RequirementItemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) controlName!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) legalReference!: string;
  @Input() maxSizeMB: number = 10;
  /** Lista `accept` HTML (coma-separada), ej. `application/pdf` o extensiones + MIME. */
  @Input() accept: string = 'application/pdf';
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  selectedFile: File | null = null;

  ngOnInit(): void {
    // Inicializar el control si no existe
    if (!this.group.get(this.controlName)) {
      this.group.addControl(this.controlName, new FormControl(null, Validators.required));
    }

    // Si ya hay un archivo cargado, mostrarlo
    const currentValue = this.control?.value;
    if (currentValue instanceof File) {
      this.selectedFile = currentValue;
    }
  }

  ngOnDestroy(): void {
    // Limpiar URL de objeto si existe
    if (this.selectedFile) {
      // No hay URL que revocar en este caso ya que solo mostramos el nombre
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
    this.fileInput?.nativeElement?.click();
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
    const maxBytes = this.maxSizeMB * 1024 * 1024;

    const file = files[0]; // Solo un archivo
    if (!file) return;

    const okType = fileMatchesAcceptList(file, this.accept);
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

    // Archivo válido
    this.selectedFile = file;
    this.control?.setValue(file);
    this.control?.setErrors(null);
    this.control?.updateValueAndValidity({ emitEvent: false });
    this.control?.markAsDirty();
    this.control?.markAsTouched();
  }

  removeFile(): void {
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
