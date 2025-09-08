export interface User {
  id?: string;
  client_id: string;
  name: string;
  last_names: string;
  email: string;
  birth_date: Date;
  gender: string;
  is_ctive?: number;
  role?: string;
  created_at?: Date;
  updated_at?: Date;
}

