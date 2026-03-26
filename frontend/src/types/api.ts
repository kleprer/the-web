export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  username: string;
  email: string;
  roles?: string[];
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserInfoResponse {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    roles?: string[];
  };
}

export interface UploadMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  trust_level?: 'high' | 'unknown' | 'low';
}

export interface FileFilters {
  investigation_id: number;
  search?: string;
  trust_level?: string | null;
  file_type?: string | null;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFilesResponse {
  items: AppFile[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface AppFile {
  id: number;
  investigation_id: number;
  filename: string;
  file_path: string;
  file_type: 'image' | 'document' | 'media' | 'other';
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  title: string;
  description?: string;
  tags?: string[];
  trust_level?: 'high' | 'unknown' | 'low';
  uploaded_by?: number;
}

export interface Investigation {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  is_archived: boolean;
  board_data?: any;
}

export interface TimelineEvent {
  id: number;
  investigation_id: number;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
  attached_files: number[];
}

export interface BoardState {
  cards: any[];
  texts: any[];
  images: any[];
  connections: any[];
}