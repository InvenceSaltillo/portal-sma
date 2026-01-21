import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestService } from '../../../../services/request/request.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { DynamicFormField } from '../../../../interfaces/dynamic-form-field.interface';
import { DynamicFormFieldComponent } from '../../../../shared/components/dynamic-form-field/dynamic-form-field.component';
import { PopoverIconComponent } from '../../../../shared/components/popover-icon/popover-icon.component';
import { MiscService } from '../../../../services/misc/misc.service';
import { SupabaseService } from '../../../../services/supabase.service';
import { AppUtils } from '../../../../app.utils';

/**
 * Componente para el trámite: LICENCIA DE CAZA DEPORTIVA INDEFINIDA (SEMARNAT-08-044)
 * Service ID: 123e4567-e89b-42d3-a456-426614174000
 *
 * Este componente usa campos estáticos (hardcodeados) pero renderiza con DynamicFormFieldComponent
 * para mantener los mismos estilos y funcionalidad.
 */
@Component({
  selector: 'app-licencia-caza-deportiva-indefinida',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DynamicFormFieldComponent,
    PopoverIconComponent,
  ],
  templateUrl: './licencia-caza-deportiva-indefinida.component.html',
  styleUrl: './licencia-caza-deportiva-indefinida.component.css'
})
export default class LicenciaCazaDeportivaIndefinidaComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private requestService = inject(RequestService);
  private toastr = inject(ToastrService);
  private spinnerService = inject(NgxSpinnerService);
  private miscService = inject(MiscService);
  private supabaseService = inject(SupabaseService);

  form!: FormGroup;
  serviceId: string | null = null;
  loading = false;

  // Campos estáticos (hardcodeados)
  formFields: DynamicFormField[] = [];
  sectionToggles: Record<string, FormControl> = {};

  ngOnInit() {
    // Obtener serviceId de la ruta
    this.serviceId = this.route.snapshot.paramMap.get('serviceId');

    if (!this.serviceId) {
      this.toastr.error('No se especificó el trámite', 'Error');
      this.router.navigate(['/dashboard/request']);
      return;
    }

    // Inicializar campos estáticos
    this.initializeStaticFields();

    // Construir formulario dinámico
    this.form = this.buildDynamicForm(this.formFields);

    // Inicializar toggles de secciones
    this.initSectionToggles();

    // Configurar dependencias entre selects (Estado -> Municipio)
    this.listenToDependentSelects();

    // Cargar opciones iniciales para Estado
    this.loadInitialOptions();
  }

  /**
   * Inicializar campos estáticos hardcodeados
   */
  private initializeStaticFields() {
    const sectionId = 'lugar-solicitud-section';

    this.formFields = [
      // Campo: Estado
      {
        section_id: sectionId,
        section_title: 'Lugar de solicitud',
        section_description: undefined,
        tooltip_title: undefined,
        tooltip_description: undefined,
        field_id: 'state_id-field',
        label: 'Estado',
        name: 'state_id',
        type: 'select',
        required: true,
        placeholder: undefined,
        default_value: undefined,
        tooltip_title_field: 'Lugar de Solicitud',
        tooltip_description_field: 'Selecciona el estado donde realizarás la solicitud.',
        depends_on_field: undefined,
        data_source: 'states',
        data_value_column: 'id',
        data_label_column: 'name',
        mask: undefined,
        drop_special: false,
        section_is_collapsible: false,
        file_allow_multiple: false,
        file_max_mb: undefined,
        file_accept_mime: [],
        section_collapsed_by_default: false,
        pattern: undefined,
        pattern_message: undefined,
        col_span: 1,
        section_grid_columns: 2,
        options: [{ value: '', label: '-- Seleccione --' }], // Se cargará dinámicamente
        extra_config: undefined,
      },
      // Campo: Municipio
      {
        section_id: sectionId,
        section_title: 'Lugar de solicitud',
        section_description: undefined,
        tooltip_title: undefined,
        tooltip_description: undefined,
        field_id: 'municipality_id-field',
        label: 'Municipio',
        name: 'municipality_id',
        type: 'select',
        required: true,
        placeholder: undefined,
        default_value: undefined,
        tooltip_title_field: 'Lugar de Solicitud',
        tooltip_description_field: 'Selecciona el municipio donde realizarás la solicitud.',
        depends_on_field: 'state_id', // Depende de Estado
        data_source: 'municipalities',
        data_value_column: 'id',
        data_label_column: 'name',
        mask: undefined,
        drop_special: false,
        section_is_collapsible: false,
        file_allow_multiple: false,
        file_max_mb: undefined,
        file_accept_mime: [],
        section_collapsed_by_default: false,
        pattern: undefined,
        pattern_message: undefined,
        col_span: 1,
        section_grid_columns: 2,
        options: [{ value: '', label: '-- Seleccione --' }], // Se cargará dinámicamente cuando se seleccione un estado
        extra_config: undefined,
      },
    ];
  }

  /**
   * Construir formulario dinámico desde campos estáticos
   */
  private buildDynamicForm(fields: DynamicFormField[]): FormGroup {
    const root = this.formBuilder.group({});
    const sectionGroups = new Map<string, FormGroup>();

    for (const f of fields) {
      // Crear grupo por sección si no existe
      if (!sectionGroups.has(f.section_id)) {
        const sg = this.formBuilder.group({});
        sectionGroups.set(f.section_id, sg);
        root.addControl(f.section_id, sg);
      }
      const sg = sectionGroups.get(f.section_id)!;

      // Valor inicial y validadores
      const initial = f.type === 'file' ? null : (f.default_value ?? '');
      const validators: any[] = [];

      if (f.required) validators.push(Validators.required);
      if (f.name === 'email') validators.push(Validators.email);
      if (f.pattern) {
        const normalizedPattern = f.pattern.replace(/\\\\/g, '\\');
        try {
          validators.push(Validators.pattern(new RegExp(normalizedPattern)));
        } catch (e) {
          console.warn('Regex inválido:', f.pattern, e);
        }
      }

      // Agregar control dentro del grupo de su sección
      sg.addControl(f.name, this.formBuilder.control(initial, validators));
    }

    root.addControl('privacyAccepted', this.formBuilder.control(false, Validators.requiredTrue));
    return root;
  }

  /**
   * Obtener secciones únicas
   */
  getSections() {
    const unique: {
      id: string;
      title: string;
      description?: string;
      tooltip_title?: string;
      tooltip_description?: string;
      is_collapsible?: boolean;
      collapsed_by_default?: boolean;
      section_grid_columns: number;
    }[] = [];

    const seen = new Set<string>();
    for (const f of this.formFields) {
      if (!seen.has(f.section_id)) {
        unique.push({
          id: f.section_id,
          title: f.section_title,
          description: f.section_description,
          tooltip_title: f.tooltip_title,
          tooltip_description: f.tooltip_description,
          section_grid_columns: f.section_grid_columns,
          is_collapsible: f.section_is_collapsible,
          collapsed_by_default: f.section_collapsed_by_default,
        });
        seen.add(f.section_id);
      }
    }
    return unique;
  }

  /**
   * Obtener campos por sección
   */
  getFieldsBySection(sectionId: string) {
    return this.formFields.filter(f => f.section_id === sectionId);
  }

  /**
   * Obtener grupo de sección
   */
  getSectionGroup(sectionId: string): FormGroup {
    return this.form.get(sectionId) as FormGroup;
  }

  /**
   * Inicializar toggles de secciones colapsables
   */
  initSectionToggles(): void {
    for (const s of this.getSections()) {
      if (!s.is_collapsible) continue;
      const visible = !(s.collapsed_by_default ?? true);
      this.sectionToggles[s.id] = new FormControl(visible);
    }
  }

  /**
   * Obtener clase CSS para grid según número de columnas
   */
  getGridColsClass(columns: number): string {
    const map: Record<number, string> = {
      1: 'grid grid-cols-1 gap-4',
      2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
      3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
      4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    };
    return map[columns] || 'grid grid-cols-1 md:grid-cols-2 gap-4';
  }

  /**
   * Obtener clase CSS para col-span
   */
  getColSpanClass(span: number): string {
    const map: Record<number, string> = {
      1: 'col-span-1',
      2: 'col-span-1 md:col-span-2',
      3: 'col-span-1 md:col-span-3',
      4: 'col-span-1 md:col-span-2 lg:col-span-4',
    };
    return map[span] || 'col-span-1';
  }

  /**
   * Configurar dependencias entre selects (Estado -> Municipio)
   */
  private listenToDependentSelects(): void {
    AppUtils.listenToDependentSelects(
      this.supabaseService.client,
      this.form,
      this.formFields,
      (loading) => {
        if (loading) {
          this.spinnerService.show();
        } else {
          this.spinnerService.hide();
        }
      }
    );
  }

  /**
   * Cargar opciones iniciales para Estado
   */
  private async loadInitialOptions() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('states')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading states:', error);
        return;
      }

      const stateField = this.formFields.find(f => f.name === 'state_id');
      if (stateField) {
        stateField.options = [
          { value: '', label: '-- Seleccione --' },
          ...(data || []).map((state: any) => ({
            value: state.id.toString(),
            label: state.name,
          })),
        ];
      }
    } catch (error) {
      console.error('Error loading initial options:', error);
    }
  }

  /**
   * Manejar acciones de campos (si hay botones de acción)
   */
  onFieldAction(evt: { action: string; field: DynamicFormField }) {
    console.log('Field action:', evt);
    // Implementar acciones específicas si es necesario
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Por favor complete todos los campos requeridos', 'Formulario incompleto');
      return;
    }

    if (!this.serviceId) {
      this.toastr.error('No se especificó el trámite', 'Error');
      return;
    }

    try {
      this.loading = true;
      this.spinnerService.show();

      // Obtener usuario autenticado
      const userString = localStorage.getItem('user');
      if (!userString) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const user = JSON.parse(userString);

      // Crear solicitud usando el servicio
      const result = await this.requestService.submitRequest({
        form: this.form,
        formFields: [], // Ya no usamos campos dinámicos
        serviceId: this.serviceId,
        userId: user.id
      });

      this.toastr.success(`Trámite creado exitosamente. Folio: ${result.folio}`, 'Éxito');
      this.router.navigate(['/dashboard/home']);
    } catch (error: any) {
      console.error('Error al enviar trámite:', error);
      this.toastr.error(error.message || 'Error al enviar el trámite', 'Error');
    } finally {
      this.loading = false;
      this.spinnerService.hide();
    }
  }
}
