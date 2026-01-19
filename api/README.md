# Portal SMA API

API REST para el Portal SMA que realiza llamadas directas a Supabase.

## Características

- ✅ Llamadas directas a Supabase (sin RPC hasta que sea necesario)
- ✅ Autenticación con JWT de Supabase
- ✅ Rate limiting
- ✅ Manejo centralizado de errores
- ✅ CORS configurado
- ✅ Seguridad con Helmet

## Instalación

```bash
cd api
npm install
```

## Configuración

1. Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Configurar las variables de entorno en `.env`:
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase
- `PORT`: Puerto del servidor (default: 3000)
- `CORS_ORIGIN`: Origen permitido para CORS (default: http://localhost:4200)

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## Endpoints

### Health Check
- `GET /health` - Verificar estado del servidor

### Service Types (Tipos de Trámite)
- `GET /api/service-types` - Obtener todos los tipos de servicio
- `GET /api/service-types/:id` - Obtener tipo de servicio por ID

**Query params:**
- `client_id`: Filtrar por cliente
- `is_active`: Filtrar por estado activo (true/false)

### Services (Trámites)
- `GET /api/services` - Obtener todos los servicios
- `GET /api/services/:id` - Obtener servicio por ID
- `GET /api/services/by-type/:typeId` - Obtener servicios por tipo

**Query params:**
- `client_id`: Filtrar por cliente
- `service_type_id`: Filtrar por tipo de servicio
- `is_active`: Filtrar por estado activo (true/false)

### Requests (Solicitudes)
- `POST /api/requests` - Crear nueva solicitud (requiere auth)
- `GET /api/requests/:id` - Obtener solicitud por ID (requiere auth)
- `GET /api/requests/by-folio/:folio` - Obtener solicitud por folio (requiere auth)
- `GET /api/requests/:id/values` - Obtener valores de campos (requiere auth)
- `POST /api/requests/:id/values` - Guardar valores de campos (requiere auth)
- `GET /api/requests/:id/files` - Obtener archivos (requiere auth)

**Autenticación:** Todas las rutas de requests requieren header:
```
Authorization: Bearer <supabase_jwt_token>
```

### Species (Especies)
- `GET /api/species` - Obtener todas las especies
- `GET /api/species/:id` - Obtener especie por ID

**Query params:**
- `client_id`: Filtrar por cliente
- `active`: Filtrar por estado activo (true/false)
- `search`: Buscar por nombre común o científico

## Ejemplos de uso

### Obtener tipos de servicio
```bash
curl http://localhost:3000/api/service-types?client_id=xxx
```

### Obtener servicios por tipo
```bash
curl http://localhost:3000/api/services/by-type/xxx
```

### Crear solicitud (con autenticación)
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "xxx",
    "privacy_accepted": true
  }'
```

## Estructura del proyecto

```
api/
├── src/
│   ├── config/
│   │   └── supabase.js          # Cliente Supabase
│   ├── controllers/             # Lógica de negocio
│   │   ├── services.controller.js
│   │   ├── service-types.controller.js
│   │   ├── requests.controller.js
│   │   └── species.controller.js
│   ├── middleware/
│   │   ├── auth.js              # Autenticación JWT
│   │   ├── error-handler.js     # Manejo de errores
│   │   └── supabase-client.js   # Inyección de Supabase
│   ├── routes/                  # Definición de rutas
│   │   ├── services.js
│   │   ├── service-types.js
│   │   ├── requests.js
│   │   └── species.js
│   └── index.js                 # Entry point
├── .env                         # Variables de entorno (no commitear)
├── .env.example                 # Ejemplo de variables de entorno
├── package.json
└── README.md
```

## Próximos pasos

- [ ] Agregar endpoints para subida de archivos
- [ ] Implementar validación de esquemas (Joi/Zod)
- [ ] Agregar logging estructurado
- [ ] Implementar tests
- [ ] Documentación con Swagger/OpenAPI
