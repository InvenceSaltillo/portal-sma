import { Component, Input, OnInit } from '@angular/core';
import { DynamicFormField } from '../../../interfaces/dynamic-form-field.interface';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { PopoverIconComponent } from '../popover-icon/popover-icon.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-dynamic-form-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PopoverIconComponent,
    NgSelectModule,
    NgxMaskDirective,

  ],
  templateUrl: './dynamic-form-field.component.html',
  styleUrl: './dynamic-form-field.component.css'
})
export class DynamicFormFieldComponent implements OnInit {
  @Input() field!: DynamicFormField;
  @Input() formGroup!: FormGroup;
  @Input() appendToSelector: string = 'body';

  isDragging = false;
  selectedFiles: File[] = [];
  imagePreviews: { url: string; name: string; size: number }[] = [];
  previewOpen = false;
  previewSrc: string | null = null;


  ngOnInit(): void { }

  ngOnDestroy(): void {
    for (const p of this.imagePreviews) URL.revokeObjectURL(p.url);
  }

  readableSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  // drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent, field: DynamicFormField): void {
    event.preventDefault();
    this.isDragging = false;
    const dt = event.dataTransfer;
    if (!dt || !dt.files?.length) return;
    this.handleFiles(Array.from(dt.files), field);
  }

  onDropzoneClick(evt: MouseEvent, input: HTMLInputElement | null): void {
    // evita que un click dentro de botones internos duplique la acción
    if ((evt.target as HTMLElement).closest('button')) return;
    input?.click();
  }

  onBrowseClick(evt: MouseEvent, input: HTMLInputElement | null): void {
    evt.stopPropagation();  // 👈 no burbujes al contenedor
    evt.preventDefault();
    input?.click();
  }


  // Previews
  isImageField(field: DynamicFormField): boolean {
    const m = (field.file_accept_mime ?? []).map(s => s.toLowerCase());
    return m.some(t => t.startsWith('image/'));
  }
  private rebuildImagePreviews(field: DynamicFormField): void {
    for (const p of this.imagePreviews) URL.revokeObjectURL(p.url);
    this.imagePreviews = [];
    if (!this.isImageField(field)) return;

    const value = this.control?.value;
    const files: File[] = Array.isArray(value) ? value : (value ? [value] : []);
    for (const f of files) {
      this.imagePreviews.push({ url: URL.createObjectURL(f), name: f.name, size: f.size });
    }
  }

  openPreview(url: string) { this.previewSrc = url; this.previewOpen = true; }

  closePreview() { this.previewOpen = false; this.previewSrc = null; }

  // change desde input
  onFileSelected(event: Event, field: DynamicFormField): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFiles(Array.from(input.files), field);
    input.value = ''; // limpia para permitir el mismo archivo otra vez
  }

  // core: validar y setear al control
  private handleFiles(files: File[], field: DynamicFormField): void {
    const accept = (field.file_accept_mime?.length ? field.file_accept_mime : ['application/pdf']);
    const maxBytes = (field.file_max_mb || 10) * 1024 * 1024;
    const allowMultiple = !!field.file_allow_multiple;

    const valid: File[] = [];
    let hasTypeError = false;
    let hasSizeError = false;

    for (const f of files) {
      const okType = accept.includes(f.type);
      const okSize = f.size <= maxBytes;

      if (!okType) hasTypeError = true;
      if (!okSize) hasSizeError = true;

      if (okType && okSize) valid.push(f);
    }

    // Si no hubo ningún archivo válido, solo marcar errores y no tocar el valor
    if (!valid.length) {
      const current = { ...(this.control?.errors || {}) };
      if (hasTypeError) current['fileType'] = true;
      if (hasSizeError) current['fileSize'] = true;
      this.control?.setErrors(Object.keys(current).length ? current : null);
      this.control?.markAsTouched();
      return;
    }

    // Hay archivos válidos → setear valor y limpiar cualquier error previo (incluido 'required')
    if (allowMultiple) {
      this.selectedFiles = [...this.selectedFiles, ...valid];
      this.control?.setValue(this.selectedFiles);
    } else {
      this.selectedFiles = [valid[0]];
      this.control?.setValue(valid[0]);
    }

    // Limpia errores (required/fileType/fileSize) y revalida
    this.control?.setErrors(null);
    this.control?.updateValueAndValidity({ emitEvent: false });
    this.control?.markAsDirty();
    this.control?.markAsTouched();
    this.rebuildImagePreviews(field);
  }

  getFileTypeLabel(field: DynamicFormField): string {
    const mimes = (field.file_accept_mime ?? []).map(s => s.toLowerCase());
    if (mimes.some(t => t === 'application/pdf' || t.endsWith('/pdf'))) return 'PDF';
    if (mimes.some(t => t.startsWith('image/'))) return 'Imagen';
    return 'Archivo';
  }


  // quitar archivo
  removeFile(index: number, field: DynamicFormField): void {
    const allowMultiple = !!field.file_allow_multiple;
    if (allowMultiple) {
      this.selectedFiles.splice(index, 1);
      this.control?.setValue(this.selectedFiles.length ? this.selectedFiles : null);
    } else {
      this.selectedFiles = [];
      this.control?.setValue(null);
    }
    this.control?.markAsDirty();
    this.control?.updateValueAndValidity();
    this.rebuildImagePreviews(field);
  }

  normalizeOnBlur(field: DynamicFormField): void {
    const ctrl = this.formGroup.get(field.name);
    if (!ctrl) return;

    // Normaliza email: trim + lowercase
    if (field.name === 'email' && typeof ctrl.value === 'string') {
      const v = ctrl.value.trim().toLowerCase();
      if (v !== ctrl.value) {
        ctrl.setValue(v, { emitEvent: false }); // revalida sin disparar valueChanges
      }
    }
  }

  get control() {
    return this.formGroup.get(this.field.name);
  }
}
