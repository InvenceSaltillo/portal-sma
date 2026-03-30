import { getSupabaseAdmin } from '../config/supabase-admin.js';

async function resolveProfile(admin, authId) {
  const { data, error } = await admin
    .from('users')
    .select('id, client_id, role, name, last_names, email, is_active')
    .or(`id.eq.${authId},user_id.eq.${authId}`)
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

async function listAllowedAgendaUsers(admin, me) {
  if (!me?.id || !me?.client_id) return [];

  const role = String(me.role || '').trim().toLowerCase();
  if (role === 'admin') {
    const { data } = await admin
      .from('users')
      .select('id, name, last_names, email')
      .eq('client_id', me.client_id)
      .eq('role', 'admin')
      .eq('is_active', true);
    return data || [];
  }

  const { data: assignedRows } = await admin
    .from('agenda_administration_assignments')
    .select('agenda_user_id')
    .eq('client_id', me.client_id)
    .eq('administrator_user_id', me.id);

  const assignedIds = (assignedRows || []).map((r) => r.agenda_user_id);
  const ids = [...new Set([me.id, ...assignedIds])];
  if (!ids.length) return [];

  const { data: users } = await admin
    .from('users')
    .select('id, name, last_names, email')
    .eq('client_id', me.client_id)
    .in('id', ids)
    .eq('is_active', true);
  return users || [];
}

function toIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export const createAgendaAppointment = async (req, res, next) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const admin = getSupabaseAdmin();
    const me = await resolveProfile(admin, authId);
    if (!me) {
      return res.status(403).json({ error: 'Perfil no encontrado para el usuario actual' });
    }

    const {
      agenda_user_id,
      title,
      detail = null,
      start_at,
      end_at,
      attended = false,
      assignee_user_ids = [],
    } = req.body || {};

    const normalizedTitle = String(title || '').trim();
    if (!normalizedTitle) {
      return res.status(400).json({ error: 'El asunto es obligatorio' });
    }

    const startIso = toIsoOrNull(start_at);
    const endIso = toIsoOrNull(end_at);
    if (!startIso || !endIso) {
      return res.status(400).json({ error: 'Fechas inválidas para la cita' });
    }
    if (new Date(endIso) <= new Date(startIso)) {
      return res.status(400).json({ error: 'La fecha/hora fin debe ser mayor al inicio' });
    }

    const allowedUsers = await listAllowedAgendaUsers(admin, me);
    const allowedIds = new Set(allowedUsers.map((u) => u.id));
    if (!agenda_user_id || !allowedIds.has(agenda_user_id)) {
      return res.status(403).json({ error: 'No tienes permiso para crear citas en esa agenda' });
    }

    const assigneeIds = Array.isArray(assignee_user_ids)
      ? [...new Set(assignee_user_ids.filter((x) => typeof x === 'string' && allowedIds.has(x) && x !== agenda_user_id))]
      : [];

    const insertRow = {
      client_id: me.client_id,
      agenda_user_id,
      title: normalizedTitle,
      detail: detail == null ? null : String(detail),
      start_at: startIso,
      end_at: endIso,
      attended: Boolean(attended),
      assignee_user_ids: assigneeIds,
      created_by_auth_id: authId,
    };

    const { data, error } = await admin
      .from('agenda_appointments')
      .insert(insertRow)
      .select('*')
      .single();

    if (error) throw error;

    // Notificaciones web por usuario implicado (agenda + asignados + creador).
    try {
      const recipientIds = [...new Set([agenda_user_id, ...assigneeIds, me.id])];
      const startFmt = new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(data.start_at));
      const rows = recipientIds.map((recipientId) => ({
        client_id: me.client_id,
        recipient_user_id: recipientId,
        actor_user_id: me.id,
        type: 'appointment_created',
        title: `Nueva cita #${String(data.folio).padStart(4, '0')}`,
        message: `${normalizedTitle} · ${startFmt}`,
        payload: {
          appointment_id: data.id,
          folio: data.folio,
          agenda_user_id: agenda_user_id,
          attended: Boolean(attended),
        },
      }));
      const { error: notifError } = await admin.from('user_notifications').insert(rows);
      if (notifError) {
        console.error('[createAgendaAppointment] No se pudieron crear notificaciones', notifError);
      }
    } catch (notifErr) {
      console.error('[createAgendaAppointment] Error no bloqueante al crear notificaciones', notifErr);
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const listAgendaAppointments = async (req, res, next) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const admin = getSupabaseAdmin();
    const me = await resolveProfile(admin, authId);
    if (!me) {
      return res.status(403).json({ error: 'Perfil no encontrado para el usuario actual' });
    }

    const agendaUserId = String(req.query.agenda_user_id || '').trim();
    if (!agendaUserId) {
      return res.status(400).json({ error: 'agenda_user_id es requerido' });
    }

    const allowedUsers = await listAllowedAgendaUsers(admin, me);
    const allowedIds = new Set(allowedUsers.map((u) => u.id));
    if (!allowedIds.has(agendaUserId)) {
      return res.status(403).json({ error: 'No tienes permiso para consultar esa agenda' });
    }

    const fromIso = toIsoOrNull(req.query.from) || new Date('2000-01-01T00:00:00.000Z').toISOString();
    const toIso = toIsoOrNull(req.query.to) || new Date('2100-01-01T00:00:00.000Z').toISOString();

    const { data, error } = await admin
      .from('agenda_appointments')
      .select('*')
      .eq('client_id', me.client_id)
      .eq('agenda_user_id', agendaUserId)
      .gte('start_at', fromIso)
      .lte('end_at', toIso)
      .order('start_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

export const deleteAgendaAppointment = async (req, res, next) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const admin = getSupabaseAdmin();
    const me = await resolveProfile(admin, authId);
    if (!me) {
      return res.status(403).json({ error: 'Perfil no encontrado para el usuario actual' });
    }

    const appointmentId = String(req.params.id || '').trim();
    if (!appointmentId) {
      return res.status(400).json({ error: 'ID de cita inválido' });
    }

    const { data: appt, error: apptError } = await admin
      .from('agenda_appointments')
      .select('id, agenda_user_id, client_id')
      .eq('id', appointmentId)
      .single();

    if (apptError || !appt) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    if (appt.client_id !== me.client_id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta cita' });
    }

    const allowedUsers = await listAllowedAgendaUsers(admin, me);
    const allowedIds = new Set(allowedUsers.map((u) => u.id));
    if (!allowedIds.has(appt.agenda_user_id)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta cita' });
    }

    const { error } = await admin
      .from('agenda_appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
