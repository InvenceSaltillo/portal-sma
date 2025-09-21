export interface DynamicFormField {
  section_id: string;
  section_title: string;
  section_description?: string;
  tooltip_title?: string;
  tooltip_description?: string;

  field_id: string;
  label: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'file' | 'radio';
  required: boolean;
  placeholder?: string;
  default_value?: string;
  tooltip_title_field?: string;
  tooltip_description_field?: string;
  depends_on_field?: string; // nombre del campo del que depende
  data_source?: string;
  data_value_column?: string;
  data_label_column?: string;
  mask?: string;
  drop_special: boolean;
  section_is_collapsible: boolean;
  file_allow_multiple: boolean;
  file_max_mb?: number;
  file_accept_mime: string[];
  section_collapsed_by_default: boolean;
  pattern?: string;
  pattern_message?: string;
  col_span: number;
  section_grid_columns: number;

  options?: { value: string; label: string }[]; // solo aplica para select
}
