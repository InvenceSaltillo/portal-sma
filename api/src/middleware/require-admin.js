/**
 * Debe ir después de `authenticate`.
 * Comprueba que el JWT corresponde a un perfil `users` con role = 'admin'.
 * Asigna `req.adminProfile` con { id, role, client_id }.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { data, error } = await req.supabase
      .from('users')
      .select('id, role, client_id')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: 'No se encontró el perfil de usuario' });
    }

    if (data.role !== 'admin') {
      return res.status(403).json({ error: 'Se requiere rol de administrador' });
    }

    req.adminProfile = data;
    next();
  } catch (err) {
    next(err);
  }
};
