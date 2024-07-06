export interface Service {
  id?: string;
  service_type_id?: string;
  name: string;
  description: string;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}
