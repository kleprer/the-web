const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Загружаем токены из localStorage
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    
    console.log(' ApiService инициализирован:');
    console.log(' Access Token:', this.accessToken ? 'есть' : 'нет');
    console.log(' Refresh Token:', this.refreshToken ? 'есть' : 'нет');
  }

  setTokens(accessToken, refreshToken) {
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

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log('🗑️ Токены удалены');
  }

  async refreshAccessToken() {
    try {
      console.log(' Попытка обновить access token...');
      
      if (!this.refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Обновляем токены
      this.setTokens(data.access_token, data.refresh_token);
      
      console.log(' Токен обновлен');
      
      return data.access_token;
      
    } catch (error) {
      console.error(' Ошибка обновления токена:', error);
      this.clearTokens();
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Добавляем токен авторизации, если он есть
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    console.log(` ${options.method || 'GET'} ${endpoint}`);
    console.log('   Headers:', { ...headers, Authorization: 'Bearer ***' });

    let config = {
      ...options,
      headers
    };

    try {
      let response = await fetch(url, config);

      // Если токен истек (401) и есть refresh token
      if (response.status === 401 && this.refreshToken) {
        console.log(' Токен истек, пробуем обновить...');
        
        try {
          const newAccessToken = await this.refreshAccessToken();
          
          // Повторяем запрос с новым токеном
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          config.headers = headers;
          
          response = await fetch(url, config);
          
        } catch (refreshError) {
          console.error(' Не удалось обновить токен:', refreshError);
          this.clearTokens();
          return Promise.reject(new Error('Session expired'));
        }
      }

      if (!response.ok) {
        console.error(` HTTP error ${response.status} for ${endpoint}`);
        return Promise.reject(new Error(`HTTP error ${response.status}`));
      }

      const data = await response.json();
      console.log(` Response from ${endpoint}:`, data);
      return data;

    } catch (error) {
      console.error(` Request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // 🔐 АВТОРИЗАЦИЯ
  async login(credentials) {
    try {
      console.log(' Попытка входа:', credentials);
      
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log(' Успешный вход:', response);
      
      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
        return response;
      } else {
        throw new Error('No tokens in response');
      }
      
    } catch (error) {
      console.error(' Ошибка входа:', error);
      throw error;
    }
  }

  async signup(userData) {
    try {
      console.log(' Регистрация:', userData);
      
      const response = await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log(' Успешная регистрация:', response);
      
      if (response.access_token) {
        this.setTokens(response.access_token, response.refresh_token);
        return response;
      } else {
        throw new Error('No tokens in response');
      }
      
    } catch (error) {
      console.error(' Ошибка регистрации:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      console.log(' Запрос информации о пользователе...');
      
      // Сначала пробуем /auth/me
      const response = await this.request('/auth/me');
      console.log(' Информация о пользователе:', response);
      return response;
      
    } catch (error) {
      console.log(' /auth/me не работает, пробуем /auth/public/me');
      
      try {
        // Если /auth/me не работает, пробуем публичный endpoint
        const response = await fetch(`${this.baseURL}/auth/public/me?token=${this.accessToken}`);
        if (response.ok) {
          const data = await response.json();
          console.log(' Публичная информация о пользователе:', data);
          return data;
        }
      } catch (e) {
        console.error(' Оба endpoints не работают:', e);
      }
      
      return { authenticated: false };
    }
  }

  async logout() {
    this.clearTokens();
    return Promise.resolve();
  }

  //  ИССЛЕДОВАНИЯ
  async getInvestigations() {
    return this.request('/investigations');
  }

  async createInvestigation(investigationData) {
    return this.request('/investigations', {
      method: 'POST',
      body: JSON.stringify(investigationData),
    });
  }

  async getInvestigation(investigationId) {
    return this.request(`/investigations/${investigationId}`);
  }

  async updateInvestigation(investigationId, investigationData) {
    return this.request(`/investigations/${investigationId}`, {
      method: 'PUT',
      body: JSON.stringify(investigationData),
    });
  }

  async deleteInvestigation(investigationId) {
    return this.request(`/investigations/${investigationId}`, {
      method: 'DELETE',
    });
  }

  //  ДОСКА
  async saveBoardState(investigationId, boardData) {
    return this.request(`/board/${investigationId}/state`, {
      method: 'PUT',
      body: JSON.stringify({ board_data: boardData }),
    });
  }

  async getBoardState(investigationId) {
    return this.request(`/board/${investigationId}/state`);
  }

  //  ТАЙМЛАЙН
  async getTimelineEvents(investigationId) {
    return this.request(`/timelines/${investigationId}/events`);
  }

  async createTimelineEvent(investigationId, eventData) {
    return this.request(`/timelines/${investigationId}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateTimelineEvent(eventId, eventData) {
    return this.request(`/timelines/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteTimelineEvent(eventId) {
    return this.request(`/timelines/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  //  ФАЙЛЫ
  async uploadFile(investigationId, file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || file.name);
    formData.append('description', metadata.description || '');
    formData.append('tags', JSON.stringify(metadata.tags || []));

    const url = `${this.baseURL}/files/upload/${investigationId}`;
    const headers = {};
    
    // Добавляем токен авторизации
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    console.log('📤 Загрузка файла:', { investigationId, fileName: file.name });

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

    const data = await response.json();
    console.log('📥 Файл загружен:', data);
    return data;
  }

  async getFiles(investigationId, fileType = null) {
    const endpoint = fileType 
      ? `/files/${fileType}/${investigationId}`
      : `/files?investigation_id=${investigationId}`;
    
    return this.request(endpoint);
  }

  async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  //  ЗАМЕТКИ
  async getNotes(investigationId) {
    return this.request(`/notes/${investigationId}/notes`);
  }

  async createNote(investigationId, noteData) {
    return this.request(`/notes/${investigationId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async updateNote(noteId, noteData) {
    return this.request(`/notes/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  }

  async deleteNote(noteId) {
    return this.request(`/notes/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  //  ПОИСК
  async globalSearch(query) {
    return this.request(`/search/global?query=${encodeURIComponent(query)}`);
  }

  async searchInInvestigation(investigationId, query) {
    return this.request(`/search/investigation/${investigationId}?query=${encodeURIComponent(query)}`);
  }

  //  ПОЛЬЗОВАТЕЛИ
  async getUserProfile() {
    return this.request('/users/me');
  }

  async updateUserProfile(userData) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser() {
    return this.request('/users/me', {
      method: 'DELETE',
    });
  }

}

export const apiService = new ApiService();