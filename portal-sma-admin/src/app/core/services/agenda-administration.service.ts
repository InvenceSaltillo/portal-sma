import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import type {
  AgendaAdministrationTarget,
  AgendaAdministrationTargetOption,
} from '../models/agenda-administration.model';

function toOption(row: AgendaAdministrationTarget): AgendaAdministrationTargetOption {
  const label = [row.name, row.last_names].filter(Boolean).join(' ').trim() || row.email || row.id;
  return { ...row, label };
}

@Injectable({ providedIn: 'root' })
export class AgendaAdministrationService {
  constructor(private readonly auth: AuthService) {}

  /**
   * Opciones del desplegable de Agenda: el usuario en sesión + admins asignados en
   * `agenda_administration_assignments` (como administrador de su agenda).
   */
  async listAdministrationTargets(): Promise<AgendaAdministrationTargetOption[]> {
    const { data, error } = await this.auth.client.rpc('get_agenda_administration_targets');
    if (error) {
      console.error('[AgendaAdministrationService] listAdministrationTargets', error);
      throw new Error(error.message || 'No se pudo cargar la lista de usuarios.');
    }
    const rows = (data ?? []) as AgendaAdministrationTarget[];
    return rows.map(toOption);
  }

  /** Todos los empleados admin del cliente (solo para pantalla de configuración; requiere ser admin). */
  async listClientAdminUsers(): Promise<AgendaAdministrationTargetOption[]> {
    const { data, error } = await this.auth.client.rpc('list_client_admin_users');
    if (error) {
      console.error('[AgendaAdministrationService] listClientAdminUsers', error);
      throw new Error(error.message || 'No se pudo cargar el catálogo de administradores.');
    }
    const rows = (data ?? []) as AgendaAdministrationTarget[];
    return rows.map(toOption);
  }

  /** `agenda_user_id` actualmente asignados a este administrador. */
  async listAssignmentsForAdministrator(administratorUserId: string): Promise<string[]> {
    const { data, error } = await this.auth.client
      .from('agenda_administration_assignments')
      .select('agenda_user_id')
      .eq('administrator_user_id', administratorUserId);
    if (error) {
      console.error('[AgendaAdministrationService] listAssignmentsForAdministrator', error);
      throw new Error(error.message || 'No se pudieron cargar las asignaciones.');
    }
    return (data ?? []).map((r) => r.agenda_user_id as string);
  }

  async replaceAssignmentsForAdministrator(
    administratorUserId: string,
    agendaUserIds: string[]
  ): Promise<void> {
    const { error } = await this.auth.client.rpc('replace_agenda_administration_assignments', {
      p_administrator_user_id: administratorUserId,
      p_agenda_user_ids: agendaUserIds,
    });
    if (error) {
      console.error('[AgendaAdministrationService] replaceAssignmentsForAdministrator', error);
      throw new Error(error.message || 'No se pudieron guardar las asignaciones.');
    }
  }
}
