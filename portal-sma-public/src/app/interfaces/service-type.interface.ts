import { Service } from './service.interface';

export interface ServiceType {
  id?: string;
  name: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
  services: Service[];
}
