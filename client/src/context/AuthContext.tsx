import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoUsers: User[];
  notifications: Notification[];
  unreadCount: number;
  login: (credentials: { email: string; password?: string; role?: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  quickDemoLogin: (userId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load demo users and cached session
  useEffect(() => {
    async function initAuth() {
      try {
        const { users } = await api.getDemoUsers();
        setDemoUsers(users);

        const savedUserId = localStorage.getItem('athlete360_user_id');
        if (savedUserId) {
          const matched = users.find(u => u.id === savedUserId);
          if (matched) {
            setUser(matched);
            loadNotifications(matched.id);
          } else {
            // Fetch directly
            try {
              const res = await api.getMe(savedUserId);
              if (res.user) {
                setUser(res.user);
                loadNotifications(res.user.id);
              }
            } catch {
              localStorage.removeItem('athlete360_user_id');
            }
          }
        }
      } catch (err) {
        console.error('Failed to init demo users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  async function loadNotifications(userId: string) {
    try {
      const res = await api.getNotifications(userId);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  const login = async (credentials: { email: string; password?: string; role?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      localStorage.setItem('athlete360_user_id', res.user.id);
      loadNotifications(res.user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      localStorage.setItem('athlete360_user_id', res.user.id);
      // reload demo users to include new registrant
      const demoRes = await api.getDemoUsers();
      setDemoUsers(demoRes.users);
      loadNotifications(res.user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async (userId: string) => {
    setIsLoading(true);
    try {
      let targetUser = demoUsers.find(u => u.id === userId);
      if (!targetUser) {
        const res = await api.getMe(userId);
        targetUser = res.user;
      }
      if (targetUser) {
        setUser(targetUser);
        localStorage.setItem('athlete360_user_id', targetUser.id);
        loadNotifications(targetUser.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('athlete360_user_id');
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await api.getMe(user.id);
      if (res.user) setUser(res.user);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    await loadNotifications(user.id);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await api.markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        demoUsers,
        notifications,
        unreadCount,
        login,
        register,
        quickDemoLogin,
        logout,
        refreshUser,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
