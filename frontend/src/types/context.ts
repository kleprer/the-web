import { User, UserWithTokens } from './index';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: UserWithTokens) => void;
  logout: () => void;
  updateTokens: (newTokens: { access_token: string; refresh_token: string }) => void;
  isAuthenticated: boolean;
}