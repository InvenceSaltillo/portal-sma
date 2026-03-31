import { applyCorsHeadersIfNeeded } from '../config/cors-origins.js';

/**
 * Middleware para manejo centralizado de errores
 */
export const errorHandler = (err, req, res, next) => {
  applyCorsHeadersIfNeeded(req, res);
  console.error('Error:', err);

  // Errores de Supabase
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      error: 'Error en la base de datos',
      message: err.message,
      code: err.code
    });
  }

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message
    });
  }

  const message = err.message || 'Error interno del servidor';
  const status =
    err.status ||
    (message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    message.includes('Faltan SUPABASE_URL')
      ? 503
      : 500);

  // Error genérico
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFound = (req, res) => {
  applyCorsHeadersIfNeeded(req, res);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
};
