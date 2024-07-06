import { User } from './user.interface';

export interface LoginResponse {
  status: string;
  user:   User;
  token:  string;
}
export interface RegisterResponse {
  status: string;
  message: string;
  user:   User;
  token:  string;
}
