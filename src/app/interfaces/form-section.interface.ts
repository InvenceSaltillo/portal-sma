import { FormControlConfig } from './custom.dialog.interfaces';
import { Popover } from './popover.interface';

export interface FormSection {
  id: string;
  popover_id?: string;
  name: string;
  text_alert?: string;
  form_controls: FormControlConfig[];
  columns: number;
  popover?: Popover;
  expanded: boolean;
  has_checkbox: boolean;
  is_active?: number;
  checkbox_label?: string;
  created_at?: Date;
  updated_at?: Date;
}
