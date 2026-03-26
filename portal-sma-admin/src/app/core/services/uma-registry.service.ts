import { Injectable, inject } from '@angular/core';
import type { FunctionsError, PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/**
 * Fila de `public.uma_registry` (catálogo/registro de UMAs por cliente).
 */
export interface UmaRegistryRow {
  id: string;
  client_id: string;
  external_id: string;
  key: string | null;
  name: string | null;
  data: unknown;
  active: boolean;
  synced_from_api: boolean;
  external_created: string | null;
  external_updated: string | null;
  sync_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UmaRegistryService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: UmaRegistryRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('uma_registry')
      .select(
        'id, client_id, external_id, key, name, data, active, synced_from_api, external_created, external_updated, sync_date, created_at, updated_at'
      )
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false, nullsFirst: false });

    return {
      data: (data as UmaRegistryRow[]) ?? [],
      error,
    };
  }

  async syncFromCinegetico(): Promise<{
    data: unknown | null;
    error: FunctionsError | null;
  }> {
    // Requiere Edge Function desplegada: `scheduled-umas-sync`
    const { data, error } = await this.auth.client.functions.invoke(
      'scheduled-umas-sync'
    );
    return { data: data ?? null, error };
  }
}

