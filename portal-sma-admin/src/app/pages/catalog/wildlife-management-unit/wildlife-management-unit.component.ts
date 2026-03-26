import { Component, OnInit, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import type { DataTableColumn } from '../../../shared/components/ui/data-table/data-table.component';
import { DataTableComponent } from '../../../shared/components/ui/data-table/data-table.component';
import { AuthService } from '../../../core/auth/auth.service';
import { UmaRegistryService, type UmaRegistryRow } from '../../../core/services/uma-registry.service';
import {
  dateForMexicoCalendarFilter,
  dbInstantToSortTimestamp,
  formatDbDateTimeMexico,
} from '../../../core/utils/db-datetime-mexico';

@Component({
  selector: 'app-wildlife-management-unit',
  standalone: true,
  imports: [DataTableComponent, ButtonModule, ProgressSpinnerModule],
  templateUrl: './wildlife-management-unit.component.html',
  styleUrl: './wildlife-management-unit.component.css',
})
export class WildlifeManagementUnitComponent implements OnInit {
  private readonly umaApi = inject(UmaRegistryService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly syncError = signal<string | null>(null);
  readonly umaRows = signal<Record<string, unknown>[]>([]);

  readonly umaColumns: DataTableColumn[] = [
    {
      field: 'key',
      header: 'Clave',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
    {
      field: 'name',
      header: 'Nombre',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
    {
      field: 'synced_from_api',
      header: 'Sincronizado',
      sortField: 'synced_sort',
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
      header: 'Actualizado',
      sortField: 'updated_at_sort',
      filter: {
        type: 'date',
        field: 'updated_at_date',
        placeholder: 'Filtrar por fecha',
      },
    },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadUmas();
  }

  async refresh(): Promise<void> {
    await this.loadUmas();
  }

  async syncNow(): Promise<void> {
    this.syncError.set(null);
    this.syncing.set(true);
    const { error } = await this.umaApi.syncFromCinegetico();
    this.syncing.set(false);

    if (error) {
      this.syncError.set(error.message || 'No se pudo sincronizar UMAs.');
      return;
    }
    await this.loadUmas();
  }

  private async loadUmas(): Promise<void> {
    this.loadError.set(null);
    const clientId = this.auth.currentUser()?.client_id;
    if (!clientId) {
      this.loadError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede cargar el catálogo.'
      );
      this.umaRows.set([]);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.umaApi.listByClientId(clientId);
    this.loading.set(false);

    if (error) {
      this.loadError.set(mapUmaListError(error));
      this.umaRows.set([]);
      return;
    }

    this.umaRows.set(
      data.map((r: UmaRegistryRow) => ({
        id: r.id,
        key: r.key ?? '—',
        name: r.name ?? '—',
        synced_from_api: r.synced_from_api ? 'Sí' : 'No',
        synced_sort: r.synced_from_api ? 1 : 0,
        updated_at: formatDbDateTimeMexico(r.updated_at),
        updated_at_date: dateForMexicoCalendarFilter(r.updated_at),
        updated_at_sort: dbInstantToSortTimestamp(r.updated_at),
      }))
    );
  }
}

function mapUmaListError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver el catálogo de UMAs.';
  }
  if (msg.includes('does not exist') || msg.includes('42p01')) {
    return 'Falta la tabla uma_registry. Aplica la migración en Supabase.';
  }
  return err.message || 'No se pudo cargar el catálogo de UMAs.';
}
