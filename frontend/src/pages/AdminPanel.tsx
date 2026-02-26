import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { ShowForAdmin } from '../components/WithPermission';

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!isManager()) {
      navigate('/boards');
    }
  }, [isManager, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Реальный запрос к API
        const response = await apiService.request<any>('/auth/users/roles');
        console.log('📥 Загружены пользователи:', response);
        
        // Преобразуем ответ в нужный формат
        const usersList = Array.isArray(response) ? response : [];
        setUsers(usersList);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleEditUser = (userId: number, currentRoles: string[]) => {
    setEditingUser(userId);
    setSelectedRoles([...currentRoles]);
  };

  const handleSaveUser = async (userId: number) => {
    try {
      await apiService.request('/auth/users/roles', {
        method: 'PUT',
        body: JSON.stringify({
          user_id: userId,
          roles: selectedRoles
        })
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, roles: selectedRoles } : u
      ));
      setEditingUser(null);
    } catch (error) {
      console.error('Ошибка сохранения ролей:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRoles([]);
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === user?.id) {
      alert('Нельзя удалить самого себя');
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await apiService.request(`/users/${userId}`, {
          method: 'DELETE'
        });
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
      }
    }
  };

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">Admin</span>;
      case 'manager':
        return <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">Manager</span>;
      default:
        return <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs">User</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151516]">
        <Navbar />
        <div className="container mx-auto px-8 py-12 text-center text-white">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151516] text-white">
      <Navbar />

      <div className="container mx-auto px-8 py-12">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Панель управления
        </h1>

        <div className="max-w-4xl mx-auto">
          <div className="bg-[#2a2a2a] border border-white border-opacity-30 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-white border-opacity-30">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserOutlined />
                Пользователи системы
              </h2>
            </div>

            <div className="divide-y divide-white divide-opacity-10">
              {users.map(u => (
                <div key={u.id} className="p-6 hover:bg-white hover:bg-opacity-5 transition-colors">
                  {editingUser === u.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-sm text-gray-400">Логин</div>
                          <div className="font-medium">{u.username}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-400">Email</div>
                          <div className="font-medium">{u.email}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400 mb-2">Роли</div>
                        <div className="flex gap-2 flex-wrap">
                          {['admin', 'manager', 'user'].map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleToggle(role)}
                              className={`
                                px-3 py-1 rounded-full text-sm transition-colors
                                ${selectedRoles.includes(role) 
                                  ? role === 'admin' 
                                    ? 'bg-red-600 text-white' 
                                    : role === 'manager'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-green-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }
                              `}
                              disabled={role === 'admin' && !isAdmin()}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSaveUser(u.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          <SaveOutlined />
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                        >
                          <CloseOutlined />
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <UserOutlined className="text-white text-lg" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {u.username}
                            <div className="flex gap-1">
                              {u.roles.map(role => (
                                <span key={role} className="ml-1">
                                  {getRoleBadge(role)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(u.id, u.roles)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Редактировать роли"
                        >
                          <EditOutlined />
                        </button>
                        
                        <ShowForAdmin>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Удалить пользователя"
                            disabled={u.id === user?.id}
                          >
                            <DeleteOutlined />
                          </button>
                        </ShowForAdmin>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  Нет пользователей
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;