import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, ArrowLeft, Paperclip, Smile } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  orderId?: string;
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  recipientId,
  recipientName,
  recipientRole,
  orderId,
  onClose
}) => {
  const { user, socket } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [recipientId, orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (socket && user) {
      socket.on('new_message', (message: Message) => {
        // Vérifier que le message concerne cette conversation
        if ((message.senderId === recipientId && message.recipientId === user.id) || 
            (message.senderId === user.id && message.recipientId === recipientId)) {
          setMessages(prev => [...prev, message]);
          
          // Mark as read if it's from the recipient
          if (message.senderId === recipientId) {
            markMessagesAsRead();
          }
        }
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket, recipientId, user?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params: any = { recipientId };
      if (orderId) params.orderId = orderId;
      
      const messagesData = await apiService.getMessages(params);
      setMessages(messagesData);
      
      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await apiService.markMessagesAsRead(recipientId, orderId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const messageData = {
        recipientId,
        message: newMessage.trim(),
        orderId
      };

      await apiService.sendMessage(messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'text-blue-600';
      case 'pharmacist': return 'text-green-600';
      case 'driver': return 'text-purple-600';
      case 'admin': return 'text-red-600';
      default: return 'text-gray-600';
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

  const handleCall = () => {
    // Simuler un appel - dans une vraie app, cela ouvrirait l'app d'appel
    alert(`Appel vers ${recipientName} - Fonctionnalité d'appel simulée`);
  };

  const handleVideoCall = () => {
    // Simuler un appel vidéo
    alert(`Appel vidéo vers ${recipientName} - Fonctionnalité d'appel vidéo simulée`);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {recipientName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">{recipientName}</h3>
            <p className={`text-sm ${getRoleColor(recipientRole)}`}>
              {getRoleLabel(recipientRole)}
            </p>
            {orderId && (
              <p className="text-xs text-gray-500">
                Commande #{orderId.slice(-6).toUpperCase()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={handleCall}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Appeler"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={handleVideoCall}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Appel vidéo"
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-center">Aucun message</p>
            <p className="text-sm text-center">Commencez la conversation !</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]: [string, any]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDate(dayMessages[0].timestamp)}
                </div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((message: Message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-medium ${getRoleColor(message.senderRole)}`}>
                            {message.senderName}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.timestamp)}
                        {isOwn && (
                          <span className="ml-1">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-3">
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;