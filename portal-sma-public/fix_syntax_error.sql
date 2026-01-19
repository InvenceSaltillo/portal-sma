-- Corrección del error de sintaxis en la sección Requisitos
-- El problema está en el bloque DO $$ de la sección Requisitos

-- Eliminar la sección problemática si existe
DELETE FROM public.form_field_templates
WHERE section_template_id = '123e4567-e89b-12d3-a456-426614174009';

DELETE FROM public.form_service_sections
WHERE section_template_id = '123e4567-e89b-12d3-a456-426614174009';

-- Recrear la sección Requisitos correctamente
DO $$
DECLARE
  v_service_id           uuid := '123e4567-e89b-42d3-a456-426614174002';
  v_section_template_id  uuid := '123e4567-e89b-12d3-a456-426614174009';
  v_exists               boolean;
  v_order_index          int;
  v_has_col_span         boolean;
BEGIN
  -- Verificar si existe col_span
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='form_field_templates'
      AND column_name='col_span'
  ) INTO v_has_col_span;

  -- Vincular la sección plantilla al servicio
  SELECT EXISTS(
    SELECT 1 FROM public.form_service_sections
    WHERE service_id = v_service_id
      AND section_template_id = v_section_template_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    SELECT COALESCE(MAX(order_index) + 1, 1)
    INTO v_order_index
    FROM public.form_service_sections
    WHERE service_id = v_service_id;

    INSERT INTO public.form_service_sections (id, service_id, section_template_id, order_index)
    VALUES (gen_random_uuid(), v_service_id, v_section_template_id, v_order_index);
  END IF;

  -- Campo 1: FOTO Y FIRMA (PRIMERA VEZ) / LICENCIA ANTERIOR (RENOVACIÓN)
  PERFORM 1 FROM public.form_field_templates
  WHERE section_template_id = v_section_template_id
    AND id = '8cd7aeac-c190-4c38-b52a-16762faa379e';

  IF NOT FOUND THEN
    INSERT INTO public.form_field_templates (
      id, section_template_id, label, name, "type", required,
      placeholder, default_value, tooltip_title, tooltip_description,
      depends_on_field, data_source, data_value_column, data_label_column,
      include_placeholder, order_index, accept_mime_types, file_max_mb, file_allow_multiple
    )
    VALUES (
      '8cd7aeac-c190-4c38-b52a-16762faa379e', v_section_template_id,
      'FOTO Y FIRMA (PRIMERA VEZ) / LICENCIA ANTERIOR (RENOVACIÓN)', 'photo_signature_license', 'file', TRUE,
      NULL, NULL,
      'FOTO Y FIRMA (PRIMERA VEZ) / LICENCIA ANTERIOR (RENOVACIÓN)', 'FOTO Y FIRMA (PRIMERA VEZ) / LICENCIA ANTERIOR (RENOVACIÓN)',
      NULL, NULL, NULL, NULL,
      FALSE, 1, 'image/*,application/pdf', 10, FALSE
    );
  END IF;

  IF v_has_col_span THEN
    UPDATE public.form_field_templates SET col_span = 1 WHERE id = '8cd7aeac-c190-4c38-b52a-16762faa379e';
  END IF;

  -- Campo 2: COMPROBANTE DE PAGO DE DERECHOS POR LICENCIA DE CAZA DEPORTIVA ANUAL CAZA
  PERFORM 1 FROM public.form_field_templates
  WHERE section_template_id = v_section_template_id
    AND name = 'payment_proof_annual_hunting';

  IF NOT FOUND THEN
    INSERT INTO public.form_field_templates (
      id, section_template_id, label, name, "type", required,
      placeholder, default_value, tooltip_title, tooltip_description,
      depends_on_field, data_source, data_value_column, data_label_column,
      include_placeholder, order_index, accept_mime_types, file_max_mb, file_allow_multiple
    )
    VALUES (
      gen_random_uuid(), v_section_template_id,
      'COMPROBANTE DE PAGO DE DERECHOS POR LICENCIA DE CAZA DEPORTIVA ANUAL CAZA', 'payment_proof_annual_hunting', 'file', TRUE,
      NULL, NULL,
      'COMPROBANTE DE PAGO DE DERECHOS POR LICENCIA DE CAZA DEPORTIVA ANUAL CAZA', 'COMPROBANTE DE PAGO DE DERECHOS POR LICENCIA DE CAZA DEPORTIVA ANUAL CAZA',
      NULL, NULL, NULL, NULL,
      FALSE, 2, 'image/*,application/pdf', 10, FALSE
    );
  END IF;

  IF v_has_col_span THEN
    UPDATE public.form_field_templates SET col_span = 1 WHERE section_template_id = v_section_template_id AND name = 'payment_proof_annual_hunting';
  END IF;

  RAISE NOTICE 'Sección Requisitos creada correctamente con 2 campos';
END $$;
