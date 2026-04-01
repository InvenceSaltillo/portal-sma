// Cargar variables de entorno PRIMERO, antes de cualquier import
import './load-env.js';

// Ahora importar el resto de módulos
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { injectSupabase } from './middleware/supabase-client.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { isOriginAllowed } from './config/cors-origins.js';

// Routes
import servicesRoutes from './routes/services.js';
import serviceTypesRoutes from './routes/service-types.js';
import requestsRoutes from './routes/requests.js';
import speciesRoutes from './routes/species.js';
import storageRoutes from './routes/storage.js';
import adminUsersRoutes from './routes/admin-users.js';
import agendaAppointmentsRoutes from './routes/agenda-appointments.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
// Sin cross-origin en CORP, el navegador puede bloquear la respuesta aunque CORS esté bien (Angular muestra status 0).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      console.warn(
        `[CORS] Origen no permitido: ${origin}. En Vercel define CORS_ORIGIN, ADMIN_ORIGIN o PORTAL_ORIGIN (coma para varios), o CORS_ORIGIN_REGEX para dominio propio. En desarrollo se permiten localhost/LAN; en producción también https://*.vercel.app con host portal-sma*.`
      );
      callback(null, false);
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Inyectar Supabase en cada request
app.use(injectSupabase);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/services', servicesRoutes);
app.use('/api/service-types', serviceTypesRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/agenda-appointments', agendaAppointmentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use(notFound);

// Error handler (debe ir al final)
app.use(errorHandler);

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API Base: http://localhost:${PORT}/api`);
  });
}

export default app;
