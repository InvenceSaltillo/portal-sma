import { getSupabaseAdmin } from '../config/supabase-admin.js';

async function resolveProfile(admin, authId) {
  const { data, error } = await admin
    .from('users')
    .select('id, client_id')
    .or(`id.eq.${authId},user_id.eq.${authId}`)
    .limit(1)
    .single();
  if (error || !data) return null;
  return data;
}

export const listMyNotifications = async (req, res, next) => {
  try {
    const authId = req.user?.id;
    if (!authId) return res.status(401).json({ error: 'Usuario no autenticado' });
    const admin = getSupabaseAdmin();
    const me = await resolveProfile(admin, authId);
    if (!me) return res.status(403).json({ error: 'Perfil no encontrado para el usuario actual' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const { data, error } = await admin
      .from('user_notifications')
      .select('*')
      .eq('client_id', me.client_id)
      .eq('recipient_user_id', me.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const authId = req.user?.id;
    if (!authId) return res.status(401).json({ error: 'Usuario no autenticado' });
    const notificationId = String(req.params.id || '').trim();
    if (!notificationId) return res.status(400).json({ error: 'ID inválido' });

    const admin = getSupabaseAdmin();
    const me = await resolveProfile(admin, authId);
    if (!me) return res.status(403).json({ error: 'Perfil no encontrado para el usuario actual' });

    const { data, error } = await admin
      .from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('client_id', me.client_id)
      .eq('recipient_user_id', me.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};
