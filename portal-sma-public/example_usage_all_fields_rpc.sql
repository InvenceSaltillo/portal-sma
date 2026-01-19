-- Ejemplo de uso de la nueva RPC get_request_all_fields

-- Ejemplo 1: Obtener todos los campos por folio
select * from public.get_request_all_fields(
  p_request_id := null,
  p_folio := 'SMA00067'
);

-- Ejemplo 2: Obtener todos los campos por request_id
select * from public.get_request_all_fields(
  p_request_id := 'e6cb1f35-d921-4091-832a-815845b61609'::uuid,
  p_folio := null
);

-- Ejemplo 3: Solo obtener los datos básicos y field_values (sin geolocalización)
select
  id,
  folio,
  service_name,
  applicant_name,
  field_values
from public.get_request_all_fields(
  p_request_id := null,
  p_folio := 'SMA00067'
);

-- Ejemplo 4: Contar cuántos campos tiene la solicitud
select
  id,
  folio,
  service_name,
  applicant_name,
  jsonb_object_keys(field_values) as field_ids,
  jsonb_object_keys_count(field_values) as total_fields
from public.get_request_all_fields(
  p_request_id := null,
  p_folio := 'SMA00067'
);

-- Ejemplo 5: Buscar campos específicos en todos los datos
select
  id,
  folio,
  field_values->'161ec443-ba55-41ed-bbc0-759eafa538af' as curp_field,
  field_values->'379f03f9-f387-44b8-8e50-bdf250722ff6' as rfc_field,
  field_values->'538254ec-1529-4b3c-b1c6-ae30d2d8dd59' as name_field
from public.get_request_all_fields(
  p_request_id := null,
  p_folio := 'SMA00067'
);
