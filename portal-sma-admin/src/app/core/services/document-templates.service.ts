import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';
import type {
  DocumentTemplateInsert,
  DocumentTemplateRelatedInsert,
  DocumentTemplateRow,
  DocumentTemplateSectionFieldRow,
  DocumentTemplateSectionRow,
  DocumentTemplateSectionWithFields,
  DocumentTemplateUpdate,
} from '../models/document-template.model';

export type {
  DocumentTemplateRow,
  DocumentTemplateSectionRow,
  DocumentTemplateSectionFieldRow,
  DocumentTemplateSectionWithFields,
} from '../models/document-template.model';

/** Payload al guardar el árbol sección → campos (reemplazo total). */
export interface DocumentTemplateSectionTreePayload {
  name: string;
  fill_instructions: string | null;
  fields: { merge_key: string; description: string | null }[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentTemplatesService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: DocumentTemplateRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('document_templates')
      .select('*')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    return {
      data: (data as DocumentTemplateRow[]) ?? [],
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: DocumentTemplateRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('document_templates')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as DocumentTemplateRow) ?? null,
      error,
    };
  }

  async insert(
    row: DocumentTemplateInsert
  ): Promise<{ data: DocumentTemplateRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('document_templates')
      .insert(row)
      .select()
      .single();

    return {
      data: (data as DocumentTemplateRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: DocumentTemplateUpdate
  ): Promise<{ data: DocumentTemplateRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('document_templates')
      .update(patch)
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    return {
      data: (data as DocumentTemplateRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('document_templates')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }

  /** Solo secciones (sin campos anidados). */
  async listSectionsByTemplateId(
    templateId: string
  ): Promise<{
    data: DocumentTemplateSectionRow[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.auth.client
      .from('document_template_sections')
      .select('*')
      .eq('document_template_id', templateId)
      .order('sort_order', { ascending: true });

    return {
      data: (data as DocumentTemplateSectionRow[]) ?? [],
      error,
    };
  }

  /**
   * Secciones con campos sustituibles (equivalente a sección + modal «Datos» del legado).
   */
  async listSectionsWithFieldsByTemplateId(
    templateId: string
  ): Promise<{
    data: DocumentTemplateSectionWithFields[];
    error: PostgrestError | null;
  }> {
    const { data: sections, error: secErr } = await this.auth.client
      .from('document_template_sections')
      .select('*')
      .eq('document_template_id', templateId)
      .order('sort_order', { ascending: true });

    if (secErr) {
      return { data: [], error: secErr };
    }

    const list = (sections as DocumentTemplateSectionRow[]) ?? [];
    if (list.length === 0) {
      return { data: [], error: null };
    }

    const ids = list.map((s) => s.id);
    const { data: fields, error: fErr } = await this.auth.client
      .from('document_template_section_fields')
      .select('*')
      .in('section_id', ids)
      .order('sort_order', { ascending: true });

    if (fErr) {
      return { data: [], error: fErr };
    }

    const bySection = new Map<string, DocumentTemplateSectionFieldRow[]>();
    for (const f of (fields as DocumentTemplateSectionFieldRow[]) ?? []) {
      const arr = bySection.get(f.section_id) ?? [];
      arr.push(f);
      bySection.set(f.section_id, arr);
    }

    const data: DocumentTemplateSectionWithFields[] = list.map((s) => ({
      ...s,
      fields: bySection.get(s.id) ?? [],
    }));

    return { data, error: null };
  }

  /**
   * Sustituye secciones y sus campos (borra secciones del template; CASCADE borra fields).
   */
  async replaceSectionTreeForTemplate(
    templateId: string,
    sections: DocumentTemplateSectionTreePayload[]
  ): Promise<{ error: PostgrestError | null }> {
    const { error: delErr } = await this.auth.client
      .from('document_template_sections')
      .delete()
      .eq('document_template_id', templateId);

    if (delErr) {
      return { error: delErr };
    }

    if (sections.length === 0) {
      return { error: null };
    }

    const sectionRows = sections.map((s, sort_order) => ({
      document_template_id: templateId,
      sort_order,
      name: s.name,
      fill_instructions: s.fill_instructions,
    }));

    const { data: insertedSections, error: insSecErr } = await this.auth.client
      .from('document_template_sections')
      .insert(sectionRows)
      .select('id, sort_order')
      .order('sort_order', { ascending: true });

    if (insSecErr) {
      return { error: insSecErr };
    }

    const inserted = [...(insertedSections ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const fieldRows: {
      section_id: string;
      sort_order: number;
      merge_key: string;
      description: string | null;
    }[] = [];

    for (let i = 0; i < inserted.length; i++) {
      const row = inserted[i];
      const sec = sections[i];
      if (!row || !sec) continue;
      sec.fields.forEach((f, j) => {
        fieldRows.push({
          section_id: row.id,
          sort_order: j,
          merge_key: f.merge_key.trim(),
          description: f.description,
        });
      });
    }

    if (fieldRows.length === 0) {
      return { error: null };
    }

    const { error: insFieldErr } = await this.auth.client
      .from('document_template_section_fields')
      .insert(fieldRows);

    return { error: insFieldErr };
  }

  async listRelatedByTemplateId(
    templateId: string
  ): Promise<{
    data: { related_document_template_id: string; sort_order: number }[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.auth.client
      .from('document_template_related')
      .select('related_document_template_id, sort_order')
      .eq('document_template_id', templateId)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error };
    }

    const rows =
      (data as {
        related_document_template_id: string;
        sort_order: number;
      }[]) ?? [];
    return { data: rows, error: null };
  }

  async replaceRelatedForTemplate(
    templateId: string,
    links: Omit<DocumentTemplateRelatedInsert, 'document_template_id'>[]
  ): Promise<{ error: PostgrestError | null }> {
    const { error: delErr } = await this.auth.client
      .from('document_template_related')
      .delete()
      .eq('document_template_id', templateId);

    if (delErr) {
      return { error: delErr };
    }

    if (links.length === 0) {
      return { error: null };
    }

    const { error: insErr } = await this.auth.client
      .from('document_template_related')
      .insert(
        links.map((l, sort_order) => ({
          document_template_id: templateId,
          related_document_template_id: l.related_document_template_id,
          sort_order: l.sort_order ?? sort_order,
        }))
      );

    return { error: insErr };
  }
}
