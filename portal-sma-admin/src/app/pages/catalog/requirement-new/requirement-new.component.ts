import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth/auth.service';
import { RequirementsService } from '../../../core/services/requirements.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SwitchComponent } from '../../../shared/components/form/input/switch.component';
import { TextAreaComponent } from '../../../shared/components/form/input/text-area.component';

const NAME_MAX = 50;
const TITLE_MAX = 255;
const DESC_MAX = 1000;

/** Peso máximo fijo para cualquier requisito (no configurable en UI). */
const MAX_SIZE_MB = 10;

const FILE_TYPE_PDF = 'Documento (PDF)';
const FILE_TYPE_IMAGE = 'Imagen';
/** Shapefile / Excel (p. ej. coordenadas de predio en UMA). */
const FILE_TYPE_GIS = 'Datos geoespaciales (SHP / Excel)';

/**
 * `accept` del input file: extensiones shapefile comunes + Excel.
 * Los .shp suelen reportar tipo vacío u octet-stream; la validación en el portal público usa también la extensión.
 */
const GIS_ACCEPT =
  '.shp,.dbf,.shx,.prj,.cpg,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

const ACCEPT_BY_FILE_TYPE: Record<string, string> = {
  [FILE_TYPE_PDF]: 'application/pdf',
  [FILE_TYPE_IMAGE]: 'image/*',
  [FILE_TYPE_GIS]: GIS_ACCEPT,
};

function acceptMimeForFileType(fileType: string): string {
  return ACCEPT_BY_FILE_TYPE[fileType] ?? ACCEPT_BY_FILE_TYPE[FILE_TYPE_PDF];
}

/** Compatibilidad con filas antiguas (Documento, Datos, Otro, etc.). */
function normalizeCatalogFileType(row: {
  file_type: string | null;
  accept: string | null;
}): string {
  const ft = (row.file_type ?? '').trim();
  const ftLower = ft.toLowerCase();
  if (ft === FILE_TYPE_IMAGE || ftLower === 'imagen') {
    return FILE_TYPE_IMAGE;
  }
  if (
    ft === FILE_TYPE_GIS ||
    ftLower === 'datos' ||
    ftLower.includes('shp') ||
    ftLower.includes('excel') ||
    ftLower.includes('geoespacial')
  ) {
    return FILE_TYPE_GIS;
  }
  const acc = (row.accept ?? '').toLowerCase();
  if (acc.startsWith('image')) return FILE_TYPE_IMAGE;
  if (
    acc.includes('.shp') ||
    acc.includes('spreadsheet') ||
    acc.includes('excel') ||
    acc.includes('officedocument.spreadsheet')
  ) {
    return FILE_TYPE_GIS;
  }
  return FILE_TYPE_PDF;
}

/**
 * Genera el identificador técnico (`name`) a partir del título público:
 * minúsculas, sin acentos, solo `a-z`, `0-9` y `_`.
 */
function slugifyPublicTitleToName(title: string, maxLen: number): string {
  const trimmed = title.trim();
  if (!trimmed) return '';
  const ascii = trimmed
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  let s = ascii
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/_+$/g, '');
  }
  return s;
}

function ensureUniqueRequirementName(
  base: string,
  existing: ReadonlySet<string>,
  maxLen: number
): string {
  if (!base) return base;
  if (!existing.has(base)) return base;
  for (let n = 2; n < 10000; n++) {
    const suffix = `_${n}`;
    const headLen = Math.max(1, maxLen - suffix.length);
    const head = base.slice(0, headLen).replace(/_+$/g, '');
    const candidate = (head + suffix).slice(0, maxLen);
    if (!existing.has(candidate)) return candidate;
  }
  return `${base.slice(0, Math.max(1, maxLen - 12))}_${Date.now().toString(36)}`.slice(
    0,
    maxLen
  );
}

/**
 * Alta y edición de requisitos del catálogo (`public.requirement_catalog`).
 */
@Component({
  selector: 'app-requirement-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    SwitchComponent,
    ProgressSpinnerModule,
    SelectModule,
  ],
  templateUrl: './requirement-new.component.html',
  styleUrl: './requirement-new.component.css',
})
export class RequirementNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly requirementsApi = inject(RequirementsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private routeHandleSeq = 0;

  /** `name` en BD al editar (no se muestra en el formulario). */
  private readonly technicalNameEdit = signal<string>('');

  readonly titleMaxLength = TITLE_MAX;
  readonly descMaxLength = DESC_MAX;

  readonly form = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.maxLength(TITLE_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    description: ['', [Validators.maxLength(DESC_MAX)]],
    legal_reference: ['', [Validators.maxLength(500)]],
    file_type: [FILE_TYPE_PDF, Validators.required],
    is_active: this.fb.nonNullable.control(true),
  });

  readonly editId = signal<string | null>(null);

  readonly isEditMode = computed(() => {
    const id = this.editId();
    return id != null && id !== '';
  });

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly editLoadError = signal<string | null>(null);
  readonly recordLoading = signal(false);
  readonly formUiReady = signal(false);

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar requisito' : 'Nuevo requisito'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica los datos del requisito y guarda los cambios.'
      : 'Registra un nuevo requisito documental para el catálogo de tu cliente.'
  );

  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );

  readonly fileTypeOptions = [
    { label: 'Documento (PDF)', value: FILE_TYPE_PDF },
    { label: 'Imagen', value: FILE_TYPE_IMAGE },
    { label: 'Datos geoespaciales (SHP / Excel)', value: FILE_TYPE_GIS },
  ];

  constructor() {
    this.route.paramMap
      .pipe(
        map((pm) => pm.get('id')),
        takeUntilDestroyed()
      )
      .subscribe((id) => {
        this.editId.set(id);
        void this.handleRoute(id);
      });
  }

  get titleCtrl() { return this.form.controls.title; }
  get descriptionCtrl() { return this.form.controls.description; }
  get legalReferenceCtrl() { return this.form.controls.legal_reference; }
  get fileTypeCtrl() { return this.form.controls.file_type; }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  onActiveChange(checked: boolean): void {
    this.form.controls.is_active.setValue(checked);
  }

  onTitleChange(v: string | number): void {
    this.titleCtrl.setValue(String(v));
  }

  onDescriptionChange(v: string): void {
    this.descriptionCtrl.setValue(v);
  }

  onLegalRefChange(v: string | number): void {
    this.legalReferenceCtrl.setValue(String(v));
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.technicalNameEdit.set('');
    this.form.reset({
      title: '',
      description: '',
      legal_reference: '',
      file_type: FILE_TYPE_PDF,
      is_active: true,
    });

    if (id == null || id === '') {
      this.formUiReady.set(true);
      return;
    }

    const clientId = this.clientId;
    if (!clientId) {
      this.editLoadError.set('No se encontró el cliente asociado a tu sesión.');
      return;
    }

    this.recordLoading.set(true);
    const { data, error } = await this.requirementsApi.getByIdForClient(id, clientId);
    this.recordLoading.set(false);

    if (seq !== this.routeHandleSeq) return;

    if (error) {
      this.editLoadError.set('No se pudo cargar el requisito.');
      return;
    }
    if (!data) {
      this.editLoadError.set('No se encontró el requisito o no pertenece a tu cliente.');
      return;
    }

    this.technicalNameEdit.set(data.name);
    this.form.patchValue({
      title: data.title,
      description: data.description ?? '',
      legal_reference: data.legal_reference ?? '',
      file_type: normalizeCatalogFileType({
        file_type: data.file_type,
        accept: data.accept,
      }),
      is_active: data.is_active,
    });
    this.formUiReady.set(true);
  }

  async onSubmit(): Promise<void> {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const clientId = this.clientId;
    if (!clientId) {
      this.submitError.set('No se encontró el cliente asociado a tu usuario.');
      return;
    }

    const rowId = this.editId();
    const editing = rowId != null && rowId !== '';
    const v = this.form.getRawValue();
    const accept = acceptMimeForFileType(v.file_type);

    this.submitting.set(true);
    let result;
    if (editing) {
      result = await this.requirementsApi.updateForClient(rowId, clientId, {
        name: this.technicalNameEdit(),
        title: v.title,
        description: v.description,
        legal_reference: v.legal_reference,
        file_type: v.file_type,
        accept,
        max_size_mb: MAX_SIZE_MB,
        is_active: v.is_active,
      });
    } else {
      const { data: listRows, error: listErr } =
        await this.requirementsApi.listByClientId(clientId);
      if (listErr) {
        this.submitting.set(false);
        this.submitError.set(
          listErr.message || 'No se pudo validar el identificador del requisito.'
        );
        return;
      }
      const existing = new Set(listRows.map((r) => r.name));
      const base = slugifyPublicTitleToName(v.title, NAME_MAX);
      if (!base) {
        this.submitting.set(false);
        this.submitError.set(
          'El título debe incluir al menos una letra o número para generar el identificador interno.'
        );
        return;
      }
      const uniqueName = ensureUniqueRequirementName(base, existing, NAME_MAX);
      result = await this.requirementsApi.insert({
        client_id: clientId,
        name: uniqueName,
        title: v.title,
        description: v.description,
        legal_reference: v.legal_reference,
        file_type: v.file_type,
        accept,
        max_size_mb: MAX_SIZE_MB,
        is_active: v.is_active,
      });
    }
    this.submitting.set(false);

    if (result.error) {
      this.submitError.set(result.error.message || 'No se pudo guardar el requisito.');
      return;
    }

    await this.router.navigate(['/catalog/requirements']);
  }

  titleHint(): string | undefined {
    const c = this.titleCtrl;
    if (!c.touched && !c.dirty) return undefined;
    if (c.hasError('required') || c.hasError('pattern')) return 'El título es obligatorio.';
    if (c.hasError('maxlength')) return `Máximo ${TITLE_MAX} caracteres.`;
    return undefined;
  }
}
