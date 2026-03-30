import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import {
  DataTableComponent,
  type DataTableColumn,
  type DataTableRowAction,
} from '../../shared/components/ui/data-table/data-table.component';

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private notificationChannel: any = null;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notifications = signal<UserNotification[]>([]);
  readonly tableColumns: DataTableColumn[] = [
    {
      field: 'title',
      header: 'Título',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
    {
      field: 'message',
      header: 'Mensaje',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
    {
      field: 'status_label',
      header: 'Estado',
      sortField: 'status_sort',
      filter: {
        type: 'select',
        placeholder: 'Todos',
        matchMode: 'equals',
        selectOptions: [
          { label: 'No leída', value: 'No leída' },
          { label: 'Leída', value: 'Leída' },
        ],
      },
    },
    {
      field: 'created_at_label',
      header: 'Recibida',
      sortField: 'created_at_sort',
      filter: { type: 'text', placeholder: 'Buscar…' },
    },
  ];

  readonly tableRowActions: DataTableRowAction[] = [
    {
      label: 'Marcar leída',
      icon: 'pi pi-check',
      severity: 'success',
      visible: (row) => row['status_label'] === 'No leída',
      command: (row) => {
        const id = String(row['id'] ?? '');
        if (id) {
          void this.markAsRead(id);
        }
      },
    },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadNotifications();
    this.setupRealtime();
  }

  ngOnDestroy(): void {
    if (this.notificationChannel) {
      this.auth.client.removeChannel(this.notificationChannel);
      this.notificationChannel = null;
    }
  }

  async loadNotifications(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const token = await this.auth.getAccessToken();
      if (!token) {
        this.error.set('No hay sesión activa.');
        return;
      }
      const resp = await fetch(`${environment.apiUrl}/notifications?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        this.error.set('No se pudieron cargar las notificaciones.');
        return;
      }
      const rows = (await resp.json()) as UserNotification[];
      this.notifications.set(rows);
    } catch {
      this.error.set('Error inesperado al cargar notificaciones.');
    } finally {
      this.loading.set(false);
    }
  }

  async markAsRead(id: string): Promise<void> {
    const token = await this.auth.getAccessToken();
    if (!token) return;
    await fetch(`${environment.apiUrl}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const now = new Date().toISOString();
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read_at: now } : n))
    );
  }

  relativeTime(iso: string): string {
    const now = Date.now();
    const t = new Date(iso).getTime();
    const diffMs = Math.max(0, now - t);
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    return `${d} d`;
  }

  tableRows(): Record<string, unknown>[] {
    return this.notifications().map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      status_label: n.read_at ? 'Leída' : 'No leída',
      status_sort: n.read_at ? 1 : 0,
      created_at_sort: new Date(n.created_at).getTime(),
      created_at_label: `${this.relativeTime(n.created_at)} (${new Date(n.created_at).toLocaleString('es-MX')})`,
    }));
  }

  private setupRealtime(): void {
    const me = this.auth.currentUser();
    if (!me?.id) return;
    this.notificationChannel = this.auth.client
      .channel(`notifications-page-${me.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `recipient_user_id=eq.${me.id}`,
        },
        (payload: any) => {
          const row = payload.new as UserNotification;
          this.notifications.update((list) => [row, ...list]);
        }
      )
      .subscribe();
  }
}
