/** Alineado con portal-sma-public (`user.interface.ts`). */
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  metadata: unknown;
  created_at: string;
  short_name: string;
}

export interface AppUser {
  id: string;
  name: string;
  last_names: string;
  email: string;
  birth_date: string;
  gender: string;
  email_verified_at: string | null;
  is_active: boolean;
  role: string;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  client_id: string;
  client: Client;
}
