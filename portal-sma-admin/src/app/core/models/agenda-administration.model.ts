/** Fila devuelta por `get_agenda_administration_targets` (Supabase). */
export interface AgendaAdministrationTarget {
  id: string;
  name: string;
  last_names: string;
  email: string;
}

export interface AgendaAdministrationTargetOption extends AgendaAdministrationTarget {
  label: string;
}
