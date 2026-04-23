/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

jest.mock('../../services/api', () => ({
  apiService: {
    getCurrentUser: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

// Тестовый компонент для доступа к контексту
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="username">{auth.user?.username || 'no-user'}</div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <button data-testid="login-btn" onClick={() => auth.login({
        id: 1,
        user_id: 1,
        username: 'testuser',
        email: 'test@test.com',
        access_token: 'token',
        refresh_token: 'refresh',
        roles: ['user'],
      })}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={auth.logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderAuthContext = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  };

  it('initializes with no user when no tokens', async () => {
    (apiService.getCurrentUser as jest.Mock).mockResolvedValue({ authenticated: false });
    
    renderAuthContext();
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('username')).toHaveTextContent('no-user');
    });
  });

  it('loads user from localStorage on init', async () => {
    const storedUser = {
      id: 1,
      username: 'storeduser',
      email: 'stored@test.com',
      roles: ['user'],
    };
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('access_token', 'test_token');
    localStorage.setItem('refresh_token', 'test_refresh');
    
    (apiService.getCurrentUser as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: storedUser,
    });
    
    renderAuthContext();
    
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('storeduser');
    });
  });

  it('logs in user correctly', async () => {
    renderAuthContext();
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
    
    act(() => {
      fireEvent.click(screen.getByTestId('login-btn'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });
    
    expect(localStorage.getItem('user')).toBeTruthy();
    expect(localStorage.getItem('access_token')).toBe('token');
  });

  it('logs out user correctly', async () => {
    renderAuthContext();
    
    act(() => {
      fireEvent.click(screen.getByTestId('login-btn'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    
    act(() => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('username')).toHaveTextContent('no-user');
    });
    
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('checks admin role correctly', () => {
    const TestRoleComponent = () => {
      const auth = useAuth();
      return (
        <div>
          <div data-testid="is-admin">{String(auth.isAdmin())}</div>
          <div data-testid="is-manager">{String(auth.isManager())}</div>
        </div>
      );
    };
    
    const adminUser = {
      id: 1,
      user_id: 1,
      username: 'admin',
      email: 'admin@test.com',
      access_token: 'token',
      refresh_token: 'refresh',
      roles: ['admin'],
    };
    
    const TestWrapper = () => {
      const auth = useAuth();
      React.useEffect(() => {
        auth.login(adminUser);
      }, []);
      return <TestRoleComponent />;
    };
    
    render(
      <AuthProvider>
        <TestWrapper />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('is-manager')).toHaveTextContent('true');
  });
});