import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../core/auth/auth.service';
import { ServiceTypesService } from '../../../core/services/service-types.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { SwitchComponent } from '../../../shared/components/form/input/switch.component';

const NAME_MAX = 255;

/**
 * Alta y edición de tipo de trámite en la misma vista.
 * - `catalog/procedure-types/new` → crear.
 * - `catalog/procedure-types/:id/edit` → editar (carga el registro del cliente).
 */
@Component({
  selector: 'app-procedure-type-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    SwitchComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: './procedure-type-new.component.html',
  styleUrl: './procedure-type-new.component.css',
})
export class ProcedureTypeNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly serviceTypesApi = inject(ServiceTypesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Evita aplicar resultados de una carga obsoleta si el usuario cambia de ruta rápido. */
  private routeHandleSeq = 0;

  readonly nameMaxLength = NAME_MAX;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(NAME_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    is_active: this.fb.nonNullable.control(true),
  });

  /** `id` de la ruta `.../:id/edit`; en `/new` no existe. */
  readonly editId = signal<string | null>(null);

  readonly isEditMode = computed(() => {
    const id = this.editId();
    return id != null && id !== '';
  });

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly editLoadError = signal<string | null>(null);
  readonly recordLoading = signal(false);
  /** Cuando el switch puede montarse con el valor correcto (tras carga en edición). */
  readonly formUiReady = signal(false);

  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar tipo de trámite' : 'Nuevo tipo de trámite'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica los datos y guarda los cambios.'
      : 'Registra un nuevo tipo en el catálogo del cliente.'
  );

  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );

  constructor() {
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

  get nameCtrl() {
    return this.form.controls.name;
  }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  /** Valor inicial del switch (solo lectura al montar `app-switch`). */
  get activeSwitchInitial(): boolean {
    return this.form.controls.is_active.getRawValue();
  }

  onActiveChange(checked: boolean): void {
    this.form.controls.is_active.setValue(checked);
  }

  onNameChange(value: string | number): void {
    this.nameCtrl.setValue(String(value));
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.form.reset({ name: '', is_active: true });

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
    const { data, error } = await this.serviceTypesApi.getByIdForClient(
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
    if (!data) {
      this.editLoadError.set(
        'No se encontró el registro o no pertenece a tu cliente.'
      );
      return;
    }

    this.form.patchValue({
      name: data.name,
      is_active: data.is_active,
    });
    this.formUiReady.set(true);
  }

  async onSubmit(): Promise<void> {
    this.submitError.set(null);

    const nameVal = String(this.nameCtrl.value ?? '').trim();
    this.nameCtrl.setValue(nameVal);

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

    const id = this.editId();
    const editing = id != null && id !== '';

    this.submitting.set(true);
    const result = editing
      ? await this.serviceTypesApi.updateForClient(id, clientId, {
          name: nameVal,
          is_active: this.form.controls.is_active.getRawValue(),
        })
      : await this.serviceTypesApi.insert({
          name: nameVal,
          is_active: this.form.controls.is_active.getRawValue(),
          client_id: clientId,
        });
    this.submitting.set(false);

    if (result.error) {
      this.submitError.set(
        mapSaveError(result.error, editing ? 'update' : 'insert')
      );
      return;
    }

    await this.router.navigate(['/catalog/procedure-types']);
  }

  nameHint(): string | undefined {
    const c = this.nameCtrl;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'El nombre es obligatorio.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${NAME_MAX} caracteres.`;
    }
    return undefined;
  }
}

function mapLoadError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver este tipo de trámite.';
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
      ? 'No tienes permiso para actualizar este tipo de trámite.'
      : 'No tienes permiso para crear tipos de trámite.';
  }
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe un tipo de trámite con ese nombre para tu cliente.';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'El cliente no es válido o no existe.';
  }
  if (mode === 'update' && (code === 'PGRST116' || msg.includes('0 rows'))) {
    return 'No se pudo actualizar: el registro no existe o no tienes acceso.';
  }
  return err.message || 'No se pudo guardar el registro.';
}
