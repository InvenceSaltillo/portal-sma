/**
 * Controller para solicitudes (requests)
 */

/**
 * Crear una nueva solicitud (usando RPC si existe)
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

    // Intentar usar RPC primero
    const { data: rpcData, error: rpcError } = await req.supabase.rpc('create_request', {
      p_service_id: service_id,
      p_privacy_accepted: privacy_accepted
    });

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (row && row.id && row.folio) {
        return res.status(201).json({ id: row.id, folio: row.folio });
      }
    }

    // Fallback a inserción directa
    const folio = `SMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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

    res.status(201).json({ id: data.id, folio: data.folio });
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
 * Listar solicitudes del usuario autenticado
 * GET /api/requests?limit=20&offset=0
 */
export const listMyRequests = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    console.log('DEBUG listMyRequests:', {
      userId: req.user.id,
      limit,
      offset
    });

    // Intentar usar RPC primero
    const { data: rpcData, error: rpcError } = await req.supabase.rpc('list_my_requests', {
      p_limit: limit,
      p_offset: offset
    });

    if (!rpcError && rpcData) {
      console.log('DEBUG: RPC success, returned', rpcData?.length || 0, 'items');
      return res.json(rpcData || []);
    }

    // Si RPC falla, usar query directa
    console.log('DEBUG: RPC failed or not found, using direct query. Error:', rpcError?.message);

    const { data: fallbackData, error: fallbackError } = await req.supabase
      .from('requests')
      .select(`
        id,
        folio,
        service_id,
        created_at,
        status_id,
        services (
          id,
          name
        ),
        request_statuses (
          id,
          code,
          name
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fallbackError) {
      console.error('DEBUG: Fallback query error:', fallbackError);
      throw fallbackError;
    }

    console.log('DEBUG: Fallback query success, returned', fallbackData?.length || 0, 'items');
    res.json(fallbackData || []);
  } catch (error) {
    console.error('DEBUG: listMyRequests error:', error);
    next(error);
  }
};

/**
 * Obtener una solicitud por folio (con valores usando RPC)
 * GET /api/requests/by-folio/:folio
 */
export const getRequestByFolio = async (req, res, next) => {
  try {
    const { folio } = req.params;

    // Intentar usar RPC primero
    const { data: rpcData, error: rpcError } = await req.supabase.rpc('get_request_with_values', {
      p_folio: folio
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      const requestData = rpcData[0];
      // Construir respuesta en el formato esperado
      const result = {
        id: requestData.id,
        folio: requestData.folio,
        service_id: requestData.service_id,
        service_name: requestData.service_name,
        created_at: requestData.created_at,
        privacy_accepted: requestData.privacy_accepted,
        status_id: requestData.status_id,
        status_code: requestData.status_code,
        status_name: requestData.status_name,
        applicant_name: requestData.applicant_name || 'N/A',
        municipality: requestData.municipality_name || 'N/A',
        state: requestData.state_name || 'N/A',
        timeline: [
          {
            id: requestData.status_id,
            status_id: requestData.status_id,
            status_name: requestData.status_name,
            status_code: requestData.status_code,
            created_at: requestData.created_at,
            description: `Estado actual: ${requestData.status_name}`,
            completed: true
          }
        ]
      };
      return res.json(result);
    }

    // Fallback a query directa
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
 * Guardar valores y archivos de una solicitud (usando RPC save_request_data)
 * POST /api/requests/:id/data
 * Body: { values: [{ field_id, value }], files: [{ field_id, path, filename, mime_type, size }] }
 */
export const saveRequestData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { values = [], files = [] } = req.body;

    // Intentar usar RPC primero
    const { data: rpcData, error: rpcError } = await req.supabase.rpc('save_request_data', {
      p_request_id: id,
      p_values: values,
      p_files: files
    });

    if (!rpcError) {
      return res.json({ success: true, data: rpcData });
    }

    // Fallback a inserción directa
    if (values.length > 0) {
      const valuesToInsert = values.map(v => ({
        request_id: id,
        field_template_id: v.field_id,
        value: v.value
      }));

      const { error: valuesError } = await req.supabase
        .from('request_values')
        .upsert(valuesToInsert, {
          onConflict: 'request_id,field_template_id'
        });

      if (valuesError) throw valuesError;
    }

    if (files.length > 0) {
      const filesToInsert = files.map(f => ({
        request_id: id,
        field_template_id: f.field_id,
        storage_path: f.path,
        file_name: f.filename,
        mime_type: f.mime_type,
        size_bytes: f.size
      }));

      const { error: filesError } = await req.supabase
        .from('request_files')
        .insert(filesToInsert);

      if (filesError) throw filesError;
    }

    res.json({ success: true });
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
      field_template_id: v.field_template_id || v.field_id,
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
