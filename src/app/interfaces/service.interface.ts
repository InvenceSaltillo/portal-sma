import { FormSection } from './form-section.interface';

export interface Service {
  id?: string;
  service_type_id?: string;
  name: string;
  description: string;
  is_active: number;
  form_sections: FormSection[];
  created_at?: Date;
  updated_at?: Date;
}
