import { Popover } from './popover.interface';

export interface FormSection {
  id: string;
  popover_id?: string;
  name: string;
  popover?: Popover;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}
