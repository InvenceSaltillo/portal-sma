import { ValidatorFn } from '@angular/forms';

export interface FormControlConfig {
  name: string;
  label: string;
  type: FormControlType;
  validators?: ValidatorFn[];
  initialValue?: string;
  selectTypeOptions?: SelectInputTypeOptions[];
  placeholder?: string;
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
}

export interface SelectInputTypeOptions {
  value: string;
  label: string;
}
