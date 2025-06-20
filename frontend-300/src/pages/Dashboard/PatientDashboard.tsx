import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Clock, CheckCircle, Package, MapPin, CreditCard, Truck, MessageCircle, Navigation, Phone } from 'lucide-react';
import apiService from '../../services/api';

const PatientDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    loadPaymentMethods();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await apiService.getOrders();
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await apiService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err: any) {
      console.error('Erreur chargement méthodes de paiement:', err);
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

  const handlePayment = async (paymentMethod: string) => {
    if (!selectedOrder) return;

    try {
      // Simuler les données de paiement selon la méthode
      const paymentData = {
        orderId: selectedOrder.id,
        paymentMethod: paymentMethod,
        paymentData: paymentMethod === 'card' ? {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          holderName: 'John Doe'
        } : {
          token: 'demo_token_' + Date.now()
        }
      };

      await apiService.processPayment(paymentData);
      setShowPaymentModal(false);
      setSelectedOrder(null);
      await loadOrders(); // Recharger les commandes
      alert('Paiement effectué avec succès!');
    } catch (err: any) {
      alert('Erreur de paiement: ' + err.message);
    }
  };

  const handleTrackOrder = (orderId: string) => {
    navigate(`/tracking?orderId=${orderId}`);
  };

  const handleContactDriver = (order: any) => {
    if (order.driverId && order.driverName) {
      navigate(`/chat?recipientId=${order.driverId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.driverName)}&recipientRole=driver`);
    } else {
      alert('Aucun livreur assigné pour le moment');
    }
  };

  const handleContactPharmacy = (order: any) => {
    if (order.pharmacyId && order.pharmacyName) {
      // Pour contacter la pharmacie, on doit récupérer l'ID du propriétaire
      // On va utiliser l'ID de la pharmacie comme fallback et le backend se chargera de trouver le bon destinataire
      navigate(`/chat?recipientId=${order.pharmacyId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.pharmacyName)}&recipientRole=pharmacist`);
    }
  };

  const handleCallDriver = (order: any) => {
    if (order.driverPhone) {
      window.location.href = `tel:${order.driverPhone}`;
    } else {
      alert('Numéro de téléphone du livreur non disponible');
    }
  };

  const activeOrder = orders.find(order => ['validated', 'paid', 'preparing', 'ready', 'in_transit'].includes(order.status));

  const stats = [
    {
      title: 'Commandes actives',
      value: orders.filter(o => ['validated', 'paid', 'preparing', 'in_transit'].includes(o.status)).length,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Commandes livrées',
      value: orders.filter(o => o.status === 'delivered').length,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Total dépensé',
      value: formatCFA(orders.reduce((sum, o) => sum + o.total, 0)),
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Gérez vos commandes et suivez vos livraisons</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
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

      {/* Active Order Tracking */}
      {activeOrder && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Commande en cours</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                activeOrder.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                activeOrder.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                activeOrder.status === 'validated' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {t(`order.status.${activeOrder.status}`)}
              </span>
              
              {activeOrder.status === 'validated' && (
                <button
                  onClick={() => {
                    setSelectedOrder(activeOrder);
                    setShowPaymentModal(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payer maintenant</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Commande #{activeOrder.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-gray-600">{activeOrder.items.length} articles - {formatCFA(activeOrder.total)}</p>
              <p className="text-sm text-gray-500">{activeOrder.pharmacyName}</p>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            <span>Livraison vers {activeOrder.deliveryAddress.street}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {activeOrder.status === 'in_transit' && (
              <button 
                onClick={() => handleTrackOrder(activeOrder.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Suivre sur la carte</span>
              </button>
            )}
            
            {/* Contact Pharmacy */}
            <button 
              onClick={() => handleContactPharmacy(activeOrder)}
              className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contacter la pharmacie</span>
            </button>
            
            {/* Contact Driver if assigned */}
            {activeOrder.driverName && (
              <>
                <button 
                  onClick={() => handleContactDriver(activeOrder)}
                  className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat avec {activeOrder.driverName}</span>
                </button>
                
                {activeOrder.driverPhone && (
                  <button 
                    onClick={() => handleCallDriver(activeOrder)}
                    className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Appeler</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Commandes récentes</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Voir toutes les commandes
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">{order.items.length} articles</p>
                    <p className="text-sm text-gray-500">{order.pharmacyName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCFA(order.total)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'validated' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t(`order.status.${order.status}`)}
                  </span>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    {order.status === 'validated' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPaymentModal(true);
                        }}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Payer
                      </button>
                    )}
                    
                    {order.status === 'in_transit' && (
                      <button
                        onClick={() => handleTrackOrder(order.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Suivre
                      </button>
                    )}
                    
                    {/* Contact buttons for all orders */}
                    <button
                      onClick={() => handleContactPharmacy(order)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Pharmacie
                    </button>
                    
                    {order.driverName && ['preparing', 'ready', 'in_transit'].includes(order.status) && (
                      <button
                        onClick={() => handleContactDriver(order)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Livreur
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
          <p className="text-gray-600">Commencez par parcourir notre catalogue de médicaments</p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Parcourir le catalogue
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paiement - Commande #{selectedOrder.id.slice(-6).toUpperCase()}
            </h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total à payer:</span>
                  <span className="text-xl font-bold text-gray-900">{formatCFA(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-gray-900">Choisir une méthode de paiement:</h4>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePayment(method.id)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;