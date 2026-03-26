import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';
import type {
  SpeciesCatalogInsert,
  SpeciesCatalogRow,
  SpeciesCatalogUpdate,
  SpeciesExploitationEntryInput,
  SpeciesExploitationEntryRow,
} from '../models/species-catalog.model';

const SPECIES_SELECT =
  'id, client_id, external_id, common_name, scientific_name, active, temporal_start, temporal_end, requires_band, distinguishes_sex_age, environmental_exploitation_key, created_at, updated_at';

@Injectable({
  providedIn: 'root',
})
export class SpeciesCatalogService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: SpeciesCatalogRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('species')
      .select(SPECIES_SELECT)
      .eq('client_id', clientId)
      .order('common_name', { ascending: true });

    return {
      data: (data as SpeciesCatalogRow[]) ?? [],
      error,
    };
  }

  async getExploitationEntries(
    speciesId: string
  ): Promise<{
    data: SpeciesExploitationEntryRow[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.auth.client
      .from('species_exploitation_entries')
      .select(
        'id, species_id, population_density_per_ha, exploitation_percent, sort_order, created_at'
      )
      .eq('species_id', speciesId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    return {
      data: (data as SpeciesExploitationEntryRow[]) ?? [],
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{
    species: SpeciesCatalogRow | null;
    entries: SpeciesExploitationEntryRow[];
    error: PostgrestError | null;
  }> {
    const { data: species, error: e1 } = await this.auth.client
      .from('species')
      .select(SPECIES_SELECT)
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    if (e1) {
      return { species: null, entries: [], error: e1 };
    }
    if (!species) {
      return { species: null, entries: [], error: null };
    }

    const { data: entries, error: e2 } = await this.getExploitationEntries(id);
    if (e2) {
      return { species: species as SpeciesCatalogRow, entries: [], error: e2 };
    }

    return {
      species: species as SpeciesCatalogRow,
      entries,
      error: null,
    };
  }

  async insert(
    row: SpeciesCatalogInsert,
    exploitationRows: SpeciesExploitationEntryInput[]
  ): Promise<{ data: SpeciesCatalogRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('species')
      .insert({
        client_id: row.client_id,
        external_id: row.external_id,
        common_name: row.common_name.trim(),
        scientific_name: row.scientific_name.trim(),
        active: row.active,
        temporal_start: row.temporal_start,
        temporal_end: row.temporal_end,
        requires_band: row.requires_band,
        distinguishes_sex_age: row.distinguishes_sex_age,
        environmental_exploitation_key: row.environmental_exploitation_key,
      })
      .select(SPECIES_SELECT)
      .single();

    if (error || !data) {
      return { data: null, error };
    }

    const species = data as SpeciesCatalogRow;
    const insErr = await this.replaceExploitationEntries(
      species.id,
      exploitationRows
    );
    if (insErr) {
      await this.auth.client.from('species').delete().eq('id', species.id);
      return { data: null, error: insErr };
    }

    return { data: species, error: null };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: SpeciesCatalogUpdate,
    exploitationRows: SpeciesExploitationEntryInput[]
  ): Promise<{ data: SpeciesCatalogRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('species')
      .update({
        common_name: patch.common_name.trim(),
        scientific_name: patch.scientific_name.trim(),
        active: patch.active,
        temporal_start: patch.temporal_start,
        temporal_end: patch.temporal_end,
        requires_band: patch.requires_band,
        distinguishes_sex_age: patch.distinguishes_sex_age,
        environmental_exploitation_key: patch.environmental_exploitation_key,
      })
      .eq('id', id)
      .eq('client_id', clientId)
      .select(SPECIES_SELECT)
      .single();

    if (error) {
      return { data: null, error };
    }

    const species = data as SpeciesCatalogRow;
    const del = await this.auth.client
      .from('species_exploitation_entries')
      .delete()
      .eq('species_id', id);

    if (del.error) {
      return { data: species, error: del.error };
    }

    const insErr = await this.replaceExploitationEntries(id, exploitationRows);
    if (insErr) {
      return { data: species, error: insErr };
    }

    return { data: species, error: null };
  }

  private async replaceExploitationEntries(
    speciesId: string,
    rows: SpeciesExploitationEntryInput[]
  ): Promise<PostgrestError | null> {
    if (rows.length === 0) {
      return null;
    }

    const payload = rows.map((r, i) => ({
      species_id: speciesId,
      population_density_per_ha: r.population_density_per_ha.trim(),
      exploitation_percent: r.exploitation_percent.trim(),
      sort_order: i,
    }));

    const { error } = await this.auth.client
      .from('species_exploitation_entries')
      .insert(payload);

    return error;
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('species')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }
}
