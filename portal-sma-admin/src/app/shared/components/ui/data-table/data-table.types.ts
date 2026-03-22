/**
 * Tipo de filtro por columna (PrimeNG `p-columnFilter` o plantilla propia).
 * - `boolean`: tri-estado nativo de Prime (checkbox).
 * - `select`: lista desplegable; requiere `selectOptions`.
 */
export type DataTableColumnFilterType =
  | 'text'
  | 'numeric'
  | 'date'
  | 'boolean'
  | 'select';

/** Opción para `filter.type === 'select'` (label visible, `value` comparado con la celda). */
export interface DataTableSelectOption {
  label: string;
  value: unknown;
}

/**
 * Filtro opcional por columna. Si no se asigna `filter` en la columna, no hay control de filtro.
 * El padre decide qué columnas filtran y con qué tipo.
 */
export interface DataTableColumnFilter {
  type: DataTableColumnFilterType;
  /**
   * Propiedad del objeto fila usada al filtrar. Por defecto la `field` de la columna.
   * Ej.: columna visible `created_at` (texto) pero filtro sobre `created_at_date` (`Date`).
   */
  field?: string;
  placeholder?: string;
  /**
   * Modo Prime (`contains`, `equals`, `dateIs`, `dateBefore`, …).
   * Si no se indica, DataTableComponent usa uno razonable según `type`.
   */
  matchMode?: string;
  /**
   * Obligatorio si `type === 'select'`. Valores comparados con la propiedad filtrada (`equals`).
   */
  selectOptions?: DataTableSelectOption[];
}

/**
 * Opción del menú de acciones por fila (`p-menu` popup).
 * El padre define el arreglo; `command` recibe la fila actual.
 */
export interface DataTableRowAction {
  label: string;
  /** Clase PrimeIcons, p. ej. `pi pi-pencil`. */
  icon?: string;
  /** Si devuelve `false`, la opción no se muestra para esa fila. */
  visible?: (row: Record<string, unknown>) => boolean;
  /** Si devuelve `true`, la opción aparece deshabilitada. */
  disabled?: (row: Record<string, unknown>) => boolean;
  command?: (row: Record<string, unknown>) => void;
}

/**
 * Columna declarativa para DataTableComponent.
 */
export interface DataTableColumn {
  /** Clave del objeto en cada fila (solo primer nivel por ahora). */
  field: string;
  /** Texto del encabezado. */
  header: string;
  /**
   * Clave usada para ordenar (PrimeNG `pSortableColumn`).
   * Útil cuando la celda muestra texto formateado pero conviene ordenar por otro valor (p. ej. ISO de fecha).
   */
  sortField?: string;
  /** Si es `false`, la columna no es ordenable. Por defecto `true` cuando la tabla tiene sort habilitado. */
  sortable?: boolean;
  /**
   * Ancho del `p-skeleton` mientras `loading` es true (p. ej. `70%`, `8rem`).
   * Si no se define, se infiere del `field`.
   */
  skeletonWidth?: string;
  /**
   * Si está definido, esa columna muestra filtro en la segunda fila de cabecera.
   * Tipo (`text`, `date`, `select`, …) y opciones los define el padre.
   */
  filter?: DataTableColumnFilter;
}
