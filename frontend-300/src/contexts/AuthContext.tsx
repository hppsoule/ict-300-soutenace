import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import apiService from '../services/api';
import { io, Socket } from 'socket.io-client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => void;
  socket: Socket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Check for stored auth token and get user profile
    const initAuth = async () => {
      const token = localStorage.getItem('pharmaDeliveryToken');
      if (token) {
        try {
          apiService.setToken(token);
          const profileData = await apiService.getProfile();
          const userData = {
            id: profileData.id,
            email: profileData.email,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
            role: profileData.role,
            avatar: profileData.avatarUrl,
            isActive: profileData.isActive,
            isVerified: profileData.isVerified,
            createdAt: profileData.createdAt,
            address: profileData.address
          };
          setUser(userData);
          
          // Initialiser Socket.IO après l'authentification
          initializeSocket(userData.id);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          localStorage.removeItem('pharmaDeliveryToken');
          apiService.setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const initializeSocket = (userId: string) => {
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('pharmaDeliveryToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connecté au serveur Socket.IO');
      // Rejoindre la room personnelle de l'utilisateur
      newSocket.emit('join_user_room', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Déconnecté du serveur Socket.IO');
    });

    // Écouter les nouvelles notifications
    newSocket.on('new_notification', (notification) => {
      console.log('🔔 Nouvelle notification reçue:', notification);
      
      // Afficher une notification toast moderne
      showNotificationToast(notification);
    });

    // Écouter les mises à jour de commandes
    newSocket.on('order_status_changed', (data) => {
      console.log('📦 Statut de commande mis à jour:', data);
      
      // Afficher une notification pour le changement de statut
      showNotificationToast({
        title: 'Commande mise à jour',
        message: `Le statut de votre commande a changé: ${data.status}`,
        type: 'info'
      });
    });

    // Écouter les nouveaux messages
    newSocket.on('new_message', (message) => {
      console.log('💬 Nouveau message reçu:', message);
      
      showNotificationToast({
        title: `Message de ${message.senderName}`,
        message: message.message,
        type: 'info'
      });
    });

    setSocket(newSocket);
  };

  const showNotificationToast = (notification: any) => {
    // Créer une notification toast moderne
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 transform transition-all duration-300 ease-in-out translate-x-full`;
    
    const typeColors = {
      success: 'border-l-green-500 bg-green-50',
      error: 'border-l-red-500 bg-red-50',
      warning: 'border-l-yellow-500 bg-yellow-50',
      info: 'border-l-blue-500 bg-blue-50'
    };

    const typeIcons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="border-l-4 ${typeColors[notification.type] || typeColors.info} p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <span class="text-lg">${typeIcons[notification.type] || typeIcons.info}</span>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-gray-900">${notification.title}</h3>
            <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Auto-suppression après 5 secondes
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.login(email, password);
      const userData = response.user;
      
      const user = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        avatar: userData.avatarUrl,
        isActive: userData.isActive,
        isVerified: userData.isVerified,
        createdAt: userData.createdAt
      };
      
      setUser(user);
      
      // Initialiser Socket.IO après la connexion
      initializeSocket(user.id);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.register(userData);
      
      // Si l'utilisateur est un patient (compte activé immédiatement)
      if (response.user && response.token) {
        const user = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: response.user.phone,
          role: response.user.role,
          avatar: response.user.avatarUrl,
          isActive: response.user.isActive,
          isVerified: response.user.isVerified,
          createdAt: response.user.createdAt
        };
        
        setUser(user);
        
        // Initialiser Socket.IO pour les patients
        if (user.role === 'patient') {
          initializeSocket(user.id);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiService.logout();
    
    // Fermer la connexion Socket.IO
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateUser, socket }}>
      {children}
    </AuthContext.Provider>
  );
};