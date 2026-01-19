// Cargar variables de entorno PRIMERO, antes de cualquier import
import './load-env.js';

// Ahora importar el resto de módulos
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { injectSupabase } from './middleware/supabase-client.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

// Routes
import servicesRoutes from './routes/services.js';
import serviceTypesRoutes from './routes/service-types.js';
import requestsRoutes from './routes/requests.js';
import speciesRoutes from './routes/species.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));

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

// 404 handler
app.use(notFound);

// Error handler (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base: http://localhost:${PORT}/api`);
});

export default app;
