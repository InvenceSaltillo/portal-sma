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
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SwitchComponent } from '../../../shared/components/form/input/switch.component';

const NAME_MAX = 255;
const DESC_MAX = 4000;
const NOTES_MAX = 4000;

/** Campo en filas de la tabla de requisitos del trámite (checkbox Obligatorio). */
const PROCEDURE_REQ_OBLIGATORIO_FIELD = '_obligatorio';

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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private routeHandleSeq = 0;

  readonly nameMaxLength = NAME_MAX;
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
    description: ['', [Validators.maxLength(DESC_MAX)]],
    notes: ['', [Validators.maxLength(NOTES_MAX)]],
    service_type_id: ['', Validators.required],
    is_uma_related: this.fb.nonNullable.control(false),
    uma_limit_scope: this.fb.control<UmaLimitScope | null>(null),
    is_active: this.fb.nonNullable.control(true),
  });

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
      return 'No hay requisitos en el catálogo de tu cliente. Crea entradas en Requisitos antes de asociarlas aqu?.';
    }
    if (filtered === 0 && q !== '') {
      return 'Ning?n requisito coincide con la b?squeda.';
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
      description: '',
      notes: '',
      service_type_id: '',
      is_uma_related: false,
      uma_limit_scope: null,
      is_active: true,
    });
    this.syncUmaLimitScopeControl();

    const clientId = this.clientId;
    if (!clientId) {
      if (seq === this.routeHandleSeq) {
        this.formUiReady.set(true);
        this.procedureRequirementRows.set([]);
        this.selectedProcedureRequirements.set([]);
        this.procedureRequirementsError.set(null);
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
      return;
    }

    this.typeOptions.set(
      (types ?? []).map((t) => ({ label: t.name, value: t.id }))
    );

    if (id == null || id === '') {
      this.formUiReady.set(true);
      void this.loadProcedureRequirementsPicker(clientId, null, seq);
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
      description: data.description ?? '',
      notes: data.notes ?? '',
      service_type_id: data.service_type_id,
      is_uma_related: isUma,
      uma_limit_scope: isUma ? umaScope : null,
      is_active: data.is_active,
    });
    this.syncUmaLimitScopeControl();
    this.formUiReady.set(true);
    void this.loadProcedureRequirementsPicker(clientId, id, seq);
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

    if (serviceId && linkedRes.error) {
      this.procedureRequirementsError.set(
        mapProcedureRequirementsError(linkedRes.error)
      );
      this.procedureRequirementRows.set([]);
      return;
    }

    const linkedById = new Map<string, boolean>();
    for (const link of linkedRes.data ?? []) {
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

    this.submitting.set(true);
    const isUmaRelated = this.form.controls.is_uma_related.getRawValue();
    const isActive = this.form.controls.is_active.getRawValue();
    const umaLimitScope: UmaLimitScope | null = isUmaRelated
      ? this.form.controls.uma_limit_scope.getRawValue()
      : null;

    const result = editing
      ? await this.proceduresApi.updateForClient(rowId, clientId, {
          name: nameVal,
          description,
          notes,
          is_uma_related: isUmaRelated,
          uma_limit_scope: umaLimitScope,
          is_active: isActive,
          service_type_id: serviceTypeId,
        })
      : await this.proceduresApi.insert({
          name: nameVal,
          description,
          notes,
          is_uma_related: isUmaRelated,
          uma_limit_scope: umaLimitScope,
          is_active: isActive,
          service_type_id: serviceTypeId,
          client_id: clientId,
        });
    if (result.error) {
      this.submitting.set(false);
      this.submitError.set(
        mapSaveError(result.error, editing ? 'update' : 'insert')
      );
      return;
    }

    const saved = result.data;
    const serviceId = editing ? rowId! : saved?.id ?? null;
    if (!serviceId) {
      this.submitting.set(false);
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
    this.submitting.set(false);
    if (linkErr) {
      this.submitError.set(mapReplaceLinksError(linkErr));
      return;
    }

    await this.router.navigate(['/catalog/procedures']);
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
  if (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    err.code === '42P01'
  ) {
    return 'No se pueden cargar las asociaciones de requisitos: el sistema necesita una actualización. Contacta al administrador.';
  }
  return err.message || 'No se pudieron cargar los requisitos del trámite.';
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
