import { supabase } from '../config/supabase.js';

/**
 * Middleware para inyectar cliente de Supabase en cada request
 * Permite usar req.supabase en los controllers
 */
export const injectSupabase = (req, res, next) => {
  req.supabase = supabase;
  next();
};
