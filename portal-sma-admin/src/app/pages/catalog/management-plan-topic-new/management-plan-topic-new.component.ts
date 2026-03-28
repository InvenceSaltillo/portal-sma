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
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { ManagementPlanTopicsService } from '../../../core/services/management-plan-topics.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { TextAreaComponent } from '../../../shared/components/form/input/text-area.component';

const NAME_MAX = 255;
const DESC_MAX = 2000;

@Component({
  selector: 'app-management-plan-topic-new',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    RouterLink,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: './management-plan-topic-new.component.html',
  styleUrl: './management-plan-topic-new.component.css',
})
export class ManagementPlanTopicNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly topicsApi = inject(ManagementPlanTopicsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly spinner = inject(NgxSpinnerService);

  private routeHandleSeq = 0;

  readonly nameMaxLength = NAME_MAX;
  readonly descMaxLength = DESC_MAX;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(NAME_MAX),
        Validators.pattern(/\S/),
      ],
    ],
    description: ['', [Validators.maxLength(DESC_MAX)]],
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
    this.isEditMode() ? 'Editar tema de plan de manejo' : 'Nuevo tema de plan de manejo'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica el nombre o la descripción y guarda los cambios.'
      : 'Registra un tema en el catálogo del cliente.'
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

  get descriptionCtrl() {
    return this.form.controls.description;
  }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  onNameChange(value: string | number): void {
    this.nameCtrl.setValue(String(value));
  }

  onDescriptionChange(value: string): void {
    this.descriptionCtrl.setValue(value);
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.form.reset({ name: '', description: '' });

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
    const { data, error } = await this.topicsApi.getByIdForClient(id, clientId);
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
      description: data.description ?? '',
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

    const descriptionVal = String(this.descriptionCtrl.value ?? '').trim();

    this.spinner.show('global');
    this.submitting.set(true);
    try {
      const result = editing
        ? await this.topicsApi.updateForClient(id, clientId, {
            name: nameVal,
            description: descriptionVal === '' ? null : descriptionVal,
          })
        : await this.topicsApi.insert({
            name: nameVal,
            description: descriptionVal === '' ? null : descriptionVal,
            client_id: clientId,
          });

      if (result.error) {
        this.submitError.set(
          mapSaveError(result.error, editing ? 'update' : 'insert')
        );
        return;
      }

      await this.router.navigate(['/catalog/management-plan-topics']);
    } finally {
      this.submitting.set(false);
      this.spinner.hide('global');
    }
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

  descriptionHint(): string | undefined {
    const c = this.descriptionCtrl;
    if (!c.touched && !c.dirty) {
      return undefined;
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${DESC_MAX} caracteres.`;
    }
    return undefined;
  }
}

function mapLoadError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver este tema.';
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
      ? 'No tienes permiso para actualizar este tema.'
      : 'No tienes permiso para crear temas.';
  }
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe un tema con ese nombre para tu cliente.';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'El cliente no es válido o no existe.';
  }
  if (mode === 'update' && (code === 'PGRST116' || msg.includes('0 rows'))) {
    return 'No se pudo actualizar: el registro no existe o no tienes acceso.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'La tabla de temas aún no existe. Aplica la migración SQL (management_plan_topics).';
  }
  return err.message || 'No se pudo guardar el registro.';
}
