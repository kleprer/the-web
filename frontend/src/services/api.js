const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // AUTH
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

  async updateInvestigation(id, investigationData) {
    return this.request(`/investigations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(investigationData),
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
}

export const apiService = new ApiService();