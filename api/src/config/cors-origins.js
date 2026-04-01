/**
 * Orígenes permitidos para CORS.
 * - Producción: define `CORS_ORIGIN` y/o `ADMIN_ORIGIN` y/o `PORTAL_ORIGIN` en Vercel
 *   (coma para varios). Sin eso, se usan valores por defecto típicos `*.vercel.app` del proyecto.
 * - Desarrollo: localhost/127.0.0.1/::1 en cualquier puerto y redes privadas típicas.
 */

const ENV_ORIGIN_KEYS = ['CORS_ORIGIN', 'ADMIN_ORIGIN', 'PORTAL_ORIGIN'];

/** Si no hay env en producción, encajar con los frontends desplegados en Vercel (ajusta en dashboard si usas otro dominio). */
const FALLBACK_PRODUCTION_ORIGINS = [
  'https://portal-sma-admin.vercel.app',
  'https://portal-sma-public.vercel.app',
];

/**
 * @param {string} origin
 * @returns {string}
 */
function normalizeOrigin(origin) {
  const s = String(origin || '').trim();
  if (!s) return s;
  try {
    return new URL(s).origin;
  } catch {
    return s.replace(/\/$/, '');
  }
}

function parseEnvOrigins() {
  const merged = [];
  for (const key of ENV_ORIGIN_KEYS) {
    const raw = process.env[key];
    if (raw && String(raw).trim()) {
      merged.push(
        ...String(raw)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  const unique = [...new Set(merged.map(normalizeOrigin))].filter(Boolean);
  if (unique.length) {
    return unique;
  }
  if (process.env.NODE_ENV === 'production') {
    return FALLBACK_PRODUCTION_ORIGINS.map(normalizeOrigin);
  }
  return [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:4300',
    'http://127.0.0.1:4300',
    'http://[::1]:4200',
    'http://[::1]:4300',
  ];
}

function isPrivateLanHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]') {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/**
 * Despliegues Vercel del monorepo (producción y previews: portal-sma-admin-git-…vercel.app).
 * No sustituye dominios propios: para esos usa CORS_ORIGIN en el dashboard.
 * @param {string} origin
 */
function isPortalSmaVercelDeployment(origin) {
  try {
    const u = new URL(origin);
    const h = u.hostname.toLowerCase();
    return (
      u.protocol === 'https:' &&
      h.endsWith('.vercel.app') &&
      h.startsWith('portal-sma')
    );
  } catch {
    return false;
  }
}

function matchesOriginRegex(origin) {
  const raw = process.env.CORS_ORIGIN_REGEX;
  if (!raw || !String(raw).trim()) {
    return false;
  }
  try {
    return new RegExp(String(raw).trim()).test(origin);
  } catch {
    return false;
  }
}

/**
 * @param {string | undefined} origin - Header Origin del request
 * @returns {boolean}
 */
export function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }
  const normalized = normalizeOrigin(origin);
  const list = parseEnvOrigins();
  if (list.includes(normalized)) {
    return true;
  }
  if (process.env.NODE_ENV === 'production') {
    if (isPortalSmaVercelDeployment(origin)) {
      return true;
    }
    if (matchesOriginRegex(origin)) {
      return true;
    }
    return false;
  }
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return false;
    }
    return isPrivateLanHost(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Refuerza cabeceras CORS en respuestas que no pasan por el middleware `cors`
 * (p. ej. algunos errores) para que el navegador no oculte el cuerpo/error.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function applyCorsHeadersIfNeeded(req, res) {
  if (res.headersSent) {
    return;
  }
  const origin = req.headers.origin;
  if (!origin || !isOriginAllowed(origin)) {
    return;
  }
  if (res.getHeader('Access-Control-Allow-Origin')) {
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
