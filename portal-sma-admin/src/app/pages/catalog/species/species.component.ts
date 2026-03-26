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
  labelForEnvironmentalExploitationKey,
  type SpeciesCatalogRow,
} from '../../../core/models/species-catalog.model';
import { SpeciesCatalogService } from '../../../core/services/species-catalog.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateMexico,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-species',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, RouterLink, ConfirmDialogModule],
  templateUrl: './species.component.html',
  styleUrl: './species.component.css',
  providers: [ConfirmationService],
})
export class SpeciesComponent implements OnInit {
  private readonly speciesApi = inject(SpeciesCatalogService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  readonly speciesRowActions: DataTableRowAction[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: (row: Record<string, unknown>) => {
        const id = row['id'];
        if (id != null && id !== '') {
          void this.router.navigate(['/catalog/species', String(id), 'edit']);
        }
      },
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      severity: 'danger',
      command: (row: Record<string, unknown>) => {
        this.requestDeleteSpecies(row);
      },
    },
  ];

  readonly speciesColumns: DataTableColumn[] = [
    {
      field: 'common_name',
      header: 'Nombre común',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
    {
      field: 'scientific_name',
      header: 'Nombre científico',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
    {
      field: 'temporalidad',
      header: 'Temporalidad',
      filter: { type: 'text', placeholder: 'Filtrar…' },
    },
    {
      field: 'requires_band',
      header: 'Requiere cintillo',
      sortField: 'requires_band_sort',
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
      field: 'distinguishes_sex_age',
      header: 'Sexo y edad',
      sortField: 'distinguishes_sort',
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
      field: 'environmental_label',
      header: '% cond. ambientales',
      filter: { type: 'text', placeholder: 'Buscar…' },
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

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly speciesRows = signal<Record<string, unknown>[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadSpecies();
  }

  async refresh(): Promise<void> {
    await this.loadSpecies();
  }

  private requestDeleteSpecies(row: Record<string, unknown>): void {
    const id = row['id'];
    const name = String(row['common_name'] ?? '').trim() || '(sin nombre)';
    if (id == null || id === '') {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar la especie «${name}»? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        void this.deleteSpecies(String(id));
      },
    });
  }

  private async deleteSpecies(id: string): Promise<void> {
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede eliminar.'
      );
      return;
    }

    this.loadError.set(null);
    this.loading.set(true);
    const { error } = await this.speciesApi.deleteForClient(id, clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapDeleteError(error));
      return;
    }

    await this.loadSpecies();
  }

  private async loadSpecies(): Promise<void> {
    this.loadError.set(null);
    const clientId = this.auth.currentUser()?.client_id;

    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.speciesRows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.speciesApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapListError(error));
      this.speciesRows.set([]);
      return;
    }

    this.speciesRows.set(
      data.map((row: SpeciesCatalogRow) => ({
        id: row.id,
        common_name: row.common_name,
        scientific_name: row.scientific_name,
        temporalidad: formatTemporalidad(row.temporal_start, row.temporal_end),
        requires_band: row.requires_band ? 'Sí' : 'No',
        requires_band_sort: row.requires_band ? 1 : 0,
        distinguishes_sex_age: row.distinguishes_sex_age ? 'Sí' : 'No',
        distinguishes_sort: row.distinguishes_sex_age ? 1 : 0,
        environmental_label: row.distinguishes_sex_age
          ? '—'
          : labelForEnvironmentalExploitationKey(row.environmental_exploitation_key),
        updated_at: formatDbDateTimeMexico(row.updated_at),
        updated_at_date: dateForMexicoCalendarFilter(row.updated_at),
        updated_at_sort: dbInstantToSortTimestamp(row.updated_at),
      }))
    );
  }
}

function formatTemporalidad(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const a = start != null && String(start).trim() !== '';
  const b = end != null && String(end).trim() !== '';
  if (!a && !b) {
    return '—';
  }
  const s = a ? formatDbDateMexico(`${String(start)}T12:00:00`) : '—';
  const e = b ? formatDbDateMexico(`${String(end)}T12:00:00`) : '—';
  return `${s} al ${e}`;
}

function mapListError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver el catálogo de especies.';
  }
  if (msg.includes('column') && msg.includes('does not exist')) {
    return 'Faltan columnas en la tabla species. Aplica la migración SQL (species_catalog_fields).';
  }
  return err.message || 'No se pudo cargar el catálogo.';
}

function mapDeleteError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';

  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para eliminar esta especie.';
  }
  if (
    code === '23503' ||
    msg.includes('foreign key') ||
    msg.includes('violates foreign key')
  ) {
    return 'No se puede eliminar: hay trámites u otros datos que referencian esta especie.';
  }
  return err.message || 'No se pudo eliminar el registro.';
}
