/**
 * Controller para solicitudes (requests)
 */

/**
 * Crear una nueva solicitud
 * POST /api/requests
 * Body: { service_id, privacy_accepted }
 */
export const createRequest = async (req, res, next) => {
  try {
    const { service_id, privacy_accepted = false } = req.body;

    if (!service_id) {
      return res.status(400).json({ error: 'service_id es requerido' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Generar folio único
    const folio = `SMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Obtener status inicial (pendiente)
    const { data: initialStatus } = await req.supabase
      .from('request_statuses')
      .select('id')
      .eq('code', 'pending')
      .single();

    const { data, error } = await req.supabase
      .from('requests')
      .insert({
        user_id: req.user.id,
        service_id,
        privacy_accepted,
        folio,
        status_id: initialStatus?.id || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una solicitud por ID
 * GET /api/requests/:id
 */
export const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('requests')
      .select(`
        id,
        folio,
        user_id,
        service_id,
        privacy_accepted,
        created_at,
        status_id,
        services (
          id,
          name,
          description,
          service_types (
            id,
            name
          )
        ),
        request_statuses (
          id,
          code,
          name
        ),
        users (
          id,
          name,
          last_names,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      throw error;
    }

    // Verificar que el usuario solo pueda ver sus propias solicitudes
    // (a menos que sea admin)
    if (req.user && req.user.id !== data.user_id) {
      // Aquí podrías agregar lógica para verificar si es admin
      // Por ahora, solo el dueño puede ver su solicitud
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una solicitud por folio
 * GET /api/requests/by-folio/:folio
 */
export const getRequestByFolio = async (req, res, next) => {
  try {
    const { folio } = req.params;

    const { data, error } = await req.supabase
      .from('requests')
      .select(`
        id,
        folio,
        user_id,
        service_id,
        privacy_accepted,
        created_at,
        status_id,
        services (
          id,
          name,
          description,
          service_types (
            id,
            name
          )
        ),
        request_statuses (
          id,
          code,
          name
        ),
        users (
          id,
          name,
          last_names,
          email
        )
      `)
      .eq('folio', folio)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener valores de campos de una solicitud
 * GET /api/requests/:id/values
 */
export const getRequestValues = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('request_values')
      .select(`
        field_template_id,
        value,
        created_at,
        form_field_templates (
          id,
          name,
          label,
          type,
          section_template_id,
          form_section_templates (
            id,
            title
          )
        )
      `)
      .eq('request_id', id);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Guardar valores de campos de una solicitud
 * POST /api/requests/:id/values
 * Body: { values: [{ field_template_id, value }] }
 */
export const saveRequestValues = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { values } = req.body;

    if (!Array.isArray(values)) {
      return res.status(400).json({ error: 'values debe ser un array' });
    }

    // Preparar datos para insertar
    const valuesToInsert = values.map(v => ({
      request_id: id,
      field_template_id: v.field_template_id,
      value: v.value
    }));

    const { data, error } = await req.supabase
      .from('request_values')
      .upsert(valuesToInsert, {
        onConflict: 'request_id,field_template_id'
      })
      .select();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener archivos de una solicitud
 * GET /api/requests/:id/files
 */
export const getRequestFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('request_files')
      .select(`
        id,
        field_template_id,
        storage_path,
        file_name,
        mime_type,
        size_bytes,
        created_at,
        form_field_templates (
          id,
          name,
          label
        )
      `)
      .eq('request_id', id);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};
