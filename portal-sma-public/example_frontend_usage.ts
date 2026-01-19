// Ejemplo de uso de la nueva RPC desde el frontend Angular

import { Injectable } from '@angular/core';
import { supabaseClient } from './core/supabase.client';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  // Método para obtener valores específicos de campos por sus IDs
  async getFieldValuesByIds(requestId: string, fieldIds: string[]) {
    try {
      const { data, error } = await supabaseClient.rpc('get_field_values_by_ids', {
        p_request_id: requestId,
        p_folio: null,
        p_field_ids: fieldIds
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting field values:', error);
      throw error;
    }
  }

  // Método para obtener valores específicos por folio
  async getFieldValuesByFolio(folio: string, fieldIds: string[]) {
    try {
      const { data, error } = await supabaseClient.rpc('get_field_values_by_ids', {
        p_request_id: null,
        p_folio: folio,
        p_field_ids: fieldIds
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting field values by folio:', error);
      throw error;
    }
  }

  // Método para generar PDF con campos específicos
  async generatePDFWithSpecificFields(requestId: string, fieldIds: string[]) {
    try {
      // Primero obtener los datos de la solicitud
      const requestData = await this.getFieldValuesByIds(requestId, fieldIds);

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
        field_ids: fieldIds,
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
}

// Ejemplo de uso en un componente
export class ExampleComponent {

  constructor(private requestService: RequestService) {}

  async loadRequestData(requestId: string) {
    // Definir los IDs de los campos que necesitamos para el PDF
    const requiredFieldIds = [
      'field-uuid-curp',      // CURP
      'field-uuid-rfc',       // RFC
      'field-uuid-name',      // Nombre
      'field-uuid-lastname',  // Apellidos
      'field-uuid-email',     // Email
      'field-uuid-phone'      // Teléfono
    ];

    try {
      // Obtener solo los campos específicos
      const requestData = await this.requestService.getFieldValuesByIds(requestId, requiredFieldIds);

      if (requestData && requestData.length > 0) {
        const request = requestData[0];

        // Acceder a los valores específicos
        const fieldValues = request.field_values;

        // Ejemplo de acceso a valores
        console.log('CURP:', fieldValues['field-uuid-curp']?.value);
        console.log('RFC:', fieldValues['field-uuid-rfc']?.value);
        console.log('Nombre:', fieldValues['field-uuid-name']?.value);

        // Generar PDF
        const pdfBlob = await this.requestService.generatePDFWithSpecificFields(requestId, requiredFieldIds);

        // Descargar PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `licencia-${request.folio}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error loading request data:', error);
    }
  }
}
