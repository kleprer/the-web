import { apiService } from '../../services/api';

const originalFetch = global.fetch;

describe('E2E User Flows (API Integration)', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should perform complete auth flow', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'e2e_token',
        refresh_token: 'e2e_refresh',
        user_id: 1,
        username: 'e2euser',
        email: 'e2e@test.com',
        roles: ['user'],
      }),
    });

    const signupData = { username: 'e2euser', email: 'e2e@test.com', password: 'pass123' };
    const signupResponse = await apiService.signup(signupData);
    
    expect(signupResponse.access_token).toBe('e2e_token');
    expect(localStorage.getItem('access_token')).toBe('e2e_token');
  });

  it('should create and manage investigation', async () => {
    localStorage.setItem('access_token', 'test-token');
    apiService.setTokens('test-token', 'test-refresh');
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 99,
        title: 'E2E Investigation',
        description: 'Test',
        user_id: 1,
        created_at: new Date().toISOString(),
      }),
    });

    const investigation = await apiService.createInvestigation({
      title: 'E2E Investigation',
      description: 'Test',
      user_id: 1,
    });

    expect(investigation.id).toBe(99);
    expect(investigation.title).toBe('E2E Investigation');
  });

  it('should handle file upload flow', async () => {
    localStorage.setItem('access_token', 'test-token');
    apiService.setTokens('test-token', 'test-refresh');
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 5,
        filename: 'e2e-test.txt',
        file_type: 'document',
        file_size: 1024,
        uploaded_at: new Date().toISOString(),
        title: 'Test File',
      }),
    });

    const file = new File(['content'], 'e2e-test.txt', { type: 'text/plain' });
    const uploadedFile = await apiService.uploadFile(1, file, { title: 'Test File' });
    
    expect(uploadedFile.filename).toBe('e2e-test.txt');
    expect(uploadedFile.id).toBe(5);
  });
});