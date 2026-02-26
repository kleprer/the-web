// src/types/index.ts
export interface User {
  id: number;
  username: string;
  email: string;
  roles?: string[]; // Добавляем роли
}

export interface UserWithTokens extends User {
  access_token?: string;
  refresh_token?: string;
  user_id?: number;
}

// ДОБАВЛЯЕМ ЭТОТ ИНТЕРФЕЙС для AuthResponse
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  username: string;
  email: string;
  roles?: string[]; // Добавляем роли
}

export interface Investigation {
  id: number;
  title: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  investigation_id: number;
  created_at?: string;
}

export interface AppFile {
  id: number;
  filename: string;
  title?: string;
  description?: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  investigation_id: number;
  tags?: string[];
  name?: string;
  type?: string;
  size?: string;
  uploaded_by?: number; // ID пользователя, загрузившего файл
}

export interface Card {
  id: string;
  title: string;
  articleUrl: string;
  date: string;
  trustLevel: 'high' | 'low' | 'unknown';
  position: { x: number; y: number };
}

export interface Text {
  id: string;
  content: string;
  position: { x: number; y: number };
}

export interface Image {
  id: string;
  url: string;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  start: {
    elementId: string;
    type: 'card' | 'text' | 'image';
  };
  end: {
    elementId: string;
    type: 'card' | 'text' | 'image';
  };
}

export interface BoardState {
  cards: Card[];
  texts: Text[];
  images: Image[];
  connections: Connection[];
}