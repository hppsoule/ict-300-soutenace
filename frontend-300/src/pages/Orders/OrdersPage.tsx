import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MapPin, 
  CreditCard, 
  MessageCircle, 
  Phone, 
  Navigation,
  Filter,
  Search,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import apiService from '../../services/api';
import OrderDetails from '../../components/Orders/OrderDetails';
import PrescriptionUploadModal from '../../components/Catalog/PrescriptionUploadModal';
import OrderAssignDriverModal from '../../components/Orders/OrderAssignDriverModal';
import { useAuth } from '../../contexts/AuthContext';

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
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

  const filterOrders = () => {
    let filtered = orders;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.pharmacyName && order.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.items.some((item: any) => 
          item.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
  };

  const convertToCFA = (euroAmount: number): number => {
    // 1 EUR = 655.957 CFA (taux fixe)
    return Math.round(euroAmount * 655.957);
  };

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
      await loadOrders();
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
      navigate(`/chat?recipientId=${order.pharmacyId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.pharmacyName)}&recipientRole=pharmacist`);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleUploadPrescription = (orderId: string) => {
    setCurrentOrderId(orderId);
    setShowPrescriptionModal(true);
  };

  const handlePrescriptionUploaded = async (prescriptionUrl: string) => {
    if (!currentOrderId) return;
    
    try {
      // Mettre à jour l'ordonnance pour la commande
      await apiService.updateOrderPrescription(currentOrderId, prescriptionUrl);
      
      // Recharger les commandes
      await loadOrders();
      
      setShowPrescriptionModal(false);
      setCurrentOrderId(null);
      
      alert('Ordonnance téléchargée avec succès!');
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingOrderStatus(orderId);
      await apiService.updateOrderStatus(orderId, status);
      await loadOrders();
      showSuccessNotification(`Commande ${getStatusText(status).toLowerCase()} avec succès`);
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  const handleAssignDriver = (orderId: string) => {
    setCurrentOrderId(orderId);
    setShowAssignDriverModal(true);
  };

  const handleDriverAssigned = async (driverId: string) => {
    if (!currentOrderId) return;
    
    try {
      // Assigner le livreur à la commande
      await apiService.assignDriver(currentOrderId, driverId);
      
      // Recharger les commandes
      await loadOrders();
      
      showSuccessNotification('Livreur assigné avec succès');
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    } finally {
      setShowAssignDriverModal(false);
      setCurrentOrderId(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'validated': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-indigo-100 text-indigo-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'validated': return 'Validée';
      case 'rejected': return 'Rejetée';
      case 'paid': return 'Payée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'in_transit': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'validated': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'paid': return <CreditCard className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Toutes les commandes' },
    { value: 'pending', label: 'En attente' },
    { value: 'validated', label: 'Validées' },
    { value: 'paid', label: 'Payées' },
    { value: 'preparing', label: 'En préparation' },
    { value: 'ready', label: 'Prêtes' },
    { value: 'in_transit', label: 'En livraison' },
    { value: 'delivered', label: 'Livrées' },
    { value: 'rejected', label: 'Rejetées' },
    { value: 'cancelled', label: 'Annulées' }
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

  if (showOrderDetails && selectedOrder) {
    return (
      <OrderDetails 
        order={selectedOrder}
        onBack={() => setShowOrderDetails(false)}
        onContactDriver={handleContactDriver}
        onContactPharmacy={handleContactPharmacy}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'patient' ? 'Mes Commandes' : 'Gestion des Commandes'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'patient' 
              ? 'Gérez et suivez toutes vos commandes' 
              : user?.role === 'pharmacist'
                ? 'Gérez les commandes de votre pharmacie'
                : 'Suivez les commandes en cours'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          
          {user?.role === 'patient' && (
            <button
              onClick={() => navigate('/catalog')}
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Nouvelle commande
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => ['validated', 'paid', 'preparing', 'ready', 'in_transit'].includes(o.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Livrées</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {user?.role === 'patient' ? 'Total dépensé' : 'Chiffre d\'affaires'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCFA(orders.reduce((sum, o) => sum + o.total, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par ID, pharmacie ou médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Commandes ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedStatus !== 'all' ? 'Aucune commande trouvée' : 'Aucune commande'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par parcourir notre catalogue de médicaments'
              }
            </p>
            {!searchTerm && selectedStatus === 'all' && user?.role === 'patient' && (
              <button
                onClick={() => navigate('/catalog')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Parcourir le catalogue
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          Commande #{order.id.slice(-6).toUpperCase()}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.pharmacyName}</p>
                      <p className="text-sm text-gray-500">
                        {order.items.length} article(s) • {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {order.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Raison du rejet:</strong> {order.rejectionReason}
                        </p>
                      )}
                      
                      {/* Prescription Required Warning */}
                      {order.status === 'pending' && order.items.some((item: any) => item.requiresPrescription) && !order.prescriptionUrl && (
                        <div className="mt-2 flex items-center text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span>Ordonnance requise</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCFA(order.total)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.deliveredAt 
                        ? `Livré le ${new Date(order.deliveredAt).toLocaleDateString('fr-FR')}`
                        : `Créé le ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`
                      }
                    </p>
                  </div>
                </div>

                {/* Adresse de livraison */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {order.deliveryAddress.street}, {order.deliveryAddress.city}
                  </span>
                </div>

                {/* Articles de la commande */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Articles commandés:</h4>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.medicineName} x{item.quantity}
                          {item.requiresPrescription && !order.prescriptionUrl && (
                            <span className="ml-2 text-red-600 text-xs">
                              (Ordonnance requise)
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCFA(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{order.items.length - 3} autres articles...
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {/* Prescription Upload Button */}
                  {user?.role === 'patient' && order.status === 'pending' && order.items.some((item: any) => item.requiresPrescription) && !order.prescriptionUrl && (
                    <button
                      onClick={() => handleUploadPrescription(order.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Télécharger ordonnance</span>
                    </button>
                  )}
                  
                  {/* Pharmacist Actions */}
                  {user?.role === 'pharmacist' && (
                    <>
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'validated')}
                            disabled={updatingOrderStatus === order.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Valider</span>
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Raison du rejet:');
                              if (reason) {
                                handleUpdateOrderStatus(order.id, 'rejected');
                              }
                            }}
                            disabled={updatingOrderStatus === order.id}
                            className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Rejeter</span>
                          </button>
                        </>
                      )}
                      
                      {order.status === 'paid' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          disabled={updatingOrderStatus === order.id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Package className="w-4 h-4" />
                          <span>Commencer préparation</span>
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                          disabled={updatingOrderStatus === order.id}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Marquer comme prête</span>
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Admin Actions */}
                  {user?.role === 'admin' && (
                    <>
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleAssignDriver(order.id)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Assigner un livreur</span>
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Patient Actions */}
                  {user?.role === 'patient' && (
                    <>
                      {order.status === 'validated' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPaymentModal(true);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Payer maintenant</span>
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Common Actions */}
                  {order.status === 'in_transit' && (
                    <button 
                      onClick={() => handleTrackOrder(order.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Suivre sur la carte</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleContactPharmacy(order)}
                    className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter la pharmacie</span>
                  </button>
                  
                  {order.driverName && (
                    <button 
                      onClick={() => handleContactDriver(order)}
                      className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat avec {order.driverName}</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleViewOrder(order)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Détails</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <span className="text-xl font-bold text-gray-900">
                    {formatCFA(selectedOrder.total)}
                  </span>
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

      {/* Prescription Upload Modal */}
      {showPrescriptionModal && (
        <PrescriptionUploadModal 
          onClose={() => setShowPrescriptionModal(false)}
          onUploadComplete={handlePrescriptionUploaded}
          orderId={currentOrderId || undefined}
        />
      )}

      {/* Assign Driver Modal */}
      {showAssignDriverModal && (
        <OrderAssignDriverModal 
          orderId={currentOrderId || ''}
          onClose={() => setShowAssignDriverModal(false)}
          onAssign={handleDriverAssigned}
        />
      )}
    </div>
  );
};

export default OrdersPage;