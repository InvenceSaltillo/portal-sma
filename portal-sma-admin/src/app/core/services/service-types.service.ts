import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/** Fila de `public.service_types` (tipos de trámite / tipo de servicio). */
export interface ServiceTypeRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  client_id: string;
}

/** Payload para insertar en `public.service_types` (sin `id`; lo genera la BD). */
export interface ServiceTypeInsert {
  name: string;
  is_active: boolean;
  client_id: string;
}

/** Campos editables en actualización (RLS + `eq` por `client_id`). */
export interface ServiceTypeUpdate {
  name: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceTypesService {
  private readonly auth = inject(AuthService);

  /**
   * Lista tipos de servicio del cliente del usuario actual (RLS debe permitir lectura).
   */
  async listByClientId(
    clientId: string
  ): Promise<{ data: ServiceTypeRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('service_types')
      .select('id, name, is_active, created_at, updated_at, client_id')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    return {
      data: (data as ServiceTypeRow[]) ?? [],
      error,
    };
  }

  /**
   * Crea un tipo de servicio para el cliente indicado (RLS debe permitir insert).
   */
  async insert(
    row: ServiceTypeInsert
  ): Promise<{ data: ServiceTypeRow | null; error: PostgrestError | null }> {
    const name = row.name.trim();
    const { data, error } = await this.auth.client
      .from('service_types')
      .insert({
        name,
        is_active: row.is_active,
        client_id: row.client_id,
      })
      .select('id, name, is_active, created_at, updated_at, client_id')
      .single();

    return {
      data: (data as ServiceTypeRow) ?? null,
      error,
    };
  }

  /**
   * Obtiene un registro por `id` solo si pertenece al `client_id` indicado.
   */
  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: ServiceTypeRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('service_types')
      .select('id, name, is_active, created_at, updated_at, client_id')
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as ServiceTypeRow) ?? null,
      error,
    };
  }

  /**
   * Actualiza nombre y activo; solo si el registro pertenece al `client_id`.
   */
  async updateForClient(
    id: string,
    clientId: string,
    patch: ServiceTypeUpdate
  ): Promise<{ data: ServiceTypeRow | null; error: PostgrestError | null }> {
    const name = patch.name.trim();
    const { data, error } = await this.auth.client
      .from('service_types')
      .update({
        name,
        is_active: patch.is_active,
      })
      .eq('id', id)
      .eq('client_id', clientId)
      .select('id, name, is_active, created_at, updated_at, client_id')
      .single();

    return {
      data: (data as ServiceTypeRow) ?? null,
      error,
    };
  }
}
