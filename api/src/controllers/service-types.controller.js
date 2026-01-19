/**
 * Controller para tipos de servicio
 */

/**
 * Obtener todos los tipos de servicio
 * GET /api/service-types
 */
export const getAllServiceTypes = async (req, res, next) => {
  try {
    const { client_id, is_active } = req.query;

    let query = req.supabase
      .from('service_types')
      .select('*');

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un tipo de servicio por ID
 * GET /api/service-types/:id
 */
export const getServiceTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('service_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Tipo de servicio no encontrado' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};
