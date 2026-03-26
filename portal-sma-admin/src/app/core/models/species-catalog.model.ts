/** Opciones del desplegable "% de aprovechamiento por condiciones ambientales". */
export const SPECIES_ENVIRONMENTAL_EXPLOITATION_OPTIONS: {
  label: string;
  value: string;
}[] = [
  { label: 'Menor al 15%', value: 'lt_15' },
  { label: 'Del 15% al 30%', value: '15_30' },
  { label: 'Del 30% al 50%', value: '30_50' },
  { label: 'Del 50% al 70%', value: '50_70' },
  { label: 'Mayor al 70%', value: 'gt_70' },
];

export function labelForEnvironmentalExploitationKey(
  key: string | null | undefined
): string {
  if (key == null || String(key).trim() === '') {
    return '—';
  }
  const opt = SPECIES_ENVIRONMENTAL_EXPLOITATION_OPTIONS.find(
    (o) => o.value === key
  );
  return opt?.label ?? key;
}

export interface SpeciesExploitationEntryRow {
  id: string;
  species_id: string;
  population_density_per_ha: string;
  exploitation_percent: string;
  sort_order: number;
  created_at: string | null;
}

export interface SpeciesCatalogRow {
  id: string;
  client_id: string;
  external_id: string;
  common_name: string;
  scientific_name: string;
  active: boolean;
  temporal_start: string | null;
  temporal_end: string | null;
  requires_band: boolean;
  distinguishes_sex_age: boolean;
  environmental_exploitation_key: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SpeciesCatalogInsert {
  client_id: string;
  external_id: string;
  common_name: string;
  scientific_name: string;
  active: boolean;
  temporal_start: string | null;
  temporal_end: string | null;
  requires_band: boolean;
  distinguishes_sex_age: boolean;
  environmental_exploitation_key: string | null;
}

export interface SpeciesCatalogUpdate {
  common_name: string;
  scientific_name: string;
  active: boolean;
  temporal_start: string | null;
  temporal_end: string | null;
  requires_band: boolean;
  distinguishes_sex_age: boolean;
  environmental_exploitation_key: string | null;
}

export interface SpeciesExploitationEntryInput {
  population_density_per_ha: string;
  exploitation_percent: string;
}
