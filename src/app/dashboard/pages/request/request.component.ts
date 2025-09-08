import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren, WritableSignal, effect, inject, signal } from '@angular/core';
import { TitleBarComponent } from '../../../shared/title-bar/title-bar.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { PopoverIconComponent } from '../../../shared/components/popover-icon/popover-icon.component';
import { RequestLocationFormComponent } from '../../../shared/components/forms/request-location-form/request-location-form.component';
import { GeneralDataFormComponent } from '../../../shared/components/forms/general-data-form/general-data-form.component';
import { IndividualEntityFormComponent } from '../../../shared/components/forms/individual-entity-form/individual-entity-form.component';
import { ServiceTypeService } from '../../../services/service-type/service-type.service';
import { ServiceService } from '../../../services/service/service.service';
import { Service } from '../../../interfaces/service.interface';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Modal, ModalInterface, Popover } from 'flowbite';
import { CommonModule } from '@angular/common';
import { NgxTippyModule, NgxTippyProps } from 'ngx-tippy-wrapper';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormControlConfig, FormControlType, SelectInputTypeOptions } from '../../../interfaces/custom.dialog.interfaces';
import { AppUtils } from '../../../app.utils';
import { MiscService } from '../../../services/misc/misc.service';
import { FormSection } from '../../../interfaces/form-section.interface';
import { NgxMaskDirective } from 'ngx-mask';
import { Specie } from '../../../interfaces/specie.interface';
import { User } from '../../../interfaces/user.interface';
import { DynamicFormField } from '../../../interfaces/dynamic-form-field.interface';
import { DynamicFormFieldComponent } from '../../../shared/components/dynamic-form-field/dynamic-form-field.component';
import { TooltipComponent } from '../../../shared/components/tooltip/tooltip.component';
import { SupabaseService } from '../../../services/supabase.service';
import { GlobalState } from '../../../interfaces/global-state.interface';


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
    // this.spinnerService.hide();

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
      console.log('DEBUG: serviceId', serviceId);
      this.dataForm.markAsPristine();
      this.dataForm.markAsUntouched();
      this.getServiceById(serviceId);
    });

    // setTimeout(() => {
    //   this.processForm.get('serviceType')?.setValue('123e4567-st9b-12d3-a456-426614174002');
    //   setTimeout(() => {
    //     this.processForm.get('service')?.setValue('123e4567-s89b-12d3-a456-426614174007');
    //   }, 500);
    // }, 1000);

  }

  search(controlName: string): void {
    const value: string | null = this.dataForm.get(controlName)?.value;
    console.log('DEBUG: search', value);

    if (!!value) {
    }
  }

  addSpecie(controlName: string, formSection?: FormSection): void {
    const dynamicControl = this.dynamicControls.find(control => control.name === controlName);

    if (!!dynamicControl) {
      const formControlValue = this.dataForm.get(controlName)?.value;
      if (!!formControlValue) {
        const specie = dynamicControl.select_options?.find(option => option.value === formControlValue);
        const commonName = specie?.label.split('-')[0].trim();
        const scientistName = specie?.label.split('-')[1].trim();
        const data: any = {
          speciesUtilizationDescription: null,
          speciesMarkingDescription: null,
          specieGender: null,
        };

        let formValid = true;

        if (!!formSection) {
          formSection.form_controls.forEach(control => {
            const controlValue = this.dataForm.get(control.name)?.value;
            if (!controlValue) {
              formValid = false;
              this.toastr.info(`El campo ${control.label} no puede estar vacío`);
              return;
            }
            data[control.name] = controlValue;
          });
        }

        if (!formValid) {
          return;
        }

        data['specieGender'] = data['specieGender'] == '1' ? 'Macho' : 'Hembra';
        console.log('DEBUG: data', data);
        if (!this.speciesSelected.find(specieObj => specieObj.id === specie?.value)) {
          this.speciesSelected.push({
            id: specie?.value!,
            commonName: commonName!,
            scientistName: scientistName!,
            ...data,
          });

          this.toastr.success('Especie agregada');

          if (!!formSection) {
            this.dataForm.get('speciesMarkingDescription')?.reset();
            this.dataForm.get('speciesUtilizationDescription')?.reset();
            this.dataForm.get('speciesUtilization')?.setValue('');
          }
          console.log('DEBUG: this.speciesSelected', this.speciesSelected);
        }
      }
    }
  }

  removeSpecie(specieId: string): void {
    this.speciesSelected = this.speciesSelected.filter(specie => specie.id != specieId);
  }

  toggleModal(): void {

    const $modalElement: HTMLElement | null = document.querySelector('#species-modal');
    const modal: ModalInterface = new Modal($modalElement, undefined, {
      id: 'species-modal',
      override: true
    });

    console.log('DEBUG: modal.isVisible();', modal.isVisible());
    modal.toggle();
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

  fillDataFake(): void {
    const file = new File(['contenido del archivo'], 'archivo.txt', {
      type: 'text/plain',
    });

    this.termsChecked = true;

    // this.dataForm.get('state')?.setValue('');
    this.dataForm.get('municipality')?.setValue('5030');
    this.dataForm.get('curp')?.setValue('RIMC840801HNLJRS00');
    this.dataForm.get('rfc')?.setValue('RIMC84080169A');
    this.dataForm.get('rupa')?.setValue('');
    this.dataForm.get('names')?.setValue('Cesar');
    this.dataForm.get('last_name_1')?.setValue('Riojas');
    this.dataForm.get('last_name_2')?.setValue('Martinez');
    this.dataForm.get('gender')?.setValue('1');
    this.dataForm.get('legal_name')?.setValue('Cesar Riojas');
    this.dataForm.get('names-2')?.setValue('Cesar');
    this.dataForm.get('last_name_1-2')?.setValue('Riojas');
    this.dataForm.get('last_name_2-2')?.setValue('Martinez');
    this.dataForm.get('names-3')?.setValue('Cesar');
    this.dataForm.get('last_name_1-3')?.setValue('Riojas');
    this.dataForm.get('last_name_2-3')?.setValue('MArtinez');
    this.dataForm.get('postal_code')?.setValue('25000');
    this.dataForm.get('street')?.setValue('Acuña');
    this.dataForm.get('street_number')?.setValue('431');
    this.dataForm.get('interior_number')?.setValue('');
    this.dataForm.get('neighborhood')?.setValue('Centro');
    this.dataForm.get('town')?.setValue('Saltillo');
    this.dataForm.get('state-2')?.setValue('5');
    this.dataForm.get('municipality-2')?.setValue('530');
    this.dataForm.get('area_code')?.setValue('844');
    this.dataForm.get('phone')?.setValue('8806948');
    this.dataForm.get('extension')?.setValue('');
    this.dataForm.get('mobile')?.setValue('8448806948');
    this.dataForm.get('email')?.setValue('cesar.riojas@hotmail.com');
    this.dataForm.get('postal_code-2')?.setValue('25000');
    this.dataForm.get('street-2')?.setValue('Acuña');
    this.dataForm.get('street_number-2')?.setValue('431');
    this.dataForm.get('interior_number-2')?.setValue('');
    this.dataForm.get('neighborhood-2')?.setValue('Centro');
    this.dataForm.get('town-2')?.setValue('Saltillo');
    this.dataForm.get('state-3')?.setValue('5');
    this.dataForm.get('municipality-3')?.setValue('5030');
    this.dataForm.get('area_code-2')?.setValue('844');
    this.dataForm.get('phone-2')?.setValue('8806948');
    this.dataForm.get('extension-2')?.setValue('');
    this.dataForm.get('mobile-2')?.setValue('8448806948');
    this.dataForm.get('email-2')?.setValue('cesar.riojas@hotmail.com');
    this.dataForm.get('request')?.setValue('first_time');
    this.dataForm.get('temporarity')?.setValue('annual');
    this.dataForm.get('nationality')?.setValue('mx');
    this.dataForm.get('migration_quality')?.setValue('national');
    this.dataForm.get('organization')?.setValue('organizacion');
    this.dataForm.get('digitalPhotoAndSignature')?.setValue(file);
    this.dataForm.get('paymentReceiptForFees')?.setValue(file);
    this.dataForm.get('officialID')?.setValue(file);
    this.dataForm.get('evaluationApprovalCertificate')?.setValue(file);
    this.dataForm.get('signatureImage')?.setValue(file);
  }

  async getServiceById(serviceId: string) {
    this.showPopovers = false;

    const fields = await this.serviceService.getFormFieldsByService(serviceId);

    this.formFields = fields;
    this.form = this.buildDynamicForm(fields);
    this.listenToDependentSelects();

    console.log('DEBUG: form', this.form);
  }

  getSections() {
    const uniqueSections: {
      id: string;
      title: string;
      description?: string;
      tooltip_title?: string;
      tooltip_description?: string,
      section_id?: string,
    }[] = [];

    const seen = new Set();
    for (const field of this.formFields) {
      if (!seen.has(field.section_id)) {
        uniqueSections.push({
          id: field.section_id,
          title: field.section_title,
          description: field.section_description,
          tooltip_title: field.tooltip_title,
          tooltip_description: field.tooltip_description
        });
        seen.add(field.section_id);
      }
    }

    return uniqueSections;
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


  onSubmit() {

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // objeto anidado por sección
    const payload = this.form.value;

    console.log('DEBUG: payload', payload);

    // si necesitas plano:
    // const flat = this.flattenFormForApi(this.form.value);
  }

  // buildDynamicForm(fields: any[]): FormGroup {
  //   const group: { [key: string]: FormControl } = {};

  //   for (const field of fields) {
  //     // Determinar valor inicial
  //     const initialValue = field.default_value ?? '';

  //     // Definir validaciones
  //     const validators = [];
  //     if (field.required) {
  //       validators.push(Validators.required);
  //     }

  //     // Los campos tipo file se manejan como null inicialmente
  //     if (field.type === 'file') {
  //       group[field.name] = new FormControl(null, validators);
  //     } else {
  //       group[field.name] = new FormControl(initialValue, validators);
  //     }
  //   }

  //   return new FormGroup(group);
  // }

  buildDynamicForm(fields: DynamicFormField[]): FormGroup {
    const root = this.formBuilder.group({});
    const sectionGroups = new Map<string, FormGroup>();

    for (const f of fields) {
      // crea el grupo por sección si no existe
      if (!sectionGroups.has(f.section_id)) {
        const sg = this.formBuilder.group({});
        sectionGroups.set(f.section_id, sg);
        root.addControl(f.section_id, sg);
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

  buildFormGroup(controls: FormControlConfig[]): void {
    // console.log('DEBUG: controls', controls.map(control => control.name));

    controls.forEach(control => {
      let initialValue;

      if (control.type === FormControlType.DATE) {
        const formattedDate = this.formatDateToISO(control.initialDate!);
        initialValue = formattedDate;
      } else if (control.type === FormControlType.SELECT) {
        if (typeof control.select_options === 'string') {
          control.select_options = JSON.parse(control.select_options)
        }
        initialValue = control.initial_value;
      } else {
        initialValue = control.initial_value;
      }

      this.dataForm.addControl(control.name, new FormControl(
        initialValue,
        AppUtils.getControlValidators(control.validators),
      ));

      if (control.name.includes('state')) {
        this.listenControlChanges(control.name);
      }

    });
    setTimeout(() => {
      //   this.fillDataFake();
    }, 1000);
  }

  listenControlChanges(controlName: string): void {

    this.dataForm.get(controlName)?.valueChanges.subscribe(value => {
      const newValue = value === 'null' ? undefined : value;
      if (newValue) {
        if (controlName.includes('state')) {
          const suffix = controlName.split('-')[1];
          this.getMunicipalitiesByState(value, suffix);
        }
        // switch (controlName) {
        //   case 'state':
        //     this.getMunicipalitiesByState(value);
        //     break;

        //   default:
        //     break;
        // }
      }
    });
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

  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

}
