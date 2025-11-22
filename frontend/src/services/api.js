// frontend/src/services/api.js
const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      config.body = options.body;
    }

    console.log('🔄 API запрос:', { url, config });

    try {
      const response = await fetch(url, config);
      console.log('📨 Ответ сервера:', response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка API:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Данные ответа:', data);
      return data;

    } catch (error) {
      console.error('💥 Ошибка запроса:', error);
      throw error;
    }
  }

  // 🔥 ИСПРАВЛЕННЫЕ МЕТОДЫ АВТОРИЗАЦИИ
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // INVESTIGATIONS
  async getInvestigations(userId) {
    return this.request(`/investigations?user_id=${userId}`);
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

  // BOARD STATE
  async saveBoardState(investigationId, boardData) {
    return this.request(`/board/${investigationId}/state`, {
      method: 'PUT',
      body: JSON.stringify({ board_data: boardData }),
    });
  }

  async getBoardState(investigationId) {
    return this.request(`/board/${investigationId}/state`);
  }

  // TIMELINE EVENTS
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

  // FILES
  async uploadFile(investigationId, file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || file.name);
    formData.append('description', metadata.description || '');
    formData.append('tags', JSON.stringify(metadata.tags || []));

    const response = await fetch(`${this.baseURL}/files/upload/${investigationId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return await response.json();
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

  // NOTES
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
}

export const apiService = new ApiService();