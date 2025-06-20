import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  MapPin, 
  User, 
  Clock, 
  Navigation, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Phone,
  Calendar,
  ArrowLeft,
  Filter,
  Search,
  History,
  CheckSquare,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const DeliveriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, socket } = useAuth();
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [acceptingDelivery, setAcceptingDelivery] = useState<string | null>(null);
  const [completingDelivery, setCompletingDelivery] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('available');
  const [newDeliveryNotification, setNewDeliveryNotification] = useState(false);

  useEffect(() => {
    if (user?.role !== 'driver') {
      navigate('/dashboard');
      return;
    }
    
    loadData();
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Écouter les nouvelles notifications via Socket.IO
  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (notification: any) => {
        console.log('🔔 Nouvelle notification reçue:', notification);
        
        // Si c'est une notification de nouvelle livraison disponible
        if (notification.title.includes('Nouvelle livraison') || 
            notification.title.includes('livraison assignée')) {
          setNewDeliveryNotification(true);
          // Recharger les données
          loadData();
          
          // Jouer un son de notification
          playNotificationSound();
        }
      });

      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket]);

  const playNotificationSound = () => {
    // Créer un élément audio et jouer un son de notification
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Erreur lecture audio:', e));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les données en parallèle
      const [deliveriesResult, statsResult] = await Promise.all([
        apiService.getAvailableDeliveries(),
        apiService.getDriverStats()
      ]);

      setAvailableDeliveries(deliveriesResult || []);
      
      if (deliveriesResult && deliveriesResult.length > 0) {
        setNewDeliveryNotification(true);
      }
      
      if (statsResult && statsResult.activeDelivery) {
        setActiveDelivery(statsResult.activeDelivery);
      } else {
        setActiveDelivery(null);
      }
      
      setError('');
    } catch (err: any) {
      console.error('Erreur chargement données livreur:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistoryError('');
      
      // Utiliser getOrders pour récupérer l'historique des livraisons
      const orders = await apiService.getOrders();
      // Filtrer pour ne garder que les livraisons terminées par ce livreur
      const userId = localStorage.getItem('userId');
      const completedDeliveries = orders.filter((order: any) => 
        order.status === 'delivered' && order.driverId === userId
      );
      
      setDeliveryHistory(completedDeliveries);
    } catch (err: any) {
      console.error('Erreur chargement historique:', err);
      setHistoryError(err.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fonction pour convertir EUR en CFA
  const convertToCFA = (euroAmount: number): number => {
    // 1 EUR = 655.957 CFA (taux fixe)
    return Math.round(euroAmount * 655.957);
  };

  // Fonction pour formater le prix en CFA
  const formatCFA = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertToCFA(amount));
  };

  const handleAcceptDelivery = async (orderId: string) => {
    if (acceptingDelivery) return;
    
    try {
      setAcceptingDelivery(orderId);
      await apiService.acceptDelivery(orderId);
      await loadData();
      
      showSuccessNotification('Livraison acceptée avec succès!');
      setNewDeliveryNotification(false);
    } catch (err: any) {
      console.error('Erreur acceptation livraison:', err);
      showErrorNotification('Erreur: ' + err.message);
    } finally {
      setAcceptingDelivery(null);
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    if (completingDelivery) return;
    
    const notes = prompt('Notes de livraison (optionnel):');
    if (notes === null) return;
    
    try {
      setCompletingDelivery(orderId);
      await apiService.completeDelivery(orderId, { deliveryNotes: notes || '' });
      await loadData();
      
      showSuccessNotification('Livraison terminée avec succès!');
    } catch (err: any) {
      console.error('Erreur finalisation livraison:', err);
      showErrorNotification('Erreur: ' + err.message);
    } finally {
      setCompletingDelivery(null);
    }
  };

  const handleTrackDelivery = (orderId: string) => {
    navigate(`/tracking?orderId=${orderId}`);
  };

  const handleContactPatient = (order: any) => {
    // Naviguer vers le chat avec le patient
    navigate(`/chat?recipientId=${order.patientId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.patientName || 'Patient')}&recipientRole=patient`);
  };

  const handleContactPharmacy = (order: any) => {
    // Naviguer vers le chat avec la pharmacie (propriétaire)
    navigate(`/chat?recipientId=${order.pharmacyOwnerId || order.pharmacyId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.pharmacyName || 'Pharmacie')}&recipientRole=pharmacist`);
  };

  const handleCallPatient = (phoneNumber: string) => {
    if (phoneNumber) {
      // Créer un lien tel: pour ouvrir l'application d'appel
      window.location.href = `tel:${phoneNumber}`;
    } else {
      showErrorNotification('Numéro de téléphone non disponible');
    }
  };

  const showSuccessNotification = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const showErrorNotification = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  };

  const filteredDeliveries = availableDeliveries.filter(delivery => {
    const matchesSearch = 
      delivery.pharmacy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery?.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'nearby' && delivery.distance && parseFloat(delivery.distance) < 5) return matchesSearch;
    if (selectedFilter === 'highvalue' && delivery.total > 50) return matchesSearch;
    
    return false;
  });

  // Charger l'historique quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'history') {
      loadDeliveryHistory();
    }
  }, [activeTab]);

  if (loading && !activeDelivery && availableDeliveries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h1>
            <p className="text-gray-600">Trouvez et gérez vos livraisons</p>
          </div>
        </div>
        
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Afficher l'erreur si elle existe */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-800">Problème de connexion</h3>
          </div>
          <p className="text-yellow-700 mb-4">{error}</p>
          
          <button
            onClick={loadData}
            className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Notification de nouvelle livraison */}
      {newDeliveryNotification && availableDeliveries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Nouvelles livraisons disponibles!</h3>
              <p className="text-sm text-blue-700">{availableDeliveries.length} livraison(s) en attente de prise en charge</p>
            </div>
          </div>
        </div>
      )}

      {/* Livraison active */}
      {activeDelivery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900">🚚 Livraison en cours</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              En route
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    Commande #{activeDelivery.id?.slice(-6).toUpperCase() || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {formatCFA(parseFloat(activeDelivery.total))} + {formatCFA(5.00)} livraison
                  </p>
                  <p className="text-sm text-blue-600">
                    {activeDelivery.pharmacy_name || 'Pharmacie'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-blue-700">
                  <User className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Patient:</strong> {activeDelivery.patient_first_name || 'N/A'} {activeDelivery.patient_last_name || ''}
                  </span>
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Adresse:</strong> {activeDelivery.delivery_street || 'Adresse'}, {activeDelivery.delivery_city || 'Ville'}
                  </span>
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Estimation:</strong> 15-30 minutes
                  </span>
                </div>
                {activeDelivery.patient_phone && (
                  <div className="flex items-center text-sm text-blue-700">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>
                      <strong>Téléphone:</strong> {activeDelivery.patient_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-3">
              <button 
                onClick={() => handleTrackDelivery(activeDelivery.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Voir sur la carte
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleContactPatient(activeDelivery)}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Patient
                </button>
                <button 
                  onClick={() => handleContactPharmacy(activeDelivery)}
                  className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Pharmacie
                </button>
              </div>
              
              {activeDelivery.patient_phone && (
                <button 
                  onClick={() => handleCallPatient(activeDelivery.patient_phone)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler le patient
                </button>
              )}
              
              <button 
                onClick={() => handleCompleteDelivery(activeDelivery.id)}
                disabled={completingDelivery === activeDelivery.id}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completingDelivery === activeDelivery.id ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckSquare className="w-4 h-4 mr-2" />
                )}
                <span>Marquer comme livrée</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } relative`}
            >
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Livraisons disponibles ({availableDeliveries.length})</span>
                {newDeliveryNotification && availableDeliveries.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>Historique</span>
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'available' && (
          <div>
            {/* Filtres et recherche */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher une livraison..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Toutes les livraisons</option>
                    <option value="nearby">À proximité ({'<'}5km)</option>
                    <option value="highvalue">Valeur élevée ({'>'}90%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des livraisons disponibles */}
            <div className="p-6">
              {filteredDeliveries.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || selectedFilter !== 'all' 
                      ? 'Aucune livraison trouvée' 
                      : 'Aucune livraison disponible'
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedFilter !== 'all'
                      ? 'Essayez de modifier vos critères de recherche'
                      : activeDelivery 
                        ? 'Terminez votre livraison en cours pour voir de nouvelles opportunités'
                        : 'De nouvelles livraisons apparaîtront ici dès qu\'elles seront prêtes'
                    }
                  </p>
                  {!activeDelivery && !searchTerm && selectedFilter === 'all' && (
                    <button
                      onClick={loadData}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Vérifier maintenant
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredDeliveries.map((delivery) => (
                    <div key={delivery.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {delivery.pharmacy?.name || 'Pharmacie'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.itemCount || 0} article(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCFA(delivery.total)}</p>
                          <p className="text-sm text-green-600 font-medium">+{formatCFA(delivery.deliveryFee)}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          <span><strong>Client:</strong> {delivery.delivery?.customer || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span><strong>Adresse:</strong> {delivery.delivery?.address || 'Destination'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Navigation className="w-4 h-4 mr-2" />
                          <span><strong>Distance:</strong> {delivery.distance || 'N/A'} • <strong>Temps:</strong> {delivery.estimatedTime || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Créée: {delivery.createdAt ? new Date(delivery.createdAt).toLocaleString('fr-FR') : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-gray-600">Total: </span>
                          <span className="font-bold text-green-600">
                            {formatCFA(delivery.total + delivery.deliveryFee)}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleAcceptDelivery(delivery.id)}
                          disabled={!!activeDelivery || acceptingDelivery === delivery.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {acceptingDelivery === delivery.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Truck className="w-4 h-4" />
                          )}
                          <span>
                            {acceptingDelivery === delivery.id ? 'Acceptation...' : 'Accepter'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Historique des livraisons
              </h2>
              <button
                onClick={loadDeliveryHistory}
                disabled={loadingHistory}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>

            {historyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">{historyError}</p>
                </div>
              </div>
            )}

            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : deliveryHistory.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison terminée</h3>
                <p className="text-gray-600">Vos livraisons terminées apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveryHistory.map((delivery) => (
                  <div key={delivery.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Commande #{delivery.id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {delivery.items.length} article(s) • {delivery.pharmacyName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCFA(delivery.total)}</p>
                        <p className="text-sm text-green-600 font-medium">+{formatCFA(5.00)} livraison</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Client: </span>
                        <span className="font-medium">{delivery.patientName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Adresse: </span>
                        <span className="font-medium">{delivery.deliveryAddress.city}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Livré le: </span>
                        <span className="font-medium">
                          {delivery.deliveredAt 
                            ? new Date(delivery.deliveredAt).toLocaleDateString('fr-FR')
                            : new Date(delivery.updatedAt).toLocaleDateString('fr-FR')
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveriesPage;