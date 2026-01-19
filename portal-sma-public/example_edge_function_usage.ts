// Ejemplo de cómo usar la Edge Function con firma desde el frontend

import { Injectable } from '@angular/core';
import { supabaseClient } from './core/supabase.client';

@Injectable({
  providedIn: 'root'
})
export class PDFService {

  // Método para generar PDF con firma usando Edge Function
  async generatePDFWithSignature(requestId: string): Promise<Blob> {
    try {
      // 1. Obtener datos completos de la solicitud (incluyendo signature_url)
      const { data: requestData, error: rpcError } = await supabaseClient.rpc('get_request_all_fields', {
        p_request_id: requestId,
        p_folio: null
      });

      if (rpcError) throw rpcError;
      if (!requestData || requestData.length === 0) {
        throw new Error('No se encontraron datos para la solicitud');
      }

      const request = requestData[0];
      console.log('Request data:', request);
      console.log('Request ID for signature search:', request.id);

      // 2. Preparar datos para la Edge Function
      const pdfData = {
        id: request.id,
        folio: request.folio,
        created_at: request.created_at,
        municipality_name: request.municipality_name,
        state_name: request.state_name,
        applicant_name: request.applicant_name,
        field_values: request.field_values
        // La Edge Function busca y genera la URL firmada automáticamente
      };

      // 3. Llamar a la Edge Function
      const { data: session } = await supabaseClient.auth.getSession();

      const response = await fetch('/functions/v1/test-pdf-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify(pdfData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error generando PDF: ${response.status} - ${errorText}`);
      }

      // 4. Retornar el PDF como Blob
      return await response.blob();

    } catch (error) {
      console.error('Error generating PDF with signature:', error);
      throw error;
    }
  }

  // Método para generar PDF sin firma (fallback)
  async generatePDFWithoutSignature(requestId: string): Promise<Blob> {
    try {
      const { data: requestData, error: rpcError } = await supabaseClient.rpc('get_request_all_fields', {
        p_request_id: requestId,
        p_folio: null
      });

      if (rpcError) throw rpcError;
      if (!requestData || requestData.length === 0) {
        throw new Error('No se encontraron datos para la solicitud');
      }

      const request = requestData[0];

      const pdfData = {
        id: request.id,
        folio: request.folio,
        created_at: request.created_at,
        municipality_name: request.municipality_name,
        state_name: request.state_name,
        applicant_name: request.applicant_name,
      field_values: request.field_values
      // La Edge Function busca automáticamente la firma
      };

      const { data: session } = await supabaseClient.auth.getSession();

      const response = await fetch('/functions/v1/test-pdf-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify(pdfData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error generando PDF: ${response.status} - ${errorText}`);
      }

      return await response.blob();

    } catch (error) {
      console.error('Error generating PDF without signature:', error);
      throw error;
    }
  }

  // Método para verificar si tiene firma
  async hasSignature(requestId: string): Promise<boolean> {
    try {
      const { data: requestData, error } = await supabaseClient.rpc('get_request_all_fields', {
        p_request_id: requestId,
        p_folio: null
      });

      if (error || !requestData || requestData.length === 0) {
        return false;
      }

      return requestData[0].signature_url !== null;
    } catch (error) {
      console.error('Error checking signature:', error);
      return false;
    }
  }

  // Método para descargar PDF
  downloadPDF(pdfBlob: Blob, filename: string) {
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Método para abrir PDF en nueva ventana
  openPDF(pdfBlob: Blob) {
    const url = window.URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    // Limpiar URL después de un tiempo
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

// Ejemplo de uso en un componente
export class ExampleComponent {

  constructor(private pdfService: PDFService) {}

  async generateAndDownloadPDF(requestId: string) {
    try {
      // Verificar si tiene firma
      const hasSignature = await this.pdfService.hasSignature(requestId);
      console.log('Tiene firma:', hasSignature);

      // Generar PDF (con o sin firma según esté disponible)
      const pdfBlob = await this.pdfService.generatePDFWithSignature(requestId);

      // Descargar PDF
      const filename = `licencia-${requestId}.pdf`;
      this.pdfService.downloadPDF(pdfBlob, filename);

      console.log('PDF generado y descargado exitosamente');

    } catch (error) {
      console.error('Error generando PDF:', error);
      // Mostrar mensaje de error al usuario
      alert('Error generando PDF. Intenta de nuevo.');
    }
  }

  async generateAndViewPDF(requestId: string) {
    try {
      const pdfBlob = await this.pdfService.generatePDFWithSignature(requestId);
      this.pdfService.openPDF(pdfBlob);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error generando PDF. Intenta de nuevo.');
    }
  }

  // Método para mostrar preview de la firma
  async showSignaturePreview(requestId: string) {
    try {
      const { data: requestData, error } = await supabaseClient.rpc('get_request_all_fields', {
        p_request_id: requestId,
        p_folio: null
      });

      if (error || !requestData || requestData.length === 0) {
        console.log('No hay datos de solicitud');
        return;
      }

      const signatureUrl = requestData[0].signature_url;

      if (signatureUrl) {
        // Crear elemento img para mostrar la firma
        const img = document.createElement('img');
        img.src = signatureUrl;
        img.alt = 'Firma digital';
        img.style.maxWidth = '300px';
        img.style.border = '1px solid #ccc';
        img.style.borderRadius = '4px';

        // Agregar al DOM temporalmente
        const previewDiv = document.getElementById('signature-preview');
        if (previewDiv) {
          previewDiv.innerHTML = '';
          previewDiv.appendChild(img);
        }
      } else {
        console.log('No hay firma disponible');
      }
    } catch (error) {
      console.error('Error mostrando preview de firma:', error);
    }
  }
}

// Ejemplo de uso directo sin servicio
export async function generatePDFDirect(requestId: string) {
  try {
    // 1. Obtener datos de la RPC
    const { data: requestData, error } = await supabaseClient.rpc('get_request_all_fields', {
      p_request_id: requestId
    });

    if (error || !requestData?.[0]) throw error;

    const request = requestData[0];

    // 2. Preparar payload para Edge Function
    const payload = {
      id: request.id,
      folio: request.folio,
      created_at: request.created_at,
      municipality_name: request.municipality_name,
      state_name: request.state_name,
      applicant_name: request.applicant_name,
      field_values: request.field_values
      // La Edge Function busca y genera la URL firmada automáticamente
    };

    // 3. Llamar Edge Function
    const { data: session } = await supabaseClient.auth.getSession();

    const response = await fetch('/functions/v1/test-pdf-coordinates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session?.access_token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // 4. Retornar PDF
    return await response.blob();

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
