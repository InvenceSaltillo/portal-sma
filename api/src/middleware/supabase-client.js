import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';

/**
 * Middleware para inyectar cliente de Supabase en cada request
 * Si hay un token de autenticación, crea un cliente con ese token
 * Permite usar req.supabase en los controllers
 */
export const injectSupabase = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Si hay un token, crear cliente con ese token (para RLS)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false
        }
      }
    );
  } else {
    // Si no hay token, usar cliente global (solo para endpoints públicos)
    req.supabase = supabase;
  }

  next();
};
