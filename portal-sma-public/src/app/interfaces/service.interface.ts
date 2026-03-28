import { FormSection } from './form-section.interface';

export interface Service {
  id?: string;
  service_type_id?: string;
  name: string;
  /** Fundamento jurídico del trámite. */
  legal_basis?: string;
  description: string;
  /** Observaciones del trámite (opcional). */
  notes?: string | null;
  /** Si el trámite aplica en contexto de una UMA. */
  is_uma_related?: boolean;
  /** Si aplica UMA: asignados | técnicos. */
  uma_limit_scope?: 'asignados' | 'tecnicos' | null;
  is_active: number;
  form_sections: FormSection[];
  created_at?: Date;
  updated_at?: Date;
}
