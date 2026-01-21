/**
 * Controller para servicios (trámites)
 */

/**
 * Obtener todos los servicios
 * GET /api/services
 */
export const getAllServices = async (req, res, next) => {
  try {
    const { client_id, service_type_id, is_active } = req.query;

    let query = req.supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types (
          id,
          name
        )
      `);

    // Filtros opcionales
    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (service_type_id) {
      query = query.eq('service_type_id', service_type_id);
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
 * Obtener un servicio por ID
 * GET /api/services/:id
 */
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener servicios por tipo de servicio
 * GET /api/services/by-type/:typeId
 */
export const getServicesByType = async (req, res, next) => {
  try {
    const { typeId } = req.params;
    const { client_id, is_active } = req.query;

    let query = req.supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        is_active,
        service_type_id,
        client_id,
        created_at,
        updated_at,
        service_types (
          id,
          name
        )
      `)
      .eq('service_type_id', typeId);

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
 * Obtener campos de formulario por servicio
 * GET /api/services/:id/form-fields
 */
export const getFormFieldsByService = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Intentar usar RPC primero
    const { data: rpcData, error: rpcError } = await req.supabase.rpc('get_form_fields_by_service', {
      p_service_id: id
    });

    if (!rpcError && rpcData) {
      try {
        const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        return res.json(parsed);
      } catch (parseError) {
        return res.json(rpcData);
      }
    }

    // Fallback: obtener campos desde las tablas directamente
    const { data: fields, error: fieldsError } = await req.supabase
      .from('form_field_templates')
      .select(`
        *,
        form_section_templates (
          id,
          title,
          order_index
        )
      `)
      .eq('service_id', id)
      .order('order_index');

    if (fieldsError) throw fieldsError;

    res.json(fields || []);
  } catch (error) {
    next(error);
  }
};
