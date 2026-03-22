import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import {
  DataTableComponent,
  type DataTableColumn,
  type DataTableRowAction,
} from '../../../shared/components/ui/data-table/data-table.component';
import {
  ServiceTypesService,
  type ServiceTypeRow,
} from '../../../core/services/service-types.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-procedure-type',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink],
  templateUrl: './procedure-type.component.html',
  styleUrl: './procedure-type.component.css',
})
export class ProcedureTypeComponent implements OnInit {
  private readonly serviceTypesApi = inject(ServiceTypesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Menú de acciones por fila (columna opcional en `app-data-table`). */
  readonly procedureTypeRowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate([
            '/catalog/procedure-types',
            String(id),
            'edit',
          ]);
        }
      },
    },
  ];

  readonly procedureTypeColumns: DataTableColumn[] = [
    {
      field: 'name',
      header: 'Nombre',
      filter: { type: 'text', placeholder: 'Buscar por nombre…' },
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
        /** Día civil en México (alineado con la fecha mostrada). */
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

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  /** Filas ya formateadas para la tabla. */
  readonly procedureTypeRows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadServiceTypes();
  }

  /** Vuelve a cargar el catálogo desde Supabase (mismo flujo que la carga inicial). */
  async refresh(): Promise<void> {
    await this.loadServiceTypes();
  }

  private async loadServiceTypes(): Promise<void> {
    this.loadError.set(null);
    const user = this.auth.currentUser();
    const clientId = user?.client_id;

    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.procedureTypeRows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } =
      await this.serviceTypesApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapSupabaseListError(error));
      this.procedureTypeRows.set([]);
      return;
    }

    this.procedureTypeRows.set(
      data.map((row: ServiceTypeRow) => ({
        id: row.id,
        name: row.name,
        is_active: row.is_active ? 'Sí' : 'No',
        /** Valor para ordenar Activo (Sí/No) de forma estable */
        is_active_sort: row.is_active ? 1 : 0,
        created_at: formatDbDateTimeMexico(row.created_at),
        created_at_date: dateForMexicoCalendarFilter(row.created_at),
        created_at_sort: dbInstantToSortTimestamp(row.created_at),
        updated_at: formatDbDateTimeMexico(row.updated_at),
        updated_at_date: dateForMexicoCalendarFilter(row.updated_at),
        updated_at_sort: dbInstantToSortTimestamp(row.updated_at),
      }))
    );
  }
}

function mapSupabaseListError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver los tipos de trámite.';
  }
  return err.message || 'No se pudo cargar el catálogo.';
}
