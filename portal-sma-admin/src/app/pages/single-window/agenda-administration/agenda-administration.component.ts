import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { AgendaAdministrationService } from '../../../core/services/agenda-administration.service';
import type { AgendaAdministrationTargetOption } from '../../../core/models/agenda-administration.model';
import { LabelComponent } from '../../../shared/components/form/label/label.component';

@Component({
  selector: 'app-agenda-administration',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    LabelComponent,
    ProgressSpinnerModule,
    SelectModule,
  ],
  templateUrl: './agenda-administration.component.html',
  styleUrl: './agenda-administration.component.css',
})
export class AgendaAdministrationComponent implements OnInit {
  private readonly agenda = inject(AgendaAdministrationService);

  readonly pageLoading = signal(true);
  readonly pageError = signal<string | null>(null);
  readonly adminOptions = signal<AgendaAdministrationTargetOption[]>([]);

  readonly selectedAdministratorId = signal<string | null>(null);
  readonly assignmentsLoading = signal(false);
  readonly assignedAgendaUserIds = signal<string[]>([]);
  /** Filtro de texto sobre la tabla de asignables. */
  readonly assignmentTableFilter = signal('');

  readonly saving = signal(false);
  readonly feedback = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

  /** Otros admins cuya agenda se puede delegar (no incluye al empleado elegido en el primer dropdown). */
  readonly assignableAdmins = computed(() => {
    const sel = this.selectedAdministratorId();
    if (!sel) {
      return [];
    }
    return this.adminOptions().filter((o) => o.id !== sel);
  });

  readonly filteredAssignableAdmins = computed(() => {
    const q = this.assignmentTableFilter().trim().toLowerCase();
    const rows = this.assignableAdmins();
    if (!q) {
      return rows;
    }
    return rows.filter((o) => {
      const hay = [o.label, o.email ?? '', o.name, o.last_names].join(' ').toLowerCase();
      return hay.includes(q);
    });
  });

  ngOnInit(): void {
    this.agenda
      .listClientAdminUsers()
      .then((list) => {
        this.adminOptions.set(list);
        this.pageError.set(null);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el catálogo.';
        this.pageError.set(msg);
        this.adminOptions.set([]);
      })
      .finally(() => this.pageLoading.set(false));
  }

  onAdministratorChange(id: string | null): void {
    this.feedback.set(null);
    this.assignmentTableFilter.set('');
    this.selectedAdministratorId.set(id);
    this.assignedAgendaUserIds.set([]);
    if (!id) {
      return;
    }
    this.assignmentsLoading.set(true);
    this.agenda
      .listAssignmentsForAdministrator(id)
      .then((ids) => {
        const allowed = new Set(this.assignableAdmins().map((o) => o.id));
        this.assignedAgendaUserIds.set(ids.filter((x) => allowed.has(x)));
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Error al cargar asignaciones.';
        this.feedback.set({ kind: 'error', text: msg });
      })
      .finally(() => this.assignmentsLoading.set(false));
  }

  isAgendaAssigned(agendaUserId: string): boolean {
    return this.assignedAgendaUserIds().includes(agendaUserId);
  }

  toggleAgendaAssignment(agendaUserId: string, checked: boolean): void {
    const cur = this.assignedAgendaUserIds();
    if (checked) {
      if (!cur.includes(agendaUserId)) {
        this.assignedAgendaUserIds.set([...cur, agendaUserId]);
      }
    } else {
      this.assignedAgendaUserIds.set(cur.filter((id) => id !== agendaUserId));
    }
  }

  allFilteredRowsAssigned(): boolean {
    const rows = this.filteredAssignableAdmins();
    if (rows.length === 0) {
      return false;
    }
    const set = new Set(this.assignedAgendaUserIds());
    return rows.every((o) => set.has(o.id));
  }

  toggleAllFilteredAssignments(checked: boolean): void {
    const ids = this.filteredAssignableAdmins().map((o) => o.id);
    const cur = new Set(this.assignedAgendaUserIds());
    if (checked) {
      ids.forEach((id) => cur.add(id));
    } else {
      ids.forEach((id) => cur.delete(id));
    }
    this.assignedAgendaUserIds.set(Array.from(cur));
  }

  async saveAssignments(): Promise<void> {
    const adminId = this.selectedAdministratorId();
    if (!adminId) {
      return;
    }
    this.feedback.set(null);
    this.saving.set(true);
    try {
      await this.agenda.replaceAssignmentsForAdministrator(adminId, this.assignedAgendaUserIds());
      this.feedback.set({ kind: 'success', text: 'Asignaciones guardadas correctamente.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.';
      this.feedback.set({ kind: 'error', text: msg });
    } finally {
      this.saving.set(false);
    }
  }
}
