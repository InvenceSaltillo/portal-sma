/**
 * Plantillas de documento (.docx) alineadas al legado SMA.
 *
 * Jerarquía: plantilla → **secciones** (agrupador + instrucciones) → **campos/datos**
 * (clave `[marcador]` en Word + descripción), equivalente al modal «Datos» del legado.
 */

/** Fila de `public.document_templates`. */
export interface DocumentTemplateRow {
  id: string;
  /** FK a `public.clients.id`. */
  client_id: string;
  name: string;
  description: string | null;

  include_management_plan: boolean;
  management_plan_merge_key: string | null;

  include_property_image: boolean;
  property_image_merge_key: string | null;

  docx_storage_path: string | null;

  include_dictamen_evaluation_key: boolean;
  dictamen_evaluation_merge_key: string | null;

  include_dictamen_date_key: boolean;
  dictamen_date_merge_key: string | null;

  include_dictamen_evaluator_key: boolean;
  dictamen_evaluator_merge_key: string | null;

  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentTemplateInsert {
  client_id: string;
  name: string;
  description?: string | null;
  include_management_plan?: boolean;
  management_plan_merge_key?: string | null;
  include_property_image?: boolean;
  property_image_merge_key?: string | null;
  docx_storage_path?: string | null;
  include_dictamen_evaluation_key?: boolean;
  dictamen_evaluation_merge_key?: string | null;
  include_dictamen_date_key?: boolean;
  dictamen_date_merge_key?: string | null;
  include_dictamen_evaluator_key?: boolean;
  dictamen_evaluator_merge_key?: string | null;
  is_active?: boolean;
}

export type DocumentTemplateUpdate = Partial<
  Omit<DocumentTemplateInsert, 'client_id'>
>;

/**
 * Fila de `public.document_template_sections` (bloque «Secciones»: nombre + instrucciones).
 */
export interface DocumentTemplateSectionRow {
  id: string;
  document_template_id: string;
  sort_order: number;
  name: string;
  fill_instructions: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentTemplateSectionInsert {
  document_template_id: string;
  sort_order?: number;
  name: string;
  fill_instructions?: string | null;
}

export type DocumentTemplateSectionUpdate = Partial<
  Omit<DocumentTemplateSectionInsert, 'document_template_id'>
>;

/** Fila de `public.document_template_section_fields` (tabla «Datos» / claves del .docx). */
export interface DocumentTemplateSectionFieldRow {
  id: string;
  section_id: string;
  sort_order: number;
  /** Marcador en el Word, p. ej. `[claveregistro]` o `claveregistro`. */
  merge_key: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentTemplateSectionFieldInsert {
  section_id: string;
  sort_order?: number;
  merge_key: string;
  description?: string | null;
}

export type DocumentTemplateSectionFieldUpdate = Partial<
  Omit<DocumentTemplateSectionFieldInsert, 'section_id'>
>;

export interface DocumentTemplateSectionWithFields extends DocumentTemplateSectionRow {
  fields: DocumentTemplateSectionFieldRow[];
}

export interface DocumentTemplateRelatedRow {
  id: string;
  document_template_id: string;
  related_document_template_id: string;
  sort_order: number;
  created_at: string | null;
}

export interface DocumentTemplateRelatedInsert {
  document_template_id: string;
  related_document_template_id: string;
  sort_order?: number;
}
