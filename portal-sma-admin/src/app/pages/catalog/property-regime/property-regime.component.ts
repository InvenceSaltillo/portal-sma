import { Component, OnInit, inject, signal } from '@angular/core';
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
  PropertyRegimesService,
  type PropertyRegimeRow,
} from '../../../core/services/property-regimes.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-property-regime',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink, ConfirmDialogModule],
  templateUrl: './property-regime.component.html',
  styleUrl: './property-regime.component.css',
  providers: [ConfirmationService],
})
export class PropertyRegimeComponent implements OnInit {
  private readonly propertyRegimesApi = inject(PropertyRegimesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly regimeRowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate([
            '/catalog/property-regimes',
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
        this.requestDeleteRegime(row);
      },
    },
  ];

  readonly regimeColumns: DataTableColumn[] = [
    {
      field: 'name',
      header: 'Nombre',
      filter: { type: 'text', placeholder: 'Buscar por nombre…' },
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

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly regimeRows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadRegimes();
  }

  async refresh(): Promise<void> {
    await this.loadRegimes();
  }

  private requestDeleteRegime(row: Record<string, unknown>): void {
    const id = row['id'];
    const name = String(row['name'] ?? '').trim() || '(sin nombre)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar el régimen de propiedad «${name}»? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteRegime(String(id));
      },
    });
  }

  private async deleteRegime(id: string): Promise<void> {
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede eliminar.'
      );
      return;
    }

    this.loadError.set(null);
    this.loading.set(true);
    const { error } = await this.propertyRegimesApi.deleteForClient(
      id,
      clientId
    );
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapDeleteError(error));
      return;
    }

    await this.loadRegimes();
  }

  private async loadRegimes(): Promise<void> {
    this.loadError.set(null);
    const clientId = this.auth.currentUser()?.client_id;

    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.regimeRows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } =
      await this.propertyRegimesApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapListError(error));
      this.regimeRows.set([]);
      return;
    }

    this.regimeRows.set(
      data.map((row: PropertyRegimeRow) => ({
        id: row.id,
        name: row.name,
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

function mapListError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver los regímenes de propiedad.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'La tabla aún no existe en la base de datos. Aplica la migración SQL (property_regimes).';
  }
  return err.message || 'No se pudo cargar el catálogo.';
}

function mapDeleteError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';

  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para eliminar este régimen.';
  }
  if (
    code === '23503' ||
    msg.includes('foreign key') ||
    msg.includes('violates foreign key')
  ) {
    return 'No se puede eliminar: hay datos que dependen de este régimen.';
  }
  return err.message || 'No se pudo eliminar el registro.';
}
