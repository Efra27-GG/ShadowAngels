import { User } from './user.interface';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}