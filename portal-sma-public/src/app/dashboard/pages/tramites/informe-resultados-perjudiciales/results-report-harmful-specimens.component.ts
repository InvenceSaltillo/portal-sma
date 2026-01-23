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
import { TransactionInformationResultsSectionComponent } from '../../../../shared/sections/transaction-information-results-section/transaction-information-results-section.component';
import { RequirementsSectionComponent, Requirement } from '../../../../shared/sections/requirements-section/requirements-section.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';
import { PrivacyAcceptanceSectionComponent } from '../../../../shared/sections/privacy-acceptance-section/privacy-acceptance-section.component';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-results-report-harmful-specimens',
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
    TransactionInformationResultsSectionComponent,
    RequirementsSectionComponent,
    SignatureSectionComponent,
    PrivacyAcceptanceSectionComponent,
  ],
  templateUrl: './results-report-harmful-specimens.component.html',
  styleUrl: './results-report-harmful-specimens.component.css',
})
export default class ResultsReportHarmfulSpecimensComponent implements OnInit {
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
      species: [''],
      quantity: [''],
      control_measure: [''],
      results_list: this.fb.array([]),
    }),
    requirements: this.fb.group({
      official_id: [null, Validators.required],
    }),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    privacyAcceptance: this.fb.group({
      privacyAccepted: [false, Validators.requiredTrue],
    }),
  });

  // Getters
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

  get requirementsGroup(): FormGroup {
    return this.form.get('requirements') as FormGroup;
  }

  get signatureGroup(): FormGroup {
    return this.form.get('signature') as FormGroup;
  }

  get privacyAcceptanceGroup(): FormGroup {
    return this.form.get('privacyAcceptance') as FormGroup;
  }

  // Dropdown options
  stateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  municipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  addressMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationStateOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  notificationMunicipalityOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];
  speciesOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];

  // Requisitos para la sección
  requirementsList: Requirement[] = [
    {
      controlName: 'official_id',
      title: 'ACREDITAR PERSONALIDAD (Identificación Oficial)',
      legalReference:
        'Artículo 12, párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
  ];

  // Firmas para la sección
  signaturesList: Signature[] = [
    {
      controlName: 'signature_file',
      title: 'Foto de la Firma',
      description: 'Esta firma es la que aparecerá en la Solicitud de Trámite.',
    },
  ];

  ngOnInit(): void {
    this.loadStates();
    this.listenStateChanges();
    this.listenAddressStateChanges();
    this.listenNotificationStateChanges();
    this.loadSpecies();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Formulario informe resultados perjudiciales:', this.form.value);
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

  private async loadSpecies(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('species')
        .select('id, common_name, scientific_name')
        .order('common_name', { ascending: true });

      if (error) {
        console.error('Error loading species:', error);
        return;
      }

      this.speciesOptions = [
        { value: '', label: '-- Seleccione --' },
        ...(data || []).map((s: any) => ({
          value: String(s.id),
          label: `${s.common_name} - ${s.scientific_name}`,
        })),
      ];
    } catch (e) {
      console.error('Error loading species:', e);
    }
  }
}
