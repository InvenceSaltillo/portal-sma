/**
 * Middleware para validar JWT de Supabase
 * Extrae el token del header Authorization y lo valida con Supabase
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Validar token con Supabase
    const { data: { user }, error } = await req.supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Token inválido o expirado'
      });
    }

    // Agregar usuario a la request para uso en controllers
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      error: 'Error al validar autenticación'
    });
  }
};

/**
 * Middleware opcional - solo valida si hay token, pero no falla si no existe
 * Útil para endpoints que pueden funcionar con o sin autenticación
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await req.supabase.auth.getUser(token);

      if (!error && user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Si hay error, continuar sin autenticación
    next();
  }
};
