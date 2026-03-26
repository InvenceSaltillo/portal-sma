import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/**
 * Fila de `public.requirement_catalog` (catálogo de requisitos por cliente).
 */
export interface RequirementRow {
  id: string;
  client_id: string;
  name: string;
  title: string;
  description: string | null;
  legal_reference: string | null;
  file_type: string | null;
  accept: string | null;
  max_size_mb: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface RequirementInsert {
  client_id: string;
  name: string;
  title: string;
  /** La columna en BD permite NULL pero para el form usamos strings vacíos. */
  description: string;
  legal_reference: string;
  file_type: string;
  accept: string;
  max_size_mb: number;
  is_active: boolean;
}

export interface RequirementUpdate {
  name: string;
  title: string;
  description: string;
  legal_reference: string;
  file_type: string;
  accept: string;
  max_size_mb: number;
  is_active: boolean;
}

/** Fila de vínculo servicio–requisito al listar asociaciones. */
export interface ServiceRequirementLinkedRow {
  is_required: boolean;
  catalog: RequirementRow;
}

@Injectable({
  providedIn: 'root',
})
export class RequirementsService {
  private readonly auth = inject(AuthService);

  /**
   * Lista requisitos vinculados al cliente por ID.
   */
  async listByClientId(
    clientId: string
  ): Promise<{ data: RequirementRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('requirement_catalog')
      .select('*')
      .eq('client_id', clientId)
      .order('title', { ascending: true });

    return {
      data: (data as RequirementRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: RequirementInsert
  ): Promise<{ data: RequirementRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('requirement_catalog')
      .insert(row)
      .select()
      .single();

    return {
      data: (data as RequirementRow) ?? null,
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: RequirementRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('requirement_catalog')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as RequirementRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: RequirementUpdate
  ): Promise<{ data: RequirementRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('requirement_catalog')
      .update(patch)
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    return {
      data: (data as RequirementRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('requirement_catalog')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }

  /**
   * Requisitos del catálogo vinculados al trámite vía `public.service_requirements`.
   */
  async listLinkedToService(
    serviceId: string
  ): Promise<{
    data: ServiceRequirementLinkedRow[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.auth.client
      .from('service_requirements')
      .select(
        `
        sort_order,
        is_required,
        requirement_catalog (
          id,
          client_id,
          name,
          title,
          description,
          legal_reference,
          file_type,
          accept,
          max_size_mb,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error };
    }

    const rows: ServiceRequirementLinkedRow[] = [];
    for (const raw of data ?? []) {
      const link = raw as {
        is_required?: boolean;
        requirement_catalog:
          | RequirementRow
          | RequirementRow[]
          | null
          | undefined;
      };
      const rc = link.requirement_catalog;
      const cat = Array.isArray(rc) ? rc[0] : rc;
      if (cat) {
        rows.push({
          is_required: link.is_required === true,
          catalog: cat,
        });
      }
    }

    return { data: rows, error: null };
  }

  /**
   * Sustituye los vínculos del trámite: borra los existentes e inserta filas
   * en orden (`sort_order` 0..n-1).
   */
  async replaceLinksForService(
    serviceId: string,
    links: { requirement_id: string; is_required: boolean }[]
  ): Promise<{ error: PostgrestError | null }> {
    const { error: delErr } = await this.auth.client
      .from('service_requirements')
      .delete()
      .eq('service_id', serviceId);

    if (delErr) {
      return { error: delErr };
    }

    if (links.length === 0) {
      return { error: null };
    }

    const { error: insErr } = await this.auth.client
      .from('service_requirements')
      .insert(
        links.map((link, sort_order) => ({
          service_id: serviceId,
          requirement_id: link.requirement_id,
          is_required: link.is_required,
          sort_order,
        }))
      );

    return { error: insErr };
  }
}
