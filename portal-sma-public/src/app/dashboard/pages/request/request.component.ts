import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren, WritableSignal, effect, inject, signal } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../../shared/components/popover-icon/popover-icon.component';
import { ServiceTypeService } from '../../../services/service-type/service-type.service';
import { ServiceService } from '../../../services/service/service.service';
import { Service } from '../../../interfaces/service.interface';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxTippyModule, NgxTippyProps } from 'ngx-tippy-wrapper';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormControlConfig, FormControlType, SelectInputTypeOptions } from '../../../interfaces/custom.dialog.interfaces';
import { AppUtils } from '../../../app.utils';
import { MiscService } from '../../../services/misc/misc.service';
import { FormSection } from '../../../interfaces/form-section.interface';
import { User } from '../../../interfaces/user.interface';
import { DynamicFormField } from '../../../interfaces/dynamic-form-field.interface';
import { DynamicFormFieldComponent } from '../../../shared/components/dynamic-form-field/dynamic-form-field.component';
import { SupabaseService } from '../../../services/supabase.service';
import { GlobalState } from '../../../interfaces/global-state.interface';
import { RequestService } from '../../../services/request/request.service';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { EmailService } from '../../../services/email/email.service';
import { supabaseClient } from '../../../core/supabase.client';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { PdfService } from '../../../services/pdf/pdf.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type SexValue = 'male' | 'female' | 'unsexed';

interface SpeciesRow {
  speciesId: string;
  speciesLabel: string;        // “Común - Científico”
  commonName?: string;
  scientificName?: string;
  description: string;
  markingSystem: string;
  sex: SexValue;
}


@Component({
  selector: 'app-request',
  standalone: true,
  imports: [
    TitleBarComponent,
    ReactiveFormsModule,
    PopoverIconComponent,
    CommonModule,
    NgxTippyModule,
    DynamicFormFieldComponent,
    AccordionModule,
    ButtonModule,
    ToggleButtonModule,
    TooltipModule,
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.css'
})
export default class RequestComponent implements OnInit {
  @ViewChildren('fileInput') fileInputs!: QueryList<any>;

  formBuilder = inject(FormBuilder);
  serviceTypeService = inject(ServiceTypeService);
  supabaseService = inject(SupabaseService);
  serviceService = inject(ServiceService);
  toastr = inject(ToastrService);
  spinnerService = inject(NgxSpinnerService);
  miscService = inject(MiscService);
  router = inject(Router);
  requestService = inject(RequestService);
  emailService = inject(EmailService);
  localStorageService = inject(LocalStorageService);
  pdfService = inject(PdfService);

  processForm!: FormGroup;
  dataForm: FormGroup = this.formBuilder.group({});
  requestLocationForm!: FormGroup;
  generalDataForm!: FormGroup;
  individualEntityForm!: FormGroup;
  serviceSelected?: Service;
  readonly FormControlType = FormControlType;
  dynamicControls: FormControlConfig[] = [];
  formSections: FormSection[] = [];
  showAccordion = false;
  termsChecked = false;
  dateChecked = false;
  enableSectionCheckboxForm?: FormGroup;
  clientId = '';

  public tippyPropsContent: NgxTippyProps = {
    placement: 'right',
    theme: 'my-theme'
  };
  selectedOption: string | null = null;
  files: File[] = [];
  showPopovers = true;
  currentFileInputSelected?: HTMLInputElement;
  speciesSelected: {
    id: string,
    commonName: string,
    scientistName: string,
    speciesUtilizationDescription?: string,
    speciesMarkingDescription?: string,
    specieGender?: string,
  }[] = [];

  form: FormGroup = new FormGroup({});
  formFields: DynamicFormField[] = [];
  #state: WritableSignal<GlobalState<any>> = signal({
    loading: false,
    data: null,
    error: null
  });
  readonly NOTIFY_SECTION_ID = '123e4567-e89b-12d3-a456-426614174007';

  notificationsToggle = new FormControl(false);
  sectionToggles: Record<string, FormControl> = {};
  loading = true;

  colsMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };

  spanMap: Record<number, string> = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    12: 'md:col-span-12',
  };

  speciesRows: Record<string, SpeciesRow[]> = {};

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      if (
        this.serviceService.loading()
        || this.miscService.loading()
      ) {
        this.spinnerService.show();
      } else {
        this.spinnerService.hide();
      }
      const serviceTypeError = this.serviceTypeService.error();
      const serviceError = this.serviceService.error();
      const miscError = this.miscService.error();
      if (serviceTypeError || serviceError || miscError) {
        this.toastr.error(
          serviceTypeError || serviceError,
          '¡Ups!',
        );
      }
      if (serviceTypeError) {
        this.router.navigateByUrl('dashboard/home');
      }
    });
  }

  getGridColsClass(cols?: number) {
    return `grid grid-cols-1 gap-4 ${this.colsMap[cols ?? 3]}`;
  }

  private findField(sectionId: string, name: string) {
    return this.formFields.find(f => f.section_id === sectionId && f.name === name);
  }

  getColSpanClass(span?: number) {
    return this.spanMap[span ?? 1];
  }

  async ngOnInit() {

    this.spinnerService.show();
    const userString = localStorage.getItem('user');

    if (!userString) {
      this.router.navigateByUrl('auth/login');
      return;
    }

    const user: User = JSON.parse(userString);
    this.clientId = user.client_id;
    // const services = await this.serviceService.getByClientId(user.client_id);
    this.processForm = this.formBuilder.group({
      serviceType: new FormControl('', [Validators.required,]),
      service: new FormControl('', [Validators.required,]),
    });

    this.enableSectionCheckboxForm = this.formBuilder.group({
      check: new FormControl(false),
    });

    await this.serviceTypeService.getByClientId(user.client_id);
    this.processForm.get('serviceType')?.valueChanges.subscribe(serviceTypeId => {
      if (!serviceTypeId) {
        return;
      }
      this.serviceSelected = undefined;
      this.getByServiceType(serviceTypeId);
    });

    this.processForm.get('service')?.valueChanges.subscribe(serviceId => {
      if (!serviceId) {
        console.log('DEBUG: no hay',);
        this.serviceSelected = undefined;
        return;
      }
      console.log('DEBUG: serviceId', this.serviceService.serviceSelected());
      this.serviceSelected = this.serviceService.serviceSelected()?.find(service => service.id === serviceId);

      this.dataForm.markAsPristine();
      this.dataForm.markAsUntouched();
      this.getServiceById(serviceId);
    });

    // Descomentar en produccion
    setTimeout(() => {
      this.processForm.get('serviceType')?.setValue('123e4567-e89b-12d3-a456-426614174002');
      setTimeout(() => {
        this.processForm.get('service')?.setValue('123e4567-e89b-42d3-a456-426614174007');
      }, 500);
    }, 1000);

  }

  search(controlName: string): void {
    const value: string | null = this.dataForm.get(controlName)?.value;
    console.log('DEBUG: search', value);

    if (!!value) {
    }
  }

  openFileInput(id: string) {
    this.currentFileInputSelected = document.getElementById('fileInput' + id) as HTMLInputElement;;
    this.currentFileInputSelected?.click();
  }

  onFileSelected(event: any, controlName: string) {
    const file = event.target.files[0];
    console.log('DEBUG: controlName', controlName);
    if (file) {
      this.dataForm.patchValue({
        [controlName]: file
      });
      this.currentFileInputSelected!.value = '';
    }
  }

  getByServiceType(serviceTypeId: string) {
    this.spinnerService.show();
    this.serviceService.getByServiceTypeAndClient(serviceTypeId, this.clientId);
    this.spinnerService.hide();
  }

  async getServiceById(serviceId: string) {
    this.showPopovers = false;

    const fields = await this.serviceService.getFormFieldsByService(serviceId);

    this.formFields = fields;
    this.form = this.buildDynamicForm(fields);
    this.listenToDependentSelects();

    this.initSectionToggles();
    for (const s of this.getSections()) {
      if (s.is_collapsible) this.wireToggleForSection(s.id, this.sectionToggles[s.id]);
    }
    console.log('DEBUG: form', this.form);

    // Descomentar en produccion
    this.fillFakeData();
  }

  initSectionToggles(): void {
    for (const s of this.getSections()) {
      if (!s.is_collapsible) continue;
      const visible = !(s.collapsed_by_default ?? true); // visible = opuesto a collapsed_by_default
      this.sectionToggles[s.id] = new FormControl(visible);
    }
  }

  wireToggleForSection(sectionId: string, toggle: FormControl): void {
    this.setRequiredForSection(sectionId, !!toggle.value);        // estado inicial
    toggle.valueChanges.subscribe(v => this.setRequiredForSection(sectionId, !!v));
  }

  setRequiredForSection(sectionId: string, enable: boolean): void {
    const group = this.getSectionGroup(sectionId);
    if (!group) return;
    const fields = this.getFieldsBySection(sectionId);

    for (const f of fields) {
      const ctrl = group.get(f.name) as FormControl;
      if (!ctrl) continue;

      const validators: any[] = [];
      if (enable && f.required) validators.push(Validators.required);
      if (f.name === 'email') validators.push(Validators.email);
      if (f.pattern) {
        const normalized = f.pattern.replace(/\\\\/g, '\\');
        try { validators.push(Validators.pattern(new RegExp(normalized))); } catch { }
      }
      ctrl.setValidators(validators);
      ctrl.updateValueAndValidity({ emitEvent: false });
      if (!enable) ctrl.reset(null, { emitEvent: false }); // opcional
    }
  }

  private buildValidatorsForField(field: DynamicFormField, forceRequired: boolean): ValidatorFn[] {
    const v: ValidatorFn[] = [];

    // required solo si la sección está visible
    if (forceRequired && field.required) v.push(Validators.required);

    // tu lógica adicional (igual a buildDynamicForm)
    if (field.name === 'email') v.push(Validators.email);

    if (field.pattern) {
      const normalizedPattern = field.pattern.replace(/\\\\/g, '\\');
      try { v.push(Validators.pattern(new RegExp(normalizedPattern))); }
      catch (e) { console.warn('Regex inválido desde BD:', field.pattern, e); }
    }

    return v;
  }


  getSections() {
    const unique: {
      id: string; title: string; description?: string;
      tooltip_title?: string; tooltip_description?: string;
      is_collapsible?: boolean; collapsed_by_default?: boolean;
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
          is_collapsible: !!(f as any).section_is_collapsible,
          collapsed_by_default: !!(f as any).section_collapsed_by_default,
        });
        seen.add(f.section_id);
      }
    }
    return unique;
  }

  getFieldsBySection(sectionId: string) {
    return this.formFields.filter(f => f.section_id === sectionId);
  }

  listenToDependentSelects(): void {
    AppUtils.listenToDependentSelects(
      this.supabaseService.client,
      this.form,
      this.formFields,
      (loading) => {
        // actualizar señal local si quieres
        this.#state.update(s => ({ ...s, loading }));

        // controlar el spinner global
        if (
          loading ||
          this.serviceService.loading() ||
          this.miscService.loading()
        ) {
          this.spinnerService.show();
        } else {
          this.spinnerService.hide();
        }
      }
    );
  }


  async onSubmit() {

    // try {
    //   const resp = await this.emailService.sendEmail({ to: 'riojasmx@gmail.com' });
    //   console.log('OK', resp);
    // } catch (e) {
    //   console.error('ERROR', e);
    // }
    this.form.markAllAsTouched();

    // Imprimir en consola los controles inválidos
    if (this.form.invalid) {
      console.log('=== CONTROLES INVÁLIDOS ===');
      this.logInvalidControls(this.form);
      console.log('===========================');
      return;
    }

    const payload = this.form.value;

    console.log('DEBUG: payload', payload);

    try {
      // Mostrar loading con mensaje personalizado
      this.spinnerService.show();

      const requestResult = await this.requestService.submitRequest({
        form: this.form,
        formFields: this.formFields,
        serviceId: this.processForm.get('service')?.value,
        userId: this.getUserId()   // Usar el id del usuario, no el client_id
      });

      const { id: requestId, folio } = requestResult;

      // Obtener información del usuario para el correo y mensaje
      const { data: { user } } = await supabaseClient.auth.getUser();
      const userEmail = user?.email || 'correo no disponible';

      // Obtener nombre completo del usuario desde localStorage
      const storedUser = this.localStorageService.getUser();
      const userFullName = storedUser ? `${storedUser.name} ${storedUser.last_names}`.trim() : 'Usuario';

      // Preparar datos mínimos para enviar al backend
      const emailData = {
        requestId: requestId,
        userEmail: userEmail,
        userFullName: userFullName
      };

      // Mostrar en consola lo que se va a enviar
      console.log('=== DATOS PARA ENVÍO DE CORREO AL BACKEND ===');
      console.log('Datos que se enviarán:', emailData);
      console.log('==========================================');

      // Enviar correo de confirmación al usuario (solo datos mínimos)
      try {
        if (user?.email) {
          await this.emailService.sendEmail(emailData);
        }
      } catch (emailError) {
        console.warn('Error al enviar correo de confirmación:', emailError);
        // No mostramos error al usuario ya que el trámite se creó exitosamente
      }

      // Mensaje personalizado con folio y email del usuario
      // Generar PDF automáticamente
      try {
        console.log('Generando PDF para request:', requestId);
        const pdfResult = await this.pdfService.generateLicensePDF(requestId);

        if (pdfResult.success) {
          console.log('PDF generado exitosamente:', pdfResult.pdf_url);

          // Mostrar mensaje de éxito con opción de descargar PDF
          this.toastr.success(
            `Trámite creado exitosamente.<br>
             <strong>Folio:</strong> ${folio}<br>
             Los datos del trámite han sido enviados a: <strong>${userEmail}</strong><br>
             <strong>PDF generado exitosamente</strong> -
             <a href="${pdfResult.pdf_url}" target="_blank" style="color: #007bff; text-decoration: underline;">
               Ver/Descargar PDF
             </a>`,
            'Solicitud Enviada',
            {
              enableHtml: true,
              timeOut: 12000, // Más tiempo para ver el enlace
              closeButton: true
            }
          );
        } else {
          throw new Error(pdfResult.error || 'Error al generar PDF');
        }
      } catch (pdfError: any) {
        console.error('Error generando PDF:', pdfError);

        // Mostrar mensaje de éxito del trámite pero con advertencia del PDF
        this.toastr.success(
          `Trámite creado exitosamente.<br>
           <strong>Folio:</strong> ${folio}<br>
           Los datos del trámite han sido enviados a: <strong>${userEmail}</strong>`,
          'Solicitud Enviada',
          {
            enableHtml: true,
            timeOut: 8000,
            closeButton: true
          }
        );

        // Mostrar advertencia separada para el PDF
        this.toastr.warning(
          'El trámite se guardó correctamente, pero hubo un problema al generar el PDF. Puedes intentar generarlo más tarde.',
          'PDF no generado',
          {
            timeOut: 8000,
            closeButton: true
          }
        );
      }

      // redirige si quieres
      this.router.navigate(['/dashboard/home']);
    } catch (err: any) {
      console.error(err);
      this.toastr.error(err?.message ?? 'No se pudo guardar la solicitud');
    } finally {
      this.spinnerService.hide();
    }
  }

  buildDynamicForm(fields: DynamicFormField[]): FormGroup {
    const root = this.formBuilder.group({});
    const sectionGroups = new Map<string, FormGroup>();

    for (const f of fields) {
      // crea el grupo por sección si no existe
      if (!sectionGroups.has(f.section_id)) {
        const sg = this.formBuilder.group({});
        sectionGroups.set(f.section_id, sg);
        root.addControl(f.section_id, sg);

        // 👇 si la sección debe tener tabla de especies, agrega el FormArray
        const anyFieldInSection = fields.find(x => x.section_id === f.section_id && x.extra_config?.renderSpeciesTable);
        if (anyFieldInSection) {
          sg.addControl('species_list', new FormArray([])); // {id,label} por elemento
        }

      }
      const sg = sectionGroups.get(f.section_id)!;

      // valor inicial y validadores
      const initial = f.type === 'file' ? null : (f.default_value ?? '');

      const validators = [];

      if (f.required) validators.push(Validators.required);

      if (f.name === 'email') {
        validators.push(Validators.email);              // plus a tu pattern
      }
      if (f.pattern) {
        // 👇 des-escapa \\ a \  (por si vino “doble” del JSON/SQL)
        const normalizedPattern = f.pattern.replace(/\\\\/g, '\\');
        try {
          validators.push(Validators.pattern(new RegExp(normalizedPattern)));
        } catch (e) {
          console.warn('Regex inválido desde BD:', f.pattern, e);
        }
      }

      // agrega el control dentro del grupo de su sección
      sg.addControl(f.name, new FormControl(initial, validators));
    }

    root.addControl('privacyAccepted', new FormControl(false, Validators.requiredTrue));
    this.loading = false;

    return root;
  }

  getSectionGroup(sectionId: string): FormGroup {
    return this.form.get(sectionId) as FormGroup;
  }

  getControl(sectionId: string, fieldName: string): FormControl {
    return this.form.get([sectionId, fieldName]) as FormControl;
  }

  setFieldValue(sectionId: string, fieldName: string, value: any): void {
    this.form.get([sectionId, fieldName])?.setValue(value);
  }


  async onSubmitForm(): Promise<void> {
    console.log('DEBUG: processformvalue', this.processForm.value);
  }

  submit(): void {
    this.dataForm.markAllAsTouched();
    console.log('DEBUG: submit', this.dataForm.value);
    if (!this.termsChecked) {
      this.toastr.warning(
        'Debe aceptar los términos de Aviso de privacidad',
      );
      return;
    }

    if (this.dataForm.invalid) {
      return;
    }
    console.log('DEBUG: VALIDDDD',);
  }

  onCheckboxChange(event: any, formSectionId: string, from: string) {
    const checked: boolean = event.target.checked;

    if (this.selectedOption === formSectionId) {
      this.selectedOption = null; // Desmarca el checkbox si se hace clic en el ya seleccionado
    } else {
      this.selectedOption = formSectionId; // Marca el checkbox y desmarca los otros
    }

    if (formSectionId === '123e4567-fs9b-12d3-a456-426614174007') {
      const formSection = this.formSections.find(section => section.id === '123e4567-fs9b-12d3-a456-426614174007');

      if (from === 'menu') {
        this.enableSectionCheckboxForm?.get('check')?.setValue(!checked);
        if (this.enableSectionCheckboxForm?.get('check')?.value) {
          formSection?.form_controls.forEach(control => this.addRequiredValidator(control.name));
        } else {
          formSection?.form_controls.forEach(control => this.removeValidators(control.name));
        }
      } else {
        if (checked) {
          formSection?.form_controls.forEach(control => this.addRequiredValidator(control.name));
        } else {
          formSection?.form_controls.forEach(control => this.removeValidators(control.name));
        }
      }

    }
  }

  onFieldAction(evt: { action: string; field: DynamicFormField }) {
    switch (evt.action) {
      case 'searchUma':
        this.searchUma(evt.field);
        break;
      case 'addSpecies':
        this.addSpeciesToList(evt.field);
        break;
      case 'addSpeciesAfterField':
        this.onAddSpeciesRow(evt.field.section_id);
        break;
      default:
        console.warn('Acción no soportada', evt);
    }
  }

  addSpeciesToList(field: DynamicFormField) {
    const sg = this.getSectionGroup(field.section_id);
    const selectedValue = sg.get(field.name)?.value;

    const option = (field.options || []).find(o => o.value === selectedValue);
    if (!option || !selectedValue) {
      this.toastr.info('Seleccione una especie para agregar.');
      return;
    }

    const list = sg.get('species_list') as FormArray;
    const already = list.value?.some((it: any) => it.id === selectedValue);
    if (already) {
      this.toastr.info('La especie ya está en la lista.');
      return;
    }

    list.push(this.formBuilder.group({
      id: [selectedValue],
      label: [option.label]
    }));

    // Limpia el select
    sg.get(field.name)?.setValue('');
  }

  onAddSpeciesRow(sectionId: string) {
    const sg = this.getSectionGroup(sectionId);         // FormGroup anidado de esa sección
    const speciesCtrl = sg.get('species');
    const descCtrl = sg.get('description');
    const markCtrl = sg.get('marking_system');
    const sexCtrl = sg.get('sex');

    // Validar requeridos
    speciesCtrl?.markAsTouched();
    descCtrl?.markAsTouched();
    markCtrl?.markAsTouched();
    sexCtrl?.markAsTouched();

    if (sg.invalid) return;

    const speciesId: string = speciesCtrl?.value;
    const description: string = descCtrl?.value?.trim() ?? '';
    const markingSystem: string = markCtrl?.value?.trim() ?? '';
    const sex: SexValue = sexCtrl?.value ?? 'unsexed';

    // Buscar label y (opcional) separar nombres
    const speciesField = this.findField(sectionId, 'species');
    const opt = speciesField?.options?.find(o => o.value === speciesId);
    const speciesLabel = opt?.label ?? '';
    // si tu label viene "Común - Científico"
    const [commonName, scientificName] = speciesLabel.split(' - ').map(s => s?.trim());

    // Inicializa contenedor si no existe
    if (!this.speciesRows[sectionId]) this.speciesRows[sectionId] = [];

    // Agrega fila
    this.speciesRows[sectionId].push({
      speciesId,
      speciesLabel,
      commonName,
      scientificName,
      description,
      markingSystem,
      sex
    });

    // Limpia campos (si así lo quieres)
    speciesCtrl?.setValue('');
    descCtrl?.reset('');
    markCtrl?.reset('');
    sexCtrl?.setValue('unsexed');         // o null
  }

  removeSpeciesFromList(sectionId: string, index: number) {
    const list = (this.getSectionGroup(sectionId).get('species_list') as FormArray);
    list.removeAt(index);
  }

  removeSpeciesRow(sectionId: string, index: number) {
    if (!this.speciesRows[sectionId]) return;
    this.speciesRows[sectionId].splice(index, 1);
  }

  getSpeciesList(sectionId: string): FormArray {
    return this.getSectionGroup(sectionId).get('species_list') as FormArray;
  }


  async searchUma(field: DynamicFormField) {
    const sectionId = field.section_id;
    const key = this.getSectionGroup(sectionId).get(field.name)?.value?.trim();
    if (!key) {
      this.toastr.info('Ingrese una clave de registro para buscar.');
      return;
    }

    try {
      this.spinnerService.show();
      // ejemplo de búsqueda en una tabla o vista `uma_registry`
      const { data, error } = await this.supabaseService.client
        .from('uma_registry')
        .select('*')
        .ilike('key', key); // o .eq('key', key)

      if (error) throw error;

      if (!data?.length) {
        this.toastr.warning('No se encontraron registros con esa clave.');
        return;
      }

      // aquí puedes abrir modal, autocompletar otros campos, etc.
      this.toastr.success(`Se encontraron ${data.length} resultado(s).`);
      // ejemplo: setear algún campo si lo deseas…
      // this.getSectionGroup(sectionId).get('otra_prop')?.setValue(data[0].nombre);
    } catch (e: any) {
      console.error(e);
      this.toastr.error('Error realizando la búsqueda de UMA.');
    } finally {
      this.spinnerService.hide();
    }
  }

  addRequiredValidator(controlName: string) {
    this.dataForm.get(controlName)?.setValidators([Validators.required]);
    this.dataForm.get(controlName)?.updateValueAndValidity();
  }

  removeValidators(controlName: string) {
    this.dataForm.get(controlName)?.clearValidators();
    this.dataForm.get(controlName)?.updateValueAndValidity();
  }

  getMunicipalitiesByState(stateId: string, suffix: string) {
    this.spinnerService.show();
    this.miscService.getMunicipalitiesByState(stateId)!.subscribe(result => {
      this.spinnerService.hide();

      const newOptions: SelectInputTypeOptions[] = [];

      result.forEach(municipality => {
        newOptions.push({
          value: municipality.id.toString(),
          label: municipality.name,
          is_selected: false,
        });
      });

      const municipalityControlName = !suffix ? 'municipality' : `municipality-${suffix}`;
      const control = this.dynamicControls.find(control => control.name === municipalityControlName);
      if (!!control) {
        control!.select_options = newOptions;
      }
    });
  }

  onTermsChecked(event: any, control: string): void {
    console.log('DEBUG: event', event.target.checked);
    if (control === 'terms') {
      this.termsChecked = event.target.checked;
    } else {
      this.dateChecked = event.target.checked;
    }
  }

  resetForms(): void {
    this.processForm.reset();
    this.dataForm.reset();
  }

  // Pon esto dentro de tu RequestComponent

  /** Utilidad para crear archivos fake con el MIME correcto */
  private makeFakeFile(name: string, type: string, sizeKB = 16): File {
    const blob = new Blob([new Uint8Array(sizeKB * 1024)], { type });
    return new File([blob], name, { type });
  }

  /** Rellena el formulario anidado con data fake */
  fillFakeData(): void {
    // ---- Archivos fake ----
    const fakePdf = this.makeFakeFile('documento.pdf', 'application/pdf', 40);
    const fakePng = this.makeFakeFile('firma.png', 'image/png', 20);

    // ---- Payload anidado (mapea 1:1 con tu estructura de form) ----
    const values: any = {
      '123e4567-e89b-12d3-a456-426614174000': {
        state_id: '5',
        municipality_id: '5030',
      },
      '11f64c89-feca-49a6-93aa-a9eeb85667c6': {
        curp: 'RIMC840801HNLJRS00',
        rfc: 'RIMC84080169A',
        rupa: 'RUPA-000123',
      },
      '123e4567-e89b-12d3-a456-426614174002': {
        first_name: 'César',
        paternal_last_name: 'Riojas',
        maternal_last_name: 'Martínez',
        sex: 'male', // ajusta al valor que uses en BD ('M'/'F', '1'/'2', etc.)
      },
      '123e4567-e89b-12d3-a456-426614174003': {
        legal_name: 'Cinegética del Norte S.A. de C.V.',
      },
      '123e4567-e89b-12d3-a456-426614174004': {
        first_name: 'Jorge',
        paternal_last_name: 'Pérez',
        maternal_last_name: 'López',
      },
      '123e4567-e89b-12d3-a456-426614174005': {
        first_name: 'Laura',
        paternal_last_name: 'Gómez',
        maternal_last_name: 'Hernández',
      },
      '123e4567-e89b-12d3-a456-426614174006': {
        postal_code: '25000',
        street: 'Acuña',
        external_number: '431',
        interior_number: '',
        neighborhood: 'Centro',
        town: 'Saltillo',
        state: '5',
        municipality: '5030',
        area_code: '844',
        phone: '8448806948',
        extension: '',
        mobile: '8448806948',
        email: 'cesar.riojas@hotmail.com',
      },
      // '123e4567-e89b-12d3-a456-426614174007': {
      //   postal_code: '25000',
      //   street: 'Acuña',
      //   external_number: '431',
      //   interior_number: '',
      //   neighborhood: 'Centro',
      //   town: 'Saltillo',
      //   state: '5',
      //   municipality: '5030',
      //   area_code: '844',
      //   phone: '8448806948',
      //   extension: '',
      //   mobile: '8448806948',
      //   email: 'cesar.riojas@hotmail.com',
      // },
      '123e4567-e89b-12d3-a456-426614174008': {
        request: 'first_time',
        temporarity: 'annual',
        nationality: 'us',
        migration_quality: 'national',
        organization: 'Club Venados del Valle',
      },
      '123e4567-e89b-12d3-a456-426614174009': {
        digitalPhotoAndSignature: fakePdf,
        paymentReceiptForFees: fakePdf,
        officialID: fakePdf,
        evaluationApprovalCertificate: fakePdf,
      },
      '123e4567-e89b-12d3-a456-426614174010': {
        signatureImage: fakePng,
      },
      privacyAccepted: true,
    };

    // ---- Patch general ----
    this.form.patchValue(values);

    // ---- Tip: si tienes selects dependientes (state -> municipality),
    // setea primero 'state' y luego 'municipality' con un pequeño delay
    const setStateAndMunicipality = (sectionId: string, stateCtrl: string, muniCtrl: string, s: string, m: string) => {
      const g = this.getSectionGroup(sectionId);
      g.get(stateCtrl)?.setValue(s);
      // deja que se carguen opciones por el listener y luego setea municipio
      setTimeout(() => g.get(muniCtrl)?.setValue(m), 150);
    };

    // Lugar de solicitud (usa state_id / municipality_id)
    setStateAndMunicipality('123e4567-e89b-12d3-a456-426614174000', 'state_id', 'municipality_id', '5', '5030');

    // Domicilio y Notificaciones (usa state / municipality)
    setStateAndMunicipality('123e4567-e89b-12d3-a456-426614174006', 'state', 'municipality', '5', '5030');
    setStateAndMunicipality('123e4567-e89b-12d3-a456-426614174007', 'state', 'municipality', '5', '5030');

    // Marca como touched/dirty si quieres ver validaciones listas
    this.form.markAsDirty();
    this.form.markAllAsTouched();
  }

  private getUserId(): string {
    const storedUser = this.localStorageService.getUser();
    return storedUser?.id || '';
  }

  /**
   * Imprime en consola todos los controles inválidos del formulario
   */
  private logInvalidControls(formGroup: FormGroup, parentPath: string = ''): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      const currentPath = parentPath ? `${parentPath}.${key}` : key;

      if (control instanceof FormGroup) {
        // Si es un FormGroup (sección), revisar recursivamente
        if (control.invalid) {
          console.log(`📁 Sección inválida: ${currentPath}`);
          this.logInvalidControls(control, currentPath);
        }
      } else if (control instanceof FormControl) {
        // Si es un FormControl (campo), verificar si es inválido
        if (control.invalid) {
          const fieldInfo = this.getFieldInfo(key, currentPath);
          const errors = this.getControlErrors(control);

          console.log(`❌ Campo inválido: ${currentPath}`, {
            campo: fieldInfo.name,
            seccion: fieldInfo.section,
            valor: control.value,
            errores: errors,
            touched: control.touched,
            dirty: control.dirty
          });
        }
      }
    });
  }

  /**
   * Obtiene información del campo basándose en su nombre y path
   */
  private getFieldInfo(fieldName: string, fullPath: string): { name: string, section: string } {
    // Buscar información del campo en formFields
    const field = this.formFields.find(f => f.name === fieldName);

    if (field) {
      const section = this.getSections().find(s => s.id === field.section_id);
      return {
        name: field.label || field.name,
        section: section?.title || 'Sección desconocida'
      };
    }

    // Para campos especiales como privacyAccepted
    if (fieldName === 'privacyAccepted') {
      return {
        name: 'Aviso de Privacidad',
        section: 'Términos y Condiciones'
      };
    }

    // Fallback
    return {
      name: fieldName,
      section: 'Sección desconocida'
    };
  }

  /**
   * Obtiene los errores de validación de un control
   */
  private getControlErrors(control: FormControl): any {
    if (!control.errors) return null;

    const errorMessages: any = {};

    Object.keys(control.errors).forEach(key => {
      switch (key) {
        case 'required':
          errorMessages[key] = 'Este campo es requerido';
          break;
        case 'email':
          errorMessages[key] = 'Formato de email inválido';
          break;
        case 'pattern':
          errorMessages[key] = 'El formato no es válido';
          break;
        case 'minlength':
          errorMessages[key] = `Mínimo ${control.errors?.[key].requiredLength} caracteres`;
          break;
        case 'maxlength':
          errorMessages[key] = `Máximo ${control.errors?.[key].requiredLength} caracteres`;
          break;
        default:
          errorMessages[key] = control.errors?.[key];
      }
    });

    return errorMessages;
  }

  private getMunicipalityFromForm(): string {
    // Buscar municipio en las diferentes secciones del formulario
    const formValue = this.form.value;

    // Intentar obtener de diferentes secciones posibles
    for (const sectionId in formValue) {
      const section = formValue[sectionId];
      if (section) {
        // Buscar por diferentes nombres de campo de municipio
        if (section.municipality_id || section.municipality) {
          const municipalityId = section.municipality_id || section.municipality;

          // Buscar el nombre del municipio en los controles dinámicos
          const municipalityControl = this.dynamicControls.find(control =>
            control.name === 'municipality' || control.name === 'municipality_id'
          );

          if (municipalityControl?.select_options) {
            const selectedOption = municipalityControl.select_options.find(option =>
              option.value === municipalityId
            );
            if (selectedOption) {
              return selectedOption.label.toUpperCase();
            }
          }
        }

        // Si hay un campo 'town' usar ese
        if (section.town) {
          return section.town.toUpperCase();
        }
      }
    }

    // Fallback por defecto
    return "SALTILLO";
  }

  hasSpeciesTable(sectionId: string): boolean {
    const fields = this.getFieldsBySection(sectionId);
    return fields.some(field => field.extra_config?.renderSpeciesTable === true);
  }

  renderSpeciesTableAferFields(sectionId: string): boolean {
    const fields = this.getFieldsBySection(sectionId);
    return fields.some(field => field.extra_config?.renderSpeciesTableAfterFields === true);
  }

}
