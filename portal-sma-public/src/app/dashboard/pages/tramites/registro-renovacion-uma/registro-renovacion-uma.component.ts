import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestService } from '../../../../services/request/request.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { RequestLocationSectionComponent } from '../../../../shared/sections/request-location-section/request-location-section.component';
import { GeneralDataSectionComponent } from '../../../../shared/sections/general-data-section/general-data-section.component';
import { IndividualPersonSectionComponent } from '../../../../shared/sections/individual-person-section/individual-person-section.component';
import { LegalEntitySectionComponent } from '../../../../shared/sections/legal-entity-section/legal-entity-section.component';
import { LegalRepresentativeSectionComponent } from '../../../../shared/sections/legal-representative-section/legal-representative-section.component';
import { AuthorizedPersonSectionComponent } from '../../../../shared/sections/authorized-person-section/authorized-person-section.component';
import { AddressContactSectionComponent } from '../../../../shared/sections/address-contact-section/address-contact-section.component';
import { NotificationAddressContactSectionComponent } from '../../../../shared/sections/notification-address-contact-section/notification-address-contact-section.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';
import { SignatureItemComponent } from '../../../../shared/sections/signature-item/signature-item.component';
import { RequirementsSectionComponent, Requirement } from '../../../../shared/sections/requirements-section/requirements-section.component';
import { PrivacyAcceptanceSectionComponent } from '../../../../shared/sections/privacy-acceptance-section/privacy-acceptance-section.component';
import { SupabaseService } from '../../../../services/supabase.service';
import { PopoverIconComponent } from '../../../../shared/components/popover-icon/popover-icon.component';
import { DropdownModule } from 'primeng/dropdown';

/**
 * Trámite: REGISTRO O RENOVACIÓN DE UNIDADES DE MANEJO PARA LA CONSERVACIÓN DE LA VIDA SILVESTRE (UMA)
 * SEMARNAT-08-022
 *
 * Secciones: Lugar de solicitud, Datos generales, Persona física, Persona moral,
 * Representante legal, Persona(s) autorizada(s), Domicilio y medios de contacto,
 * Notificaciones - Domicilio y medios de contacto, Firma, Aviso de privacidad.
 */
@Component({
  selector: 'app-registro-renovacion-uma',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RequestLocationSectionComponent,
    GeneralDataSectionComponent,
    IndividualPersonSectionComponent,
    LegalEntitySectionComponent,
    LegalRepresentativeSectionComponent,
    AuthorizedPersonSectionComponent,
    AddressContactSectionComponent,
    NotificationAddressContactSectionComponent,
    SignatureSectionComponent,
    SignatureItemComponent,
    RequirementsSectionComponent,
    PrivacyAcceptanceSectionComponent,
    PopoverIconComponent,
    DropdownModule,
  ],
  templateUrl: './registro-renovacion-uma.component.html',
  styleUrl: './registro-renovacion-uma.component.css',
})
export default class RegistroRenovacionUmaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private requestService = inject(RequestService);
  private toastr = inject(ToastrService);
  private spinnerService = inject(NgxSpinnerService);
  private supabaseService = inject(SupabaseService);

  form: FormGroup = this.fb.group({
    requestLocation: this.fb.group({
      state_id: ['', Validators.required],
      municipality_id: ['', Validators.required],
    }),
    generalData: this.fb.group({
      curp: ['', Validators.required],
      rfc: ['', Validators.required],
      rupa: [''],
    }),
    individualPerson: this.fb.group({
      nombre: ['', Validators.required],
      apellido_paterno: ['', Validators.required],
      apellido_materno: ['', Validators.required],
      sexo: ['', Validators.required],
    }),
    legalEntity: this.fb.group({
      denominacion_razon_social: ['', Validators.required],
    }),
    legalRepresentative: this.fb.group({
      representante_nombre: ['', Validators.required],
      representante_apellido_paterno: ['', Validators.required],
      representante_apellido_materno: ['', Validators.required],
    }),
    authorizedPerson: this.fb.group({
      autorizada_nombre: ['', Validators.required],
      autorizada_apellido_paterno: ['', Validators.required],
      autorizada_apellido_materno: ['', Validators.required],
    }),
    addressContact: this.fb.group({
      postal_code: ['', Validators.required],
      street: ['', Validators.required],
      external_number: ['', Validators.required],
      internal_number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      city: ['', Validators.required],
      state_id: ['', Validators.required],
      municipality_id: ['', Validators.required],
      area_code: ['', Validators.required],
      phone: ['', Validators.required],
      extension: ['', Validators.required],
      mobile_phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    }),
    notificationAddressContact: this.fb.group({
      enable_notifications: [false],
      postal_code: [''],
      street: [''],
      external_number: [''],
      internal_number: [''],
      neighborhood: [''],
      city: [''],
      state_id: [''],
      municipality_id: [''],
      area_code: [''],
      phone: [''],
      extension: [''],
      mobile_phone: [''],
      email: [''],
    }),
    transactionInfo: this.fb.group({
      petition_type: ['', Validators.required],
      management_type: ['', Validators.required],
      registration_latitude: [''],
      registration_longitude: [''],
      registration_utm_zone: [''],
      registration_surface_hectares: [''],
      renovation_uma_number: [''],
      facility_postal_code: ['', Validators.required],
      facility_street: ['', Validators.required],
      facility_external_number: ['', Validators.required],
      facility_internal_number: [''],
      facility_neighborhood: ['', Validators.required],
      facility_city: ['', Validators.required],
      facility_state_id: ['', Validators.required],
      facility_municipality_id: ['', Validators.required],
      facility_area_code: ['', Validators.required],
      facility_phone: ['', Validators.required],
      facility_extension: [''],
      facility_mobile_phone: [''],
      facility_email: ['', [Validators.required, Validators.email]],
    }),
    additionalFormatType: ['ninguno'],
    additionalFormatCartaUma: this.fb.group({
      lugar_state_id: [''],
      lugar_municipality_id: [''],
      nombre: [''],
      apellido_paterno: [''],
      apellido_materno: [''],
      identificacion_oficial: [''],
      expedida_por: [''],
      denominacion_razon_social: [''],
      numero_acta_constitutiva: [''],
      acta_constitutiva: [''],
      uma_denominada: [''],
      uma_numero_registro: [''],
      uma_state_id: [''],
      uma_municipality_id: [''],
      objetivos_especificos: [''],
      plan_manejo_tipo: [''],
    }),
    additionalFormatCartaPredioFederal: this.fb.group({
      lugar_state_id: [''],
      lugar_municipality_id: [''],
      nombre: [''],
      apellido_paterno: [''],
      apellido_materno: [''],
      identificacion_oficial: [''],
      expedida_por: [''],
      denominacion_razon_social: [''],
      numero_acta_constitutiva: [''],
      acta_constitutiva: [''],
      pfc_denominado: [''],
      pfc_numero_control: [''],
      pfc_state_id: [''],
      pfc_municipality_id: [''],
      especie_grupo_especies: [''],
    }),
    requirements: this.fb.group({
      inventario_ejemplares: [null, Validators.required],
      plan_manejo_carta_adhesion: [null, Validators.required],
      nombramiento_responsable_tecnico: [null, Validators.required],
      carta_topografica: [null, Validators.required],
      documentos_propiedad_planos: [null, Validators.required],
      archivo_shp_excel: [null, Validators.required],
      documentacion_renovacion: [null, Validators.required],
      acreditar_personalidad: [null, Validators.required],
      actas_asamblea_ejidos: [null, Validators.required],
      estudios_poblacionales: [null, Validators.required],
    }),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    signatureTechnicalResponsible: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    privacyAcceptance: this.fb.group({
      privacyAccepted: [false, Validators.requiredTrue],
    }),
  });

  serviceId: string | null = null;
  loading = false;

  get requestLocationGroup(): FormGroup {
    return this.form.get('requestLocation') as FormGroup;
  }

  get generalDataGroup(): FormGroup {
    return this.form.get('generalData') as FormGroup;
  }

  get individualPersonGroup(): FormGroup {
    return this.form.get('individualPerson') as FormGroup;
  }

  get legalEntityGroup(): FormGroup {
    return this.form.get('legalEntity') as FormGroup;
  }

  get legalRepresentativeGroup(): FormGroup {
    return this.form.get('legalRepresentative') as FormGroup;
  }

  get authorizedPersonGroup(): FormGroup {
    return this.form.get('authorizedPerson') as FormGroup;
  }

  get addressContactGroup(): FormGroup {
    return this.form.get('addressContact') as FormGroup;
  }

  get notificationAddressContactGroup(): FormGroup {
    return this.form.get('notificationAddressContact') as FormGroup;
  }

  get transactionInfoGroup(): FormGroup {
    return this.form.get('transactionInfo') as FormGroup;
  }

  get additionalFormatCartaUmaGroup(): FormGroup {
    return this.form.get('additionalFormatCartaUma') as FormGroup;
  }

  get additionalFormatCartaPredioFederalGroup(): FormGroup {
    return this.form.get('additionalFormatCartaPredioFederal') as FormGroup;
  }

  get requirementsGroup(): FormGroup {
    return this.form.get('requirements') as FormGroup;
  }

  get signatureGroup(): FormGroup {
    return this.form.get('signature') as FormGroup;
  }

  get signatureTechnicalResponsibleGroup(): FormGroup {
    return this.form.get('signatureTechnicalResponsible') as FormGroup;
  }

  get privacyAcceptanceGroup(): FormGroup {
    return this.form.get('privacyAcceptance') as FormGroup;
  }

  stateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  municipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  facilityStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  facilityMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  formatLugarStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  formatLugarMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  formatUnitStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  formatUnitMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];

  petitionTypeOptions: { value: string; label: string }[] = [
    { value: 'registro', label: 'Registro' },
    { value: 'renovacion', label: 'Renovación' },
  ];
  managementTypeOptions: { value: string; label: string }[] = [
    { value: 'vida_libre', label: 'En vida libre' },
    { value: 'intensivo', label: 'Intensivo' },
  ];
  signaturesList: Signature[] = [
    {
      controlName: 'signature_file',
      title: 'Foto de la Firma',
      description: 'Esta firma es la que aparecerá en la Solicitud de Trámite.',
    },
  ];

  requirementsList: Requirement[] = [
    {
      controlName: 'inventario_ejemplares',
      title:
        'En caso de registro, el Inventario de ejemplares, acompañado de la documentación que acredite su legal procedencia, solo cuando se trate de UMA sujetas a manejo Intensivo',
      legalReference:
        'Artículo 30, Fracción IV, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'plan_manejo_carta_adhesion',
      title:
        'En caso de registro, el plan de manejo o carta de adhesión a los planes de manejo tipo establecidos por la Secretaría',
      legalReference:
        'Artículo 30, Fracción II, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'nombramiento_responsable_tecnico',
      title: 'Nombramiento de responsable técnico',
      legalReference: 'Art. 47 bis 1 de la LGVS, Art. 34 bis del Reglamento de la LGVS',
    },
    {
      controlName: 'carta_topografica',
      title:
        'En caso de registro, carta topográfica del Instituto Nacional de Estadística, Geografía e Informática o porción digitalizada del mismo, escala 1:50,000 o de escala adecuada al tamaño del predio, a efecto de ubicar el predio o instalación',
      legalReference:
        'Artículo 30, Fracción III, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'documentos_propiedad_planos',
      title:
        'En caso de registro, copia de los documentos que acrediten los derechos de propiedad o legítima posesión de los predios o instalaciones y planos correspondientes a los mismos.',
      legalReference:
        'Artículo 30, Fracción I, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'archivo_shp_excel',
      title: 'Archivo .SHP o Excel (Cuando se trate de un Registro de UMA o Modificación en la Superficie)',
      legalReference:
        'Artículo 30, Fracción III, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'documentacion_renovacion',
      title:
        'Cuando se trate de la renovación del registro solo deberá presentar: La documentación que acredite que se ha renovado, prorrogado o ampliado la vigencia de los derechos de posesión sobre predios sujetos a manejo para la conservación y aprovechamiento sustentable de la vida silvestre.',
      legalReference:
        'Artículo 36, Párrafo primero, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'acreditar_personalidad',
      title: 'ACREDITAR PERSONALIDAD (Identificación Oficial)',
      legalReference:
        'Artículo 12, Párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'actas_asamblea_ejidos',
      title:
        'En caso de registro, cuando se trate de ejidos o tierras comunales, se deberán anexar las actas de asamblea celebradas en términos de la legislación agraria, en las cuales se tome como resolución real',
      legalReference:
        'Artículo 32, Párrafo penúltimo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'estudios_poblacionales',
      title: 'En caso de registro, estudios poblacionales (solo para fauna).',
      legalReference:
        'Art. 47 Bis, Párrafo segundo, Decreto por el que se reforman y adicionan diversas disposiciones de la Ley General de Vida Silvestre, publicado en el DOF el 6 de junio de 2012.',
    },
  ];

  ngOnInit(): void {
    // serviceId puede venir por query params (ruta directa) o ser asignado por el tramite-wrapper después de cargar el componente
    this.serviceId = this.route.snapshot.queryParamMap.get('serviceId');
    this.loadStates();
    this.listenRequestLocationStateChanges();
    this.listenAddressStateChanges();
    this.listenNotificationStateChanges();
    this.listenFacilityStateChanges();
    this.listenPetitionTypeChanges();
    this.listenFormatLugarStateChanges();
    this.listenFormatUnitStateChanges();
  }

  private listenPetitionTypeChanges(): void {
    const petitionControl = this.transactionInfoGroup.get('petition_type');
    if (!petitionControl) return;

    petitionControl.valueChanges.subscribe((value: string) => {
      const lat = this.transactionInfoGroup.get('registration_latitude');
      const lng = this.transactionInfoGroup.get('registration_longitude');
      const umaNum = this.transactionInfoGroup.get('renovation_uma_number');
      if (value === 'registro') {
        lat?.setValidators([Validators.required]);
        lng?.setValidators([Validators.required]);
        umaNum?.clearValidators();
        umaNum?.setValue('');
      } else if (value === 'renovacion') {
        lat?.clearValidators();
        lng?.clearValidators();
        lat?.setValue('');
        lng?.setValue('');
        this.transactionInfoGroup.get('registration_utm_zone')?.setValue('');
        this.transactionInfoGroup.get('registration_surface_hectares')?.setValue('');
        umaNum?.setValidators([Validators.required]);
      } else {
        lat?.clearValidators();
        lng?.clearValidators();
        umaNum?.clearValidators();
      }
      lat?.updateValueAndValidity();
      lng?.updateValueAndValidity();
      umaNum?.updateValueAndValidity();
    });
  }

  async onSubmit(): Promise<void> {
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

      const userString = localStorage.getItem('user');
      if (!userString) {
        this.router.navigate(['/auth/login']);
        return;
      }

      const user = JSON.parse(userString);
      const result = await this.requestService.submitRequest({
        form: this.form,
        formFields: [],
        serviceId: this.serviceId,
        userId: user.id,
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

  private async loadStates(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('states')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading states:', error);
        return;
      }

      const statesData = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((state: { id: string; name: string }) => ({
          value: String(state.id),
          label: state.name,
        })),
      ];

      this.stateOptions = statesData;
      this.addressStateOptions = statesData;
      this.notificationStateOptions = statesData;
      this.facilityStateOptions = statesData;
      this.formatLugarStateOptions = statesData;
      this.formatUnitStateOptions = statesData;
    } catch (e) {
      console.error('Error loading states:', e);
    }
  }

  private listenRequestLocationStateChanges(): void {
    const stateControl = this.requestLocationGroup.get('state_id');
    if (!stateControl) return;

    stateControl.valueChanges.subscribe((stateId: string) => {
      this.requestLocationGroup.get('municipality_id')?.setValue('');
      if (!stateId) {
        this.municipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadMunicipalities(stateId);
    });
  }

  private listenAddressStateChanges(): void {
    const stateControl = this.addressContactGroup.get('state_id');
    if (!stateControl) return;

    stateControl.valueChanges.subscribe((stateId: string) => {
      this.addressContactGroup.get('municipality_id')?.setValue('');
      if (!stateId) {
        this.addressMunicipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadAddressMunicipalities(stateId);
    });
  }

  private listenNotificationStateChanges(): void {
    const stateControl = this.notificationAddressContactGroup.get('state_id');
    if (!stateControl) return;

    stateControl.valueChanges.subscribe((stateId: string) => {
      this.notificationAddressContactGroup.get('municipality_id')?.setValue('');
      if (!stateId) {
        this.notificationMunicipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadNotificationMunicipalities(stateId);
    });
  }

  private async loadMunicipalities(stateId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('municipalities')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading municipalities:', error);
        return;
      }

      this.municipalityOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((m: { id: string; name: string }) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
  }

  private async loadAddressMunicipalities(stateId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('municipalities')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading municipalities:', error);
        return;
      }

      this.addressMunicipalityOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((m: { id: string; name: string }) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
  }

  private async loadNotificationMunicipalities(stateId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('municipalities')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading municipalities:', error);
        return;
      }

      this.notificationMunicipalityOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((m: { id: string; name: string }) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
  }

  private listenFacilityStateChanges(): void {
    const stateControl = this.transactionInfoGroup.get('facility_state_id');
    if (!stateControl) return;

    stateControl.valueChanges.subscribe((stateId: string) => {
      this.transactionInfoGroup.get('facility_municipality_id')?.setValue('');
      if (!stateId) {
        this.facilityMunicipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadFacilityMunicipalities(stateId);
    });
  }

  private async loadFacilityMunicipalities(stateId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('municipalities')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading municipalities:', error);
        return;
      }

      this.facilityMunicipalityOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((m: { id: string; name: string }) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
  }

  private listenFormatLugarStateChanges(): void {
    const gUma = this.additionalFormatCartaUmaGroup.get('lugar_state_id');
    const gPfc = this.additionalFormatCartaPredioFederalGroup.get('lugar_state_id');
    const handler = (stateId: string, group: FormGroup) => {
      group.get('lugar_municipality_id')?.setValue('');
      if (!stateId) {
        this.formatLugarMunicipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadFormatLugarMunicipalities(stateId);
    };
    gUma?.valueChanges.subscribe((id: string) => handler(id, this.additionalFormatCartaUmaGroup));
    gPfc?.valueChanges.subscribe((id: string) => handler(id, this.additionalFormatCartaPredioFederalGroup));
  }

  private listenFormatUnitStateChanges(): void {
    const gUma = this.additionalFormatCartaUmaGroup.get('uma_state_id');
    const gPfc = this.additionalFormatCartaPredioFederalGroup.get('pfc_state_id');
    const handler = (stateId: string, group: FormGroup) => {
      const munKey = group === this.additionalFormatCartaUmaGroup ? 'uma_municipality_id' : 'pfc_municipality_id';
      group.get(munKey)?.setValue('');
      if (!stateId) {
        this.formatUnitMunicipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadFormatUnitMunicipalities(stateId);
    };
    gUma?.valueChanges.subscribe((id: string) => handler(id, this.additionalFormatCartaUmaGroup));
    gPfc?.valueChanges.subscribe((id: string) => handler(id, this.additionalFormatCartaPredioFederalGroup));
  }

  private async loadFormatLugarMunicipalities(stateId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('municipalities')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true });
      if (error) return;
      this.formatLugarMunicipalityOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((m: { id: string; name: string }) => ({ value: String(m.id), label: m.name })),
      ];
    } catch (e) {
      console.error('Error loading format lugar municipalities:', e);
    }
  }

  private async loadFormatUnitMunicipalities(stateId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('municipalities')
        .select('id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true });
      if (error) return;
      this.formatUnitMunicipalityOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((m: { id: string; name: string }) => ({ value: String(m.id), label: m.name })),
      ];
    } catch (e) {
      console.error('Error loading format unit municipalities:', e);
    }
  }
}
