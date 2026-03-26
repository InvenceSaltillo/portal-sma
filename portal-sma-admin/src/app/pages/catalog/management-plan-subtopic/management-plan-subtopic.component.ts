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
  ManagementPlanSubtopicsService,
  embedTopicName,
  type ManagementPlanSubtopicRow,
} from '../../../core/services/management-plan-subtopics.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-management-plan-subtopic',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink, ConfirmDialogModule],
  templateUrl: './management-plan-subtopic.component.html',
  styleUrl: './management-plan-subtopic.component.css',
  providers: [ConfirmationService],
})
export class ManagementPlanSubtopicComponent implements OnInit {
  private readonly subtopicsApi = inject(ManagementPlanSubtopicsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly subtopicRowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate([
            '/catalog/management-plan-subtopics',
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
        this.requestDeleteSubtopic(row);
      },
    },
  ];

  readonly subtopicColumns: DataTableColumn[] = [
    {
      field: 'tema',
      header: 'Tema',
      filter: { type: 'text', placeholder: 'Buscar por tema…' },
    },
    {
      field: 'orden',
      header: 'Orden',
      sortField: 'orden_sort',
      filter: { type: 'text', placeholder: 'Filtrar orden…' },
    },
    {
      field: 'descripcion',
      header: 'Descripción',
      filter: { type: 'text', placeholder: 'Buscar en descripción…' },
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
  readonly subtopicRows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadSubtopics();
  }

  async refresh(): Promise<void> {
    await this.loadSubtopics();
  }

  private requestDeleteSubtopic(row: Record<string, unknown>): void {
    const id = row['id'];
    const label = String(row['descripcion'] ?? '').trim().slice(0, 80) || '(sin descripción)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar el subtema «${label}»? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteSubtopic(String(id));
      },
    });
  }

  private async deleteSubtopic(id: string): Promise<void> {
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede eliminar.'
      );
      return;
    }

    this.loadError.set(null);
    this.loading.set(true);
    const { error } = await this.subtopicsApi.deleteForClient(id, clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapDeleteError(error));
      return;
    }

    await this.loadSubtopics();
  }

  private async loadSubtopics(): Promise<void> {
    this.loadError.set(null);
    const clientId = this.auth.currentUser()?.client_id;

    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.subtopicRows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.subtopicsApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapListError(error));
      this.subtopicRows.set([]);
      return;
    }

    this.subtopicRows.set(
      data.map((row: ManagementPlanSubtopicRow) => ({
        id: row.id,
        tema: embedTopicName(row),
        orden: row.orden,
        orden_sort: row.orden,
        descripcion: row.descripcion,
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
    return 'No tienes permiso para ver los subtemas de plan de manejo.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'La tabla de subtemas aún no existe en la base de datos. Aplica la migración SQL (management_plan_subtopics).';
  }
  return err.message || 'No se pudo cargar el catálogo.';
}

function mapDeleteError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para eliminar este subtema.';
  }
  return err.message || 'No se pudo eliminar el registro.';
}
