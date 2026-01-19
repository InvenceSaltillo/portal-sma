-- Función mejorada que preserva la estructura de secciones y maneja campos duplicados
drop function if exists public.get_request_with_values(uuid, text);

create or replace function public.get_request_with_values(
  p_request_id uuid default null,
  p_folio      text default null
)
returns table (
  id uuid,
  folio text,
  service_id uuid,
  service_name text,
  service_type_name text,
  client_id uuid,
  user_id uuid,
  created_at timestamptz,
  privacy_accepted boolean,
  status_id uuid,
  status_code text,
  status_name text,
  municipality_name text,
  state_name text,
  applicant_name text,
  form_values jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Validaciones: uno u otro (no ambos, no ninguno)
  if p_request_id is null and nullif(btrim(p_folio), '') is null then
    raise exception 'Provide either p_request_id or p_folio';
  end if;
  if p_request_id is not null and nullif(btrim(p_folio), '') is not null then
    raise exception 'Provide only one parameter: p_request_id or p_folio';
  end if;

  return query
  with base as (
    select
      r.id,
      r.folio,
      r.service_id,
      s.name::text   as service_name,
      st.name::text  as service_type_name,
      s.client_id    as client_id,
      r.user_id      as user_id,
      r.created_at,
      r.privacy_accepted,
      r.status_id,
      rs.code::text  as status_code,
      rs.name::text  as status_name,
      trim(concat_ws(' ', u.name, u.last_names)) as applicant_name
    from public.requests r
    join public.services           s  on s.id  = r.service_id
    left join public.service_types st on st.id = s.service_type_id
    left join public.request_statuses rs on rs.id = r.status_id
    left join public.users            u  on u.id = r.user_id
    where ((p_request_id is not null and r.id = p_request_id)
        or (p_folio      is not null and r.folio = p_folio))
  ),

  -- Último valor por field_template_id (mantener lógica existente)
  last_values as (
    select distinct on (rv.field_template_id)
      rv.request_id,
      rv.field_template_id,
      rv.value,
      rv.created_at
    from public.request_values rv
    where rv.request_id = (select b.id from base b limit 1)
    order by rv.field_template_id, rv.created_at desc
  ),

  -- Construir estructura jerárquica: sections -> fields
  section_fields as (
    select
      lv.request_id,
      coalesce(
        regexp_replace(
          lower(nullif(trim(fst.title), '')),
          '[^a-z0-9]+','_','g'
        ),
        'sin_seccion'
      ) as section_slug,
      coalesce(trim(fst.title), 'Sin Sección') as section_title,
      ffs.order_index as section_order,
      regexp_replace(
        lower(fft.name),
        '[^a-z0-9]+','_','g'
      ) as field_slug,
      fft.name as field_label,
      fft.order_index as field_order,
      lv.value,
      fft.type as field_type,
      fst.id as section_id,
      fft.id as field_id
    from last_values lv
    join public.form_field_templates   fft on fft.id = lv.field_template_id
    left join public.form_section_templates fst on fst.id = fft.section_template_id
    left join public.form_service_sections ffs on ffs.section_template_id = fst.id
  ),

  -- Agrupar por secciones y construir JSON estructurado
  sections_data as (
    select
      sf.request_id,
      sf.section_slug,
      sf.section_title,
      coalesce(sf.section_order, 999) as section_order,
      jsonb_object_agg(
        sf.field_slug,
        jsonb_build_object(
          'value', sf.value,
          'label', sf.field_label,
          'type', sf.field_type,
          'order', sf.field_order,
          'field_id', sf.field_id
        )
        order by sf.field_order, sf.field_slug
      ) as fields_data
    from section_fields sf
    group by sf.request_id, sf.section_slug, sf.section_title, sf.section_order
  ),

  -- Construir el objeto JSON final con estructura jerárquica
  form_values_json as (
    select
      sd.request_id,
      jsonb_object_agg(
        sd.section_slug,
        jsonb_build_object(
          'title', sd.section_title,
          'order', sd.section_order,
          'fields', sd.fields_data
        )
        order by sd.section_order, sd.section_slug
      ) as form_values
    from sections_data sd
    group by sd.request_id
  ),

  -- Mantener lógica existente para geolocalización
  muni_raw as (
    select
      lv.request_id,
      regexp_replace(lower(fft.name), '[^a-z0-9]+', '', 'g') as norm_name,
      lv.value
    from last_values lv
    join public.form_field_templates fft on fft.id = lv.field_template_id
  ),
  muni_prep as (
    select
      mr.request_id,
      max(case
            when mr.norm_name in ('municipalityid','municipioid','idmunicipio')
             and mr.value ~ '^[0-9]+$'
            then mr.value::int
          end) as municipality_id,
      coalesce(
        max(case when mr.norm_name in ('municipality','municipio')
                 then nullif(trim(mr.value), '') end),
        null
      ) as municipality_name_text
    from muni_raw mr
    group by mr.request_id
  ),
  mn as (
    select
      mp.request_id,
      coalesce(m.name::text, mp.municipality_name_text)::text as municipality_name,
      m.state_id
    from muni_prep mp
    left join public.municipalities m on m.id = mp.municipality_id
  ),

  state_raw as (
    select
      lv.request_id,
      regexp_replace(lower(fft.name), '[^a-z0-9]+', '', 'g') as norm_name,
      lv.value
    from last_values lv
    join public.form_field_templates fft on fft.id = lv.field_template_id
  ),
  state_prep as (
    select
      sr.request_id,
      max(case
            when sr.norm_name in ('stateid','estadoid','idestado')
             and sr.value ~ '^[0-9]+$'
            then sr.value::int
          end) as state_id,
      coalesce(
        max(case when sr.norm_name in ('state','estado')
                 then nullif(trim(sr.value), '') end),
        null
      ) as state_name_text
    from state_raw sr
    group by sr.request_id
  ),
  geo as (
    select
      coalesce(mn.request_id, sp.request_id)             as request_id,
      mn.municipality_name                               as municipality_name,
      coalesce(st2.name::text, sp.state_name_text)::text as state_name
    from mn
    full join state_prep sp on sp.request_id = mn.request_id
    left join public.states st2 on st2.id = coalesce(mn.state_id, sp.state_id)
  )

  select
    b.id,
    b.folio,
    b.service_id,
    b.service_name,
    b.service_type_name,
    b.client_id,
    b.user_id,
    b.created_at,
    b.privacy_accepted,
    b.status_id,
    b.status_code,
    b.status_name,
    g.municipality_name,
    g.state_name,
    b.applicant_name,
    coalesce(fv.form_values, '{}'::jsonb) as form_values
  from base b
  left join form_values_json fv on fv.request_id = b.id
  left join geo      g on g.request_id = b.id;
end;
$$;
