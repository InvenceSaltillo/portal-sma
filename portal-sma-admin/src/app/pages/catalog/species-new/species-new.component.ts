import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NgxSpinnerService } from 'ngx-spinner';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth/auth.service';
import { SPECIES_ENVIRONMENTAL_EXPLOITATION_OPTIONS } from '../../../core/models/species-catalog.model';
import { SpeciesCatalogService } from '../../../core/services/species-catalog.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { TextAreaComponent } from '../../../shared/components/form/input/text-area.component';

const COMMON_MAX = 500;
const SCIENTIFIC_MAX = 4000;
const DRAFT_MAX = 100;

@Component({
  selector: 'app-species-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    SelectModule,
    ProgressSpinnerModule,
    DatePicker,
  ],
  templateUrl: './species-new.component.html',
  styleUrl: './species-new.component.css',
})
export class SpeciesNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly speciesApi = inject(SpeciesCatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly spinner = inject(NgxSpinnerService);

  private routeHandleSeq = 0;

  readonly environmentalOptions = SPECIES_ENVIRONMENTAL_EXPLOITATION_OPTIONS;
  readonly commonMaxLength = COMMON_MAX;
  readonly scientificMaxLength = SCIENTIFIC_MAX;

  readonly form = this.fb.group({
    common_name: [
      '',
      [
        Validators.required,
        Validators.maxLength(COMMON_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    scientific_name: [
      '',
      [
        Validators.required,
        Validators.maxLength(SCIENTIFIC_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    temporal_start: this.fb.control<Date | null>(null),
    temporal_end: this.fb.control<Date | null>(null),
    requires_band: this.fb.nonNullable.control(false),
    distinguishes_sex_age: this.fb.nonNullable.control(false),
    environmental_exploitation_key: ['', [Validators.required]],
    draft_density: ['', [Validators.maxLength(DRAFT_MAX)]],
    draft_percent: ['', [Validators.maxLength(DRAFT_MAX)]],
    exploitationEntries: this.fb.array<FormGroup>([]),
  });

  readonly editId = signal<string | null>(null);

  readonly isEditMode = computed(() => {
    const id = this.editId();
    return id != null && id !== '';
  });

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly editLoadError = signal<string | null>(null);
  readonly recordLoading = signal(false);
  readonly formUiReady = signal(false);

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar especie' : 'Nueva especie'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica los datos, el aprovechamiento y guarda los cambios.'
      : 'Registra una especie en el catálogo del cliente.'
  );

  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );

  /**
   * Si es true (se distingue sexo y edad), se oculta el desplegable de
   * condiciones ambientales.
   */
  readonly hideEnvironmentalExploitation = signal(false);

  constructor() {
    const dist = this.form.controls.distinguishes_sex_age;
    const env = this.form.controls.environmental_exploitation_key;

    dist.valueChanges
      .pipe(startWith(dist.value), takeUntilDestroyed())
      .subscribe((v) => {
        const distinguishes = Boolean(v);
        this.hideEnvironmentalExploitation.set(distinguishes);
        if (distinguishes) {
          env.clearValidators();
          env.setValue('');
        } else {
          env.setValidators([Validators.required]);
        }
        env.updateValueAndValidity({ emitEvent: false });
      });

    this.route.paramMap
      .pipe(
        map((pm) => pm.get('id')),
        takeUntilDestroyed()
      )
      .subscribe((id) => {
        this.editId.set(id);
        void this.handleRoute(id);
      });
  }

  get exploitationEntries(): FormArray {
    return this.form.controls.exploitationEntries as FormArray;
  }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  onCommonNameChange(v: string | number): void {
    this.form.controls.common_name.setValue(String(v));
  }

  onScientificNameChange(v: string): void {
    this.form.controls.scientific_name.setValue(v);
  }

  onDraftDensityChange(v: string | number): void {
    this.form.controls.draft_density.setValue(String(v));
  }

  onDraftPercentChange(v: string | number): void {
    this.form.controls.draft_percent.setValue(String(v));
  }

  exploitationGroupAt(index: number): FormGroup {
    return this.exploitationEntries.at(index) as FormGroup;
  }

  addExploitationRow(): void {
    const d = String(this.form.controls.draft_density.value ?? '').trim();
    const p = String(this.form.controls.draft_percent.value ?? '').trim();
    if (!d || !p) {
      this.form.controls.draft_density.markAsTouched();
      this.form.controls.draft_percent.markAsTouched();
      return;
    }
    const g = this.fb.group({
      population_density_per_ha: [d, Validators.required],
      exploitation_percent: [p, Validators.required],
    });
    this.exploitationEntries.push(g);
    this.form.controls.draft_density.setValue('');
    this.form.controls.draft_percent.setValue('');
    this.form.controls.draft_density.markAsUntouched();
    this.form.controls.draft_percent.markAsUntouched();
  }

  removeExploitationRow(index: number): void {
    if (index < 0 || index >= this.exploitationEntries.length) {
      return;
    }
    this.exploitationEntries.removeAt(index);
  }

  private clearExploitationEntries(): void {
    while (this.exploitationEntries.length > 0) {
      this.exploitationEntries.removeAt(0);
    }
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.clearExploitationEntries();
    this.form.reset({
      common_name: '',
      scientific_name: '',
      temporal_start: null,
      temporal_end: null,
      requires_band: false,
      distinguishes_sex_age: false,
      environmental_exploitation_key: '',
      draft_density: '',
      draft_percent: '',
    });

    const clientId = this.clientId;
    if (!clientId) {
      if (seq === this.routeHandleSeq) {
        this.formUiReady.set(true);
      }
      return;
    }

    if (id == null || id === '') {
      if (seq === this.routeHandleSeq) {
        this.formUiReady.set(true);
      }
      return;
    }

    this.recordLoading.set(true);
    const { species, entries, error } = await this.speciesApi.getByIdForClient(
      id,
      clientId
    );
    this.recordLoading.set(false);

    if (seq !== this.routeHandleSeq) {
      return;
    }

    if (error) {
      this.editLoadError.set(mapLoadError(error));
      return;
    }
    if (!species) {
      this.editLoadError.set(
        'No se encontró el registro o no pertenece a tu cliente.'
      );
      return;
    }

    this.form.patchValue({
      common_name: species.common_name,
      scientific_name: species.scientific_name,
      temporal_start: dateFromDbIso(species.temporal_start),
      temporal_end: dateFromDbIso(species.temporal_end),
      requires_band: species.requires_band,
      distinguishes_sex_age: species.distinguishes_sex_age,
      environmental_exploitation_key:
        species.environmental_exploitation_key ?? '',
    });

    for (const e of entries) {
      this.exploitationEntries.push(
        this.fb.group({
          population_density_per_ha: [
            e.population_density_per_ha,
            Validators.required,
          ],
          exploitation_percent: [e.exploitation_percent, Validators.required],
        })
      );
    }

    this.formUiReady.set(true);
  }

  async onSubmit(): Promise<void> {
    this.submitError.set(null);

    const cn = String(this.form.controls.common_name.value ?? '').trim();
    const sn = String(this.form.controls.scientific_name.value ?? '').trim();
    this.form.controls.common_name.setValue(cn);
    this.form.controls.scientific_name.setValue(sn);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const clientId = this.clientId;
    if (!clientId) {
      this.submitError.set(
        'No se encontró el cliente asociado a tu usuario. No se puede guardar.'
      );
      return;
    }

    const distinguishes = this.form.controls.distinguishes_sex_age.value;
    const envKey = String(
      this.form.controls.environmental_exploitation_key.value ?? ''
    ).trim();

    if (!distinguishes && !envKey) {
      this.submitError.set(
        'Selecciona el porcentaje de aprovechamiento por condiciones ambientales, o marca «Se distingue sexo y edad».'
      );
      return;
    }

    const temporalStart = dateToIsoDateString(
      this.form.controls.temporal_start.value
    );
    const temporalEnd = dateToIsoDateString(
      this.form.controls.temporal_end.value
    );

    const exploitationPayload = this.exploitationEntries.controls.map(
      (c) => {
        const g = c as FormGroup;
        return {
          population_density_per_ha: String(
            g.controls['population_density_per_ha'].value ?? ''
          ).trim(),
          exploitation_percent: String(
            g.controls['exploitation_percent'].value ?? ''
          ).trim(),
        };
      }
    );

    const basePayload = {
      common_name: cn,
      scientific_name: sn,
      active: true,
      temporal_start: temporalStart,
      temporal_end: temporalEnd,
      requires_band: this.form.controls.requires_band.value,
      distinguishes_sex_age: distinguishes,
      environmental_exploitation_key: distinguishes ? null : envKey,
    };

    const id = this.editId();
    const editing = id != null && id !== '';

    this.spinner.show('global');
    this.submitting.set(true);
    try {
      const result = editing
        ? await this.speciesApi.updateForClient(
            id,
            clientId,
            basePayload,
            exploitationPayload
          )
        : await this.speciesApi.insert(
            {
              client_id: clientId,
              external_id: globalThis.crypto.randomUUID(),
              ...basePayload,
            },
            exploitationPayload
          );

      if (result.error) {
        this.submitError.set(
          mapSaveError(result.error, editing ? 'update' : 'insert')
        );
        return;
      }

      await this.router.navigate(['/catalog/species']);
    } finally {
      this.submitting.set(false);
      this.spinner.hide('global');
    }
  }

  commonNameHint(): string | undefined {
    return nameFieldHint(this.form.controls.common_name, COMMON_MAX);
  }

  scientificNameHint(): string {
    const c = this.form.controls.scientific_name;
    if (!c.touched && !c.dirty) {
      return '';
    }
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'El nombre científico es obligatorio.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${SCIENTIFIC_MAX} caracteres.`;
    }
    return '';
  }
}

/** Parse DB `yyyy-mm-dd` (or ISO prefix) to local calendar date for the picker. */
function dateFromDbIso(iso: string | null | undefined): Date | null {
  if (iso == null || String(iso).trim() === '') {
    return null;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d);
}

/** Serialize picker value to `yyyy-mm-dd` for the API, or null if empty. */
function dateToIsoDateString(d: Date | null | undefined): string | null {
  if (d == null || !(d instanceof Date) || Number.isNaN(d.getTime())) {
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nameFieldHint(
  c: { touched: boolean; dirty: boolean; errors: unknown },
  max: number
): string | undefined {
  if (!c.touched && !c.dirty) {
    return undefined;
  }
  const err = c.errors as Record<string, unknown> | null;
  if (err?.['required'] || err?.['pattern']) {
    return 'El nombre es obligatorio.';
  }
  if (err?.['maxlength']) {
    return `Máximo ${max} caracteres.`;
  }
  return undefined;
}

function mapLoadError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver esta especie.';
  }
  return err.message || 'No se pudo cargar el registro.';
}

function mapSaveError(
  err: { message?: string; code?: string },
  mode: 'insert' | 'update'
): string {
  const msg = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';

  if (msg.includes('permission denied') || msg.includes('rls')) {
    return mode === 'update'
      ? 'No tienes permiso para actualizar esta especie.'
      : 'No tienes permiso para crear especies.';
  }
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe una especie con el mismo identificador externo o datos duplicados.';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'El cliente no es válido o falta una referencia en la base de datos.';
  }
  if (mode === 'update' && (code === 'PGRST116' || msg.includes('0 rows'))) {
    return 'No se pudo actualizar: el registro no existe o no tienes acceso.';
  }
  if (msg.includes('column') && msg.includes('does not exist')) {
    return 'Faltan columnas en species. Aplica la migración species_catalog_fields.';
  }
  return err.message || 'No se pudo guardar el registro.';
}
