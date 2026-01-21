import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RequestLocationSectionComponent } from '../../../../shared/sections/request-location-section/request-location-section.component';
import { GeneralDataSectionComponent } from '../../../../shared/sections/general-data-section/general-data-section.component';
import { IndividualPersonSectionComponent } from '../../../../shared/sections/individual-person-section/individual-person-section.component';
import { LegalEntitySectionComponent } from '../../../../shared/sections/legal-entity-section/legal-entity-section.component';
import { LegalRepresentativeSectionComponent } from '../../../../shared/sections/legal-representative-section/legal-representative-section.component';
import { AuthorizedPersonSectionComponent } from '../../../../shared/sections/authorized-person-section/authorized-person-section.component';
import { AddressContactSectionComponent } from '../../../../shared/sections/address-contact-section/address-contact-section.component';
import { NotificationAddressContactSectionComponent } from '../../../../shared/sections/notification-address-contact-section/notification-address-contact-section.component';
import { NonExtractiveInfoSectionComponent } from '../../../../shared/sections/non-extractive-info-section/non-extractive-info-section.component';
import { RequirementsSectionComponent, Requirement } from '../../../../shared/sections/requirements-section/requirements-section.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';
import { PrivacyAcceptanceSectionComponent } from '../../../../shared/sections/privacy-acceptance-section/privacy-acceptance-section.component';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-non-extractive-authorization',
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
    NonExtractiveInfoSectionComponent,
    RequirementsSectionComponent,
    SignatureSectionComponent,
    PrivacyAcceptanceSectionComponent,
  ],
  templateUrl: './non-extractive-authorization.component.html',
  styleUrl: './non-extractive-authorization.component.css',
})
export default class NonExtractiveAuthorizationComponent implements OnInit {
  private fb = inject(FormBuilder);
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
    requirements: this.fb.group({
      payment_proof: [null, Validators.required],
      official_id: [null, Validators.required],
      management_plan: [null, Validators.required],
    }),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    privacyAcceptance: this.fb.group({
      privacyAccepted: [false, Validators.requiredTrue],
    }),
    transactionInformation: this.fb.group({
      exploitation_object: ['', Validators.required],
      exploitation_site: ['', Validators.required],
      exploitation_temporality: ['', Validators.required],
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
  });

  stateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  municipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  exploitationSiteOptions: { value: string; label: string }[] = [
    { value: '', label: '-- Seleccione --' },
    { value: 'uma', label: 'UMA' },
    { value: 'otro_predio', label: 'Otro predio' },
  ];

  requirementsList: Requirement[] = [
    {
      controlName: 'payment_proof',
      title: 'Autorización de aprovechamiento no extractivo de vida silvestre: Comprobante de pago de derechos',
      legalReference: 'Artículo 238 C, Fracciones I y II de la Ley Federal de Derechos vigente.',
    },
    {
      controlName: 'official_id',
      title: 'ACREDITAR PERSONALIDAD (Identificación Oficial)',
      legalReference: 'Artículo 12, párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'management_plan',
      title: 'Autorización de aprovechamiento no extractivo de vida silvestre: Plan de manejo',
      legalReference: 'Artículo 132, primer párrafo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
  ];

  signaturesList: Signature[] = [
    {
      controlName: 'signature_file',
      title: 'Foto de la Firma',
      description: 'Esta firma es la que aparecerá en la Solicitud de Trámite.',
    },
  ];

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

  get transactionInformationGroup(): FormGroup {
    return this.form.get('transactionInformation') as FormGroup;
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
  get addressContactGroup(): FormGroup {
    return this.form.get('addressContact') as FormGroup;
  }

  get notificationAddressContactGroup(): FormGroup {
    return this.form.get('notificationAddressContact') as FormGroup;
  }

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
    console.log('Formulario no extractivo:', this.form.value);
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

