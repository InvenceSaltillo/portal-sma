import { createClient } from '@supabase/supabase-js';

let _admin = null;

/**
 * Cliente Supabase con service_role: Auth Admin API e inserciones que ignoran RLS.
 * Requiere SUPABASE_SERVICE_ROLE_KEY en el entorno (solo servidor, nunca en el front).
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para operaciones de administración'
    );
  }
  if (!_admin) {
    _admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _admin;
}
