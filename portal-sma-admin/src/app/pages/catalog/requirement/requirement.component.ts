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
  RequirementsService,
  type RequirementRow,
} from '../../../core/services/requirements.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-requirement',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink, ConfirmDialogModule],
  templateUrl: './requirement.component.html',
  styleUrl: './requirement.component.css',
  providers: [ConfirmationService],
})
export class RequirementComponent implements OnInit {
  private readonly requirementsApi = inject(RequirementsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly requirementRowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
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
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      severity: 'danger',
      command: (row: Record<string, unknown>) => {
        this.requestDeleteRequirement(row);
      },
    },
  ];

  readonly requirementColumns = computed<DataTableColumn[]>(() => {
    return [
      {
        field: 'title',
        header: 'Título',
        filter: { type: 'text', placeholder: 'Buscar por título…' },
      },
      {
        field: 'file_type',
        header: 'Tipo de archivo',
        filter: { type: 'text', placeholder: 'Filtrar tipo…' },
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
        field: 'updated_at',
        header: 'Última actualización',
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
  readonly requirementRows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadRequirements();
  }

  async refresh(): Promise<void> {
    await this.loadRequirements();
  }

  private requestDeleteRequirement(row: Record<string, unknown>): void {
    const id = row['id'];
    const title = String(row['title'] ?? '').trim() || '(sin título)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar el requisito «${title}»? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteRequirement(String(id));
      },
    });
  }

  private async deleteRequirement(id: string): Promise<void> {
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) return;

    this.loadError.set(null);
    this.loading.set(true);
    const { error } = await this.requirementsApi.deleteForClient(id, clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(error.message || 'No se pudo eliminar el requisito.');
      return;
    }

    await this.loadRequirements();
  }

  private async loadRequirements(): Promise<void> {
    this.loadError.set(null);
    const clientId = this.auth.currentUser()?.client_id;

    if (!clientId) {
      this.loadError.set('No se encontró el cliente asociado.');
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.requirementsApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(error.message || 'No se pudo cargar el catálogo.');
      return;
    }

    this.requirementRows.set(
      data.map((row: RequirementRow) => ({
        id: row.id,
        title: row.title,
        file_type: row.file_type || '—',
        is_active: row.is_active ? 'Sí' : 'No',
        is_active_sort: row.is_active ? 1 : 0,
        updated_at: formatDbDateTimeMexico(row.updated_at),
        updated_at_date: dateForMexicoCalendarFilter(row.updated_at),
        updated_at_sort: dbInstantToSortTimestamp(row.updated_at),
      }))
    );
  }
}
