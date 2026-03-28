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
import { NgxSpinnerService } from 'ngx-spinner';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/auth/auth.service';
import { ManagementPlanSubtopicsService } from '../../../core/services/management-plan-subtopics.service';
import { ManagementPlanTopicsService } from '../../../core/services/management-plan-topics.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { TextAreaComponent } from '../../../shared/components/form/input/text-area.component';

const DESC_MAX = 4000;
const ORDEN_MAX = 999999;

export interface TopicSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-management-plan-subtopic-new',
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
  ],
  templateUrl: './management-plan-subtopic-new.component.html',
  styleUrl: './management-plan-subtopic-new.component.css',
})
export class ManagementPlanSubtopicNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly subtopicsApi = inject(ManagementPlanSubtopicsService);
  private readonly topicsApi = inject(ManagementPlanTopicsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly spinner = inject(NgxSpinnerService);

  private routeHandleSeq = 0;

  readonly descMaxLength = DESC_MAX;

  readonly form = this.fb.nonNullable.group({
    topic_id: ['', [Validators.required]],
    orden: [
      0,
      [Validators.required, Validators.min(0), Validators.max(ORDEN_MAX)],
    ],
    descripcion: [
      '',
      [
        Validators.required,
        Validators.maxLength(DESC_MAX),
        Validators.pattern(/\S/),
      ],
    ],
  });

  readonly editId = signal<string | null>(null);
  readonly topicOptions = signal<TopicSelectOption[]>([]);
  readonly topicsLoadError = signal<string | null>(null);

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
    this.isEditMode()
      ? 'Editar subtema de plan de manejo'
      : 'Nuevo subtema de plan de manejo'
  );

  readonly pageSubtitle = computed(() =>
    this.isEditMode()
      ? 'Modifica el tema, el orden o la descripción y guarda los cambios.'
      : 'Registra un subtema vinculado a un tema de plan de manejo.'
  );

  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Guardar'
  );

  readonly topicsEmpty = computed(() => this.topicOptions().length === 0);

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

  get topicIdCtrl() {
    return this.form.controls.topic_id;
  }

  get ordenCtrl() {
    return this.form.controls.orden;
  }

  get descripcionCtrl() {
    return this.form.controls.descripcion;
  }

  get clientId(): string | null {
    return this.auth.currentUser()?.client_id ?? null;
  }

  topicIdInvalid(): boolean {
    return this.topicIdCtrl.invalid && this.topicIdCtrl.touched;
  }

  onOrdenChange(value: string | number): void {
    const n =
      typeof value === 'number' ? value : parseInt(String(value), 10);
    const safe = Number.isNaN(n) ? 0 : Math.min(Math.max(0, n), ORDEN_MAX);
    this.ordenCtrl.setValue(safe);
  }

  onDescripcionChange(value: string): void {
    this.descripcionCtrl.setValue(value);
  }

  private async loadTopicOptions(clientId: string): Promise<void> {
    this.topicsLoadError.set(null);
    const { data, error } = await this.topicsApi.listByClientId(clientId);
    if (error) {
      this.topicsLoadError.set(
        error.message || 'No se pudieron cargar los temas de plan de manejo.'
      );
      this.topicOptions.set([]);
      return;
    }
    this.topicOptions.set(
      data.map((t) => ({ label: t.name, value: t.id }))
    );
  }

  private async handleRoute(id: string | null): Promise<void> {
    const seq = ++this.routeHandleSeq;
    this.submitError.set(null);
    this.editLoadError.set(null);
    this.formUiReady.set(false);
    this.form.reset({
      topic_id: '',
      orden: 0,
      descripcion: '',
    });

    const clientId = this.clientId;
    if (!clientId) {
      if (seq === this.routeHandleSeq) {
        this.formUiReady.set(true);
      }
      return;
    }

    await this.loadTopicOptions(clientId);
    if (seq !== this.routeHandleSeq) {
      return;
    }

    if (id == null || id === '') {
      if (seq === this.routeHandleSeq) {
        this.formUiReady.set(true);
      }
      return;
    }

    this.recordLoading.set(true);
    const { data, error } = await this.subtopicsApi.getByIdForClient(
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
      topic_id: data.topic_id,
      orden: data.orden,
      descripcion: data.descripcion,
    });
    this.formUiReady.set(true);
  }

  async onSubmit(): Promise<void> {
    this.submitError.set(null);

    const descVal = String(this.descripcionCtrl.value ?? '').trim();
    this.descripcionCtrl.setValue(descVal);

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

    if (this.topicOptions().length === 0 && !this.isEditMode()) {
      this.submitError.set(
        'Debes tener al menos un tema de plan de manejo para crear un subtema.'
      );
      return;
    }

    const topicId = String(this.topicIdCtrl.value ?? '').trim();
    if (!topicId) {
      this.topicIdCtrl.markAsTouched();
      return;
    }

    const orden = Math.floor(Number(this.ordenCtrl.value));
    if (Number.isNaN(orden) || orden < 0 || orden > ORDEN_MAX) {
      this.ordenCtrl.markAsTouched();
      this.submitError.set('Indica un orden numérico válido.');
      return;
    }

    const id = this.editId();
    const editing = id != null && id !== '';

    this.spinner.show('global');
    this.submitting.set(true);
    try {
      const result = editing
        ? await this.subtopicsApi.updateForClient(id, clientId, {
            topic_id: topicId,
            orden,
            descripcion: descVal,
          })
        : await this.subtopicsApi.insert({
            topic_id: topicId,
            orden,
            descripcion: descVal,
          });

      if (result.error) {
        this.submitError.set(
          mapSaveError(result.error, editing ? 'update' : 'insert')
        );
        return;
      }

      await this.router.navigate(['/catalog/management-plan-subtopics']);
    } finally {
      this.submitting.set(false);
      this.spinner.hide('global');
    }
  }

  descripcionHint(): string {
    const c = this.descripcionCtrl;
    if (!c.touched && !c.dirty) {
      return '';
    }
    if (c.hasError('required') || c.hasError('pattern')) {
      return 'La descripción es obligatoria.';
    }
    if (c.hasError('maxlength')) {
      return `Máximo ${DESC_MAX} caracteres.`;
    }
    return '';
  }

  ordenHint(): string {
    const c = this.ordenCtrl;
    if (!c.touched && !c.dirty) {
      return '';
    }
    if (c.hasError('required')) {
      return 'El orden es obligatorio.';
    }
    if (c.hasError('min') || c.hasError('max')) {
      return `Entre 0 y ${ORDEN_MAX}.`;
    }
    return '';
  }
}

function mapLoadError(err: { message?: string; code?: string }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para ver este subtema.';
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
      ? 'No tienes permiso para actualizar este subtema.'
      : 'No tienes permiso para crear subtemas.';
  }
  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe un subtema con ese orden para el tema seleccionado.';
  }
  if (code === '23503' || msg.includes('foreign key')) {
    return 'El tema seleccionado no es válido o fue eliminado.';
  }
  if (mode === 'update' && (code === 'PGRST116' || msg.includes('0 rows'))) {
    return 'No se pudo actualizar: el registro no existe o no tienes acceso.';
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'La tabla de subtemas aún no existe. Aplica la migración SQL (management_plan_subtopics).';
  }
  return err.message || 'No se pudo guardar el registro.';
}
