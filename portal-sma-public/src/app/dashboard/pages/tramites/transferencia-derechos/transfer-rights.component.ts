import { Component, OnInit, inject, signal } from '@angular/core';
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
import { PrivacyAcceptanceSectionComponent } from '../../../../shared/sections/privacy-acceptance-section/privacy-acceptance-section.component';
import { SupabaseService } from '../../../../services/supabase.service';
import { PopoverIconComponent } from '../../../../shared/components/popover-icon/popover-icon.component';
import { DropdownModule } from 'primeng/dropdown';
import { TramiteRequirementsBlockComponent } from '../../../../shared/components/tramite-requirements-block/tramite-requirements-block.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';

@Component({
  selector: 'app-transfer-rights',
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
    PopoverIconComponent,
    DropdownModule,
    TramiteRequirementsBlockComponent,
    SignatureSectionComponent,
    PrivacyAcceptanceSectionComponent,
  ],
  templateUrl: './transfer-rights.component.html',
  styleUrl: './transfer-rights.component.css',
})
export default class TransferRightsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  readonly tramiteServiceId = signal('');
  onServiceIdBound(serviceId: string): void {
    this.tramiteServiceId.set(serviceId);
  }

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
    transactionInformation: this.fb.group({
      petition_type: ['', Validators.required],
      transfer_temporality: ['', Validators.required],
      uma_or_property_registration: ['', Validators.required],
      transferred_rights: ['', Validators.required],
    }),
    transferee: this.fb.group({
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
    }),
    requirements: this.fb.group({}),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    privacyAcceptance: this.fb.group({
      privacyAccepted: [false, Validators.requiredTrue],
    }),
  });

  stateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  municipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  petitionTypeOptions: { value: string; label: string }[] = [
    { value: '', label: '--SELECCIONE--' },
    { value: 'extractivo', label: 'Extractivo' },
    { value: 'no-extractivo', label: 'No extractivo' },
  ];
  transfereeAddressStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  transfereeAddressMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
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

  get addressContactGroup(): FormGroup {
    return this.form.get('addressContact') as FormGroup;
  }

  get notificationAddressContactGroup(): FormGroup {
    return this.form.get('notificationAddressContact') as FormGroup;
  }

  get transactionInformationGroup(): FormGroup {
    return this.form.get('transactionInformation') as FormGroup;
  }

  get transfereeGroup(): FormGroup {
    return this.form.get('transferee') as FormGroup;
  }

  get transfereeGeneralDataGroup(): FormGroup {
    return this.transfereeGroup.get('generalData') as FormGroup;
  }

  get transfereeIndividualPersonGroup(): FormGroup {
    return this.transfereeGroup.get('individualPerson') as FormGroup;
  }

  get transfereeLegalEntityGroup(): FormGroup {
    return this.transfereeGroup.get('legalEntity') as FormGroup;
  }

  get transfereeLegalRepresentativeGroup(): FormGroup {
    return this.transfereeGroup.get('legalRepresentative') as FormGroup;
  }

  get transfereeAuthorizedPersonGroup(): FormGroup {
    return this.transfereeGroup.get('authorizedPerson') as FormGroup;
  }

  get transfereeAddressContactGroup(): FormGroup {
    return this.transfereeGroup.get('addressContact') as FormGroup;
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

  ngOnInit(): void {
    this.loadStates();
    this.listenStateChanges();
    this.listenAddressStateChanges();
    this.listenNotificationStateChanges();
    this.listenTransfereeAddressStateChanges();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Formulario transferencia de derechos:', this.form.value);
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
      this.transfereeAddressStateOptions = statesData;
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

  private listenTransfereeAddressStateChanges(): void {
    const stateControl = this.transfereeAddressContactGroup.get('state_id');
    if (!stateControl) return;

    stateControl.valueChanges.subscribe((stateId: string) => {
      this.transfereeAddressContactGroup.get('municipality_id')?.setValue('');
      if (!stateId) {
        this.transfereeAddressMunicipalityOptions = [{ value: '', label: '-- Seleccione --' }];
        return;
      }
      this.loadTransfereeAddressMunicipalities(stateId);
    });
  }

  private async loadTransfereeAddressMunicipalities(stateId: string): Promise<void> {
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

      this.transfereeAddressMunicipalityOptions = [
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
