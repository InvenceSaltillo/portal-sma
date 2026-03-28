import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/** Tipo anidado que devuelve PostgREST al hacer select en `service_types`. */
export interface ProcedureNestedServiceType {
  id: string;
  name: string;
}

/** Alcance "Limitar solo a UMAS" del legado: asignados o técnicos. */
export type UmaLimitScope = 'asignados' | 'tecnicos';

export function umaLimitScopeLabel(
  v: string | null | undefined
): string {
  if (v === 'asignados') return 'Asignados';
  if (v === 'tecnicos') return 'Técnicos';
  return '—';
}

/**
 * Fila de `public.services` (trámite / servicio del catálogo del cliente).
 */
export interface ProcedureRow {
  id: string;
  name: string;
  /** Fundamento jurídico del trámite (obligatorio en admin). */
  legal_basis?: string | null;
  description: string | null;
  /** Notas internas u observaciones del trámite (texto libre). */
  notes?: string | null;
  /** Indica si el trámite aplica en contexto de una UMA. */
  is_uma_related?: boolean;
  /**
   * Si `is_uma_related`, restricción Asignados vs Técnicos; si no aplica, `null`.
   */
  uma_limit_scope?: UmaLimitScope | null;
  is_active: boolean;
  service_type_id: string;
  client_id: string;
  created_at: string | null;
  updated_at: string | null;
  service_types?: ProcedureNestedServiceType | ProcedureNestedServiceType[] | null;
}

export interface ProcedureInsert {
  name: string;
  legal_basis: string;
  /** La columna en BD es NOT NULL; usar cadena vacía si no hay texto. */
  description: string;
  notes: string | null;
  is_uma_related: boolean;
  uma_limit_scope: UmaLimitScope | null;
  is_active: boolean;
  service_type_id: string;
  client_id: string;
}

export interface ProcedureUpdate {
  name: string;
  legal_basis: string;
  description: string;
  notes: string | null;
  is_uma_related: boolean;
  uma_limit_scope: UmaLimitScope | null;
  is_active: boolean;
  service_type_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProceduresService {
  private readonly auth = inject(AuthService);

  /**
   * Lista trámites (`services`) del cliente con nombre del tipo (`service_types`).
   */
  async listByClientId(
    clientId: string
  ): Promise<{ data: ProcedureRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('services')
      .select(
        `
        id,
        name,
        legal_basis,
        description,
        notes,
        is_uma_related,
        uma_limit_scope,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types ( id, name )
      `
      )
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    return {
      data: (data as ProcedureRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: ProcedureInsert
  ): Promise<{ data: ProcedureRow | null; error: PostgrestError | null }> {
    const name = row.name.trim();
    const legal_basis = (row.legal_basis ?? '').trim();
    const description = (row.description ?? '').trim();
    const notes =
      row.notes != null && String(row.notes).trim() !== ''
        ? String(row.notes).trim()
        : null;

    const { data, error } = await this.auth.client
      .from('services')
      .insert({
        name,
        legal_basis,
        description,
        notes,
        is_uma_related: row.is_uma_related,
        uma_limit_scope: row.uma_limit_scope,
        is_active: row.is_active,
        service_type_id: row.service_type_id,
        client_id: row.client_id,
      })
      .select(
        `
        id,
        name,
        legal_basis,
        description,
        notes,
        is_uma_related,
        uma_limit_scope,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types ( id, name )
      `
      )
      .single();

    return {
      data: (data as ProcedureRow) ?? null,
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: ProcedureRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('services')
      .select(
        `
        id,
        name,
        legal_basis,
        description,
        notes,
        is_uma_related,
        uma_limit_scope,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types ( id, name )
      `
      )
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as ProcedureRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: ProcedureUpdate
  ): Promise<{ data: ProcedureRow | null; error: PostgrestError | null }> {
    const name = patch.name.trim();
    const legal_basis = (patch.legal_basis ?? '').trim();
    const description = (patch.description ?? '').trim();
    const notes =
      patch.notes != null && String(patch.notes).trim() !== ''
        ? String(patch.notes).trim()
        : null;

    const { data, error } = await this.auth.client
      .from('services')
      .update({
        name,
        legal_basis,
        description,
        notes,
        is_uma_related: patch.is_uma_related,
        uma_limit_scope: patch.uma_limit_scope,
        is_active: patch.is_active,
        service_type_id: patch.service_type_id,
      })
      .eq('id', id)
      .eq('client_id', clientId)
      .select(
        `
        id,
        name,
        legal_basis,
        description,
        notes,
        is_uma_related,
        uma_limit_scope,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types ( id, name )
      `
      )
      .single();

    return {
      data: (data as ProcedureRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('services')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }
}

/** Nombre legible del tipo desde la fila anidada de PostgREST. */
export function procedureServiceTypeName(
  row: ProcedureRow | null | undefined
): string {
  const st = row?.service_types;
  if (st == null) {
    return '—';
  }
  const first = Array.isArray(st) ? st[0] : st;
  return first?.name?.trim() ? first.name : '—';
}
