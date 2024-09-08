import { ValidatorFn } from '@angular/forms';
import { Popover } from './popover.interface';

export interface FormControlConfig {
  name: string;
  label: string;
  type: FormControlType;
  validators?: any;
  initial_value?: string;
  initialDate?: Date;
  select_options?: SelectInputTypeOptions[];
  popover?: Popover;
  placeholder?: string;
  input_mask?: string;
  file_button_text?: string;
  file_input_accept?: string;
  index?: number;
}

export interface CustomDialogConfig {
  dialogTitle: string;
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
  svgIconPath: string
}

export enum FormControlType {
  TEXT = 'text',
  EMAIL = 'email',
  NUMBER = 'number',
  SELECT = 'select',
  DATE = 'date',
  FILE = 'file',
}

export interface SelectInputTypeOptions {
  value: string;
  label: string;
  is_selected: boolean;
}
