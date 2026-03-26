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
  DocumentTemplatesService,
  type DocumentTemplateRow,
} from '../../../core/services/document-templates.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-document-template',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink, ConfirmDialogModule],
  templateUrl: './document-template.component.html',
  styleUrl: './document-template.component.css',
  providers: [ConfirmationService],
})
export class DocumentTemplateComponent implements OnInit {
  private readonly templatesApi = inject(DocumentTemplatesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly rowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate([
            '/catalog/document-templates',
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
        this.requestDelete(row);
      },
    },
  ];

  readonly columns = computed<DataTableColumn[]>(() => [
    {
      field: 'name',
      header: 'Nombre',
      filter: { type: 'text', placeholder: 'Buscar por nombre…' },
    },
    {
      field: 'description',
      header: 'Descripción',
      sortable: false,
      filter: { type: 'text', placeholder: 'Buscar en descripción…' },
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
  ]);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadList();
  }

  async refresh(): Promise<void> {
    await this.loadList();
  }

  private requestDelete(row: Record<string, unknown>): void {
    const id = row['id'];
    const name = String(row['name'] ?? '').trim() || '(sin nombre)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar la plantilla «${name}»? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteRow(String(id));
      },
    });
  }

  private async deleteRow(id: string): Promise<void> {
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) {
      this.loadError.set('No se encontró el cliente asociado.');
      return;
    }

    this.loadError.set(null);
    this.loading.set(true);
    const { error } = await this.templatesApi.deleteForClient(id, clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapDeleteError(error));
      return;
    }

    await this.loadList();
  }

  private async loadList(): Promise<void> {
    this.loadError.set(null);
    const clientId = this.auth.currentUser()?.client_id;

    if (!clientId) {
      this.loadError.set('No se encontró el cliente asociado a tu usuario.');
      this.rows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.templatesApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapListError(error));
      this.rows.set([]);
      return;
    }

    this.rows.set(
      data.map((row: DocumentTemplateRow) => ({
        id: row.id,
        name: row.name,
        description: formatDescriptionCell(row.description),
        is_active: row.is_active ? 'Sí' : 'No',
        is_active_sort: row.is_active ? 1 : 0,
        updated_at: formatDbDateTimeMexico(row.updated_at),
        updated_at_date: dateForMexicoCalendarFilter(row.updated_at),
        updated_at_sort: dbInstantToSortTimestamp(row.updated_at),
      }))
    );
  }
}

function formatDescriptionCell(text: string | null | undefined): string {
  if (text == null) return '—';
  const t = String(text).trim();
  if (t === '') return '—';
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}

function mapListError(err: { message?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver las plantillas.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'La tabla de plantillas aún no existe en la base de datos. Aplica la migración correspondiente.';
  }
  return err.message || 'No se pudo cargar el catálogo.';
}

function mapDeleteError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para eliminar esta plantilla.';
  }
  if (
    code === '23503' ||
    msg.includes('foreign key') ||
    msg.includes('violates foreign key')
  ) {
    return 'No se puede eliminar: otros registros dependen de esta plantilla.';
  }
  return err.message || 'No se pudo eliminar el registro.';
}
