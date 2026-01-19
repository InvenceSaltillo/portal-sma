-- Ejemplo de uso de la nueva RPC get_field_values_by_ids

-- Ejemplo 1: Obtener valores específicos por folio
select * from public.get_field_values_by_ids(
  p_request_id := null,
  p_folio := 'FOL-2025-001',
  p_field_ids := array[
    'field-uuid-1'::uuid,  -- CURP
    'field-uuid-2'::uuid,  -- RFC
    'field-uuid-3'::uuid,  -- Nombre
    'field-uuid-4'::uuid,  -- Primer Apellido
    'field-uuid-5'::uuid,  -- Email
    'field-uuid-6'::uuid   -- Teléfono
  ]
);

-- Ejemplo 2: Obtener valores específicos por request_id
select * from public.get_field_values_by_ids(
  p_request_id := 'request-uuid-123'::uuid,
  p_folio := null,
  p_field_ids := array[
    'field-uuid-1'::uuid,  -- CURP
    'field-uuid-2'::uuid,  -- RFC
    'field-uuid-3'::uuid   -- Nombre
  ]
);

-- Ejemplo 3: Solo campos de contacto
select * from public.get_field_values_by_ids(
  p_request_id := null,
  p_folio := 'FOL-2025-001',
  p_field_ids := array[
    'field-uuid-5'::uuid,  -- Email
    'field-uuid-6'::uuid,  -- Teléfono
    'field-uuid-7'::uuid,  -- Dirección
    'field-uuid-8'::uuid   -- Código Postal
  ]
);
