import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import {
  DocumentTemplatesService,
  type DocumentTemplateSectionTreePayload,
} from '../../../core/services/document-templates.service';
import type {
  DocumentTemplateSectionFieldRow,
  DocumentTemplateSectionWithFields,
} from '../../../core/models/document-template.model';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { CheckboxComponent } from '../../../shared/components/form/input/checkbox.component';
import { TextAreaComponent } from '../../../shared/components/form/input/text-area.component';

const NAME_MAX = 200;
const MERGE_KEY_MAX = 300;
const DESC_MAX = 4000;

function nullIfEmpty(s: string): string | null {
  const t = String(s ?? '').trim();
  return t === '' ? null : t;
}

@Component({
  selector: 'app-document-template-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    CheckboxComponent,
    ProgressSpinnerModule,
    DialogModule,
  ],
  templateUrl: './document-template-new.component.html',
  styleUrl: './document-template-new.component.css',
})
export class DocumentTemplateNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly api = inject(DocumentTemplatesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly spinner = inject(NgxSpinnerService);

  private routeHandleSeq = 0;

  readonly nameMaxLength = NAME_MAX;
  readonly mergeKeyMaxLength = MERGE_KEY_MAX;

  readonly form = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(NAME_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.maxLength(DESC_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    include_management_plan: this.fb.nonNullable.control(false),
    management_plan_merge_key: ['', [Validators.maxLength(500)]],
    include_property_image: this.fb.nonNullable.control(false),
    property_image_merge_key: ['', [Validators.maxLength(500)]],
    docx_storage_path: [''],
    include_dictamen_evaluation_key: this.fb.nonNullable.control(false),
    dictamen_evaluation_merge_key: ['', [Validators.maxLength(500)]],
    include_dictamen_date_key: this.fb.nonNullable.control(false),
    dictamen_date_merge_key: ['', [Validators.maxLength(500)]],
    include_dictamen_evaluator_key: this.fb.nonNullable.control(false),
    dictamen_evaluator_merge_key: ['', [Validators.maxLength(500)]],
    is_active: this.fb.nonNullable.control(true),
    sections: this.fb.array<FormGroup>([]),
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
    this.isEditMode() ? 'Editar plantilla de documento' : 'Nueva plantilla de documento'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica la plantilla, secciones y configuración del documento.'
      : 'Configura el .docx base, el dictamen de evaluación y las secciones para generar documentos.'
  );

  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );

  readonly docxFileInput = viewChild<ElementRef<HTMLInputElement>>('docxFileInput');

  /** .docx elegido y pendiente de subir al guardar (sustituye o define la ruta en Storage). */
  readonly pendingDocxFile = signal<File | null>(null);

  /** Resalta el bloque de archivo si falta .docx al intentar guardar. */
  readonly docxMissingHighlight = signal(false);

  /** Borrador de sección (patrón legado: formulario + tabla). */
  readonly sectionDraftName = signal('');
  readonly sectionDraftInstructions = signal('');
  /** Índice en edición en la tabla; null = alta nueva. */
  readonly editingSectionIndex = signal<number | null>(null);
  /** Sección cuyos marcadores (datos) se muestran debajo. */
  readonly selectedSectionIndexForFields = signal<number | null>(null);
  readonly sectionDraftError = signal<string | null>(null);

  /** Modal de marcadores / datos por sección (botón Editar en la tabla). */
  readonly sectionDataModalOpen = signal(false);
  readonly sectionDataModalIndex = signal<number | null>(null);
  /** Borrador para añadir un marcador desde el modal (clave + descripción). */
  readonly sectionDataFieldDraftKey = signal('');
  readonly sectionDataFieldDraftDesc = signal('');
  readonly sectionDataFieldDraftError = signal<string | null>(null);

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

  get nameCtrl() {
    return this.form.controls.name;
  }
  get descriptionCtrl() {
    return this.form.controls.description;
  }

  get sections(): FormArray {
    return this.form.controls.sections;
  }

  /** `fields` de la sección en el índice dado (marcadores del .docx). */
  sectionFields(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('fields') as FormArray;
  }

  sectionDataModalTitle(): string {
    const i = this.sectionDataModalIndex();
    if (i === null) {
      return 'Datos de la sección (marcadores en el Word)';
    }
    const n = String(this.sections.at(i).get('name')?.value ?? '').trim();
    return n !== ''
      ? `Datos de la sección — ${n}`
      : 'Datos de la sección (marcadores en el Word)';
  }

  onSectionDataModalVisibleChange(visible: boolean): void {
    this.sectionDataModalOpen.set(visible);
    if (!visible) {
      this.sectionDataModalIndex.set(null);
      this.clearSectionDataFieldDraft();
    }
  }

  openSectionDataModal(index: number, event: Event): void {
    event.stopPropagation();
    this.clearSectionDataFieldDraft();
    this.sectionDataModalIndex.set(index);
    this.sectionDataModalOpen.set(true);
  }

  closeSectionDataModal(): void {
    this.sectionDataModalOpen.set(false);
    this.sectionDataModalIndex.set(null);
    this.clearSectionDataFieldDraft();
  }

  clearSectionDataFieldDraft(): void {
    this.sectionDataFieldDraftKey.set('');
    this.sectionDataFieldDraftDesc.set('');
    this.sectionDataFieldDraftError.set(null);
  }

  saveSectionDataFieldDraft(): void {
    const i = this.sectionDataModalIndex();
    if (i === null) {
      return;
    }
    const key = String(this.sectionDataFieldDraftKey() ?? '').trim();
    if (key === '') {
      this.sectionDataFieldDraftError.set('La clave del marcador es obligatoria.');
      return;
    }
    this.sectionDataFieldDraftError.set(null);
    const desc = String(this.sectionDataFieldDraftDesc() ?? '').trim();
    this.sectionFields(i).push(
      this.createFieldGroup({
        merge_key: key,
        description: desc === '' ? null : desc,
      })
    );
    this.clearSectionDataFieldDraft();
  }

  addFieldToModalSection(): void {
    const i = this.sectionDataModalIndex();
    if (i === null) {
      return;
    }
    this.sectionFields(i).push(this.createFieldGroup());
  }

  removeFieldFromModalSection(fieldIndex: number): void {
    const i = this.sectionDataModalIndex();
    if (i === null) {
      return;
    }
    this.sectionFields(i).removeAt(fieldIndex);
  }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  private createFieldGroup(
    initial?: Pick<DocumentTemplateSectionFieldRow, 'merge_key' | 'description'>
  ): FormGroup {
    return this.fb.nonNullable.group({
      merge_key: [initial?.merge_key ?? '', [Validators.maxLength(MERGE_KEY_MAX)]],
      description: [initial?.description ?? '', [Validators.maxLength(2000)]],
    });
  }

  private createSectionGroup(initial?: DocumentTemplateSectionWithFields): FormGroup {
    const fieldsArr = this.fb.array<FormGroup>([]);
    if (initial?.fields?.length) {
      for (const f of initial.fields) {
        fieldsArr.push(this.createFieldGroup(f));
      }
    }
    return this.fb.group({
      name: [initial?.name ?? ''],
      fill_instructions: [initial?.fill_instructions ?? ''],
      fields: fieldsArr,
    });
  }

  saveSectionDraft(): void {
    this.sectionDraftError.set(null);
    const name = String(this.sectionDraftName() ?? '').trim();
    const fill = String(this.sectionDraftInstructions() ?? '').trim();
    if (name === '') {
      this.sectionDraftError.set('El nombre de la sección es obligatorio.');
      return;
    }
    const editIdx = this.editingSectionIndex();
    if (editIdx !== null) {
      const g = this.sections.at(editIdx);
      g.get('name')?.setValue(name);
      g.get('fill_instructions')?.setValue(fill);
      this.selectedSectionIndexForFields.set(editIdx);
    } else {
      this.sections.push(
        this.createSectionGroup({
          id: '',
          document_template_id: '',
          sort_order: this.sections.length,
          name,
          fill_instructions: fill === '' ? null : fill,
          created_at: null,
          updated_at: null,
          fields: [],
        })
      );
      this.selectedSectionIndexForFields.set(this.sections.length - 1);
    }
    this.clearSectionDraft();
  }

  clearSectionDraft(): void {
    this.sectionDraftName.set('');
    this.sectionDraftInstructions.set('');
    this.editingSectionIndex.set(null);
    this.sectionDraftError.set(null);
  }

  onSectionTableRowClick(index: number): void {
    const g = this.sections.at(index);
    this.sectionDraftName.set(String(g.get('name')?.value ?? ''));
    this.sectionDraftInstructions.set(String(g.get('fill_instructions')?.value ?? ''));
    this.editingSectionIndex.set(index);
    this.selectedSectionIndexForFields.set(index);
    this.sectionDraftError.set(null);
  }

  deleteSectionRow(index: number, event?: Event): void {
    event?.stopPropagation();
    const modalIdx = this.sectionDataModalIndex();
    if (modalIdx === index) {
      this.closeSectionDataModal();
    } else if (modalIdx !== null && modalIdx > index) {
      this.sectionDataModalIndex.set(modalIdx - 1);
    }
    this.sections.removeAt(index);
    const sel = this.selectedSectionIndexForFields();
    const ed = this.editingSectionIndex();
    if (sel === index) {
      this.selectedSectionIndexForFields.set(null);
    } else if (sel !== null && sel > index) {
      this.selectedSectionIndexForFields.set(sel - 1);
    }
    if (ed === index) {
      this.clearSectionDraft();
    } else if (ed !== null && ed > index) {
      this.editingSectionIndex.set(ed - 1);
    }
  }

  onActiveChange(checked: boolean): void {
    this.form.controls.is_active.setValue(checked);
  }

  openDocxPicker(): void {
    this.docxFileInput()?.nativeElement?.click();
  }

  async viewStoredDocx(): Promise<void> {
    const path = String(this.form.controls.docx_storage_path.value ?? '').trim();
    if (!path) {
      return;
    }
    this.submitError.set(null);
    const { data, error } = await this.auth.client.storage
      .from('clients')
      .createSignedUrl(path, 60 * 10); // 10 min

    if (error || !data?.signedUrl) {
      this.submitError.set(
        error?.message || 'No se pudo generar la URL para visualizar el archivo.'
      );
      return;
    }

    // Los navegadores suelen descargar .docx. Para visualizar en pestaña nueva
    // usamos el visor web de Office (Word Online) apuntando a la URL firmada.
    const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
      data.signedUrl
    )}`;

    window.open(viewerUrl, '_blank', 'noopener,noreferrer');
  }

  docxDisplayName(): string {
    const f = this.pendingDocxFile();
    if (f) {
      return f.name;
    }
    const p = String(this.form.controls.docx_storage_path.value ?? '').trim();
    if (!p) {
      return '';
    }
    const parts = p.split('/').filter(Boolean);
    return parts.length ? (parts[parts.length - 1] ?? p) : p;
  }

  hasStoredOrPendingDocx(): boolean {
    if (this.pendingDocxFile()) {
      return true;
    }
    return String(this.form.controls.docx_storage_path.value ?? '').trim() !== '';
  }

  onDocxFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) {
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.docx')) {
      this.submitError.set('Solo se pueden subir archivos en formato: .docx');
      return;
    }
    this.submitError.set(null);
    this.pendingDocxFile.set(file);
    this.docxMissingHighlight.set(false);
  }

  private async uploadPendingDocxIfAny(
    clientId: string
  ): Promise<{ error: string | null }> {
    const file = this.pendingDocxFile();
    if (!file) {
      return { error: null };
    }
    const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
    const path = `${clientId}/document_templates/${Date.now()}_${safe}`;
    const { error } = await this.auth.client.storage.from('clients').upload(path, file, {
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: false,
    });
    if (error) {
      return {
        error:
          error.message ||
          'No se pudo subir el archivo. Comprueba permisos o tu conexión.',
      };
    }
    this.pendingDocxFile.set(null);
    this.form.patchValue({ docx_storage_path: path });
    return { error: null };
  }

  private resetForm(): void {
    this.selectedSectionIndexForFields.set(null);
    this.clearSectionDraft();
    while (this.sections.length) {
      this.sections.removeAt(0);
    }
    this.pendingDocxFile.set(null);
    this.docxMissingHighlight.set(false);
    this.form.reset({
      name: '',
      description: '',
      include_management_plan: false,
      management_plan_merge_key: '',
      include_property_image: false,
      property_image_merge_key: '',
      docx_storage_path: '',
      include_dictamen_evaluation_key: false,
      dictamen_evaluation_merge_key: '',
      include_dictamen_date_key: false,
      dictamen_date_merge_key: '',
      include_dictamen_evaluator_key: false,
      dictamen_evaluator_merge_key: '',
      is_active: true,
    });
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.resetForm();

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
    const { data, error } = await this.api.getByIdForClient(id, clientId);
    const secRes = await this.api.listSectionsWithFieldsByTemplateId(id);
    this.recordLoading.set(false);

    if (seq !== this.routeHandleSeq) return;

    if (error || !data) {
      this.editLoadError.set(
        'No se encontró la plantilla o no pertenece a tu cliente.'
      );
      return;
    }

    if (secRes.error) {
      this.editLoadError.set(
        secRes.error.message?.includes('does not exist')
          ? 'Aplica la migración de «document_template_section_fields» en Supabase.'
          : 'No se pudieron cargar las secciones.'
      );
      return;
    }

    this.form.patchValue({
      name: data.name,
      description: data.description ?? '',
      include_management_plan: data.include_management_plan,
      management_plan_merge_key: data.management_plan_merge_key ?? '',
      include_property_image: data.include_property_image,
      property_image_merge_key: data.property_image_merge_key ?? '',
      docx_storage_path: data.docx_storage_path ?? '',
      include_dictamen_evaluation_key: data.include_dictamen_evaluation_key,
      dictamen_evaluation_merge_key: data.dictamen_evaluation_merge_key ?? '',
      include_dictamen_date_key: data.include_dictamen_date_key,
      dictamen_date_merge_key: data.dictamen_date_merge_key ?? '',
      include_dictamen_evaluator_key: data.include_dictamen_evaluator_key,
      dictamen_evaluator_merge_key: data.dictamen_evaluator_merge_key ?? '',
      is_active: data.is_active,
    });

    for (const row of secRes.data) {
      this.sections.push(this.createSectionGroup(row));
    }

    this.formUiReady.set(true);
  }

  private collectSectionTreeForSave():
    | { ok: true; sections: DocumentTemplateSectionTreePayload[] }
    | { ok: false; message: string } {
    const out: DocumentTemplateSectionTreePayload[] = [];

    for (const secCtrl of this.sections.controls) {
      const sv = secCtrl.getRawValue() as {
        name: string;
        fill_instructions: string;
        fields: { merge_key: string; description: string }[];
      };
      const name = String(sv.name ?? '').trim();
      const fill_instructions = nullIfEmpty(sv.fill_instructions ?? '');

      const fieldsOut: { merge_key: string; description: string | null }[] = [];
      for (const f of sv.fields ?? []) {
        const mk = String(f.merge_key ?? '').trim();
        const desc = nullIfEmpty(f.description ?? '');
        if (mk === '' && desc == null) continue;
        if (mk === '' && desc != null) {
          return {
            ok: false,
            message:
              'Cada dato con descripción necesita una clave (marcador), p. ej. [nombreespecie].',
          };
        }
        if (mk !== '') {
          fieldsOut.push({ merge_key: mk, description: desc });
        }
      }

      const hasSectionContent =
        fill_instructions != null || name !== '' || fieldsOut.length > 0;

      if (!hasSectionContent) continue;

      if (name === '') {
        return {
          ok: false,
          message: 'Toda sección con datos o campos debe tener un nombre.',
        };
      }

      out.push({
        name,
        fill_instructions,
        fields: fieldsOut,
      });
    }

    return { ok: true, sections: out };
  }

  private buildTemplatePayload() {
    const v = this.form.getRawValue();
    return {
      name: (v.name ?? '').trim(),
      description: nullIfEmpty(v.description ?? ''),
      docx_storage_path: nullIfEmpty(v.docx_storage_path ?? ''),
      include_management_plan: v.include_management_plan,
      management_plan_merge_key: v.include_management_plan
        ? nullIfEmpty(v.management_plan_merge_key ?? '')
        : null,
      include_property_image: v.include_property_image,
      property_image_merge_key: v.include_property_image
        ? nullIfEmpty(v.property_image_merge_key ?? '')
        : null,
      include_dictamen_evaluation_key: v.include_dictamen_evaluation_key,
      dictamen_evaluation_merge_key: v.include_dictamen_evaluation_key
        ? nullIfEmpty(v.dictamen_evaluation_merge_key ?? '')
        : null,
      include_dictamen_date_key: v.include_dictamen_date_key,
      dictamen_date_merge_key: v.include_dictamen_date_key
        ? nullIfEmpty(v.dictamen_date_merge_key ?? '')
        : null,
      include_dictamen_evaluator_key: v.include_dictamen_evaluator_key,
      dictamen_evaluator_merge_key: v.include_dictamen_evaluator_key
        ? nullIfEmpty(v.dictamen_evaluator_merge_key ?? '')
        : null,
      is_active: v.is_active,
    };
  }

  async onSubmit(): Promise<void> {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.hasStoredOrPendingDocx()) {
      this.docxMissingHighlight.set(true);
      this.submitError.set('Debes subir un archivo Word (.docx).');
      return;
    }
    this.docxMissingHighlight.set(false);

    const clientId = this.clientId;
    if (!clientId) {
      this.submitError.set('No se encontró el cliente asociado a tu usuario.');
      return;
    }

    const tree = this.collectSectionTreeForSave();
    if (!tree.ok) {
      this.submitError.set(tree.message);
      return;
    }

    this.spinner.show('global');
    this.submitting.set(true);

    const upErr = await this.uploadPendingDocxIfAny(clientId);
    if (upErr.error) {
      this.spinner.hide('global');
      this.submitting.set(false);
      this.submitError.set(upErr.error);
      return;
    }

    const payload = this.buildTemplatePayload();
    const rowId = this.editId();
    const editing = rowId != null && rowId !== '';

    if (editing) {
      const { error: upErr, data: updated } = await this.api.updateForClient(
        rowId,
        clientId,
        payload
      );
      if (upErr) {
        this.spinner.hide('global');
        this.submitting.set(false);
        this.submitError.set(upErr.message || 'No se pudo actualizar la plantilla.');
        return;
      }
      if (!updated) {
        this.spinner.hide('global');
        this.submitting.set(false);
        this.submitError.set('No se pudo actualizar la plantilla.');
        return;
      }
      const { error: secErr } = await this.api.replaceSectionTreeForTemplate(
        rowId,
        tree.sections
      );
      this.spinner.hide('global');
      this.submitting.set(false);
      if (secErr) {
        this.submitError.set(
          secErr.message ||
            'Se guardó la plantilla pero falló al guardar secciones o campos.'
        );
        return;
      }
    } else {
      const { data: created, error: insErr } = await this.api.insert({
        client_id: clientId,
        ...payload,
      });
      if (insErr || !created) {
        this.spinner.hide('global');
        this.submitting.set(false);
        this.submitError.set(
          insErr?.message || 'No se pudo crear la plantilla.'
        );
        return;
      }
      const { error: secErr } = await this.api.replaceSectionTreeForTemplate(
        created.id,
        tree.sections
      );
      this.spinner.hide('global');
      this.submitting.set(false);
      if (secErr) {
        this.submitError.set(
          secErr.message ||
            'Se creó la plantilla pero falló al guardar secciones o campos.'
        );
        return;
      }
    }

    this.spinner.hide('global');
    await this.router.navigate(['/catalog/document-templates']);
  }

  nameHint(): string | undefined {
    const c = this.nameCtrl;
    if (!c.touched && !c.dirty) return undefined;
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'El nombre es obligatorio.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${NAME_MAX} caracteres.`;
    }
    return undefined;
  }

  descriptionHint(): string | undefined {
    const c = this.descriptionCtrl;
    if (!c.touched && !c.dirty) return undefined;
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'La descripción es obligatoria.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${DESC_MAX} caracteres.`;
    }
    return undefined;
  }

  asString(v: string | number): string {
    return String(v);
  }

  normalizeMergeKeyInput(v: string | number): string {
    const raw = String(v ?? '').trim();
    if (raw === '') return '';

    // Quita cualquier corchete que se vaya colando durante la escritura y normaliza a "[texto]".
    // Ej: "[d]a]t]" -> "dat" -> "[dat]"
    const inner = raw.replace(/[\[\]]/g, '').trim();
    return inner === '' ? '' : `[${inner}]`;
  }
}
