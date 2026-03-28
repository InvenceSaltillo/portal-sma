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
import { DatePicker } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NgxSpinnerService } from 'ngx-spinner';
import { SelectModule } from 'primeng/select';
import { DocumentTemplatesService } from '../../../core/services/document-templates.service';
import {
  ServiceDocumentDetailsService,
  type ServiceDocumentDetailLinkedRow,
  type ServiceDocumentDetailType,
} from '../../../core/services/service-document-details.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ProceduresService,
  type UmaLimitScope,
} from '../../../core/services/procedures.service';
import { ServiceTypesService } from '../../../core/services/service-types.service';
import {
  RequirementsService,
  type RequirementRow,
  type ServiceRequirementLinkedRow,
} from '../../../core/services/requirements.service';
import {
  DataTableComponent,
  type DataTableColumn,
  type DataTableRowAction,
} from '../../../shared/components/ui/data-table/data-table.component';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateMexico,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SwitchComponent } from '../../../shared/components/form/input/switch.component';

const NAME_MAX = 255;
const LEGAL_BASIS_MAX = 8000;
const DESC_MAX = 4000;
const NOTES_MAX = 4000;

/** Campo en filas de la tabla de requisitos del trámite (checkbox Obligatorio). */
const PROCEDURE_REQ_OBLIGATORIO_FIELD = '_obligatorio';

/** Fila de la tabla «Detalles del trámite» (UI + persistencia). */
export interface ProcedureDetailTableRow {
  id: string;
  document_template_id: string;
  template_name: string;
  detail_type: ServiceDocumentDetailType;
  valid_from: string;
  valid_to: string;
}

const PROCEDURE_DETAIL_TYPE_OPTIONS: {
  label: string;
  value: ServiceDocumentDetailType;
}[] = [
  { label: 'Car\u00e1tula', value: 'caratula' },
  { label: 'Resolutivo aprobado', value: 'resolutivo_aprobado' },
  { label: 'Resolutivo rechazado', value: 'resolutivo_rechazado' },
  { label: 'Resolutivo suspendido', value: 'resolutivo_suspendido' },
];

const PROCEDURE_REQUIREMENT_TABLE_COLUMNS: DataTableColumn[] = [
  {
    field: 'title',
    header: 'T\u00edtulo',
  },
  {
    field: 'file_type',
    header: 'Tipo de archivo',
  },
  {
    field: 'is_active',
    header: 'Activo',
    sortField: 'is_active_sort',
  },
  {
    field: 'updated_at',
    header: '\u00daltima actualizaci\u00f3n',
    sortField: 'updated_at_sort',
  },
];

export interface ProcedureTypeOption {
  label: string;
  value: string;
}

/**
 * Alta y edición de trámite (`public.services`).
 */
@Component({
  selector: 'app-procedure-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    SwitchComponent,
    ProgressSpinnerModule,
    SelectModule,
    DatePicker,
    DataTableComponent,
  ],
  templateUrl: './procedure-new.component.html',
  styleUrl: './procedure-new.component.css',
})
export class ProcedureNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly proceduresApi = inject(ProceduresService);
  private readonly serviceTypesApi = inject(ServiceTypesService);
  private readonly requirementsApi = inject(RequirementsService);
  private readonly documentTemplatesApi = inject(DocumentTemplatesService);
  private readonly serviceDocumentDetailsApi = inject(ServiceDocumentDetailsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly spinner = inject(NgxSpinnerService);

  private routeHandleSeq = 0;

  readonly nameMaxLength = NAME_MAX;
  readonly legalBasisMaxLength = LEGAL_BASIS_MAX;
  readonly descMaxLength = DESC_MAX;
  readonly notesMaxLength = NOTES_MAX;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(NAME_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    legal_basis: [
      '',
      [
        Validators.required,
        Validators.maxLength(LEGAL_BASIS_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    description: ['', [Validators.maxLength(DESC_MAX)]],
    notes: ['', [Validators.maxLength(NOTES_MAX)]],
    service_type_id: ['', Validators.required],
    is_uma_related: this.fb.nonNullable.control(false),
    uma_limit_scope: this.fb.control<UmaLimitScope | null>(null),
    is_active: this.fb.nonNullable.control(true),
  });

  /** Borrador para agregar filas a «Detalles del trámite». */
  readonly detailDraftForm = this.fb.group({
    valid_from: this.fb.control<Date | null>(null),
    valid_to: this.fb.control<Date | null>(null),
    document_template_id: this.fb.control<string>(''),
    detail_type: this.fb.control<ServiceDocumentDetailType | ''>(''),
  });

  readonly procedureDetailTypeOptions = PROCEDURE_DETAIL_TYPE_OPTIONS;

  readonly editId = signal<string | null>(null);
  readonly typeOptions = signal<ProcedureTypeOption[]>([]);

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
    this.isEditMode() ? 'Editar trámite' : 'Nuevo trámite'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica los datos y guarda los cambios.'
      : 'Registra un trámite vinculado a un tipo de trámite de tu cliente.'
  );

  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );

  readonly procedureRequirementColumns = PROCEDURE_REQUIREMENT_TABLE_COLUMNS;

  /** Texto del buscador por título (solo vista; filtra `procedureRequirementRowsForTable`). */
  readonly requirementTitleSearch = signal('');

  readonly procedureRequirementRowsForTable = computed(() => {
    const q = this.requirementTitleSearch().trim().toLowerCase();
    const rows = this.procedureRequirementRows();
    if (q === '') {
      return rows;
    }
    return rows.filter((r) =>
      String(r['title'] ?? '')
        .toLowerCase()
        .includes(q)
    );
  });

  readonly procedureRequirementsTableEmptyMessage = computed(() => {
    const total = this.procedureRequirementRows().length;
    const filtered = this.procedureRequirementRowsForTable().length;
    const q = this.requirementTitleSearch().trim();
    if (total === 0) {
      return 'No hay requisitos en el cat\u00e1logo de tu cliente. Crea entradas en Requisitos antes de asociarlas aqu\u00ed.';
    }
    if (filtered === 0 && q !== '') {
      return 'Ning\u00fan requisito coincide con la b\u00fasqueda.';
    }
    return 'No hay registros para mostrar.';
  });

  readonly procedureRequirementRowActions: DataTableRowAction[] = [
    {
      label: 'Editar en catálogo',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate([
            '/catalog/requirements',
            String(id),
            'edit',
          ]);
        }
      },
    },
  ];

  readonly procedureRequirementRows = signal<Record<string, unknown>[]>([]);
  readonly selectedProcedureRequirements = signal<Record<string, unknown>[]>(
    []
  );
  readonly procedureRequirementsLoading = signal(false);
  readonly procedureRequirementsError = signal<string | null>(null);
  /** Aviso si no se pudieron cargar vínculos guardados pero el catálogo sí está disponible. */
  readonly procedureRequirementsLinkWarning = signal<string | null>(null);

  readonly documentTemplateOptions = signal<{ label: string; value: string }[]>(
    []
  );
  readonly procedureDetailRows = signal<ProcedureDetailTableRow[]>([]);
  readonly procedureDocumentTemplatesError = signal<string | null>(null);
  readonly procedureDocumentDetailsWarning = signal<string | null>(null);
  readonly procedureDetailsLoading = signal(false);
  /** Mensaje de validación al pulsar «Agregar» en detalles (no confundir con error de guardado). */
  readonly procedureDetailDraftError = signal<string | null>(null);

  /** Nombre del campo de fila para el checkbox "Obligatorio" (template). */
  readonly procedureReqObligatorioField = PROCEDURE_REQ_OBLIGATORIO_FIELD;

  onProcedureRequirementSelectionChange(
    rows: Record<string, unknown>[] | null
  ): void {
    const selectedSet = new Set((rows ?? []).map((r) => String(r['id'])));
    this.procedureRequirementRows.update((all) => {
      for (const r of all) {
        if (!selectedSet.has(String(r['id']))) {
          r[PROCEDURE_REQ_OBLIGATORIO_FIELD] = false;
        }
      }
      return [...all];
    });
    this.selectedProcedureRequirements.set(rows ?? []);
  }

  onRequirementObligatorioChange(payload: {
    row: Record<string, unknown>;
    value: boolean;
  }): void {
    payload.row[PROCEDURE_REQ_OBLIGATORIO_FIELD] = payload.value;
    this.procedureRequirementRows.update((rows) => [...rows]);
  }

  onRequirementTitleSearchInput(event: Event): void {
    const v = (event.target as HTMLInputElement | null)?.value ?? '';
    this.requirementTitleSearch.set(v);
  }

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

  get legalBasisCtrl() {
    return this.form.controls.legal_basis;
  }

  get descriptionCtrl() {
    return this.form.controls.description;
  }

  get notesCtrl() {
    return this.form.controls.notes;
  }

  get serviceTypeCtrl() {
    return this.form.controls.service_type_id;
  }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  get activeSwitchInitial(): boolean {
    return this.form.controls.is_active.getRawValue();
  }

  get umaRelatedSwitchInitial(): boolean {
    return this.form.controls.is_uma_related.getRawValue();
  }

  onActiveChange(checked: boolean): void {
    this.form.controls.is_active.setValue(checked);
  }

  onUmaRelatedChange(checked: boolean): void {
    this.form.controls.is_uma_related.setValue(checked);
    this.syncUmaLimitScopeControl();
  }

  /** Muestra el grupo solo si `is_uma_related` (template). */
  get showUmaLimitScope(): boolean {
    return this.form.controls.is_uma_related.getRawValue() === true;
  }

  get umaLimitScopeCtrl() {
    return this.form.controls.uma_limit_scope;
  }

  private syncUmaLimitScopeControl(): void {
    const isUma = this.form.controls.is_uma_related.getRawValue();
    const scopeCtrl = this.form.controls.uma_limit_scope;
    if (!isUma) {
      scopeCtrl.setValue(null, { emitEvent: false });
      scopeCtrl.clearValidators();
    } else {
      scopeCtrl.setValidators([Validators.required]);
      const v = scopeCtrl.value;
      if (v !== 'asignados' && v !== 'tecnicos') {
        scopeCtrl.setValue('tecnicos', { emitEvent: false });
      }
    }
    scopeCtrl.updateValueAndValidity({ emitEvent: false });
  }

  onNameChange(value: string | number): void {
    this.nameCtrl.setValue(String(value));
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.form.reset({
      name: '',
      legal_basis: '',
      description: '',
      notes: '',
      service_type_id: '',
      is_uma_related: false,
      uma_limit_scope: null,
      is_active: true,
    });
    this.syncUmaLimitScopeControl();
    this.resetProcedureDetailsUi();

    const clientId = this.clientId;
    if (!clientId) {
      if (seq === this.routeHandleSeq) {
        this.formUiReady.set(true);
        this.procedureRequirementRows.set([]);
        this.selectedProcedureRequirements.set([]);
        this.procedureRequirementsError.set(null);
        this.procedureRequirementsLinkWarning.set(null);
        this.procedureRequirementsLoading.set(false);
      }
      return;
    }

    this.recordLoading.set(true);
    const { data: types, error: typesErr } =
      await this.serviceTypesApi.listByClientId(clientId);
    this.recordLoading.set(false);

    if (seq !== this.routeHandleSeq) {
      return;
    }

    if (typesErr) {
      this.editLoadError.set(
        'No se pudieron cargar los tipos de trámite. No se puede continuar.'
      );
      this.procedureRequirementRows.set([]);
      this.selectedProcedureRequirements.set([]);
      this.procedureDetailRows.set([]);
      return;
    }

    this.typeOptions.set(
      (types ?? []).map((t) => ({ label: t.name, value: t.id }))
    );

    if (id == null || id === '') {
      this.formUiReady.set(true);
      void this.loadProcedureRequirementsAndDetails(clientId, null, seq);
      return;
    }

    this.recordLoading.set(true);
    const { data, error } = await this.proceduresApi.getByIdForClient(
      id,
      clientId
    );
    this.recordLoading.set(false);

    if (seq !== this.routeHandleSeq) {
      return;
    }

    if (error) {
      this.editLoadError.set(mapLoadError(error));
      return;
    }
    if (!data) {
      this.editLoadError.set(
        'No se encontró el registro o no pertenece a tu cliente.'
      );
      return;
    }

    const isUma = data.is_uma_related === true;
    let umaScope = parseUmaLimitScope(data.uma_limit_scope);
    if (isUma && umaScope == null) {
      umaScope = 'tecnicos';
    }

    this.form.patchValue({
      name: data.name,
      legal_basis: data.legal_basis ?? '',
      description: data.description ?? '',
      notes: data.notes ?? '',
      service_type_id: data.service_type_id,
      is_uma_related: isUma,
      uma_limit_scope: isUma ? umaScope : null,
      is_active: data.is_active,
    });
    this.syncUmaLimitScopeControl();
    this.formUiReady.set(true);
    void this.loadProcedureRequirementsAndDetails(clientId, id, seq);
  }

  private resetProcedureDetailsUi(): void {
    this.detailDraftForm.reset({
      valid_from: null,
      valid_to: null,
      document_template_id: '',
      detail_type: '',
    });
    this.documentTemplateOptions.set([]);
    this.procedureDetailRows.set([]);
    this.procedureDocumentTemplatesError.set(null);
    this.procedureDocumentDetailsWarning.set(null);
    this.procedureDetailsLoading.set(false);
    this.procedureDetailDraftError.set(null);
  }

  private async loadProcedureRequirementsAndDetails(
    clientId: string,
    serviceId: string | null,
    seq: number
  ): Promise<void> {
    await Promise.all([
      this.loadProcedureRequirementsPicker(clientId, serviceId, seq),
      this.loadProcedureDetailsPanel(clientId, serviceId, seq),
    ]);
  }

  private async loadProcedureDetailsPanel(
    clientId: string,
    serviceId: string | null,
    seq: number
  ): Promise<void> {
    this.procedureDetailsLoading.set(true);
    this.procedureDocumentTemplatesError.set(null);
    this.procedureDocumentDetailsWarning.set(null);

    const templatesPromise = this.documentTemplatesApi.listByClientId(clientId);
    const detailsPromise =
      serviceId != null && serviceId !== ''
        ? this.serviceDocumentDetailsApi.listLinkedToService(serviceId)
        : Promise.resolve({
            data: [] as ServiceDocumentDetailLinkedRow[],
            error: null,
          });

    const [tplRes, detRes] = await Promise.all([
      templatesPromise,
      detailsPromise,
    ]);

    if (seq !== this.routeHandleSeq) {
      return;
    }

    this.procedureDetailsLoading.set(false);

    if (tplRes.error) {
      this.procedureDocumentTemplatesError.set(
        mapDocumentTemplatesLoadError(tplRes.error)
      );
      this.documentTemplateOptions.set([]);
      this.procedureDetailRows.set([]);
      return;
    }

    this.documentTemplateOptions.set(
      (tplRes.data ?? []).map((t) => ({ label: t.name, value: t.id }))
    );

    let detailRows = detRes.data ?? [];
    if (serviceId && detRes.error) {
      if (isRecoverableLinkedAssociationsLoadError(detRes.error)) {
        this.procedureDocumentDetailsWarning.set(
          'No se pudieron cargar los detalles guardados de este tr\u00e1mite. Puedes volver a definirlos y guardar.'
        );
        detailRows = [];
      } else {
        this.procedureDocumentTemplatesError.set(
          mapProcedureDocumentDetailsLoadError(detRes.error)
        );
        this.procedureDetailRows.set([]);
        return;
      }
    }

    const mapped: ProcedureDetailTableRow[] = [];
    for (const row of detailRows) {
      const m = this.mapLinkedDetailToTableRow(row);
      if (m) {
        mapped.push(m);
      }
    }
    this.procedureDetailRows.set(mapped);
  }

  private mapLinkedDetailToTableRow(
    row: ServiceDocumentDetailLinkedRow
  ): ProcedureDetailTableRow | null {
    if (!isValidServiceDocumentDetailType(row.detail_type)) {
      return null;
    }
    const dt = row.document_templates;
    const tpl = Array.isArray(dt) ? dt[0] : dt;
    const name = tpl?.name?.trim() ? tpl.name : '\u2014';
    return {
      id: row.id,
      document_template_id: row.document_template_id,
      template_name: name,
      detail_type: row.detail_type,
      valid_from: row.valid_from,
      valid_to: row.valid_to,
    };
  }

  detailTypeLabel(t: ServiceDocumentDetailType): string {
    const o = PROCEDURE_DETAIL_TYPE_OPTIONS.find((x) => x.value === t);
    return o?.label ?? t;
  }

  formatDetailDate(isoDate: string): string {
    return formatDbDateMexico(`${isoDate}T12:00:00`);
  }

  addProcedureDetailRow(): void {
    this.procedureDetailDraftError.set(null);
    const draft = this.detailDraftForm.getRawValue();
    const from = draft.valid_from;
    const to = draft.valid_to;
    const templateId = String(draft.document_template_id ?? '').trim();
    const detailType = draft.detail_type;

    if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
      this.procedureDetailDraftError.set(
        'Indica la fecha de inicio de vigencia.'
      );
      return;
    }
    if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
      this.procedureDetailDraftError.set('Indica la fecha de fin de vigencia.');
      return;
    }
    if (templateId === '') {
      this.procedureDetailDraftError.set('Selecciona una plantilla.');
      return;
    }
    if (!detailType || !isValidServiceDocumentDetailType(detailType)) {
      this.procedureDetailDraftError.set('Selecciona un tipo de documento.');
      return;
    }

    const validFrom = toIsoDateLocal(from);
    const validTo = toIsoDateLocal(to);
    if (validTo < validFrom) {
      this.procedureDetailDraftError.set(
        'La fecha de fin de vigencia no puede ser anterior a la de inicio.'
      );
      return;
    }

    const opt = this.documentTemplateOptions().find(
      (o) => o.value === templateId
    );
    const templateName = opt?.label?.trim() ? opt.label : '\u2014';

    this.procedureDetailRows.update((rows) => [
      ...rows,
      {
        id: globalThis.crypto.randomUUID(),
        document_template_id: templateId,
        template_name: templateName,
        detail_type: detailType,
        valid_from: validFrom,
        valid_to: validTo,
      },
    ]);
    this.procedureDetailDraftError.set(null);
    this.clearProcedureDetailDraft();
  }

  clearProcedureDetailDraft(): void {
    this.procedureDetailDraftError.set(null);
    this.detailDraftForm.reset({
      valid_from: null,
      valid_to: null,
      document_template_id: '',
      detail_type: '',
    });
  }

  removeProcedureDetailRow(rowId: string): void {
    this.procedureDetailRows.update((rows) =>
      rows.filter((r) => r.id !== rowId)
    );
  }

  private orderedProcedureDetailPayload(): {
    document_template_id: string;
    detail_type: ServiceDocumentDetailType;
    valid_from: string;
    valid_to: string;
  }[] {
    return this.procedureDetailRows().map((r) => ({
      document_template_id: r.document_template_id,
      detail_type: r.detail_type,
      valid_from: r.valid_from,
      valid_to: r.valid_to,
    }));
  }

  private toRequirementTableRow(
    row: RequirementRow,
    obligatorio = false
  ): Record<string, unknown> {
    return {
      id: row.id,
      title: row.title,
      file_type: row.file_type || '\u2014',
      is_active: row.is_active ? 'S\u00ed' : 'No',
      is_active_sort: row.is_active ? 1 : 0,
      updated_at: formatDbDateTimeMexico(row.updated_at),
      updated_at_date: dateForMexicoCalendarFilter(row.updated_at),
      updated_at_sort: dbInstantToSortTimestamp(row.updated_at),
      [PROCEDURE_REQ_OBLIGATORIO_FIELD]: obligatorio,
    };
  }

  private async loadProcedureRequirementsPicker(
    clientId: string,
    serviceId: string | null,
    seq: number
  ): Promise<void> {
    this.procedureRequirementsLoading.set(true);
    this.procedureRequirementsError.set(null);
    this.procedureRequirementsLinkWarning.set(null);
    this.selectedProcedureRequirements.set([]);
    this.requirementTitleSearch.set('');

    const catalogPromise = this.requirementsApi.listByClientId(clientId);
    const linkedPromise =
      serviceId != null && serviceId !== ''
        ? this.requirementsApi.listLinkedToService(serviceId)
        : Promise.resolve({
            data: [] as ServiceRequirementLinkedRow[],
            error: null,
          });

    const [catalogRes, linkedRes] = await Promise.all([
      catalogPromise,
      linkedPromise,
    ]);

    if (seq !== this.routeHandleSeq) {
      return;
    }

    this.procedureRequirementsLoading.set(false);

    if (catalogRes.error) {
      this.procedureRequirementsError.set(
        mapRequirementCatalogLoadError(catalogRes.error)
      );
      this.procedureRequirementRows.set([]);
      return;
    }

    let linkedRows = linkedRes.data ?? [];
    if (serviceId && linkedRes.error) {
      if (isRecoverableLinkedAssociationsLoadError(linkedRes.error)) {
        this.procedureRequirementsLinkWarning.set(
          'No se pudieron cargar los requisitos ya vinculados a este tr\u00e1mite (base de datos o configuraci\u00f3n). Puedes seleccionar requisitos en la tabla y guardar; si el guardado falla, contacta al administrador.'
        );
        linkedRows = [];
      } else {
        this.procedureRequirementsError.set(
          mapProcedureRequirementsError(linkedRes.error)
        );
        this.procedureRequirementRows.set([]);
        return;
      }
    }

    const linkedById = new Map<string, boolean>();
    for (const link of linkedRows) {
      linkedById.set(link.catalog.id, link.is_required);
    }

    const rows = (catalogRes.data ?? []).map((row) =>
      this.toRequirementTableRow(row, linkedById.get(row.id) === true)
    );
    this.procedureRequirementRows.set(rows);

    const selected = rows.filter((r) => linkedById.has(String(r['id'])));
    this.selectedProcedureRequirements.set(selected);
  }

  /** Orden para `sort_order`: el del listado del catálogo (p. ej. por título). */
  private orderedSelectedRequirementLinks(): {
    requirement_id: string;
    is_required: boolean;
  }[] {
    const selected = new Set(
      this.selectedProcedureRequirements().map((r) => String(r['id']))
    );
    const out: { requirement_id: string; is_required: boolean }[] = [];
    for (const row of this.procedureRequirementRows()) {
      const id = String(row['id']);
      if (selected.has(id)) {
        out.push({
          requirement_id: id,
          is_required: row[PROCEDURE_REQ_OBLIGATORIO_FIELD] === true,
        });
      }
    }
    return out;
  }

  async onSubmit(): Promise<void> {
    this.submitError.set(null);

    const nameVal = String(this.nameCtrl.value ?? '').trim();
    this.nameCtrl.setValue(nameVal);
    const legalBasisVal = String(this.legalBasisCtrl.value ?? '').trim();
    this.legalBasisCtrl.setValue(legalBasisVal);
    const descVal = String(this.descriptionCtrl.value ?? '').trim();
    this.descriptionCtrl.setValue(descVal);
    /** BD: `services.description` es NOT NULL; cadena vacía si el usuario no escribe nada. */
    const description = descVal;

    const notesVal = String(this.notesCtrl.value ?? '').trim();
    this.notesCtrl.setValue(notesVal);
    const notes = notesVal === '' ? null : notesVal;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const clientId = this.clientId;
    if (!clientId) {
      this.submitError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede guardar.'
      );
      return;
    }

    const serviceTypeId = this.serviceTypeCtrl.value;
    if (!serviceTypeId) {
      this.form.markAllAsTouched();
      return;
    }

    const rowId = this.editId();
    const editing = rowId != null && rowId !== '';

    this.spinner.show('global');
    this.submitting.set(true);
    try {
      const isUmaRelated = this.form.controls.is_uma_related.getRawValue();
      const isActive = this.form.controls.is_active.getRawValue();
      const umaLimitScope: UmaLimitScope | null = isUmaRelated
        ? this.form.controls.uma_limit_scope.getRawValue()
        : null;

      const result = editing
        ? await this.proceduresApi.updateForClient(rowId, clientId, {
            name: nameVal,
            legal_basis: legalBasisVal,
            description,
            notes,
            is_uma_related: isUmaRelated,
            uma_limit_scope: umaLimitScope,
            is_active: isActive,
            service_type_id: serviceTypeId,
          })
        : await this.proceduresApi.insert({
            name: nameVal,
            legal_basis: legalBasisVal,
            description,
            notes,
            is_uma_related: isUmaRelated,
            uma_limit_scope: umaLimitScope,
            is_active: isActive,
            service_type_id: serviceTypeId,
            client_id: clientId,
          });
      if (result.error) {
        this.submitError.set(
          mapSaveError(result.error, editing ? 'update' : 'insert')
        );
        return;
      }

      const saved = result.data;
      const serviceId = editing ? rowId! : saved?.id ?? null;
      if (!serviceId) {
        this.submitError.set(
          'El tr\u00e1mite se guard\u00f3 pero no se obtuvo su identificador. No se pudieron asociar los requisitos.'
        );
        return;
      }

      const requirementLinks = this.orderedSelectedRequirementLinks();
      const { error: linkErr } =
        await this.requirementsApi.replaceLinksForService(
          serviceId,
          requirementLinks
        );
      if (linkErr) {
        this.submitError.set(mapReplaceLinksError(linkErr));
        return;
      }

      const detailPayload = this.orderedProcedureDetailPayload();
      const { error: docDetErr } =
        await this.serviceDocumentDetailsApi.replaceForService(
          serviceId,
          detailPayload
        );
      if (docDetErr) {
        this.submitError.set(mapReplaceDocumentDetailsError(docDetErr));
        return;
      }

      await this.router.navigate(['/catalog/procedures']);
    } finally {
      this.submitting.set(false);
      this.spinner.hide('global');
    }
  }

  nameHint(): string | undefined {
    const c = this.nameCtrl;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'El nombre es obligatorio.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${NAME_MAX} caracteres.`;
    }
    return undefined;
  }

  legalBasisHint(): string | undefined {
    const c = this.legalBasisCtrl;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'El fundamento jurídico es obligatorio.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${LEGAL_BASIS_MAX} caracteres.`;
    }
    return undefined;
  }

  descHint(): string | undefined {
    const c = this.descriptionCtrl;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${DESC_MAX} caracteres.`;
    }
    return undefined;
  }

  notesHint(): string | undefined {
    const c = this.notesCtrl;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${NOTES_MAX} caracteres.`;
    }
    return undefined;
  }

  serviceTypeInvalid(): boolean {
    const c = this.serviceTypeCtrl;
    return c.invalid && c.touched;
  }
}

function parseUmaLimitScope(
  raw: string | null | undefined
): UmaLimitScope | null {
  return raw === 'asignados' || raw === 'tecnicos' ? raw : null;
}

function isValidServiceDocumentDetailType(
  v: string
): v is ServiceDocumentDetailType {
  return (
    v === 'caratula' ||
    v === 'resolutivo_aprobado' ||
    v === 'resolutivo_rechazado' ||
    v === 'resolutivo_suspendido'
  );
}

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapDocumentTemplatesLoadError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver las plantillas de documento.';
  }
  return (
    err.message ||
    'No se pudieron cargar las plantillas de documento de tu cliente.'
  );
}

function mapProcedureDocumentDetailsLoadError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver los detalles del tr\u00e1mite.';
  }
  return (
    err.message || 'No se pudieron cargar los detalles guardados del tr\u00e1mite.'
  );
}

function mapReplaceDocumentDetailsError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para guardar los detalles del tr\u00e1mite.';
  }
  if (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    err.code === '42P01'
  ) {
    return 'No se pueden guardar los detalles del tr\u00e1mite: falta crear la tabla en la base de datos. Contacta al administrador.';
  }
  if (err.code === '23503' || msg.includes('foreign key')) {
    return 'Alguna plantilla ya no existe o el tr\u00e1mite no es v\u00e1lido. Recarga la p\u00e1gina e int\u00e9ntalo de nuevo.';
  }
  if (msg.includes('check') || err.code === '23514') {
    return 'Los datos de detalle no cumplen las reglas del sistema (fechas o tipo). Revisa el formulario.';
  }
  return err.message || 'No se pudieron guardar los detalles del tr\u00e1mite.';
}

function mapRequirementCatalogLoadError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver el cat\u00e1logo de requisitos.';
  }
  return (
    err.message ||
    'No se pudieron cargar los requisitos del cat\u00e1logo de tu cliente.'
  );
}

function mapReplaceLinksError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para asociar requisitos al tr\u00e1mite.';
  }
  if (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    err.code === '42P01'
  ) {
    return 'No se pueden guardar las asociaciones de requisitos: el sistema necesita una actualización. Contacta al administrador.';
  }
  if (err.code === '23503' || msg.includes('foreign key')) {
    return 'Algunos requisitos ya no existen o el tr\u00e1mite no es v\u00e1lido. Recarga la p\u00e1gina e int\u00e9ntalo de nuevo.';
  }
  return err.message || 'No se pudieron guardar los requisitos del tr\u00e1mite.';
}

function mapProcedureRequirementsError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver los requisitos vinculados.';
  }
  if (isRecoverableLinkedAssociationsLoadError(err)) {
    return 'No se pueden cargar las asociaciones de requisitos: el sistema necesita una actualización. Contacta al administrador.';
  }
  return err.message || 'No se pudieron cargar los requisitos del trámite.';
}

/**
 * Errores de esquema / tabla / embed de PostgREST donde aún tiene sentido mostrar el catálogo.
 * No incluye RLS ni permisos explícitos.
 */
function isRecoverableLinkedAssociationsLoadError(err: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return false;
  }
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find a relationship') ||
    msg.includes('relation') ||
    err.code === '42P01' ||
    err.code === 'PGRST205'
  );
}

function mapLoadError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver este trámite.';
  }
  return err.message || 'No se pudo cargar el registro.';
}

function mapSaveError(
  err: { message?: string; code?: string },
  mode: 'insert' | 'update'
): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';

  if (msg.includes('permission denied') || msg.includes('rls')) {
    return mode === 'update'
      ? 'No tienes permiso para actualizar este trámite.'
      : 'No tienes permiso para crear trámites.';
  }
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe un registro que entra en conflicto (duplicado).';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'El trámite no es válido o no pertenece a tu cliente.';
  }
  if (mode === 'update' && (code === 'PGRST116' || msg.includes('0 rows'))) {
    return 'No se pudo actualizar: el registro no existe o no tienes acceso.';
  }
  return err.message || 'No se pudo guardar el registro.';
}
