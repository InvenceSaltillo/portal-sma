import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GeneratePDFRequest {
  request_id: string;
}

export interface GeneratePDFResponse {
  success: boolean;
  pdf_url?: string;
  file_path?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private http = inject(HttpClient);

  /**
   * Generate PDF for a specific request/tramite
   */
  async generateLicensePDF(requestId: string): Promise<GeneratePDFResponse> {
    try {
      const response = await fetch(`${environment.supabaseUrl}/functions/v1/generate-license-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.supabaseKey}`,
        },
        body: JSON.stringify({ request_id: requestId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'PDF generation failed');
      }

      return result;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Download PDF directly as blob
   */
  async downloadPDF(requestId: string): Promise<Blob> {
    const result = await this.generateLicensePDF(requestId);

    if (!result.success || !result.pdf_url) {
      throw new Error('Failed to generate PDF');
    }

    const response = await fetch(result.pdf_url);
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    return await response.blob();
  }

  /**
   * Generate and automatically download PDF
   */
  async generateAndDownload(requestId: string, fileName?: string): Promise<void> {
    try {
      const blob = await this.downloadPDF(requestId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `licencia-caza-${requestId}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Open PDF in new window/tab
   */
  async viewPDF(requestId: string): Promise<void> {
    try {
      const result = await this.generateLicensePDF(requestId);

      if (result.success && result.pdf_url) {
        window.open(result.pdf_url, '_blank');
      } else {
        throw new Error('Failed to generate PDF for viewing');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      throw error;
    }
  }
}
