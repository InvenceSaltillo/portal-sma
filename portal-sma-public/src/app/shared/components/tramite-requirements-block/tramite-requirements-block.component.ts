import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  RequirementsSectionComponent,
  Requirement,
} from '../../sections/requirements-section/requirements-section.component';
import { ServiceRequirementsService } from '../../../services/service-requirements/service-requirements.service';

@Component({
  selector: 'app-tramite-requirements-block',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RequirementsSectionComponent],
  templateUrl: './tramite-requirements-block.component.html',
})
export class TramiteRequirementsBlockComponent {
  readonly form = input.required<FormGroup>();
  readonly serviceId = input<string>('');
  /** Nombre del control en el FormGroup raíz (por defecto `requirements`). */
  readonly controlName = input<string>('requirements');

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ServiceRequirementsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly list = signal<Requirement[]>([]);

  constructor() {
    combineLatest([
      toObservable(this.serviceId),
      toObservable(this.form),
      toObservable(this.controlName),
    ])
      .pipe(
        map(([id, parentForm, key]) => ({
          id: (id ?? '').trim(),
          parentForm,
          key: key ?? 'requirements',
        })),
        filter(
          (x): x is { id: string; parentForm: FormGroup; key: string } =>
            x.id.length > 0 && !!x.parentForm
        ),
        distinctUntilChanged(
          (a, b) => a.id === b.id && a.parentForm === b.parentForm && a.key === b.key
        ),
        switchMap(({ id, parentForm, key }) => {
          this.loading.set(true);
          this.error.set(null);
          return this.api.listByServiceId(id).pipe(
            tap((rows) => {
              const reqs: Requirement[] = [];
              const controls: Record<string, FormControl> = {};

              for (const row of rows) {
                const c = row.catalog;
                const accept =
                  c.accept && String(c.accept).trim().length > 0
                    ? String(c.accept).trim()
                    : 'application/pdf';
                const maxMb =
                  typeof c.max_size_mb === 'number' && c.max_size_mb > 0 ? c.max_size_mb : 10;

                reqs.push({
                  controlName: c.name,
                  title: c.title,
                  legalReference: c.legal_reference ?? '',
                  description: c.description,
                  accept,
                  maxSizeMB: maxMb,
                });

                controls[c.name] = new FormControl(
                  null,
                  row.is_required ? Validators.required : []
                );
              }

              this.list.set(reqs);
              parentForm.setControl(key, this.fb.group(controls));
            }),
            catchError((e: unknown) => {
              console.error('Error cargando requisitos del trámite:', e);
              this.error.set(
                'No se pudieron cargar los requisitos documentales. Intenta de nuevo más tarde o contacta al administrador.'
              );
              this.list.set([]);
              parentForm.setControl(key, this.fb.group({}));
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  get requirementsGroup(): FormGroup {
    const g = this.form().get(this.controlName());
    return (g as FormGroup) ?? this.fb.group({});
  }

  /** Bloquea envío del formulario principal mientras cargan los requisitos o hubo error de carga. */
  submitBlocked(): boolean {
    return this.loading() || this.error() != null;
  }
}
