import {
  Component,
  EventEmitter,
  Input,
  Output,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule, Menu } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import type {
  DataTableColumn,
  DataTableColumnFilterType,
  DataTableRowAction,
  DataTableRowActionSeverity,
} from './data-table.types';

/**
 * Tabla de datos reutilizable (PrimeNG Table).
 * Versión inicial: columnas planas y filas genéricas; se puede extender con paginación, orden, filtros, etc.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    NgClass,
    TableModule,
    Skeleton,
    FormsModule,
    SelectModule,
    ButtonModule,
    MenuModule,
    CheckboxModule,
  ],
  templateUrl: './data-table.component.html',
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    :host ::ng-deep .data-table-filter-row th {
      padding-top: 0.35rem;
      padding-bottom: 0.5rem;
      vertical-align: top;
      min-width: 0;
    }
    /* PrimeNG 18: host es <p-columnFilter>; raíz interna .p-datatable-inline-filter (flex) */
    :host ::ng-deep .data-table-filter-row th p-columnfilter {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    :host ::ng-deep .data-table-filter-row .p-datatable-filter.p-datatable-inline-filter {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    :host ::ng-deep .data-table-filter-row .p-datatable-inline-filter > .p-fluid {
      flex: 1 1 0%;
      min-width: 0;
      max-width: 100%;
      width: auto;
    }
    :host ::ng-deep .data-table-filter-row .p-datatable-inline-filter .p-datatable-filter-element-container {
      flex: 1 1 0% !important;
      min-width: 0 !important;
      width: auto !important;
      max-width: 100%;
    }
    :host ::ng-deep .data-table-filter-row .p-inputtext,
    :host ::ng-deep .data-table-filter-row input.p-inputtext {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0;
      box-sizing: border-box;
    }
    :host ::ng-deep .data-table-filter-row .p-inputwrapper,
    :host ::ng-deep .data-table-filter-row .p-inputwrapper-filled {
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    :host ::ng-deep .data-table-filter-row .p-select {
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    :host ::ng-deep .data-table-filter-row .p-datepicker,
    :host ::ng-deep .data-table-filter-row .p-datepicker .p-inputtext {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    :host ::ng-deep .p-datatable-tbody > tr.data-table-row-clickable:hover {
      background-color: rgb(249 250 251);
    }
    :host-context(.dark) ::ng-deep .p-datatable-tbody > tr.data-table-row-clickable:hover {
      background-color: rgb(255 255 255 / 0.04);
    }
  `,
})
export class DataTableComponent {
  private readonly rowActionsMenuRef = viewChild<Menu>('rowActionsMenu');
  private readonly pTableRef = viewChild<Table>('pTable');

  /** Definición de columnas. */
  @Input({ required: true }) columns: DataTableColumn[] = [];

  /** Filas (objetos con las claves indicadas en `columns[].field`). */
  @Input() value: Record<string, unknown>[] = [];

  @Input() loading = false;

  /** Filas de placeholder tipo skeleton cuando `loading` es true. */
  @Input() skeletonRows = 5;

  @Input() stripedRows = true;

  @Input() showGridlines = true;

  /** `scroll` | `stack` — por defecto stack en móvil. */
  @Input() responsiveLayout: 'scroll' | 'stack' = 'stack';

  // ——— Selección de filas (checkboxes PrimeNG) ———

  /** Sin selección vs varias filas con `p-tableCheckbox`. */
  @Input() selectionMode: 'none' | 'multiple' = 'none';

  /**
   * Filas seleccionadas (mismo tipo que `value`; deben ser referencias a objetos del arreglo `value`).
   * Con `selectionMode === 'multiple'`, suele ser un arreglo (puede estar vacío).
   */
  @Input() selection: Record<string, unknown>[] | null = null;

  @Output() selectionChange = new EventEmitter<Record<string, unknown>[] | null>();

  /**
   * Campo único por fila para `dataKey` de Prime (obligatorio con selección por checkbox).
   * Si no se define, se usa `rowTrackByField` o `id`.
   */
  @Input() selectionDataKey: string | null = null;

  /**
   * Si es `true`, el checkbox del encabezado solo afecta la página actual del paginador.
   */
  @Input() selectionPageOnly = false;

  /**
   * Texto del encabezado de la columna de selección (p. ej. "Seleccione").
   * No hay checkbox en el encabezado: no se ofrece “seleccionar todas las filas”.
   */
  @Input() selectionColumnHeader = '';

  /**
   * Segunda columna de checkbox (p. ej. "Obligatorio"), independiente de la selección de fila.
   * El booleano vive en `value[][extraCheckboxField]`.
   */
  @Input() extraCheckboxColumnHeader = '';

  /** Campo booleano en cada fila para la segunda columna de checkbox. */
  @Input() extraCheckboxField = '_extraCheckbox';

  @Output() extraCheckboxChange = new EventEmitter<{
    row: Record<string, unknown>;
    value: boolean;
  }>();

  /** Clases del contenedor p-table (PrimeNG). */
  @Input() styleClass = 'p-datatable-sm w-full';

  /** Estilo de la tabla HTML interna. */
  @Input() tableStyle: Record<string, string> = { 'min-width': '100%' };

  @Input() emptyMessage = 'No hay registros para mostrar.';

  /** Ordenamiento por una sola columna o varias (Shift+clic en modo multiple). */
  @Input() sortMode: 'single' | 'multiple' = 'single';

  /**
   * Activa cabeceras ordenables (`pSortableColumn`).
   * Las columnas pueden desactivarse con `sortable: false`.
   */
  @Input() sortable = true;

  /** Al ordenar, vuelve a la primera página (recomendado con paginador). */
  @Input() resetPageOnSort = true;

  // ——— Filtros por columna (cliente) ———

  /**
   * Permite la fila de filtros. Solo se muestra si además **alguna columna** define `filter`.
   * Qué columnas filtran y el tipo (`text`, `date`, …) lo decide el padre en cada columna.
   */
  @Input() columnFilter = true;

  /** Espera antes de aplicar filtro tras escribir (ms). */
  @Input() filterDelay = 300;

  /** Locale para reglas de filtro (p. ej. mayúsculas). */
  @Input() filterLocale = 'es-MX';

  /** Placeholder por defecto de los inputs de filtro. */
  @Input() defaultFilterPlaceholder = 'Filtrar…';

  /**
   * Campos incluidos en el filtro global de Prime (`filterGlobal`, modo `contains`).
   * Si el arreglo no está vacío, se muestra un buscador encima de la tabla.
   */
  @Input() globalFilterFields: string[] = [];

  /** Placeholder del buscador global. */
  @Input() globalFilterPlaceholder = '';

  // ——— Paginación (cliente; `value` completo en memoria) ———

  /** Activa el paginador de PrimeNG. */
  @Input() paginator = true;

  /** Filas por página. */
  @Input() rows = 10;

  /** Opciones del desplegable “filas por página”. */
  @Input() rowsPerPageOptions: number[] = [5, 10, 25, 50];

  /** `top` | `bottom` | `both`. */
  @Input() paginatorPosition: 'top' | 'bottom' | 'both' = 'bottom';

  /**
   * Si es `true`, el paginador se muestra aunque quepan todas las filas en una página.
   * Si es `false`, PrimeNG lo oculta cuando `totalRecords <= rows` (por eso “desaparece” con pocas filas).
   */
  @Input() alwaysShowPaginator = true;

  /** Texto “Mostrando X a Y de Z…”. */
  @Input() showCurrentPageReport = true;

  @Input() currentPageReportTemplate =
    'Mostrando {first} a {last} de {totalRecords} registros';

  /** Botones ir a primera / última página. */
  @Input() showFirstLastIcon = true;

  /** Locale del paginador (etiquetas de Prime). */
  @Input() paginatorLocale = 'es-MX';

  /**
   * Ancla el desplegable “filas por página” al `body` para que no lo recorten
   * contenedores con `overflow` (muy habitual con tablas).
   */
  @Input() paginatorDropdownAppendTo: 'body' | null = 'body';

  /**
   * Estilo del panel del paginador (contraste respecto a la tabla / tema).
   */
  @Input() paginatorStyleClass =
    'border-t border-gray-200 bg-gray-50/90 mt-1 rounded-b-lg px-2 py-3 text-gray-800 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100';

  // ——— Columna de acciones (menú por fila) ———

  /**
   * Si tiene al menos una entrada, se añade una columna final con botón que abre un menú.
   * Cada acción puede ocultarse o deshabilitarse por fila con `visible` / `disabled`.
   */
  @Input() rowActions: DataTableRowAction[] = [];

  /** Encabezado de la columna de acciones. */
  @Input() actionsColumnHeader = 'Acciones';

  /** Icono del botón que abre el menú (PrimeIcons). */
  @Input() actionsTriggerIcon = 'pi pi-ellipsis-v';

  /** `aria-label` / título accesible del botón de acciones. */
  @Input() actionsTriggerAriaLabel = 'Abrir menú de acciones';

  /** Ancla del overlay del menú (evita recortes con `overflow`). */
  @Input() actionsMenuAppendTo: 'body' | null = 'body';

  /**
   * Si es `true`, un clic en la fila (fuera de botones, enlaces o checkboxes) emite `rowClick`.
   */
  @Input() rowClickable = false;

  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  // ——— Columna de numeración (conteo / #) ———

  /**
   * Columna inicial con el número de fila (1-based). Con paginador, el conteo sigue
   * entre páginas (p. ej. página 2 con 10 filas/página → 11–20).
   */
  @Input() showRowNumberColumn = true;

  /** Encabezado de la columna de conteo (p. ej. `#` o `Nº`). */
  @Input() rowNumberColumnHeader = '#';

  /**
   * Campo único por fila para `rowTrackBy` de PrimeNG.
   * Tras ordenar, el array se muta in situ; con trackBy por referencia de objeto
   * el DOM a veces no refleja el orden. `id` suele ser adecuado.
   * `null` = usar el índice (menos estable si cambian filas).
   */
  @Input() rowTrackByField: string | null = 'id';

  /** TrackBy pasado a `p-table` (no usar identidad del objeto fila). */
  rowTrackBy = (index: number, row: Record<string, unknown>): string | number => {
    const key = this.rowTrackByField;
    if (key != null && row[key] != null && row[key] !== '') {
      return row[key] as string | number;
    }
    return index;
  };

  cellValue(row: Record<string, unknown>, field: string): unknown {
    return row[field];
  }

  /**
   * Índice visible 1-based: respeta `first` del `p-table` (offset del paginador).
   */
  rowDisplayIndex(
    table: { first?: number | null } | null | undefined,
    rowIndex: number
  ): number {
    const f = table?.first;
    const first = f == null ? 0 : f;
    return first + rowIndex + 1;
  }

  /**
   * PrimeNG con `loading=true` renderiza el cuerpo normal **y** `loadingbody`, lo que
   * deja datos anteriores + filas skeleton a la vez. Mientras carga, no pasamos filas.
   */
  get valueForTable(): Record<string, unknown>[] {
    return this.loading ? [] : this.value;
  }

  /** Índices 0..skeletonRows-1 para `@for` en la plantilla de carga. */
  get skeletonRowIndexes(): number[] {
    const n = Math.max(0, Math.min(12, this.skeletonRows));
    return Array.from({ length: n }, (_, i) => i);
  }

  /** Campo de datos que usa PrimeNG para comparar al ordenar. */
  sortKey(col: DataTableColumn): string {
    return col.sortField ?? col.field;
  }

  isColumnSortable(col: DataTableColumn): boolean {
    return this.sortable && col.sortable !== false;
  }

  /** Segunda fila de cabecera: solo si el padre activó filtros y al menos una columna tiene `filter`. */
  get showColumnFilterRow(): boolean {
    return (
      this.columnFilter && this.columns.some((c) => c.filter != null)
    );
  }

  get showGlobalFilter(): boolean {
    return this.globalFilterFields.length > 0;
  }

  onGlobalFilterInput(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    const value = el?.value ?? '';
    this.pTableRef()?.filterGlobal(value, 'contains');
  }

  /** Columna extra de menú de acciones. */
  get showActionsColumn(): boolean {
    return this.rowActions.length > 0;
  }

  get showSelectionColumn(): boolean {
    return this.selectionMode === 'multiple';
  }

  get showExtraCheckboxColumn(): boolean {
    return this.extraCheckboxColumnHeader.trim().length > 0;
  }

  /** `dataKey` efectivo para Prime cuando hay selección. */
  effectiveSelectionDataKey(): string {
    const fromInput = this.selectionDataKey?.trim();
    if (fromInput) {
      return fromInput;
    }
    const fromTrack = this.rowTrackByField?.trim();
    if (fromTrack) {
      return fromTrack;
    }
    return 'id';
  }

  onTableSelectionChange(value: unknown): void {
    if (!this.showSelectionColumn) {
      return;
    }
    const arr = Array.isArray(value)
      ? (value as Record<string, unknown>[])
      : value == null
        ? null
        : [value as Record<string, unknown>];
    this.selectionChange.emit(arr);
  }

  rowIsPrimarySelected(row: Record<string, unknown>): boolean {
    const key = this.effectiveSelectionDataKey();
    const v = row[key];
    const sel = this.selection ?? [];
    return sel.some((s) => s[key] === v);
  }

  extraCheckboxChecked(row: Record<string, unknown>): boolean {
    return row[this.extraCheckboxField] === true;
  }

  onExtraCheckboxModelChange(
    row: Record<string, unknown>,
    checked: boolean
  ): void {
    this.extraCheckboxChange.emit({ row, value: checked });
  }

  extraCheckboxInputId(row: Record<string, unknown>): string {
    const key = this.effectiveSelectionDataKey();
    const id = row[key];
    return `dt-extra-cb-${String(id ?? 'row')}`;
  }

  /** Para `colspan` en mensaje vacío. */
  get totalColumnCount(): number {
    return (
      this.columns.length +
      (this.showActionsColumn ? 1 : 0) +
      (this.showRowNumberColumn ? 1 : 0) +
      (this.showSelectionColumn ? 1 : 0) +
      (this.showExtraCheckboxColumn ? 1 : 0)
    );
  }

  /** Modelo del `p-menu` popup (se reconstruye al abrir por fila). */
  actionsMenuModel: MenuItem[] = [];

  onBodyRowClick(event: Event, row: Record<string, unknown>): void {
    if (!this.rowClickable) {
      return;
    }
    const t = event.target as HTMLElement | null;
    if (
      t?.closest(
        'button, a, input, textarea, select, label, .p-checkbox, .p-tablecheckbox, [data-row-click-ignore]'
      )
    ) {
      return;
    }
    this.rowClick.emit(row);
  }

  openRowActionsMenu(event: Event, row: Record<string, unknown>): void {
    event.preventDefault();
    event.stopPropagation();
    this.actionsMenuModel = this.buildRowActionsMenuItems(row);
    queueMicrotask(() => {
      const menu = this.rowActionsMenuRef();
      menu?.toggle(event);
    });
  }

  private buildRowActionsMenuItems(row: Record<string, unknown>): MenuItem[] {
    const items: MenuItem[] = [];
    for (const action of this.rowActions) {
      if (action.visible && action.visible(row) === false) {
        continue;
      }
      const disabled = action.disabled?.(row) === true;
      const styleClass = this.rowActionStyleClass(action);
      items.push({
        label: action.label,
        icon: action.icon,
        disabled,
        ...(styleClass ? { styleClass } : {}),
        command: () => {
          if (!disabled) {
            action.command?.(row);
          }
        },
      });
    }
    return items;
  }

  /** Clases en el `p-menuitem` (Prime aplica `item.styleClass` al ítem del menú). */
  private rowActionStyleClass(action: DataTableRowAction): string | undefined {
    const parts: string[] = [];
    if (action.severity) {
      parts.push(severityToMenuClass(action.severity));
    }
    if (action.styleClass?.trim()) {
      parts.push(action.styleClass.trim());
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  isColumnFilterable(col: DataTableColumn): boolean {
    return this.columnFilter && col.filter != null;
  }

  /**
   * Evita comparar `col.filter.type === 'select'` en la plantilla: algunas versiones del
   * compilador / language service de Angular marcan error de solapamiento de tipos.
   */
  isSelectColumnFilter(col: DataTableColumn): boolean {
    return col.filter?.type === 'select';
  }

  /** Campo del modelo que usa Prime en `filters[field]`. */
  filterFieldKey(col: DataTableColumn): string {
    return col.filter!.field ?? col.field;
  }

  filterTypeFor(col: DataTableColumn): Exclude<DataTableColumnFilterType, 'select'> {
    const t = col.filter!.type;
    if (t === 'select') {
      return 'text';
    }
    return t;
  }

  filterMatchModeFor(col: DataTableColumn): string {
    const f = col.filter!;
    if (f.matchMode) {
      return f.matchMode;
    }
    switch (f.type) {
      case 'numeric':
        return 'equals';
      case 'date':
        return 'dateIs';
      case 'boolean':
      case 'select':
        return 'equals';
      default:
        return 'contains';
    }
  }

  filterPlaceholderFor(col: DataTableColumn): string {
    return col.filter!.placeholder ?? this.defaultFilterPlaceholder;
  }

  /**
   * Fecha/boolean suelen necesitar confirmación en el UI de Prime; texto/número filtran al escribir.
   */
  filterShowApplyFor(col: DataTableColumn): boolean {
    const t = col.filter!.type;
    return t === 'date' || t === 'boolean';
  }

  /** Opciones del `p-select` en filtros tipo `select`. */
  selectFilterOptions(col: DataTableColumn): { label: string; value: unknown }[] {
    return col.filter?.selectOptions ?? [];
  }

  skeletonWidth(col: DataTableColumn): string {
    if (col.skeletonWidth) {
      return col.skeletonWidth;
    }
    const f = col.field.toLowerCase();
    if (f === 'is_active' || f.endsWith('_active') || f === 'activo') {
      return '3rem';
    }
    if (f.includes('date') || f.includes('_at') || f === 'alta') {
      return '7rem';
    }
    return 'min(12rem, 85%)';
  }
}

export type {
  DataTableColumn,
  DataTableColumnFilter,
  DataTableColumnFilterType,
  DataTableRowAction,
  DataTableRowActionSeverity,
  DataTableSelectOption,
} from './data-table.types';

function severityToMenuClass(severity: DataTableRowActionSeverity): string {
  switch (severity) {
    case 'danger':
      return 'dt-row-action-danger';
    case 'warning':
      return 'dt-row-action-warning';
    case 'success':
      return 'dt-row-action-success';
    case 'info':
      return 'dt-row-action-info';
    default:
      return '';
  }
}
