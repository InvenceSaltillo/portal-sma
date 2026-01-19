import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FormGroup } from '@angular/forms';
import { DynamicFormField } from '../../interfaces/dynamic-form-field.interface';
import { RequestRowWithService, RequestInquiryResult } from '../../interfaces/request.interface';
import { supabaseClient } from './../../core/supabase.client';

type FileMeta = {
  field_id: string;
  path: string;
  filename: string;
  mime_type: string;
  size: number;
};

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly BUCKET_NAME = 'clients'; // <-- usando el bucket clients que sí existe

  constructor() { }


  async listMyRequests(limit = 20, offset = 0) {
    const { data, error } = await supabaseClient.rpc('list_my_requests', {
      p_limit: limit,
      p_offset: offset
    });
    if (error) throw error;
    return data as RequestRowWithService[];
  }

  async getRequestByFolio(folio: string) {
    const { data, error } = await supabaseClient.rpc('get_request_with_values', {
      p_folio: folio
    });
    if (error) throw error;

    // La RPC retorna un array, necesitamos el primer elemento
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const requestData = data[0];

        // Construir el objeto RequestInquiryResult con los datos de la RPC
        const result: RequestInquiryResult = {
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

    return result;
  }

  async submitRequest(args: {
    form: FormGroup;
    formFields: DynamicFormField[];
    serviceId: string;
    userId: string;
  }): Promise<{ id: string; folio: string }> {
    const { form, formFields, serviceId, userId } = args;

    // Debug: Verificar usuario autenticado
    const { data: { user } } = await supabaseClient.auth.getUser();
    console.log('DEBUG: Usuario autenticado:', user?.id);
    console.log('DEBUG: userId enviado:', userId);
    console.log('DEBUG: serviceId:', serviceId);

    const privacyAccepted = !!form.get('privacyAccepted')?.value;

    type CreateRequestArgs = {
      p_service_id: string;
      p_privacy_accepted?: boolean;
    };

    type CreateRequestRow = {
      id: string;
      folio: string;
    };

    // Usar el ID del usuario autenticado en lugar del userId enviado
    const authenticatedUserId = user?.id;
    if (!authenticatedUserId) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error: createErr } = await supabaseClient
      .rpc('create_request', {
        p_service_id: serviceId,
        p_privacy_accepted: privacyAccepted,
      });

    if (createErr) throw createErr;

    const row = Array.isArray(data) ? data[0] : (data as unknown as CreateRequestRow | null);
    if (!row) throw new Error('create_request no retornó datos');

    const { id: requestId, folio } = row;

    // Obtener client_id desde los datos del usuario
    const clientId = this.getClientIdFromUser();

    const filesMeta = await this.uploadAllFiles({ form, formFields, userId: authenticatedUserId, requestId, clientId });
    const valuesPayload = this.buildValuesPayload({ form, formFields });

    const { error: saveErr } = await supabaseClient.rpc('save_request_data', {
      p_request_id: requestId,
      p_values: valuesPayload,
      p_files: filesMeta,
    });
    if (saveErr) throw saveErr;

    return { id: requestId, folio };
  }


  /** Subir todos los campos file a Storage y devolver metadatos */
  private async uploadAllFiles(args: {
    form: FormGroup;
    formFields: DynamicFormField[];
    userId: string;
    requestId: string;
    clientId?: string;
  }): Promise<FileMeta[]> {
    const { form, formFields, userId, requestId, clientId } = args;
    const metas: FileMeta[] = [];

    const fileFields = formFields.filter(f => f.type === 'file');
    if (!fileFields.length) return metas;

    // Obtener client_id (usar fallback si no se proporciona)
    const safeClientId = clientId || 'default-client';

    // Estructura de carpetas: {clientId}/users/{userId}/requests/{requestId}/documents
    // (el bucket ya es 'clients', no necesitamos agregarlo en la ruta)
    const baseDir = `${safeClientId}/users/${userId}/requests/${requestId}/documents`;

    for (const field of fileFields) {
      const ctrl = this.getControlForField(form, field);
      if (!ctrl) continue;
      const value = ctrl.value;

      const files: File[] = Array.isArray(value) ? value : (value ? [value] : []);
      if (!files.length) continue;

      for (const file of files) {
        const safeName = this.toSafeFileName(file.name);
        const unique = `${Date.now()}-${cryptoRandom(6)}-${safeName}`;
        const path = `${baseDir}/${unique}`;

        const { error: upErr } = await supabaseClient
          .storage
          .from(this.BUCKET_NAME)
          .upload(path, file, { upsert: false, cacheControl: '3600' });

        if (upErr) throw upErr;

        metas.push({
          field_id: field.field_id,
          path,
          filename: file.name,
          mime_type: file.type,
          size: file.size
        });
      }
    }

    return metas;
  }

  /** Construye arreglo [{field_id, value}] para campos no-file */
  private buildValuesPayload(args: {
    form: FormGroup;
    formFields: DynamicFormField[];
  }): Array<{ field_id: string; value: string | null }> {
    const { form, formFields } = args;
    const items: Array<{ field_id: string; value: string | null }> = [];

    for (const f of formFields) {
      if (f.type === 'file') continue; // archivos se fueron aparte
      const ctrl = this.getControlForField(form, f);
      if (!ctrl) continue;

      const raw = ctrl.value;
      const value =
        raw === undefined || raw === null
          ? null
          : typeof raw === 'string'
            ? raw
            : JSON.stringify(raw);

      items.push({ field_id: f.field_id, value });
    }

    return items;
  }

  private getControlForField(form: FormGroup, field: DynamicFormField) {
    // tus forms están anidados por secciónId -> nombreCampo
    // localiza el grupo por sección y luego el control por name
    const section = form.get(field.section_id) as FormGroup | null;
    return section?.get(field.name) ?? null;
  }

  private toSafeFileName(name: string): string {
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return clean.replace(/[^\w.\-]+/g, '_').toLowerCase();
  }

  /** Obtener client_id desde los datos del usuario en localStorage */
  private getClientIdFromUser(): string | undefined {
    try {
      // Intentar obtener desde localStorage del navegador
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.client_id) {
          return user.client_id;
        }
      }

      // Fallback: retornar undefined para usar 'default-client'
      return undefined;
    } catch (error) {
      console.warn('Error obteniendo client_id:', error);
      return undefined;
    }
  }
}

/** Genera cadena aleatoria para evitar colisiones en nombre de archivo */
function cryptoRandom(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
