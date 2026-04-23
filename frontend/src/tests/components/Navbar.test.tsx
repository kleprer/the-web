// frontend/src/__tests__/components/Navbar.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthProvider } from '../../context/AuthContext';
import { apiService } from '../../services/api';

// Мокаем API сервис
jest.mock('../../services/api', () => ({
  apiService: {
    getInvestigations: jest.fn().mockResolvedValue([]),
  },
}));

// Мокаем react-router-dom хуки
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ boardId: '1' }),
}));

// Устанавливаем токен в localStorage перед тестами
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('access_token', 'fake-token');
  localStorage.setItem('refresh_token', 'fake-refresh');
  localStorage.setItem('user', JSON.stringify({ 
    id: 1, 
    username: 'testuser', 
    email: 'test@test.com', 
    roles: ['user'] 
  }));
});

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Navbar currentBoardName="Test Board" />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  it('renders navbar correctly', async () => {
    renderNavbar();
    await waitFor(() => {
      expect(screen.getByText('ПАУТИНА')).toBeInTheDocument();
    });
  });

  it('shows timeline link', () => {
    renderNavbar();
    expect(screen.getByText('таймлайны')).toBeInTheDocument();
  });

  it('shows evidence link', () => {
    renderNavbar();
    expect(screen.getByText('доказательства')).toBeInTheDocument();
  });

  it('shows boards link', () => {
    renderNavbar();
    expect(screen.getByText('доски')).toBeInTheDocument();
  });

  it('shows logo', () => {
    renderNavbar();
    const logo = screen.getByAltText('Логотип');
    expect(logo).toBeInTheDocument();
  });

  it('shows current board name', () => {
    renderNavbar();
    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });
});