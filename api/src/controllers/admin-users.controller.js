import { getSupabaseAdmin } from '../config/supabase-admin.js';

/**
 * POST /api/admin/users
 * Crea usuario en Supabase Auth y fila en public.users (admin, mismo cliente que el llamador).
 * id y user_id en public.users = auth.users.id
 */
export const createAdminUser = async (req, res, next) => {
  try {
    const { email, password, name, last_names, birth_date, gender } = req.body;

    if (!email?.trim() || !password || !name?.trim() || !last_names?.trim()) {
      return res.status(400).json({
        error: 'email, password, name y last_names son requeridos',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    const clientId = req.adminProfile.client_id;
    let admin;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      return res.status(503).json({ error: e.message });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (authError || !authData?.user?.id) {
      const msg = authError?.message || 'No se pudo crear el usuario en Auth';
      const status =
        authError?.status === 422 || /already|registered|exists/i.test(msg)
          ? 409
          : 400;
      return res.status(status).json({ error: msg });
    }

    const uid = authData.user.id;

    const row = {
      id: uid,
      user_id: uid,
      email: normalizedEmail,
      name: name.trim(),
      last_names: last_names.trim(),
      birth_date: birth_date || '1970-01-01',
      gender: gender?.trim() || 'O',
      role: 'admin',
      client_id: clientId,
      is_active: true,
      remember_token: null,
      email_verified_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await admin
      .from('users')
      .insert(row)
      .select('id, user_id, email, name, last_names, role, client_id, is_active')
      .single();

    if (insertError) {
      try {
        await admin.auth.admin.deleteUser(uid);
      } catch (cleanupErr) {
        console.error(
          '[createAdminUser] Usuario Auth creado pero falló users; no se pudo borrar en Auth:',
          uid,
          cleanupErr
        );
      }
      return next(insertError);
    }

    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
};
