import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, Clock, CheckCircle, Euro, MapPin, Navigation, Package, AlertCircle, 
  Play, CheckSquare, RefreshCw, Star, MessageCircle, Phone, Map, History,
  User, Calendar, TrendingUp, Bell
} from 'lucide-react';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DriverDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, socket } = useAuth();
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [driverStats, setDriverStats] = useState<any>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingDelivery, setAcceptingDelivery] = useState<string | null>(null);
  const [completingDelivery, setCompletingDelivery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newDeliveryNotification, setNewDeliveryNotification] = useState(false);

  useEffect(() => {
    loadData();
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      
      // Charger les données en parallèle avec gestion d'erreur individuelle
      const [deliveriesResult, statsResult] = await Promise.allSettled([
        apiService.getAvailableDeliveries(),
        apiService.getDriverStats()
      ]);

      // Traiter les livraisons disponibles
      if (deliveriesResult.status === 'fulfilled') {
        setAvailableDeliveries(deliveriesResult.value || []);
        
        // Réinitialiser la notification si des livraisons sont disponibles
        if (deliveriesResult.value && deliveriesResult.value.length > 0) {
          setNewDeliveryNotification(true);
        }
      } else {
        console.error('Erreur chargement livraisons:', deliveriesResult.reason);
        setAvailableDeliveries([]);
      }

      // Traiter les statistiques
      if (statsResult.status === 'fulfilled') {
        setDriverStats(statsResult.value || {});
      } else {
        console.error('Erreur chargement stats:', statsResult.reason);
        setDriverStats({
          today: { deliveries: 0, earnings: 0, avgTime: 0 },
          total: { deliveries: 0, earnings: 0, completionRate: 0 },
          activeDelivery: null
        });
      }

      // Charger l'historique des livraisons
      try {
        const historyData = await apiService.getOrders();
        // Filtrer pour ne garder que les livraisons terminées par ce livreur
        const userId = localStorage.getItem('userId');
        setDeliveryHistory(historyData.filter((order: any) => 
          order.status === 'delivered' && order.driverId === userId
        ));
      } catch (historyError) {
        console.error('Erreur chargement historique:', historyError);
        setDeliveryHistory([]);
      }

      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Erreur chargement données livreur:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      
      // Définir des valeurs par défaut en cas d'erreur
      setAvailableDeliveries([]);
      setDriverStats({
        today: { deliveries: 0, earnings: 0, avgTime: 0 },
        total: { deliveries: 0, earnings: 0, completionRate: 0 },
        activeDelivery: null
      });
      setDeliveryHistory([]);
    } finally {
      setLoading(false);
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

  const safeToFixed = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined) return '0.00';
    const num = parseFloat(String(value));
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  const safeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  const stats = [
    {
      title: 'Livraisons aujourd\'hui',
      value: driverStats?.today?.deliveries || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'En cours',
      value: driverStats?.activeDelivery ? 1 : 0,
      icon: Truck,
      color: 'bg-blue-500',
    },
    {
      title: 'Revenus du jour',
      value: formatCFA(safeNumber(driverStats?.today?.earnings)),
      icon: Euro,
      color: 'bg-green-600',
    },
    {
      title: 'Temps moyen',
      value: driverStats?.today?.avgTime ? `${driverStats.today.avgTime} min` : 'N/A',
      icon: Clock,
      color: 'bg-yellow-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord - Livreur</h1>
          <p className="text-gray-600">Gérez vos livraisons et optimisez vos trajets</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          
          <button
            onClick={() => navigate('/deliveries')}
            className={`border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2 relative ${
              newDeliveryNotification ? 'animate-pulse' : ''
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Toutes les livraisons</span>
            {newDeliveryNotification && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Afficher l'erreur si elle existe, mais ne pas bloquer l'interface */}
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

      {/* Onglets de navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4" />
                <span>Tableau de bord</span>
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
                <span>Historique ({deliveryHistory.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.title} className="bg-gray-50 rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className={`${stat.color} rounded-lg p-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Delivery */}
              {driverStats?.activeDelivery && (
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
                            Commande #{driverStats.activeDelivery.id?.slice(-6).toUpperCase() || 'N/A'}
                          </p>
                          <p className="text-sm text-blue-700">
                            {formatCFA(safeNumber(driverStats.activeDelivery.total))} + {formatCFA(5.00)} livraison
                          </p>
                          <p className="text-sm text-blue-600">
                            {driverStats.activeDelivery.pharmacy_name || 'Pharmacie'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-blue-700">
                          <User className="w-4 h-4 mr-2" />
                          <span>
                            <strong>Patient:</strong> {driverStats.activeDelivery.patient_first_name || 'N/A'} {driverStats.activeDelivery.patient_last_name || ''}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>
                            <strong>Adresse:</strong> {driverStats.activeDelivery.delivery_street || 'Adresse'}, {driverStats.activeDelivery.delivery_city || 'Ville'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>
                            <strong>Estimation:</strong> 15-30 minutes
                          </span>
                        </div>
                        {driverStats.activeDelivery.patient_phone && (
                          <div className="flex items-center text-sm text-blue-700">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>
                              <strong>Téléphone:</strong> {driverStats.activeDelivery.patient_phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-3">
                      <button 
                        onClick={() => handleTrackDelivery(driverStats.activeDelivery.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Map className="w-4 h-4 mr-2" />
                        Voir sur la carte
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleContactPatient(driverStats.activeDelivery)}
                          className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Patient
                        </button>
                        <button 
                          onClick={() => handleContactPharmacy(driverStats.activeDelivery)}
                          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Pharmacie
                        </button>
                      </div>
                      
                      {driverStats.activeDelivery.patient_phone && (
                        <button 
                          onClick={() => handleCallPatient(driverStats.activeDelivery.patient_phone)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Appeler le patient
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleCompleteDelivery(driverStats.activeDelivery.id)}
                        disabled={completingDelivery === driverStats.activeDelivery.id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {completingDelivery === driverStats.activeDelivery.id ? (
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

              {/* Available Deliveries */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    📦 Livraisons disponibles ({availableDeliveries.length})
                  </h2>
                  <button 
                    onClick={() => navigate('/deliveries')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>Voir toutes</span>
                    <Navigation className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {availableDeliveries.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison disponible</h3>
                    <p className="text-gray-600">
                      {driverStats?.activeDelivery 
                        ? 'Terminez votre livraison en cours pour voir de nouvelles opportunités'
                        : 'De nouvelles livraisons apparaîtront ici dès qu\'elles seront prêtes'
                      }
                    </p>
                    {!driverStats?.activeDelivery && (
                      <button
                        onClick={loadData}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Vérifier maintenant
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {availableDeliveries.slice(0, 4).map((delivery) => (
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
                            disabled={!!driverStats?.activeDelivery || acceptingDelivery === delivery.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {acceptingDelivery === delivery.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
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
                
                {availableDeliveries.length > 4 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate('/deliveries')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir {availableDeliveries.length - 4} livraisons supplémentaires
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  📋 Historique des livraisons ({deliveryHistory.length})
                </h2>
                <div className="text-sm text-gray-600">
                  Total gagné: <span className="font-bold text-green-600">{formatCFA(deliveryHistory.length * 5)}</span>
                </div>
              </div>

              {deliveryHistory.length === 0 ? (
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

      {/* Performance Summary */}
      {driverStats && driverStats.total && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Résumé des performances</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeNumber(driverStats.total.deliveries)}</div>
              <div className="text-sm text-gray-600">Total livraisons</div>
              <div className="flex items-center justify-center mt-1">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-xs text-gray-500">Expérience</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCFA(safeNumber(driverStats.total.earnings))}</div>
              <div className="text-sm text-gray-600">Total revenus</div>
              <div className="text-xs text-gray-500 mt-1">
                Moyenne: {formatCFA(driverStats.total.deliveries > 0 ? safeNumber(driverStats.total.earnings) / driverStats.total.deliveries : 0)}/livraison
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{safeNumber(driverStats.total.completionRate)}%</div>
              <div className="text-sm text-gray-600">Taux de réussite</div>
              <div className="text-xs text-gray-500 mt-1">
                {driverStats.total.completionRate >= 95 ? 'Excellent' : 
                 driverStats.total.completionRate >= 85 ? 'Très bien' : 
                 driverStats.total.completionRate >= 75 ? 'Bien' : 'À améliorer'}
              </div>
            </div>
          </div>

          {/* Conseils pour améliorer les performances */}
          {driverStats.total.deliveries > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Conseils pour optimiser vos revenus</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {driverStats.today.avgTime > 45 && (
                  <li>• Optimisez vos trajets pour réduire le temps de livraison</li>
                )}
                {driverStats.today.deliveries < 5 && (
                  <li>• Acceptez plus de livraisons pendant les heures de pointe</li>
                )}
                {driverStats.total.completionRate < 90 && (
                  <li>• Améliorez votre taux de réussite pour débloquer des bonus</li>
                )}
                <li>• Les livraisons en soirée (18h-21h) sont souvent mieux rémunérées</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;