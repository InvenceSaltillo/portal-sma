/**
 * Controller para especies
 */

/**
 * Obtener todas las especies
 * GET /api/species
 */
export const getAllSpecies = async (req, res, next) => {
  try {
    const { client_id, active, search } = req.query;

    let query = req.supabase
      .from('species')
      .select('*');

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    if (search) {
      query = query.or(`common_name.ilike.%${search}%,scientific_name.ilike.%${search}%`);
    }

    const { data, error } = await query.order('common_name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una especie por ID
 * GET /api/species/:id
 */
export const getSpeciesById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('species')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Especie no encontrada' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};
