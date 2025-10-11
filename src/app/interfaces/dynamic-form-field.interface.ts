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
  extra_config?: DynamicExtraConfig;
}

export interface SuffixButtonConfig {
  icon?: string;          // ej. 'pi pi-search' o 'hero-magnifying-glass'
  label?: string;         // texto accesible
  action: string;         // ej. 'searchUma' (lo usas en el switch del contenedor)
  tooltip?: string;       // ayuda opcional
}

export interface DynamicExtraConfig {
  suffixButton?: SuffixButtonConfig; // 👈 botón al final del input (la lupa)
  clearOnSelect?: boolean;           // banderas extra que quieras
  fetchConfig?: FetchConfig;
  addButton?: AddButtonConfig;
  [key: string]: any;
  renderSpeciesTable?: boolean;
  renderSpeciesTableAfterFields?: boolean;
}

export interface FetchConfig {
  url?: string;
  method?: string;
  queryKey?: string;
  valueKey?: string;
  labelTemplate?: string;
}

export interface AddButtonConfig {
  icon?: string;
  label?: string;
  action?: string;
}
