import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';

interface UserNotification {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  templateUrl: './notification-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  isOpen = false;
  notifying = false;
  loading = false;
  notifications: UserNotification[] = [];
  private notificationChannel: any = null;

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

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      void this.markVisibleAsRead();
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  trackById(_: number, item: UserNotification): string {
    return item.id;
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

  private async loadNotifications(): Promise<void> {
    this.loading = true;
    try {
      const token = await this.auth.getAccessToken();
      if (!token) return;
      const resp = await fetch(`${environment.apiUrl}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const rows = (await resp.json()) as UserNotification[];
      this.notifications = rows;
      this.notifying = rows.some((n) => !n.read_at);
    } finally {
      this.loading = false;
    }
  }

  private setupRealtime(): void {
    const me = this.auth.currentUser();
    if (!me?.id) return;
    this.notificationChannel = this.auth.client
      .channel(`notifications-${me.id}`)
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
          this.notifications = [row, ...this.notifications].slice(0, 50);
          if (!this.isOpen) {
            this.notifying = true;
          }
        }
      )
      .subscribe();
  }

  private async markVisibleAsRead(): Promise<void> {
    const unread = this.notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) {
      this.notifying = false;
      return;
    }
    const token = await this.auth.getAccessToken();
    if (!token) return;
    for (const id of unread) {
      void fetch(`${environment.apiUrl}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    const now = new Date().toISOString();
    this.notifications = this.notifications.map((n) =>
      unread.includes(n.id) ? { ...n, read_at: now } : n
    );
    this.notifying = false;
  }
}
