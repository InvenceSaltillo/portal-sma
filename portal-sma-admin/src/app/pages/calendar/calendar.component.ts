import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../core/auth/auth.service';
import { AgendaAdministrationService } from '../../core/services/agenda-administration.service';
import type { AgendaAdministrationTargetOption } from '../../core/models/agenda-administration.model';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { environment } from '../../../environments/environment';

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    detail?: string;
    attended?: boolean;
    assigneeIds?: string[];
    folio?: number;
  };
}

interface CalendarHoverPopover {
  top: number;
  left: number;
  title: string;
  folio: string;
  start: string;
  end: string;
  assignees: string;
  attended: string;
}

/** Color único en la cuadrícula (se quitó el selector de colores). */
const CITA_FC_CLASS = 'primary';
const SLOT_MINUTES = 30;
const AGENDA_API_BASE = `${environment.apiUrl}/agenda-appointments`;

interface AgendaAppointmentRow {
  id: string;
  folio: number;
  agenda_user_id: string;
  title: string;
  detail: string | null;
  start_at: string;
  end_at: string;
  attended: boolean;
  assignee_user_ids: string[] | null;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    FormsModule,
    FullCalendarModule,
    ConfirmDialogModule,
    MultiSelectModule,
    LabelComponent,
    ModalComponent,
    ProgressSpinnerModule,
    SelectModule,
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  providers: [ConfirmationService],
})
export class CalendarComponent implements OnInit {

  private readonly agendaAdmin = inject(AgendaAdministrationService);
  private readonly auth = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly targetsLoading = signal(true);
  readonly targetsError = signal<string | null>(null);
  readonly targets = signal<AgendaAdministrationTargetOption[]>([]);
  readonly selectedUserId = signal<string | null>(null);

  readonly showCalendarSection = computed(() => {
    if (this.targetsLoading() || this.targetsError()) {
      return false;
    }
    return this.selectedAgendaOwner() !== null;
  });

  readonly selectedAgendaOwner = computed(() => {
    const id = this.selectedUserId();
    if (!id) {
      return null;
    }
    const row = this.targets().find((t) => t.id === id);
    if (!row) {
      return null;
    }
    return { userId: row.id, displayName: row.label };
  });

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  eventTitle = '';
  eventDetail = '';
  eventAttended = false;
  eventAssigneeIds: string[] = [];
  titleTouched = false;
  formError: string | null = null;
  citaStart: Date | null = null;
  citaEnd: Date | null = null;
  isOpen = false;
  hoverPopover: CalendarHoverPopover | null = null;

  calendarOptions!: CalendarOptions;

  ngOnInit() {
    // Asegura sesión/perfil disponible tras F5 antes de autoseleccionar.
    this.auth.ensureAppUserLoaded().finally(() => this.loadAdministrationTargets());

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      locale: esLocale,
      /** Altura según el contenido (ranuras 9–17 h), sin relleno vertical extra. */
      height: 'auto',
      initialView: 'timeGridWeek',
      /** Oculta la fila superior "Todo el día" en vistas semana/día. */
      allDaySlot: false,
      slotDuration: `00:${String(SLOT_MINUTES).padStart(2, '0')}:00`,
      slotLabelInterval: `00:${String(SLOT_MINUTES).padStart(2, '0')}:00`,
      slotMinTime: '09:00:00',
      // Fin exclusivo: la cuadrícula llega hasta el cierre a las 17:00 (5 pm).
      slotMaxTime: '18:00:00',
      slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        meridiem: 'short',
      },
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        meridiem: 'short',
      },
      headerToolbar: {
        left: 'prev,next addEventButton',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      selectable: true,
      events: this.events,
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      eventMouseEnter: (info) => this.showEventHoverPopover(info),
      eventMouseLeave: () => this.hideEventHoverPopover(),
      slotLaneDidMount: (arg) => {
        if (!arg.date) return;
        const start = new Date(arg.date);
        const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
        const label = `${this.formatTimeOnly(start)} - ${this.formatTimeOnly(end)}`;
        // En timeGrid, el hover real lo hace el <td>; ponemos el atributo ahí para que el texto
        // se muestre en la celda exacta (día + hora), no centrado en otra columna.
        const td = arg.el.closest?.('td');
        arg.el.setAttribute('data-hover-time', label);
        td?.setAttribute('data-hover-time', label);
      },
      customButtons: {
        addEventButton: {
          text: 'Agregar cita +',
          click: () => this.openModal()
        }
      },
      eventContent: (arg) => this.renderEventContent(arg)
    };
  }

  private loadAdministrationTargets(): void {
    this.targetsLoading.set(true);
    this.targetsError.set(null);
    this.agendaAdmin
      .listAdministrationTargets()
      .then(async (list) => {
        this.targets.set(list);
        this.targetsError.set(null);

        // Autoselección: al entrar al calendario, seleccionar el usuario logeado.
        // Solo si aún no hay selección explícita.
        if (!this.selectedUserId()) {
          const session = await this.auth.getSession();
          const myId = session?.user?.id ?? null;
          if (myId && list.some((t) => t.id === myId)) {
            this.onAgendaUserChange(myId);
          }
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Error al cargar usuarios.';
        this.targetsError.set(msg);
        this.targets.set([]);
      })
      .finally(() => this.targetsLoading.set(false));
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    this.resetModalFields();
    const [start, end] = this.rangeFromSelection(selectInfo);
    this.citaStart = start;
    this.citaEnd = end;
    this.openModal();
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const start = event.start ?? undefined;
    const end = event.end ?? undefined;
    this.selectedEvent = {
      id: String(event.id),
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: {
        calendar: event.extendedProps['calendar'] ?? CITA_FC_CLASS,
        detail: event.extendedProps['detail'] ?? '',
      },
    };
    this.eventTitle = event.title;
    this.eventDetail = String(event.extendedProps['detail'] ?? '');
    this.eventAttended = Boolean(event.extendedProps['attended']);
    this.eventAssigneeIds = Array.isArray(event.extendedProps['assigneeIds'])
      ? [...(event.extendedProps['assigneeIds'] as string[])]
      : [];
    const [dStart, dEnd] =
      start && end
        ? [new Date(start), new Date(end)]
        : start
          ? [new Date(start), new Date(new Date(start).getTime() + 60 * 60 * 1000)]
          : this.defaultCitaRange();
    this.citaStart = dStart;
    this.citaEnd = dEnd;
    this.openModal();
  }

  handleAddOrUpdateEvent() {
    this.titleTouched = true;
    this.formError = null;
    if (!this.isEventTitleValid || !this.citaStart || !this.citaEnd) {
      return;
    }
    const normalizedTitle = this.eventTitle.trim();
    const startIso = this.toLocalIsoDatetime(this.citaStart);
    const endIso = this.toLocalIsoDatetime(this.citaEnd);
    if (this.selectedEvent) {
      this.events = this.events.map((ev) =>
        ev.id === this.selectedEvent!.id
          ? {
              ...ev,
              title: normalizedTitle,
              start: startIso,
              end: endIso,
              allDay: false,
              extendedProps: {
                calendar: CITA_FC_CLASS,
                detail: this.eventDetail,
                attended: this.eventAttended,
                assigneeIds: [...this.eventAssigneeIds],
                folio: ev.extendedProps.folio,
              },
            }
          : ev,
      );
      this.calendarOptions.events = this.events;
      this.closeModal();
    } else {
      void this.createAppointmentInBackend({
        agenda_user_id: this.selectedUserId(),
        title: normalizedTitle,
        detail: this.eventDetail || null,
        start_at: startIso,
        end_at: endIso,
        attended: this.eventAttended,
        assignee_user_ids: [...this.eventAssigneeIds],
      });
    }
  }

  async handleDeleteEvent(): Promise<void> {
    if (!this.selectedEvent?.id) {
      return;
    }
    const pendingDeleteId = this.selectedEvent.id;
    // Cerrar primero el modal de edición para evitar stacking de overlays.
    this.isOpen = false;
    this.confirmationService.confirm({
      key: 'calendar-delete-confirm',
      message: '¿Seguro que deseas eliminar esta cita? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        void this.executeDeleteEvent(pendingDeleteId);
      },
      reject: () => {
        // Si cancela, reabrimos el modal del evento seleccionado.
        this.isOpen = true;
      },
    });
  }

  private async executeDeleteEvent(eventId: string): Promise<void> {
    if (!eventId) {
      return;
    }
    this.formError = null;
    try {
      const token = await this.auth.getAccessToken();
      if (!token) {
        this.formError = 'No hay sesión válida. Inicia sesión nuevamente.';
        return;
      }
      const resp = await fetch(`${AGENDA_API_BASE}/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        this.formError = body?.error || 'No se pudo eliminar la cita.';
        this.isOpen = true;
        return;
      }
      this.events = this.events.filter((ev) => ev.id !== eventId);
      this.calendarOptions.events = this.events;
      this.closeModal();
    } catch (e) {
      console.error('[Calendar] handleDeleteEvent', e);
      this.formError = 'Error inesperado al eliminar la cita.';
      this.isOpen = true;
    }
  }

  resetModalFields() {
    this.eventTitle = '';
    this.eventDetail = '';
    this.eventAttended = false;
    this.eventAssigneeIds = [];
    this.titleTouched = false;
    this.formError = null;
    this.citaStart = null;
    this.citaEnd = null;
    this.selectedEvent = null;
  }

  openModal() {
    if (!this.selectedEvent && (!this.citaStart || !this.citaEnd)) {
      const [start, end] = this.defaultCitaRange();
      this.citaStart = start;
      this.citaEnd = end;
    }
    this.isOpen = true;
  }

  private defaultCitaRange(): Date[] {
    const start = new Date();
    start.setHours(9, 30, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    return [start, end];
  }

  private rangeFromSelection(selectInfo: DateSelectArg): Date[] {
    const start = new Date(selectInfo.start);
    let end = selectInfo.end
      ? new Date(selectInfo.end)
      : new Date(start.getTime() + 60 * 60 * 1000);
    if (selectInfo.allDay) {
      end = new Date(end.getTime() - 1);
    }
    if (end <= start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
    return [start, end];
  }

  private toLocalIsoDatetime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  formatCitaDateTime(d: Date | null): string {
    if (!d) return '--/--/---- --:--';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  }

  get assignableAgendaOptions(): AgendaAdministrationTargetOption[] {
    const ownerId = this.selectedAgendaOwner()?.userId ?? null;
    return this.targets().filter((t) => t.id !== ownerId);
  }

  get isEventTitleValid(): boolean {
    return this.eventTitle.trim().length > 0;
  }

  private formatTimeOnly(d: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d).toLowerCase();
  }

  onAgendaUserChange(userId: string | null): void {
    this.selectedUserId.set(userId);
    if (!userId) {
      this.events = [];
      this.calendarOptions.events = this.events;
      return;
    }
    void this.loadAppointmentsForAgenda(userId);
  }

  private async loadAppointmentsForAgenda(agendaUserId: string): Promise<void> {
    try {
      const token = await this.auth.getAccessToken();
      if (!token) return;
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      const to = new Date();
      to.setMonth(to.getMonth() + 6);
      const q = new URLSearchParams({
        agenda_user_id: agendaUserId,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const resp = await fetch(`${AGENDA_API_BASE}?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('No se pudieron cargar las citas');
      const rows = (await resp.json()) as AgendaAppointmentRow[];
      this.events = rows.map((r) => this.toCalendarEvent(r));
      this.calendarOptions.events = this.events;
    } catch (e) {
      console.error('[Calendar] loadAppointmentsForAgenda', e);
    }
  }

  private async createAppointmentInBackend(payload: {
    agenda_user_id: string | null;
    title: string;
    detail: string | null;
    start_at: string;
    end_at: string;
    attended: boolean;
    assignee_user_ids: string[];
  }): Promise<void> {
    try {
      if (!payload.agenda_user_id) {
        this.formError = 'Selecciona una agenda válida para crear la cita.';
        return;
      }
      const token = await this.auth.getAccessToken();
      if (!token) {
        this.formError = 'No hay sesión válida. Inicia sesión nuevamente.';
        return;
      }
      const resp = await fetch(AGENDA_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        this.formError = body?.error || 'No se pudo crear la cita.';
        return;
      }
      const created = body as AgendaAppointmentRow;
      this.events = [...this.events, this.toCalendarEvent(created)];
      this.calendarOptions.events = this.events;
      this.closeModal();
    } catch (e) {
      console.error('[Calendar] createAppointmentInBackend', e);
      this.formError = 'Error inesperado al crear la cita.';
    }
  }

  private toCalendarEvent(row: AgendaAppointmentRow): CalendarEvent {
    return {
      id: row.id,
      title: row.title,
      start: row.start_at,
      end: row.end_at,
      allDay: false,
      extendedProps: {
        calendar: CITA_FC_CLASS,
        detail: row.detail ?? '',
        attended: Boolean(row.attended),
        assigneeIds: Array.isArray(row.assignee_user_ids) ? row.assignee_user_ids : [],
        folio: row.folio,
      },
    };
  }

  closeModal() {
    this.isOpen = false;
    this.resetModalFields();
  }

  private showEventHoverPopover(info: any): void {
    const ev = info.event;
    const start = ev.start ? new Date(ev.start) : null;
    const end = ev.end ? new Date(ev.end) : null;
    const assigneeIds: string[] = Array.isArray(ev.extendedProps['assigneeIds'])
      ? ev.extendedProps['assigneeIds']
      : [];
    const labels = assigneeIds
      .map((id) => this.targets().find((t) => t.id === id)?.label)
      .filter(Boolean) as string[];

    const rect = info.el.getBoundingClientRect();
    const panelWidth = 260;
    const gap = 10;
    const preferRight = rect.right + panelWidth + gap < window.innerWidth;
    const left = preferRight
      ? rect.right + gap
      : Math.max(8, rect.left - panelWidth - gap);
    const top = Math.max(8, rect.top - 8);

    this.hoverPopover = {
      top,
      left,
      title: ev.title || 'Sin asunto',
      folio: this.formatFolio(ev.extendedProps['folio'], ev.id),
      start: this.formatPopoverDate(start),
      end: this.formatPopoverDate(end),
      assignees: labels.length ? labels.join(', ') : 'Sin asignados',
      attended: ev.extendedProps['attended'] ? 'Atendido' : 'Sin atender',
    };
  }

  private hideEventHoverPopover(): void {
    this.hoverPopover = null;
  }

  private formatPopoverDate(d: Date | null): string {
    if (!d) return '--';
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  }

  private formatFolio(folio: unknown, eventId: string): string {
    if (typeof folio === 'number' && Number.isFinite(folio)) {
      return String(folio).padStart(4, '0');
    }
    const raw = String(eventId ?? '');
    const digits = raw.replace(/\D/g, '');
    const core = digits.slice(-4) || '0';
    return core.padStart(4, '0');
  }

  renderEventContent(eventInfo: { timeText?: string; event: { title: string } }) {
    const colorClass = `fc-bg-${CITA_FC_CLASS}`;
    return {
      html: `
        <div class="event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm">
          <div class="fc-daygrid-event-dot"></div>
          <div class="fc-event-time">${eventInfo.timeText || ''}</div>
          <div class="fc-event-title">${eventInfo.event.title}</div>
        </div>
      `,
    };
  }

}
