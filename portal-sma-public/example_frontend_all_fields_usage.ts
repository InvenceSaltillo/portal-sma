// Ejemplo de uso de la nueva RPC get_request_all_fields desde el frontend Angular

import { Injectable } from '@angular/core';
import { supabaseClient } from './core/supabase.client';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  // Método para obtener TODOS los campos de una solicitud
  async getAllRequestFields(requestId: string) {
    try {
      const { data, error } = await supabaseClient.rpc('get_request_all_fields', {
        p_request_id: requestId,
        p_folio: null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting all request fields:', error);
      throw error;
    }
  }

  // Método para obtener TODOS los campos por folio
  async getAllRequestFieldsByFolio(folio: string) {
    try {
      const { data, error } = await supabaseClient.rpc('get_request_all_fields', {
        p_request_id: null,
        p_folio: folio
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting all request fields by folio:', error);
      throw error;
    }
  }

  // Método para generar PDF con TODOS los campos
  async generatePDFWithAllFields(requestId: string) {
    try {
      // Obtener todos los datos de la solicitud
      const requestData = await this.getAllRequestFields(requestId);

      if (!requestData || requestData.length === 0) {
        throw new Error('No se encontraron datos para la solicitud');
      }

      const request = requestData[0];

      // Preparar datos para el PDF
      const pdfData = {
        id: request.id,
        folio: request.folio,
        created_at: request.created_at,
        municipality_name: request.municipality_name,
        state_name: request.state_name,
        applicant_name: request.applicant_name,
        field_values: request.field_values
      };

      // Llamar a la función de PDF
      const response = await fetch('/functions/v1/test-pdf-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(pdfData)
      });

      if (!response.ok) {
        throw new Error('Error generando PDF');
      }

      // Retornar el blob del PDF
      return await response.blob();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Método helper para buscar campos por nombre y sección
  findFieldByNameAndSection(fieldValues: any, fieldName: string, sectionTitle?: string): any | null {
    if (!fieldValues) return null;

    for (const fieldId in fieldValues) {
      const field = fieldValues[fieldId];
      if (field.field_name === fieldName) {
        if (!sectionTitle || field.section_title === sectionTitle) {
          return field;
        }
      }
    }
    return null;
  }

  // Método helper para obtener todos los campos de una sección específica
  getFieldsBySection(fieldValues: any, sectionTitle: string): any[] {
    if (!fieldValues) return [];

    const fields = [];
    for (const fieldId in fieldValues) {
      const field = fieldValues[fieldId];
      if (field.section_title === sectionTitle) {
        fields.push(field);
      }
    }
    return fields;
  }
}

// Ejemplo de uso en un componente
export class ExampleComponent {

  constructor(private requestService: RequestService) {}

  async loadCompleteRequestData(requestId: string) {
    try {
      // Obtener todos los campos de la solicitud
      const requestData = await this.requestService.getAllRequestFields(requestId);

      if (requestData && requestData.length > 0) {
        const request = requestData[0];

        // Acceder a todos los valores
        const fieldValues = request.field_values;

        // Ejemplo de acceso a valores específicos
        const curpField = this.requestService.findFieldByNameAndSection(
          fieldValues,
          'curp',
          'Datos generales'
        );
        console.log('CURP:', curpField?.value);

        const nameField = this.requestService.findFieldByNameAndSection(
          fieldValues,
          'first_name',
          'Persona física'
        );
        console.log('Nombre:', nameField?.value);

        // Obtener todos los campos de una sección específica
        const contactFields = this.requestService.getFieldsBySection(
          fieldValues,
          'Domicilio y medios de contacto'
        );
        console.log('Campos de contacto:', contactFields);

        // Generar PDF con todos los datos
        const pdfBlob = await this.requestService.generatePDFWithAllFields(requestId);

        // Descargar PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `licencia-${request.folio}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error loading complete request data:', error);
    }
  }

  // Método para mostrar todos los campos en una tabla
  async displayAllFields(requestId: string) {
    try {
      const requestData = await this.requestService.getAllRequestFields(requestId);

      if (requestData && requestData.length > 0) {
        const request = requestData[0];
        const fieldValues = request.field_values;

        // Crear array de todos los campos para mostrar en tabla
        const allFields = [];
        for (const fieldId in fieldValues) {
          const field = fieldValues[fieldId];
          allFields.push({
            id: fieldId,
            name: field.field_name,
            section: field.section_title,
            type: field.field_type,
            value: field.value
          });
        }

        console.table(allFields);
        return allFields;
      }
    } catch (error) {
      console.error('Error displaying all fields:', error);
    }
  }
}
