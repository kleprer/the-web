import { apiService } from '../../services/api';


describe('ApiService', () => {
  const mockFetch = global.fetch as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    apiService.clearTokens();
  });

  describe('Authentication', () => {
    it('logs in successfully', async () => {
      const mockResponse = {
        access_token: 'test_access',
        refresh_token: 'test_refresh',
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.login({
        username: 'testuser',
        password: 'password123',
      });
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      );
    });

    it('handles login error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
      });
      
      await expect(apiService.login({
        username: 'wrong',
        password: 'wrong',
      })).rejects.toThrow('Invalid credentials');
    });

    it('signs up successfully', async () => {
      const mockResponse = {
        access_token: 'test_access',
        refresh_token: 'test_refresh',
        user_id: 1,
        username: 'newuser',
        email: 'new@example.com',
        roles: ['user'],
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.signup({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Token Management', () => {
    it('sets tokens correctly', () => {
      apiService.setTokens('access123', 'refresh456');
      
      expect(localStorage.getItem('access_token')).toBe('access123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh456');
    });

    it('clears tokens correctly', () => {
      localStorage.setItem('access_token', 'test');
      localStorage.setItem('refresh_token', 'test');
      
      apiService.clearTokens();
      
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('refreshes token automatically on 401', async () => {
      // Первый запрос возвращает 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ detail: 'Unauthorized' }),
        })
        // Запрос на обновление токена
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'new_access',
            refresh_token: 'new_refresh',
            user_id: 1,
            username: 'test',
            email: 'test@test.com',
          }),
        })
        // Повторный запрос с новым токеном
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        });
      
      apiService.setTokens('old_token', 'refresh_token');
      
      const result = await apiService.request('/test-endpoint');
      
      expect(result).toEqual({ data: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Investigation API', () => {
    beforeEach(() => {
      apiService.setTokens('test_token', 'test_refresh');
    });

    it('gets investigations', async () => {
      const mockInvestigations = [
        { id: 1, title: 'Investigation 1', description: 'Desc 1', user_id: 1, created_at: '2024-01-01' },
        { id: 2, title: 'Investigation 2', description: 'Desc 2', user_id: 1, created_at: '2024-01-02' },
      ];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvestigations,
      });
      
      const result = await apiService.getInvestigations(1);
      
      expect(result).toEqual(mockInvestigations);
    });

    it('creates investigation', async () => {
      const newInvestigation = {
        id: 1,
        title: 'New Investigation',
        description: 'Test',
        user_id: 1,
        created_at: '2024-01-01',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newInvestigation,
      });
      
      const result = await apiService.createInvestigation({
        title: 'New Investigation',
        description: 'Test',
        user_id: 1,
      });
      
      expect(result).toEqual(newInvestigation);
    });

    it('deletes investigation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Investigation deleted successfully' }),
      });
      
      await expect(apiService.deleteInvestigation(1)).resolves.not.toThrow();
    });
  });

  describe('File Operations', () => {
    beforeEach(() => {
      apiService.setTokens('test_token', 'test_refresh');
    });

    it('uploads file', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        id: 1,
        filename: 'test.txt',
        file_type: 'document',
        file_size: 12,
        uploaded_at: '2024-01-01',
        title: 'test.txt',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      const result = await apiService.uploadFile(1, mockFile, { title: 'Test File' });
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/files/upload/1',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('gets files with filters', async () => {
      const mockPaginatedResponse = {
        items: [
          { id: 1, filename: 'file1.jpg', file_type: 'image' },
          { id: 2, filename: 'file2.pdf', file_type: 'document' },
        ],
        total: 2,
        page: 1,
        pages: 1,
        limit: 12,
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedResponse,
      });
      
      const result = await apiService.getFilesWithFilters({
        investigation_id: 1,
        file_type: 'image',
        page: 1,
        limit: 12,
      });
      
      expect(result).toEqual(mockPaginatedResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/files/filter?investigation_id=1&file_type=image&page=1&limit=12'),
        expect.any(Object)
      );
    });
  });
});