/**
 * Middleware para manejo centralizado de errores
 */
export const errorHandler = (err, req, res, next) => {
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

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
};
