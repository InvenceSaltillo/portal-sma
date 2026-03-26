import { Component, computed, inject, signal } from '@angular/core';
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
import { TenureTypesService } from '../../../core/services/tenure-types.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';

const NAME_MAX = 255;

@Component({
  selector: 'app-tenure-type-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: './tenure-type-new.component.html',
  styleUrl: './tenure-type-new.component.css',
})
export class TenureTypeNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tenureTypesApi = inject(TenureTypesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
    this.isEditMode() ? 'Editar tipo de tenencia' : 'Nuevo tipo de tenencia'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica el nombre y guarda los cambios.'
      : 'Registra un tipo de tenencia en el catálogo del cliente.'
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

  onNameChange(value: string | number): void {
    this.nameCtrl.setValue(String(value));
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.form.reset({ name: '' });

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
    const { data, error } = await this.tenureTypesApi.getByIdForClient(
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

    this.form.patchValue({ name: data.name });
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
      ? await this.tenureTypesApi.updateForClient(id, clientId, {
          name: nameVal,
        })
      : await this.tenureTypesApi.insert({
          name: nameVal,
          client_id: clientId,
        });
    this.submitting.set(false);

    if (result.error) {
      this.submitError.set(
        mapSaveError(result.error, editing ? 'update' : 'insert')
      );
      return;
    }

    await this.router.navigate(['/catalog/tenure-types']);
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
    return 'No tienes permiso para ver este tipo de tenencia.';
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
      ? 'No tienes permiso para actualizar este tipo de tenencia.'
      : 'No tienes permiso para crear tipos de tenencia.';
  }
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe un tipo de tenencia con ese nombre para tu cliente.';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'El cliente no es válido o no existe.';
  }
  if (mode === 'update' && (code === 'PGRST116' || msg.includes('0 rows'))) {
    return 'No se pudo actualizar: el registro no existe o no tienes acceso.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'La tabla aún no existe. Aplica la migración SQL (tenure_types).';
  }
  return err.message || 'No se pudo guardar el registro.';
}
