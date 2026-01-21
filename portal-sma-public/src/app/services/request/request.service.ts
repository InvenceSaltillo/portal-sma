import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { DynamicFormField } from '../../interfaces/dynamic-form-field.interface';
import { RequestRowWithService, RequestInquiryResult } from '../../interfaces/request.interface';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
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
  private readonly BUCKET_NAME = 'clients';
  private http = inject(HttpClient);
  private requestUrl = `${environment.apiUrl}/requests`;

  constructor() { }

  async listMyRequests(limit = 20, offset = 0) {
    try {
      const data = await firstValueFrom(
        this.http.get<RequestRowWithService[]>(`${this.requestUrl}?limit=${limit}&offset=${offset}`)
      );
      return data;
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  }

  async getRequestByFolio(folio: string) {
    try {
      const data = await firstValueFrom(
        this.http.get<RequestInquiryResult>(`${this.requestUrl}/by-folio/${folio}`)
      );
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error fetching request by folio:', error);
      throw error;
    }
  }

  async submitRequest(args: {
    form: FormGroup;
    formFields?: DynamicFormField[]; // Opcional para componentes nuevos
    serviceId: string;
    userId: string;
  }): Promise<{ id: string; folio: string }> {
    const { form, formFields = [], serviceId, userId } = args;

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

    // Crear solicitud usando la API
    const createResponse = await firstValueFrom(
      this.http.post<{ id: string; folio: string }>(`${this.requestUrl}`, {
        service_id: serviceId,
        privacy_accepted: privacyAccepted
      })
    );

    const { id: requestId, folio } = createResponse;

    // Obtener client_id desde los datos del usuario
    const clientId = this.getClientIdFromUser();

    // Si hay formFields, usar el método antiguo (formularios dinámicos)
    // Si no hay formFields, construir payload desde el form directamente
    let filesMeta: FileMeta[] = [];
    let valuesPayload: Array<{ field_id: string; value: string | null }> = [];

    if (formFields.length > 0) {
      // Método antiguo: formularios dinámicos
      filesMeta = await this.uploadAllFiles({ form, formFields, userId: authenticatedUserId, requestId, clientId });
      valuesPayload = this.buildValuesPayload({ form, formFields });
    } else {
      // Método nuevo: formularios fijos
      // TODO: Implementar lógica para extraer valores del form directamente
      // Por ahora, solo guardamos archivos si existen
      filesMeta = await this.uploadAllFilesFromForm({ form, userId: authenticatedUserId, requestId, clientId });
      valuesPayload = this.buildValuesPayloadFromForm({ form });
    }

    // Guardar datos usando la API
    await firstValueFrom(
      this.http.post(`${this.requestUrl}/${requestId}/data`, {
        values: valuesPayload,
        files: filesMeta
      })
    );

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

  /** Método nuevo: subir archivos desde formulario fijo */
  private async uploadAllFilesFromForm(args: {
    form: FormGroup;
    userId: string;
    requestId: string;
    clientId?: string;
  }): Promise<FileMeta[]> {
    const { form, userId, requestId, clientId } = args;
    const metas: FileMeta[] = [];
    const safeClientId = clientId || 'default-client';
    const baseDir = `${safeClientId}/users/${userId}/requests/${requestId}/documents`;

    // Buscar todos los controles que sean File
    for (const controlName of Object.keys(form.controls)) {
      const control = form.get(controlName);
      if (!control) continue;

      const value = control.value;
      if (!value) continue;

      // Si el valor es un File o File[]
      const files: File[] = Array.isArray(value)
        ? value.filter((v: any) => v instanceof File)
        : (value instanceof File ? [value] : []);

      for (const file of files) {
        const safeName = this.toSafeFileName(file.name);
        const unique = `${Date.now()}-${cryptoRandom(6)}-${safeName}`;
        const path = `${baseDir}/${unique}`;

        const { error } = await supabaseClient.storage
          .from(this.BUCKET_NAME)
          .upload(path, file, { upsert: false, cacheControl: '3600' });

        if (error) throw error;

        metas.push({
          field_id: controlName, // Usar el nombre del control como field_id
          path,
          filename: file.name,
          mime_type: file.type,
          size: file.size
        });
      }
    }

    return metas;
  }

  /** Método nuevo: construir payload desde formulario fijo */
  private buildValuesPayloadFromForm(args: {
    form: FormGroup;
  }): Array<{ field_id: string; value: string | null }> {
    const { form } = args;
    const items: Array<{ field_id: string; value: string | null }> = [];

    // Recorrer todos los controles del formulario
    for (const controlName of Object.keys(form.controls)) {
      const control = form.get(controlName);
      if (!control) continue;

      // Saltar campos especiales
      if (controlName === 'privacyAccepted') continue;
      if (controlName === 'especies' || controlName.includes('species')) continue; // Manejar especies por separado

      const raw = control.value;
      const value =
        raw === undefined || raw === null
          ? null
          : typeof raw === 'string'
            ? raw
            : typeof raw === 'object'
              ? JSON.stringify(raw)
              : String(raw);

      items.push({ field_id: controlName, value });
    }

    return items;
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
