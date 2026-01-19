import { supabaseClient } from './../../core/supabase.client';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor() { }

  async sendEmail(payload: { [k: string]: unknown }) {
    // Si el usuario está logueado, el SDK adjunta el JWT en automático.
    const { data, error } = await supabaseClient.functions.invoke('tramite-notification', {
      body: payload
    });
    if (error) throw error;
    return data;
  }
}
