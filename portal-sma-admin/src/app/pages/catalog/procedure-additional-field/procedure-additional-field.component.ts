import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  DataTableComponent,
  type DataTableColumn,
  type DataTableRowAction,
} from '../../../shared/components/ui/data-table/data-table.component';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ProceduresService,
  procedureServiceTypeName,
  type ProcedureRow,
} from '../../../core/services/procedures.service';
import { ServiceAdditionalFieldsService } from '../../../core/services/service-additional-fields.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { TextAreaComponent } from '../../../shared/components/form/input/text-area.component';

const NAME_MAX = 500;
const DESC_MAX = 2000;
const EXCEL_COL_MAX = 8;

@Component({
  selector: 'app-procedure-additional-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DataTableComponent,
    ButtonModule,
    ConfirmDialogModule,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
  ],
  templateUrl: './procedure-additional-field.component.html',
  styleUrl: './procedure-additional-field.component.css',
  providers: [ConfirmationService],
})
export class ProcedureAdditionalFieldComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly proceduresApi = inject(ProceduresService);
  private readonly fieldsApi = inject(ServiceAdditionalFieldsService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly nameMaxLength = NAME_MAX;
  readonly descMaxLength = DESC_MAX;

  /**
   * Misma lógica que el catálogo de trámites: filtro «Tipo de trámite» como `p-select`
   * con opciones deducidas de las filas cargadas.
   */
  readonly procedureColumns = computed<DataTableColumn[]>(() => {
    const rows = this.procedureRows();
    const typeNames = new Set<string>();
    for (const r of rows) {
      const n = String(r['service_type_name'] ?? '').trim();
      if (n !== '' && n !== '—') {
        typeNames.add(n);
      }
    }
    const sortedTypes = [...typeNames].sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
    const serviceTypeSelectOptions = sortedTypes.map((name) => ({
      label: name,
      value: name,
    }));

    return [
      {
        field: 'name',
        header: 'Nombre',
        filter: { type: 'text', placeholder: 'Buscar por nombre…' },
      },
      {
        field: 'service_type_name',
        header: 'Tipo de trámite',
        sortField: 'service_type_sort',
        filter: {
          type: 'select',
          placeholder: 'Todos',
          matchMode: 'equals',
          selectOptions: serviceTypeSelectOptions,
        },
      },
      {
        field: 'description',
        header: 'Descripción',
        sortable: false,
        filter: { type: 'text', placeholder: 'Buscar en descripción…' },
      },
    ];
  });

  readonly fieldColumns: DataTableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: false },
    { field: 'description', header: 'Descripción', sortable: false },
    { field: 'is_date_label', header: '¿Es fecha?', sortable: false },
    { field: 'is_required_label', header: '¿Es obligatorio?', sortable: false },
  ];

  readonly fieldRowActions: DataTableRowAction[] = [
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      severity: 'danger',
      command: (row: Record<string, unknown>) => {
        this.requestDeleteField(row);
      },
    },
  ];

  readonly loadingProcedures = signal(false);
  readonly loadProceduresError = signal<string | null>(null);
  readonly procedureRows = signal<Record<string, unknown>[]>([]);

  readonly selectedProcedure = signal<{ id: string; name: string } | null>(
    null
  );

  readonly loadingFields = signal(false);
  readonly loadFieldsError = signal<string | null>(null);
  readonly fieldRows = signal<Record<string, unknown>[]>([]);

  readonly savingField = signal(false);
  readonly fieldFormError = signal<string | null>(null);

  readonly fieldForm = this.fb.group({
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
    is_date: this.fb.nonNullable.control(false),
    is_required: this.fb.nonNullable.control(false),
    excel_column: [
      '',
      [
        Validators.required,
        Validators.maxLength(EXCEL_COL_MAX),
        Validators.pattern(/^[A-Za-z]+$/),
      ],
    ],
  });

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  async ngOnInit(): Promise<void> {
    await this.loadProcedures();
  }

  onProcedureRowClick(row: Record<string, unknown>): void {
    const id = row['id'];
    const name = String(row['name'] ?? '').trim() || '(sin nombre)';
    if (id == null || id === '') {
      return;
    }
    this.selectedProcedure.set({ id: String(id), name });
    this.fieldFormError.set(null);
    this.loadFieldsError.set(null);
    void this.loadFieldsForSelected();
  }

  clearProcedureSelection(): void {
    this.selectedProcedure.set(null);
    this.fieldRows.set([]);
    this.loadFieldsError.set(null);
    this.clearFieldForm();
  }

  onFieldNameChange(v: string | number): void {
    this.fieldForm.controls.name.setValue(String(v));
  }

  onFieldDescriptionChange(v: string): void {
    this.fieldForm.controls.description.setValue(v);
  }

  onExcelColumnChange(v: string | number): void {
    this.fieldForm.controls.excel_column.setValue(String(v));
  }

  clearFieldForm(): void {
    this.fieldForm.reset({
      name: '',
      description: '',
      is_date: false,
      is_required: false,
      excel_column: '',
    });
    this.fieldForm.markAsUntouched();
    this.fieldFormError.set(null);
  }

  async submitFieldForm(): Promise<void> {
    this.fieldFormError.set(null);
    const sel = this.selectedProcedure();
    if (!sel) {
      return;
    }

    const name = String(this.fieldForm.controls.name.value ?? '').trim();
    const desc = String(this.fieldForm.controls.description.value ?? '').trim();
    const excel = String(this.fieldForm.controls.excel_column.value ?? '')
      .trim()
      .toUpperCase();

    this.fieldForm.controls.name.setValue(name);
    this.fieldForm.controls.description.setValue(desc);
    this.fieldForm.controls.excel_column.setValue(excel);

    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }

    const clientId = this.clientId;
    if (!clientId) {
      this.fieldFormError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede guardar.'
      );
      return;
    }

    const nextOrder = this.fieldRows().length;

    this.savingField.set(true);
    const { error } = await this.fieldsApi.insert({
      service_id: sel.id,
      name,
      description: desc,
      is_date: this.fieldForm.controls.is_date.value,
      is_required: this.fieldForm.controls.is_required.value,
      excel_column: excel,
      sort_order: nextOrder,
    });
    this.savingField.set(false);

    if (error) {
      this.fieldFormError.set(mapFieldSaveError(error));
      return;
    }

    this.clearFieldForm();
    await this.loadFieldsForSelected();
  }

  async refreshProcedures(): Promise<void> {
    await this.loadProcedures();
  }

  private async loadProcedures(): Promise<void> {
    this.loadProceduresError.set(null);
    const clientId = this.clientId;
    if (!clientId) {
      this.loadProceduresError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.procedureRows.set([]);
      return;
    }

    this.loadingProcedures.set(true);
    const { data, error } = await this.proceduresApi.listByClientId(clientId);
    this.loadingProcedures.set(false);

    if (error) {
      this.loadProceduresError.set(
        error.message || 'No se pudo cargar la lista de trámites.'
      );
      this.procedureRows.set([]);
      return;
    }

    this.procedureRows.set(
      data.map((row: ProcedureRow) => {
        const typeName = procedureServiceTypeName(row);
        return {
          id: row.id,
          name: row.name,
          service_type_name: typeName,
          service_type_sort:
            typeName === '—' ? '\uffff' : typeName.toLowerCase(),
          description: formatDescriptionCell(row.description),
        };
      })
    );

    const sel = this.selectedProcedure();
    if (sel && !data.some((r) => r.id === sel.id)) {
      this.clearProcedureSelection();
    }
  }

  private async loadFieldsForSelected(): Promise<void> {
    const sel = this.selectedProcedure();
    if (!sel) {
      this.fieldRows.set([]);
      return;
    }

    this.loadFieldsError.set(null);
    this.loadingFields.set(true);
    const { data, error } = await this.fieldsApi.listByServiceId(sel.id);
    this.loadingFields.set(false);

    if (error) {
      this.loadFieldsError.set(
        error.message?.includes('does not exist') || error.code === '42P01'
          ? 'Falta la tabla service_additional_fields. Aplica la migración en Supabase.'
          : error.message || 'No se pudieron cargar los campos.'
      );
      this.fieldRows.set([]);
      return;
    }

    this.fieldRows.set(
      data.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        is_date_label: r.is_date ? 'Sí' : 'No',
        is_required_label: r.is_required ? 'Sí' : 'No',
      }))
    );
  }

  private requestDeleteField(row: Record<string, unknown>): void {
    const id = row['id'];
    const name = String(row['name'] ?? '').trim() || '(sin nombre)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar el campo «${name}»?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteField(String(id));
      },
    });
  }

  private async deleteField(id: string): Promise<void> {
    this.loadFieldsError.set(null);
    const { error } = await this.fieldsApi.deleteById(id);
    if (error) {
      this.loadFieldsError.set(
        error.message || 'No se pudo eliminar el campo.'
      );
      return;
    }
    await this.loadFieldsForSelected();
  }

  fieldNameHint(): string | undefined {
    const c = this.fieldForm.controls.name;
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

  fieldDescriptionHint(): string {
    const c = this.fieldForm.controls.description;
    if (!c.touched && !c.dirty) {
      return '';
    }
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'La descripción es obligatoria.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${DESC_MAX} caracteres.`;
    }
    return '';
  }

  excelColumnHint(): string | undefined {
    const c = this.fieldForm.controls.excel_column;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('required')) {
      return 'Indica la letra(s) de columna en Excel (p. ej. A o AB).';
    }
    if (c.hasError('pattern')) {
      return 'Solo letras, sin espacios (p. ej. A, B, AA).';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${EXCEL_COL_MAX} caracteres.`;
    }
    return undefined;
  }
}

function formatDescriptionCell(text: string | null | undefined): string {
  if (text == null) {
    return '—';
  }
  const t = text.trim();
  return t === '' ? '—' : t;
}

function mapFieldSaveError(err: {
  message?: string;
  code?: string;
}): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';
  if (
    code === '23505' ||
    msg.includes('duplicate') ||
    msg.includes('unique')
  ) {
    return 'Ya existe un campo con el mismo nombre o la misma columna de Excel para este trámite.';
  }
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para guardar campos en este trámite.';
  }
  if (msg.includes('does not exist') || code === '42P01') {
    return 'Falta la tabla service_additional_fields. Aplica la migración en Supabase.';
  }
  return err.message || 'No se pudo guardar el campo.';
}
