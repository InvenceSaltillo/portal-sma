import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UmaRegistrationSectionComponent } from '../../../../shared/sections/uma-registration-section/uma-registration-section.component';
import { RequestLocationSectionComponent } from '../../../../shared/sections/request-location-section/request-location-section.component';
import { GeneralDataSectionComponent } from '../../../../shared/sections/general-data-section/general-data-section.component';
import { IndividualPersonSectionComponent } from '../../../../shared/sections/individual-person-section/individual-person-section.component';
import { LegalEntitySectionComponent } from '../../../../shared/sections/legal-entity-section/legal-entity-section.component';
import { LegalRepresentativeSectionComponent } from '../../../../shared/sections/legal-representative-section/legal-representative-section.component';
import { AuthorizedPersonSectionComponent } from '../../../../shared/sections/authorized-person-section/authorized-person-section.component';
import { AddressContactSectionComponent } from '../../../../shared/sections/address-contact-section/address-contact-section.component';
import { NotificationAddressContactSectionComponent } from '../../../../shared/sections/notification-address-contact-section/notification-address-contact-section.component';
import { ModificationInfoSectionComponent } from '../../../../shared/sections/modification-info-section/modification-info-section.component';
import { AttachedDocumentationSectionComponent, DocumentationItem } from '../../../../shared/sections/attached-documentation-section/attached-documentation-section.component';
import { RequirementsSectionComponent, Requirement } from '../../../../shared/sections/requirements-section/requirements-section.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';
import { PrivacyAcceptanceSectionComponent } from '../../../../shared/sections/privacy-acceptance-section/privacy-acceptance-section.component';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-modificacion-umma',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UmaRegistrationSectionComponent,
    RequestLocationSectionComponent,
    GeneralDataSectionComponent,
    IndividualPersonSectionComponent,
    LegalEntitySectionComponent,
    LegalRepresentativeSectionComponent,
    AuthorizedPersonSectionComponent,
    AddressContactSectionComponent,
    NotificationAddressContactSectionComponent,
    ModificationInfoSectionComponent,
    AttachedDocumentationSectionComponent,
    RequirementsSectionComponent,
    SignatureSectionComponent,
    PrivacyAcceptanceSectionComponent,
  ],
  templateUrl: './modificacion-umma.component.html',
  styleUrl: './modificacion-umma.component.css',
})
export default class ModificacionUmmaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  form: FormGroup = this.fb.group({
    umaRegistration: this.fb.group({
      uma_registration_key: ['', Validators.required],
    }),
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
    modificationInfo: this.fb.group({
      modification_types: this.fb.group({
        surface: [false],
        species: [false],
        technical_manager: [false],
        management_type: [false],
        marking_system: [false],
        holder: [false],
        fences: [false],
        name_or_corporate_name: [false],
      }),
      uma_registration_number: ['', Validators.required],
      new_surface: ['', Validators.required],
      new_holder_or_responsible_or_name: ['', Validators.required],
      modification_proposal: ['', Validators.required],
      new_marking_system: ['', Validators.required],
    }),
    attachedDocumentation: this.fb.group({}),
    requirements: this.fb.group({
      technical_manager_nomination: [null, Validators.required],
      ownership_transfer_document: [null, Validators.required],
      ownership_rights_document: [null, Validators.required],
      shp_or_excel_file: [null, Validators.required],
      official_id_document: [null, Validators.required],
      biological_sheet_file: [null, Validators.required],
    }),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    privacyAcceptance: this.fb.group({
      privacyAccepted: [false, Validators.requiredTrue],
    }),
  });

  // Getters
  get umaRegistrationGroup(): FormGroup {
    return this.form.get('umaRegistration') as FormGroup;
  }

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

  get modificationInfoGroup(): FormGroup {
    return this.form.get('modificationInfo') as FormGroup;
  }

  get attachedDocumentationGroup(): FormGroup {
    return this.form.get('attachedDocumentation') as FormGroup;
  }

  get requirementsGroup(): FormGroup {
    return this.form.get('requirements') as FormGroup;
  }

  get signatureGroup(): FormGroup {
    return this.form.get('signature') as FormGroup;
  }

  get privacyAcceptanceGroup(): FormGroup {
    return this.form.get('privacyAcceptance') as FormGroup;
  }

  // Documentación que se anexa
  documentationItems: DocumentationItem[] = [
    {
      controlName: 'identificacion_oficial',
      description:
        'Identificación oficial vigente para personas físicas y representantes legales. Original para cotejo y copia simple.',
      hasNotApplicable: true,
    },
    {
      controlName: 'documentacion_propiedad_superficie',
      description:
        'Copia de documentación que acredite derechos de propiedad o legítima posesión sobre los predios, en caso de cambios en la superficie de la UMA.',
      hasNotApplicable: true,
    },
    {
      controlName: 'representacion_legal',
      description:
        'Original o copia certificada y copia simple para cotejo del documento con el que se acredita la representación legal del promovente. Para el caso de personas físicas: carta poder firmada ante dos testigos. Para el caso de personas morales: Poder Notarial, sólo en el caso de que la representación y las actuaciones para las que se encuentre facultado no se encuentren contenidas desde el Acta Constitutiva.',
      hasNotApplicable: true,
    },
    {
      controlName: 'acta_constitutiva',
      description:
        'Acta Constitutiva para el caso de personas morales. Original o copia certificada y copia simple para cotejo.',
      hasNotApplicable: true,
    },
    {
      controlName: 'documentos_transferencia_derechos',
      description:
        'Copia de los documentos mediante los cuales se hayan transferido los derechos de propiedad o posesión legítima de los predios en donde se localiza la UMA, cuando se trate de cambio de titular.',
      hasNotApplicable: true,
    },
  ];

  // Requisitos
  requirementsList: Requirement[] = [
    {
      controlName: 'technical_manager_nomination',
      title: 'Nombramiento de responsable técnico',
      legalReference:
        'Art. 7o. de la Ley General de Vida Silvestre y demás disposiciones aplicables a la designación de responsables técnicos en UMA.',
    },
    {
      controlName: 'ownership_transfer_document',
      title:
        'TRANSFERENCIA DE DERECHOS DE PROPIEDAD (sólo cuando se trate de un cambio de titular)',
      legalReference:
        'Art. 79, fracción IV, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'ownership_rights_document',
      title:
        'DERECHOS DE PROPIEDAD (cuando se trate de una modificación de superficie)',
      legalReference:
        'Artículos 29 y 79 del Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'shp_or_excel_file',
      title:
        'Archivo .SHP o Excel (cuando se trate de un registro de UMA o modificación en la superficie)',
      legalReference:
        'Artículos 29 y 79 del Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'official_id_document',
      title: 'ACREDITAR PERSONALIDAD (Identificación Oficial)',
      legalReference:
        'Artículo 12, párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'biological_sheet_file',
      title:
        'CUADRO DE FICHA(S) BIOLÓGICA(S) DE LA(S) ESPECIE(S) (cuando se trate de una ampliación de especies)',
      legalReference:
        'Art. 77, párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
  ];

  // Firmas
  signaturesList: Signature[] = [
    {
      controlName: 'signature_file',
      title: 'Foto de la Firma',
      description: 'Esta firma es la que aparecerá en la Solicitud de Trámite.',
    },
  ];

  // Dropdown options
  stateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  municipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];


  ngOnInit(): void {
    this.loadStates();
    this.listenStateChanges();
    this.listenAddressStateChanges();
    this.listenNotificationStateChanges();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Formulario modificación UMA:', this.form.value);
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
        ...(data || []).map((state: any) => ({
          value: String(state.id),
          label: state.name,
        })),
      ];
      this.stateOptions = statesData;
      this.addressStateOptions = statesData;
      this.notificationStateOptions = statesData;
    } catch (e) {
      console.error('Error loading states:', e);
    }
  }

  private listenStateChanges(): void {
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
        ...(data || []).map((m: any) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
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
        ...(data || []).map((m: any) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
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
        ...(data || []).map((m: any) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
  }
}

