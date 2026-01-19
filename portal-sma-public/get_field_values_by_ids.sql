-- RPC optimizada que devuelve solo los valores de campos específicos por sus IDs
drop function if exists public.get_field_values_by_ids(uuid, text, uuid[]);

create or replace function public.get_field_values_by_ids(
  p_request_id uuid default null,
  p_folio      text default null,
  p_field_ids  uuid[] default array[]::uuid[]
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
  field_values jsonb
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

  -- Si no se proporcionan field_ids, devolver estructura vacía
  if array_length(p_field_ids, 1) is null or array_length(p_field_ids, 1) = 0 then
    raise exception 'Field IDs array cannot be empty';
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

  -- Último valor por field_template_id para los campos específicos
  requested_values as (
    select distinct on (rv.field_template_id)
      rv.request_id,
      rv.field_template_id,
      rv.value,
      rv.created_at,
      fft.name as field_name,
      fft.type as field_type,
      fst.title as section_title
    from public.request_values rv
    join public.form_field_templates fft on fft.id = rv.field_template_id
    left join public.form_section_templates fst on fst.id = fft.section_template_id
    where rv.request_id = (select b.id from base b limit 1)
      and rv.field_template_id = any(p_field_ids)
    order by rv.field_template_id, rv.created_at desc
  ),

  -- Construir objeto JSON con los valores solicitados
  field_values_json as (
    select
      rv.request_id,
      jsonb_object_agg(
        rv.field_template_id::text,
        jsonb_build_object(
          'field_name', rv.field_name,
          'field_type', rv.field_type,
          'section_title', rv.section_title,
          'value', rv.value,
          'field_id', rv.field_template_id
        )
      ) as field_values
    from requested_values rv
    group by rv.request_id
  ),

  -- Mantener lógica existente para geolocalización
  muni_raw as (
    select
      lv.request_id,
      regexp_replace(lower(fft.name), '[^a-z0-9]+', '', 'g') as norm_name,
      lv.value
    from public.request_values lv
    join public.form_field_templates fft on fft.id = lv.field_template_id
    where lv.request_id = (select b.id from base b limit 1)
      and lv.field_template_id = any(p_field_ids)
      and lv.created_at = (
        select max(lv2.created_at)
        from public.request_values lv2
        where lv2.field_template_id = lv.field_template_id
      )
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
    from public.request_values lv
    join public.form_field_templates fft on fft.id = lv.field_template_id
    where lv.request_id = (select b.id from base b limit 1)
      and lv.field_template_id = any(p_field_ids)
      and lv.created_at = (
        select max(lv2.created_at)
        from public.request_values lv2
        where lv2.field_template_id = lv.field_template_id
      )
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
    coalesce(fv.field_values, '{}'::jsonb) as field_values
  from base b
  left join field_values_json fv on fv.request_id = b.id
  left join geo      g on g.request_id = b.id;
end;
$$;
