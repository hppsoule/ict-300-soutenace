import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Phone, Video, Plus, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

interface ChatListProps {
  onSelectChat: (contact: any) => void;
  selectedContactId?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  orderId?: string;
  lastMessageTime: string;
  unreadCount: number;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedContactId }) => {
  const { user, socket } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [error, setError] = useState('');
  const [availableError, setAvailableError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  // Listen for new messages to update contact list
  useEffect(() => {
    if (socket) {
      socket.on('new_message', () => {
        loadContacts();
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const contactsData = await apiService.getChatContacts();
      setContacts(contactsData);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      setError(error.message || 'Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableContacts = async () => {
    try {
      setLoadingAvailable(true);
      setAvailableError('');
      const availableData = await apiService.getAvailableContacts();
      setAvailableContacts(availableData);
    } catch (error: any) {
      console.error('Error loading available contacts:', error);
      setAvailableError(error.message || 'Erreur lors du chargement des contacts disponibles');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Charger les contacts disponibles quand on ouvre le modal
  useEffect(() => {
    if (showNewChatModal) {
      loadAvailableContacts();
    }
  }, [showNewChatModal]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'text-blue-600 bg-blue-100';
      case 'pharmacist': return 'text-green-600 bg-green-100';
      case 'driver': return 'text-purple-600 bg-purple-100';
      case 'admin': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'pharmacist': return 'Pharmacien';
      case 'driver': return 'Livreur';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleNewChat = (contact: any) => {
    onSelectChat(contact);
    setShowNewChatModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => setShowNewChatModal(true)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau chat</span>
        </button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={loadContacts}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 p-4">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-center">
              {searchTerm ? 'Aucun contact trouvé' : 'Aucune conversation'}
            </p>
            <p className="text-sm text-center text-gray-400">
              {searchTerm ? 'Essayez un autre terme' : 'Vos conversations apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <div
                key={`${contact.id}-${contact.orderId || 'general'}`}
                onClick={() => onSelectChat(contact)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedContactId === contact.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium truncate ${
                        contact.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {contact.name}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(contact.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(contact.role)}`}>
                        {getRoleLabel(contact.role)}
                      </span>
                      
                      {contact.orderId && (
                        <span className="text-xs text-gray-500">
                          Commande #{contact.orderId.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nouveau chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {availableError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{availableError}</p>
                <button 
                  onClick={loadAvailableContacts}
                  className="mt-1 text-sm text-red-700 font-medium"
                >
                  Réessayer
                </button>
              </div>
            )}

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : availableContacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun contact disponible</p>
                <p className="text-sm text-gray-400">
                  Les contacts apparaîtront ici selon vos commandes
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableContacts.map((contact) => (
                  <button
                    key={`${contact.id}-${contact.orderId || 'general'}`}
                    onClick={() => handleNewChat(contact)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-600">{getRoleLabel(contact.role)}</div>
                        {contact.orderId && (
                          <div className="text-xs text-gray-500">
                            Commande #{contact.orderId.slice(-6)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;