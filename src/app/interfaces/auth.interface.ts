import { User } from './user.interface';

export interface LoginResponse {
  status: string;
  user:   User;
  token:  string;
}
