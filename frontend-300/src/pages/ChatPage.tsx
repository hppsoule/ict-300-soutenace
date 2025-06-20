import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';

const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showChatList, setShowChatList] = useState(true);

  // Récupérer les paramètres de l'URL pour ouvrir directement une conversation
  useEffect(() => {
    const recipientId = searchParams.get('recipientId');
    const recipientName = searchParams.get('recipientName');
    const recipientRole = searchParams.get('recipientRole');
    const orderId = searchParams.get('orderId');

    if (recipientId && recipientName && recipientRole) {
      const contact = {
        id: recipientId,
        name: decodeURIComponent(recipientName),
        role: recipientRole,
        orderId: orderId || undefined
      };
      setSelectedContact(contact);
      setShowChatList(false);
    }
  }, [searchParams]);

  const handleSelectChat = (contact: any) => {
    setSelectedContact(contact);
    setShowChatList(false); // Hide chat list on mobile when chat is selected
  };

  const handleCloseChat = () => {
    setSelectedContact(null);
    setShowChatList(true);
    // Nettoyer l'URL
    navigate('/chat', { replace: true });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow overflow-hidden">
      {/* Chat List - Hidden on mobile when chat is open */}
      <div className={`w-full lg:w-1/3 xl:w-1/4 ${showChatList ? 'block' : 'hidden lg:block'}`}>
        <ChatList 
          onSelectChat={handleSelectChat}
          selectedContactId={selectedContact?.id}
        />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${selectedContact ? 'block' : 'hidden lg:block'}`}>
        {selectedContact ? (
          <ChatWindow
            recipientId={selectedContact.id}
            recipientName={selectedContact.name}
            recipientRole={selectedContact.role}
            orderId={selectedContact.orderId}
            onClose={handleCloseChat}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600 max-w-sm mb-4">
                Choisissez une conversation dans la liste pour commencer à discuter avec vos contacts.
              </p>
              <button
                onClick={handleBackToDashboard}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;