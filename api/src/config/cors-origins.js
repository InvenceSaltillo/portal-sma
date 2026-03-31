/**
 * Orígenes permitidos para CORS. En desarrollo se aceptan localhost/127.0.0.1/::1
 * en cualquier puerto y redes privadas típicas, para evitar fallos con "0 headers"
 * cuando el front no coincide exactamente con la lista fija.
 */

function parseEnvOrigins() {
  const raw = process.env.CORS_ORIGIN;
  if (raw && String(raw).trim()) {
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
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
 * @param {string | undefined} origin - Header Origin del request
 * @returns {boolean}
 */
export function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }
  const list = parseEnvOrigins();
  if (list.includes(origin)) {
    return true;
  }
  if (process.env.NODE_ENV === 'production') {
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
