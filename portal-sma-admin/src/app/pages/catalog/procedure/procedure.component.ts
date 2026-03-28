import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  umaLimitScopeLabel,
  type ProcedureRow,
} from '../../../core/services/procedures.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-procedure',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink, ConfirmDialogModule],
  templateUrl: './procedure.component.html',
  styleUrl: './procedure.component.css',
  providers: [ConfirmationService],
})
export class ProcedureComponent implements OnInit {
  private readonly proceduresApi = inject(ProceduresService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly procedureRowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate([
            '/catalog/procedures',
            String(id),
            'edit',
          ]);
        }
      },
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      severity: 'danger',
      command: (row: Record<string, unknown>) => {
        this.requestDeleteProcedure(row);
      },
    },
  ];

  /**
   * Opciones del filtro «Tipo de trámite»: solo nombres que aparecen en la lista cargada
   * (no incluye tipos del catálogo sin trámites en pantalla).
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
        headerClass: 'min-w-[34rem]',
        cellClass:
          'min-w-[34rem] max-w-[60rem] align-top whitespace-normal break-words',
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
        field: 'legal_basis',
        header: 'Fundamento jurídico',
        sortable: false,
        headerClass: 'min-w-[24rem]',
        cellClass:
          'min-w-[24rem] max-w-[60rem] align-top whitespace-normal break-words',
        filter: { type: 'text', placeholder: 'Buscar en fundamento…' },
      },
      {
        field: 'description',
        header: 'Descripción',
        sortable: false,
        headerClass: 'min-w-[34rem]',
        cellClass:
          'min-w-[34rem] max-w-[60rem] align-top whitespace-normal break-words',
        filter: { type: 'text', placeholder: 'Buscar en descripción…' },
      },
      {
        field: 'notes',
        header: 'Notas',
        sortable: false,
        filter: { type: 'text', placeholder: 'Buscar en notas…' },
      },
      {
        field: 'is_uma_related',
        header: 'UMA',
        sortField: 'is_uma_related_sort',
        filter: {
          type: 'select',
          placeholder: 'Todos',
          matchMode: 'equals',
          selectOptions: [
            { label: 'Sí', value: 'Sí' },
            { label: 'No', value: 'No' },
          ],
        },
      },
      {
        field: 'uma_limit_scope_label',
        header: 'Límite UMA',
        sortField: 'uma_limit_sort',
        filter: {
          type: 'select',
          placeholder: 'Todos',
          matchMode: 'equals',
          selectOptions: [
            { label: 'Asignados', value: 'Asignados' },
            { label: 'Técnicos', value: 'Técnicos' },
            { label: '—', value: '—' },
          ],
        },
      },
      {
        field: 'is_active',
        header: 'Activo',
        sortField: 'is_active_sort',
        filter: {
          type: 'select',
          placeholder: 'Todos',
          matchMode: 'equals',
          selectOptions: [
            { label: 'Sí', value: 'Sí' },
            { label: 'No', value: 'No' },
          ],
        },
      },
      {
        field: 'created_at',
        header: 'Fecha de creación',
        sortField: 'created_at_sort',
        filter: {
          type: 'date',
          field: 'created_at_date',
          placeholder: 'Filtrar por fecha',
        },
      },
      {
        field: 'updated_at',
        header: 'Fecha de actualización',
        sortField: 'updated_at_sort',
        filter: {
          type: 'date',
          field: 'updated_at_date',
          placeholder: 'Filtrar por fecha',
        },
      },
    ];
  });

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly procedureRows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadProcedures();
  }

  async refresh(): Promise<void> {
    await this.loadProcedures();
  }

  private requestDeleteProcedure(row: Record<string, unknown>): void {
    const id = row['id'];
    const name = String(row['name'] ?? '').trim() || '(sin nombre)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar el trámite «${name}»? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteProcedure(String(id));
      },
    });
  }

  private async deleteProcedure(id: string): Promise<void> {
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede eliminar.'
      );
      return;
    }

    this.loadError.set(null);
    this.loading.set(true);
    const { error } = await this.proceduresApi.deleteForClient(id, clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapDeleteError(error));
      return;
    }

    await this.loadProcedures();
  }

  private async loadProcedures(): Promise<void> {
    this.loadError.set(null);
    const user = this.auth.currentUser();
    const clientId = user?.client_id;

    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.procedureRows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.proceduresApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapSupabaseListError(error));
      this.procedureRows.set([]);
      return;
    }

    this.procedureRows.set(
      data.map((row: ProcedureRow) => {
        const typeName = procedureServiceTypeName(row);
        const uma = row.is_uma_related === true;
        const limitLabel = uma ? umaLimitScopeLabel(row.uma_limit_scope) : '—';
        return {
          id: row.id,
          name: row.name,
          service_type_name: typeName,
          service_type_sort: typeName === '—' ? '\uffff' : typeName.toLowerCase(),
          legal_basis: formatDescriptionCell(row.legal_basis),
          description: formatDescriptionCell(row.description),
          notes: formatDescriptionCell(row.notes),
          is_uma_related: uma ? 'Sí' : 'No',
          is_uma_related_sort: uma ? 1 : 0,
          uma_limit_scope_label: limitLabel,
          uma_limit_sort:
            row.uma_limit_scope === 'asignados'
              ? '1'
              : row.uma_limit_scope === 'tecnicos'
                ? '2'
                : uma
                  ? '\uffff'
                  : '0',
          is_active: row.is_active ? 'Sí' : 'No',
          is_active_sort: row.is_active ? 1 : 0,
          created_at: formatDbDateTimeMexico(row.created_at),
          created_at_date: dateForMexicoCalendarFilter(row.created_at),
          created_at_sort: dbInstantToSortTimestamp(row.created_at),
          updated_at: formatDbDateTimeMexico(row.updated_at),
          updated_at_date: dateForMexicoCalendarFilter(row.updated_at),
          updated_at_sort: dbInstantToSortTimestamp(row.updated_at),
        };
      })
    );
  }
}

function formatDescriptionCell(text: string | null | undefined): string {
  if (text == null) {
    return '—';
  }
  const t = String(text).trim();
  if (t === '') {
    return '—';
  }
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}

function mapSupabaseListError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver los trámites.';
  }
  return err.message || 'No se pudo cargar el catálogo.';
}

function mapDeleteError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';

  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para eliminar este trámite.';
  }
  if (
    code === '23503' ||
    msg.includes('foreign key') ||
    msg.includes('violates foreign key')
  ) {
    return 'No se puede eliminar: hay solicitudes u otros datos que dependen de este trámite.';
  }
  return err.message || 'No se pudo eliminar el registro.';
}
