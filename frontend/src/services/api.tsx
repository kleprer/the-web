import { LoginCredentials, SignupCredentials, AuthResponse, TokenRefreshResponse, UserInfoResponse, UploadMetadata, FileFilters, PaginatedFilesResponse } from '../types/api';
import { Investigation, AppFile, TimelineEvent, BoardState, User } from '../types/index';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  private baseURL: string;
  private accessToken: string | null;
  private refreshToken: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    
    console.log('📡 ApiService инициализирован:');
    console.log('   Access Token:', this.accessToken ? 'есть' : 'нет');
    console.log('   Refresh Token:', this.refreshToken ? 'есть' : 'нет');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    console.log('💾 Токены сохранены в localStorage');
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('🗑️ Токены удалены');
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResponse> {
    try {
      console.log('🔄 Попытка обновить access token...');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json() as TokenRefreshResponse;
      
      this.setTokens(data.access_token, data.refresh_token);
      
      console.log('✅ Токен обновлен');
      
      return data;
      
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error);
      this.clearTokens();
      throw error;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    console.log(`📤 ${options.method || 'GET'} ${endpoint}`);
    console.log('   Headers:', { ...headers, Authorization: this.accessToken ? 'Bearer ***' : 'none' });

    let config: RequestInit = {
      ...options,
      headers
    };

    try {
      let response = await fetch(url, config);

      if (response.status === 401 && this.refreshToken) {
        console.log('🔄 Токен истек, пробуем обновить...');
        
        try {
          const newTokens = await this.refreshAccessToken(this.refreshToken);
          
          headers['Authorization'] = `Bearer ${newTokens.access_token}`;
          config.headers = headers;
          
          response = await fetch(url, config);
          
        } catch (refreshError) {
          console.error('❌ Не удалось обновить токен:', refreshError);
          this.clearTokens();
          return Promise.reject(new Error('Session expired'));
        }
      }

      if (!response.ok) {
        console.error(`❌ HTTP error ${response.status} for ${endpoint}`);
        const errorData = await response.json().catch(() => ({}));
        return Promise.reject(new Error(errorData.detail || `HTTP error ${response.status}`));
      }

      const data = await response.json() as T;
      console.log(`📥 Response from ${endpoint}:`, data);
      return data;

    } catch (error) {
      console.error(`❌ Request error for ${endpoint}:`, error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Попытка входа:', { username: credentials.username });
      
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('✅ Успешный вход. Ответ сервера:', response);
      
      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
        return response;
      } else {
        throw new Error('No tokens in response');
      }
      
    } catch (error) {
      console.error('❌ Ошибка входа:', error);
      throw error;
    }
  }

  async signup(userData: SignupCredentials): Promise<AuthResponse> {
    try {
      console.log('📝 Регистрация:', { username: userData.username, email: userData.email });
      
      const response = await this.request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('✅ Успешная регистрация. Ответ сервера:', response);
      
      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
        return response;
      } else {
        throw new Error('No tokens in response');
      }
      
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<UserInfoResponse> {
    try {
      console.log('👤 Запрос информации о пользователе...');
      
      const response = await this.request<UserInfoResponse>('/auth/me');
      console.log('👤 Информация о пользователе:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Ошибка получения информации о пользователе:', error);
      return { authenticated: false };
    }
  }

  async logout(): Promise<void> {
    this.clearTokens();
    return Promise.resolve();
  }

  async getInvestigations(userId?: number): Promise<Investigation[]> {
    const endpoint = userId ? `/investigations?user_id=${userId}` : '/investigations';
    return this.request<Investigation[]>(endpoint);
  }

  async createInvestigation(investigationData: Partial<Investigation>): Promise<Investigation> {
    return this.request<Investigation>('/investigations', {
      method: 'POST',
      body: JSON.stringify(investigationData),
    });
  }

  async getInvestigation(investigationId: number): Promise<Investigation> {
    return this.request<Investigation>(`/investigations/${investigationId}`);
  }

  async updateInvestigation(investigationId: number, investigationData: Partial<Investigation>): Promise<Investigation> {
    return this.request<Investigation>(`/investigations/${investigationId}`, {
      method: 'PUT',
      body: JSON.stringify(investigationData),
    });
  }

  async deleteInvestigation(investigationId: number): Promise<void> {
    return this.request<void>(`/investigations/${investigationId}`, {
      method: 'DELETE',
    });
  }

  async saveBoardState(investigationId: number, boardData: BoardState): Promise<any> {
    return this.request(`/board/${investigationId}/state`, {
      method: 'PUT',
      body: JSON.stringify({ board_data: boardData }),
    });
  }

  async getBoardState(investigationId: number): Promise<{ board_data: BoardState }> {
    return this.request<{ board_data: BoardState }>(`/board/${investigationId}/state`);
  }

  async getTimelineEvents(investigationId: number): Promise<TimelineEvent[]> {
    return this.request<TimelineEvent[]>(`/timelines/${investigationId}/events`);
  }

  async createTimelineEvent(investigationId: number, eventData: any): Promise<TimelineEvent> {
    return this.request<TimelineEvent>(`/timelines/${investigationId}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateTimelineEvent(eventId: number, eventData: any): Promise<TimelineEvent> {
    return this.request<TimelineEvent>(`/timelines/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteTimelineEvent(eventId: number): Promise<void> {
    return this.request<void>(`/timelines/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Работа с файлами
  async uploadFile(investigationId: number, file: File, metadata: UploadMetadata = {}): Promise<AppFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || file.name);
    formData.append('description', metadata.description || '');
    formData.append('tags', JSON.stringify(metadata.tags || []));
    if (metadata.trust_level) {
      formData.append('trust_level', metadata.trust_level);
    }

    const url = `${this.baseURL}/files/upload/${investigationId}`;
    const headers: HeadersInit = {};
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    console.log('📤 Загрузка файла:', { 
      investigationId, 
      fileName: file.name,
      trust_level: metadata.trust_level 
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'File upload failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as AppFile;
    console.log('📥 Файл загружен:', data);
    return data;
  }

  // Получение файлов с серверной фильтрацией и пагинацией
  async getFilesWithFilters(filters: FileFilters): Promise<PaginatedFilesResponse> {
    const queryParams = new URLSearchParams();
    queryParams.set('investigation_id', filters.investigation_id.toString());
    
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.trust_level) queryParams.set('trust_level', filters.trust_level);
    if (filters.file_type) queryParams.set('file_type', filters.file_type);
    if (filters.date_from) queryParams.set('date_from', filters.date_from);
    if (filters.date_to) queryParams.set('date_to', filters.date_to);
    if (filters.sort_by) queryParams.set('sort_by', filters.sort_by);
    if (filters.page) queryParams.set('page', filters.page.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());

    const url = `/files/filter?${queryParams.toString()}`;
    return this.request<PaginatedFilesResponse>(url);
  }

  async getFiles(investigationId: number, fileType: string | null = null): Promise<AppFile[]> {
    const endpoint = fileType 
      ? `/files/${fileType}/${investigationId}`
      : `/files?investigation_id=${investigationId}`;
    
    return this.request<AppFile[]>(endpoint);
  }

  // Получение URL для скачивания файла
  async getDownloadUrl(fileId: number): Promise<string> {
    try {
      const response = await this.request<{ url: string }>(`/files/download-url/${fileId}`);
      return response.url;
    } catch (error) {
      console.error('Ошибка получения ссылки для скачивания:', error);
      return `${this.baseURL}/files/download/${fileId}`;
    }
  }

  async deleteFile(fileId: number): Promise<void> {
    return this.request<void>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async getNotes(investigationId: number): Promise<any[]> {
    return this.request<any[]>(`/notes/${investigationId}/notes`);
  }

  async createNote(investigationId: number, noteData: any): Promise<any> {
    return this.request(`/notes/${investigationId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async updateNote(noteId: number, noteData: any): Promise<any> {
    return this.request(`/notes/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  }

  async deleteNote(noteId: number): Promise<void> {
    return this.request(`/notes/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async globalSearch(query: string): Promise<any> {
    return this.request(`/search/global?query=${encodeURIComponent(query)}`);
  }

  async searchInInvestigation(investigationId: number, query: string): Promise<any> {
    return this.request(`/search/investigation/${investigationId}?query=${encodeURIComponent(query)}`);
  }

  async getUserProfile(): Promise<UserInfoResponse> {
    return this.request<UserInfoResponse>('/users/me');
  }

// Скачивание файла
async downloadFile(fileId: number): Promise<Blob> {
  const url = `${this.baseURL}/files/download/${fileId}`;
  const headers: HeadersInit = {};
  
  if (this.accessToken) {
    headers['Authorization'] = `Bearer ${this.accessToken}`;
  }

  console.log('📥 Скачивание файла:', url);
  
  const response = await fetch(url, { 
    headers,
    credentials: 'include'
  });
  
  console.log('📊 Статус ответа:', response.status);
  console.log('📊 Заголовки ответа:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    let errorMessage = `Download failed: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    }
    console.error('❌ Ошибка скачивания:', errorMessage);
    throw new Error(errorMessage);
  }
  
  const blob = await response.blob();
  console.log('✅ Файл получен, размер:', blob.size, 'тип:', blob.type);
  
  if (blob.size === 0) {
    console.error('❌ Получен пустой файл');
    throw new Error('Получен пустой файл');
  }
  
  return blob;
}
  async updateUserProfile(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(): Promise<void> {
    return this.request<void>('/users/me', {
      method: 'DELETE',
    });
  }

  async getUsersWithRoles(): Promise<any> {
    return this.request('/auth/users/roles');
  }
}

export const apiService = new ApiService();