import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RequestLocationSectionComponent } from '../../../../shared/sections/request-location-section/request-location-section.component';
import { PopoverIconComponent } from '../../../../shared/components/popover-icon/popover-icon.component';
import { GeneralDataSectionComponent } from '../../../../shared/sections/general-data-section/general-data-section.component';
import { IndividualPersonSectionComponent } from '../../../../shared/sections/individual-person-section/individual-person-section.component';
import { LegalEntitySectionComponent } from '../../../../shared/sections/legal-entity-section/legal-entity-section.component';
import { LegalRepresentativeSectionComponent } from '../../../../shared/sections/legal-representative-section/legal-representative-section.component';
import { AuthorizedPersonSectionComponent } from '../../../../shared/sections/authorized-person-section/authorized-person-section.component';
import { AddressContactSectionComponent } from '../../../../shared/sections/address-contact-section/address-contact-section.component';
import { NotificationAddressContactSectionComponent } from '../../../../shared/sections/notification-address-contact-section/notification-address-contact-section.component';
import { PrivacyAcceptanceSectionComponent } from '../../../../shared/sections/privacy-acceptance-section/privacy-acceptance-section.component';
import { AttachedDocumentationSectionComponent, DocumentationItem } from '../../../../shared/sections/attached-documentation-section/attached-documentation-section.component';
import { RequirementsSectionComponent, Requirement } from '../../../../shared/sections/requirements-section/requirements-section.component';
import { SignatureSectionComponent, Signature } from '../../../../shared/sections/signature-section/signature-section.component';
import { SupabaseService } from '../../../../services/supabase.service';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-conservacion-vida-silvestre-a',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    PopoverIconComponent,
    RequestLocationSectionComponent,
    GeneralDataSectionComponent,
    IndividualPersonSectionComponent,
    LegalEntitySectionComponent,
    LegalRepresentativeSectionComponent,
    AuthorizedPersonSectionComponent,
    AddressContactSectionComponent,
    NotificationAddressContactSectionComponent,
    PrivacyAcceptanceSectionComponent,
    AttachedDocumentationSectionComponent,
    RequirementsSectionComponent,
    SignatureSectionComponent,
  ],
  templateUrl: './conservacion-vida-silvestre-a.component.html',
  styleUrl: './conservacion-vida-silvestre-a.component.css',
})
export default class ConservacionVidaSilvestreAComponent implements OnInit {
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
    transactionInfo: this.fb.group({
      petition_type: ['', Validators.required],
      collection_name_and_number: ['', Validators.required],
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
      inventory_species: ['', Validators.required],
      inventory_sex: ['', Validators.required],
      inventory_description: ['', Validators.required],
      inventory_marking_system: ['', Validators.required],
      inventory_legal_document: ['', Validators.required],
      inventory_list: this.fb.array([]),
    }),
    attachedDocumentation: this.fb.group({}),
    requirements: this.fb.group({
      plan_manejo: [null, Validators.required],
      inventario: [null, Validators.required],
      official_id_document: [null, Validators.required],
      legal_provenance: [null, Validators.required],
    }),
    signature: this.fb.group({
      signature_file: [null, Validators.required],
    }),
    privacyAcceptance: this.fb.group({
      privacyAccepted: [false, Validators.requiredTrue],
    }),
  });

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

  get attachedDocumentationGroup(): FormGroup {
    return this.form.get('attachedDocumentation') as FormGroup;
  }

  get requirementsGroup(): FormGroup {
    return this.form.get('requirements') as FormGroup;
  }

  get inventoryListArray(): FormArray {
    return this.transactionInfoGroup.get('inventory_list') as FormArray;
  }

  get signatureGroup(): FormGroup {
    return this.form.get('signature') as FormGroup;
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

  petitionTypeOptions: { value: string; label: string }[] = [
    { value: 'registro', label: 'Registro' },
    { value: 'actualizacion', label: 'Actualización' },
  ];

  speciesOptions: { value: string; label: string }[] = [{ value: '', label: '-- Seleccione --' }];

  inventorySexOptions: { value: string; label: string }[] = [
    { value: '', label: '-- Seleccione --' },
    { value: 'M', label: 'Macho' },
    { value: 'H', label: 'Hembra' },
    { value: 'indeterminado', label: 'Indeterminado' },
  ];

  documentationItems: DocumentationItem[] = [
    {
      controlName: 'identificacion_oficial',
      description:
        'Identificación oficial vigente para personas físicas y representantes legales. Original para cotejo y copia simple.',
      hasNotApplicable: true,
    },
    {
      controlName: 'inventario',
      description: 'Inventario.',
      hasNotApplicable: true,
    },
    {
      controlName: 'comprobante_pago_derechos',
      description: 'Comprobante de pago de derechos, original y copia. (Sólo en caso de registro)',
      hasNotApplicable: true,
    },
    {
      controlName: 'hoja_ayuda_e5cinco',
      description: 'Copia de la hoja de ayuda e5cinco. (Sólo en caso de registro)',
      hasNotApplicable: true,
    },
    {
      controlName: 'acta_constitutiva',
      description:
        'Acta Constitutiva para el caso de personas morales. Original o copia certificada y copia simple para cotejo.',
      hasNotApplicable: true,
    },
    {
      controlName: 'documentacion_legal_procedencia_material',
      description:
        'Documentación que ampare la legal procedencia del material biológico que forme parte del acervo. (Sólo deberá de presentarse para la modalidad A en caso de registro o cuando en la actualización se vaya a incorporar nuevo material biológico distinto al registrado).',
      hasNotApplicable: true,
    },
    {
      controlName: 'representacion_legal',
      description:
        'Original o copia certificada y copia simple para cotejo del documento con el que se acredita la representación legal del promovente. Para el caso de personas físicas: carta poder firmada ante dos testigos. Para el caso de personas morales: Poder Notarial, sólo en el caso de que la representación y las actuaciones para las que se encuentre facultado no se encuentren contenidas desde el Acta Constitutiva.',
      hasNotApplicable: true,
    },
    {
      controlName: 'documentacion_legal_procedencia_inventario',
      description:
        'Copia de la documentación que acredite la legal procedencia de los ejemplares, partes o derivados que formen parte del inventario, así como el sistema de marca. (Sólo deberá de presentarse en caso de registro o cuando en la actualización se vayan a incorporar nuevos ejemplares, partes o derivados, distintos a los registrados).',
      hasNotApplicable: true,
    },
    {
      controlName: 'plan_manejo',
      description:
        'Plan de manejo. (Sólo deberá presentarse para la modalidad B en caso de registro o cuando en la actualización se vayan a incorporar especies diferentes a las ya registradas, distintos a los registrados).',
      hasNotApplicable: true,
    },
  ];

  requirementsList: Requirement[] = [
    {
      controlName: 'plan_manejo',
      title: 'CONSERVACIÓN DE LA VIDA SILVESTRE FUERA DE SU HÁBITAT NATURAL, MODALIDAD "A": PLAN DE MANEJO',
      legalReference:
        'Artículo 131, Fracción II, Reglamento de la Ley General de Vida Silvestre publicado en el DOF el 30 de noviembre de 2006 y sus reformas.',
    },
    {
      controlName: 'inventario',
      title: 'CONSERVACIÓN DE LA VIDA SILVESTRE FUERA DE SU HÁBITAT NATURAL, MODALIDAD "A": INVENTARIO',
      legalReference:
        'Artículo 131, Párrafo tercero, Reglamento de la Ley General de Vida Silvestre publicado en el DOF el 30 de noviembre de 2006 y sus reformas.',
    },
    {
      controlName: 'official_id_document',
      title: 'ACREDITAR PERSONALIDAD (Identificación Oficial)',
      legalReference:
        'Artículo 12, párrafo segundo, Reglamento de la Ley General de Vida Silvestre, publicado en el DOF el 30 de noviembre de 2006.',
    },
    {
      controlName: 'legal_provenance',
      title: 'CONSERVACIÓN DE LA VIDA SILVESTRE FUERA DE SU HÁBITAT NATURAL MODALIDAD A: LEGAL PROCEDENCIA',
      legalReference:
        'Artículo 131, Fracción I, Reglamento de la Ley General de Vida Silvestre publicado en el DOF el 30 de noviembre de 2006 y sus reformas.',
    },
  ];

  signaturesList: Signature[] = [
    {
      controlName: 'signature_file',
      title: 'Foto de la Firma',
      description: 'Esta firma es la que aparecerá en la Solicitud de Trámite.',
    },
  ];

  ngOnInit(): void {
    this.loadStates();
    this.loadSpecies();
    this.listenRequestLocationStateChanges();
    this.listenAddressStateChanges();
    this.listenNotificationStateChanges();
    this.listenFacilityStateChanges();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('Formulario conservación vida silvestre (modalidad A):', this.form.value);
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
      this.facilityStateOptions = statesData;
    } catch (e) {
      console.error('Error loading states:', e);
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
        ...(data || []).map((m: any) => ({
          value: String(m.id),
          label: m.name,
        })),
      ];
    } catch (e) {
      console.error('Error loading municipalities:', e);
    }
  }

  editingIndex: number | null = null;

  isEditingInventory(): boolean {
    return this.editingIndex !== null;
  }

  addInventoryItem(): void {
    const g = this.transactionInfoGroup;
    const speciesId = g.get('inventory_species')?.value;
    const description = g.get('inventory_description')?.value?.trim?.();
    const sex = g.get('inventory_sex')?.value;
    const marking = g.get('inventory_marking_system')?.value?.trim?.();
    const legalDoc = g.get('inventory_legal_document')?.value?.trim?.();
    if (!speciesId) {
      g.get('inventory_species')?.markAsTouched();
      return;
    }
    if (!description) {
      g.get('inventory_description')?.markAsTouched();
      return;
    }
    if (!sex) {
      g.get('inventory_sex')?.markAsTouched();
      return;
    }
    if (!marking) {
      g.get('inventory_marking_system')?.markAsTouched();
      return;
    }
    if (!legalDoc) {
      g.get('inventory_legal_document')?.markAsTouched();
      return;
    }
    const opt = this.speciesOptions.find(o => o.value === speciesId);
    const speciesLabel = opt?.label ?? '';
    const [commonName, scientificName] = speciesLabel.split(' - ').map((s: string) => s?.trim() ?? '');
    const alreadyExists = this.inventoryListArray.controls.some(
      (ctrl) => (ctrl as FormGroup).get('species_id')?.value === speciesId
    );
    if (alreadyExists) return;

    const row = this.fb.group({
      species_id: [speciesId, Validators.required],
      species_label: [speciesLabel],
      common_name: [commonName],
      scientific_name: [scientificName],
      description: [description, Validators.required],
      sex: [sex, Validators.required],
      marking_system_number: [marking, Validators.required],
      legal_document: [legalDoc, Validators.required],
    });
    this.inventoryListArray.push(row);
    this.clearInventoryFields();
  }

  editInventoryItem(index: number): void {
    if (index < 0 || index >= this.inventoryListArray.length) return;
    const row = this.getInventoryRow(index);
    this.transactionInfoGroup.get('inventory_species')?.setValue(row.get('species_id')?.value);
    this.transactionInfoGroup.get('inventory_sex')?.setValue(row.get('sex')?.value);
    this.transactionInfoGroup.get('inventory_description')?.setValue(row.get('description')?.value);
    this.transactionInfoGroup.get('inventory_marking_system')?.setValue(row.get('marking_system_number')?.value);
    this.transactionInfoGroup.get('inventory_legal_document')?.setValue(row.get('legal_document')?.value);
    this.editingIndex = index;
  }

  updateInventoryItem(): void {
    if (this.editingIndex === null) return;
    const g = this.transactionInfoGroup;
    const speciesId = g.get('inventory_species')?.value;
    const description = g.get('inventory_description')?.value?.trim?.();
    const sex = g.get('inventory_sex')?.value;
    const marking = g.get('inventory_marking_system')?.value?.trim?.();
    const legalDoc = g.get('inventory_legal_document')?.value?.trim?.();
    if (!speciesId || !description || !sex || !marking || !legalDoc) {
      g.get('inventory_species')?.markAsTouched();
      g.get('inventory_description')?.markAsTouched();
      g.get('inventory_sex')?.markAsTouched();
      g.get('inventory_marking_system')?.markAsTouched();
      g.get('inventory_legal_document')?.markAsTouched();
      return;
    }
    const opt = this.speciesOptions.find(o => o.value === speciesId);
    const speciesLabel = opt?.label ?? '';
    const [commonName, scientificName] = speciesLabel.split(' - ').map((s: string) => s?.trim() ?? '');
    const row = this.getInventoryRow(this.editingIndex);
    row.patchValue({
      species_id: speciesId,
      species_label: speciesLabel,
      common_name: commonName,
      scientific_name: scientificName,
      description,
      sex,
      marking_system_number: marking,
      legal_document: legalDoc,
    });
    this.clearInventoryFields();
    this.editingIndex = null;
  }

  cancelEditInventory(): void {
    this.clearInventoryFields();
    this.editingIndex = null;
  }

  private clearInventoryFields(): void {
    this.transactionInfoGroup.get('inventory_species')?.setValue('');
    this.transactionInfoGroup.get('inventory_sex')?.setValue('');
    this.transactionInfoGroup.get('inventory_description')?.setValue('');
    this.transactionInfoGroup.get('inventory_marking_system')?.setValue('');
    this.transactionInfoGroup.get('inventory_legal_document')?.setValue('');
    this.transactionInfoGroup.get('inventory_species')?.markAsUntouched();
  }

  clearInventoryForm(): void {
    this.clearInventoryFields();
    this.inventoryListArray.clear();
    this.editingIndex = null;
  }

  removeInventoryItem(index: number): void {
    if (index < 0 || index >= this.inventoryListArray.length) return;
    this.inventoryListArray.removeAt(index);
    if (this.editingIndex === index) {
      this.cancelEditInventory();
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      this.editingIndex--;
    }
  }

  getInventoryRow(index: number): FormGroup {
    return this.inventoryListArray.at(index) as FormGroup;
  }

  getSexLabel(value: string): string {
    const opt = this.inventorySexOptions.find(o => o.value === value);
    return opt?.label ?? value ?? '';
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
        ...(data || []).map((m: any) => ({
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
        ...(data || []).map((m: any) => ({
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
