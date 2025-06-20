import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Package, 
  Truck, 
  User, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Calendar, 
  ArrowLeft,
  RefreshCw,
  Eye,
  Download,
  FileText,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MessageCircle,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Composant pour le graphique circulaire
const PieChartComponent: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {data.map((item, index) => {
          const startPercent = cumulativePercent;
          const percent = total === 0 ? 0 : (item.value / total) * 100;
          cumulativePercent += percent;
          
          // Calcul des coordonnées pour le tracé de l'arc
          const startX = 50 + 40 * Math.cos(2 * Math.PI * startPercent / 100);
          const startY = 50 + 40 * Math.sin(2 * Math.PI * startPercent / 100);
          const endX = 50 + 40 * Math.cos(2 * Math.PI * cumulativePercent / 100);
          const endY = 50 + 40 * Math.sin(2 * Math.PI * cumulativePercent / 100);
          
          // Déterminer si l'arc est grand (plus de 180 degrés)
          const largeArcFlag = percent > 50 ? 1 : 0;
          
          // Créer le chemin d'arc
          const pathData = [
            `M 50 50`,
            `L ${startX} ${startY}`,
            `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ');
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="#fff"
              strokeWidth="0.5"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      
      {/* Légende */}
      <div className="absolute top-full mt-4 left-0 right-0">
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
              <span className="text-xs text-gray-700">{item.label} ({item.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('csv');
  
  // Référence pour le téléchargement
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Dans une vraie implémentation, il faudrait un endpoint API dédié pour les admins
      // Ici on utilise l'endpoint standard
      const ordersData = await apiService.getOrders();
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
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

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleDownloadOrders = () => {
    setShowDownloadOptions(true);
  };

  const downloadOrdersList = (format: string, orderList: any[] = filteredOrders) => {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (format === 'csv') {
      // Générer le contenu CSV
      const headers = ['ID', 'Patient', 'Pharmacie', 'Livreur', 'Total', 'Statut', 'Date de création', 'Date de livraison'];
      content = headers.join(',') + '\n';
      
      orderList.forEach(order => {
        const row = [
          order.id,
          `"${order.patientName}"`,
          `"${order.pharmacyName}"`,
          `"${order.driverName || 'Non assigné'}"`,
          convertToCFA(order.total),
          `"${getStatusText(order.status)}"`,
          `"${new Date(order.createdAt).toLocaleDateString('fr-FR')}"`,
          `"${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('fr-FR') : 'Non livrée'}"`,
        ];
        content += row.join(',') + '\n';
      });
      
      filename = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      // Générer le contenu JSON
      const jsonData = orderList.map(order => ({
        id: order.id,
        patientName: order.patientName,
        pharmacyName: order.pharmacyName,
        driverName: order.driverName,
        total: order.total,
        status: order.status,
        items: order.items,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt
      }));
      
      content = JSON.stringify(jsonData, null, 2);
      filename = `commandes_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }
    
    // Créer un blob et déclencher le téléchargement
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = filename;
      downloadLinkRef.current.click();
      
      // Nettoyer l'URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    setShowDownloadOptions(false);
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.patientName && order.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.pharmacyName && order.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    let matchesDateRange = true;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    
    if (selectedDateRange === 'today') {
      matchesDateRange = orderDate.toDateString() === now.toDateString();
    } else if (selectedDateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesDateRange = orderDate >= weekAgo;
    } else if (selectedDateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      matchesDateRange = orderDate >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Données pour les graphiques
  const statusData = [
    { label: 'En attente', value: orders.filter(o => o.status === 'pending').length, color: '#F59E0B' },
    { label: 'Validées', value: orders.filter(o => o.status === 'validated').length, color: '#3B82F6' },
    { label: 'Payées', value: orders.filter(o => o.status === 'paid').length, color: '#8B5CF6' },
    { label: 'En préparation', value: orders.filter(o => o.status === 'preparing').length, color: '#EC4899' },
    { label: 'Prêtes', value: orders.filter(o => o.status === 'ready').length, color: '#10B981' },
    { label: 'En livraison', value: orders.filter(o => o.status === 'in_transit').length, color: '#6366F1' },
    { label: 'Livrées', value: orders.filter(o => o.status === 'delivered').length, color: '#059669' },
    { label: 'Rejetées', value: orders.filter(o => o.status === 'rejected').length, color: '#EF4444' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'validated': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      case 'preparing': return 'bg-pink-100 text-pink-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
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
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'validated': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'paid': return <CreditCard className="w-5 h-5 text-purple-600" />;
      case 'preparing': return <Package className="w-5 h-5 text-pink-600" />;
      case 'ready': return <Package className="w-5 h-5 text-green-600" />;
      case 'in_transit': return <Truck className="w-5 h-5 text-indigo-600" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-gray-600" />;
      default: return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  // Calcul des statistiques
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalDeliveredRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Obtenir la date d'il y a 30 jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Commandes des 30 derniers jours
  const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  const recentRevenue = recentOrders.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showOrderDetails && selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowOrderDetails(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détails de la commande</h1>
            <p className="text-gray-600">Commande #{selectedOrder.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: getStatusColor(selectedOrder.status).split(' ')[0] }}>
                  {getStatusIcon(selectedOrder.status)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Commande #{selectedOrder.id.slice(-6).toUpperCase()}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')} à {new Date(selectedOrder.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadOrdersList('json', [selectedOrder])}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Informations patient</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedOrder.patientName}</p>
                      <p className="text-xs text-gray-600">Patient</p>
                    </div>
                  </div>
                  {selectedOrder.patientPhone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="text-sm text-gray-900">{selectedOrder.patientPhone}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.postalCode} {selectedOrder.deliveryAddress.city}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/chat?recipientId=${selectedOrder.patientId}&recipientName=${encodeURIComponent(selectedOrder.patientName)}&recipientRole=patient`)}
                    className="mt-2 w-full bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Informations pharmacie</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedOrder.pharmacyName}</p>
                      <p className="text-xs text-gray-600">Pharmacie</p>
                    </div>
                  </div>
                  {selectedOrder.pharmacyPhone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="text-sm text-gray-900">{selectedOrder.pharmacyPhone}</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/chat?recipientId=${selectedOrder.pharmacyId}&recipientName=${encodeURIComponent(selectedOrder.pharmacyName)}&recipientRole=pharmacist`)}
                    className="mt-2 w-full bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Informations livreur</h3>
                {selectedOrder.driverName ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Truck className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedOrder.driverName}</p>
                        <p className="text-xs text-gray-600">Livreur</p>
                      </div>
                    </div>
                    {selectedOrder.driverPhone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-sm text-gray-900">{selectedOrder.driverPhone}</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/chat?recipientId=${selectedOrder.driverId}&recipientName=${encodeURIComponent(selectedOrder.driverName)}&recipientRole=driver`)}
                      className="mt-2 w-full bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contacter</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24">
                    <p className="text-sm text-gray-500">Aucun livreur assigné</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Articles commandés</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {selectedOrder.items.map((item: any, index: number) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.medicineName}</p>
                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                        {item.requiresPrescription && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Ordonnance requise
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCFA(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-600">{formatCFA(item.price)} / unité</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">{formatCFA(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {selectedOrder.trackingInfo && selectedOrder.trackingInfo.updates && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Historique de suivi</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {selectedOrder.trackingInfo.updates.map((update: any, index: number) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{update.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(update.timestamp).toLocaleString('fr-FR')}
                          </p>
                          {update.location && (
                            <p className="text-xs text-blue-600 mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              Position enregistrée
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600">Supervision de toutes les commandes de la plateforme</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadOrders}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCFA(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">{formatCFA(averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => ['pending', 'validated', 'paid', 'preparing', 'ready', 'in_transit'].includes(o.status)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-600" />
            Répartition par statut
          </h2>
          <PieChartComponent data={statusData} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-green-600" />
            Statistiques des 30 derniers jours
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Commandes</span>
                <span className="text-lg font-bold text-gray-900">{recentOrders.length}</span>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">+{Math.round((recentOrders.length / orders.length) * 100)}%</span>
                <span className="text-gray-500 ml-2">vs période précédente</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Chiffre d'affaires</span>
                <span className="text-lg font-bold text-gray-900">{formatCFA(recentRevenue)}</span>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">+{Math.round((recentRevenue / totalRevenue) * 100)}%</span>
                <span className="text-gray-500 ml-2">vs période précédente</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Taux de livraison</span>
                <span className="text-lg font-bold text-gray-900">
                  {orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">+5%</span>
                <span className="text-gray-500 ml-2">vs période précédente</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Commandes annulées</span>
                <span className="text-lg font-bold text-gray-900">
                  {orders.filter(o => o.status === 'rejected' || o.status === 'cancelled').length}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-red-600">-2%</span>
                <span className="text-gray-500 ml-2">vs période précédente</span>
              </div>
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
              placeholder="Rechercher une commande..."
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
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="validated">Validées</option>
              <option value="paid">Payées</option>
              <option value="preparing">En préparation</option>
              <option value="ready">Prêtes</option>
              <option value="in_transit">En livraison</option>
              <option value="delivered">Livrées</option>
              <option value="rejected">Rejetées</option>
              <option value="cancelled">Annulées</option>
            </select>
            
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des commandes ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livreur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: getStatusColor(order.status).split(' ')[0] }}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(-6).toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items.length} article(s)
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.patientName}</div>
                      <div className="text-xs text-gray-500">Patient</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.pharmacyName}</div>
                      <div className="text-xs text-gray-500">Pharmacie</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.driverName ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.driverName}</div>
                          <div className="text-xs text-gray-500">Livreur</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCFA(order.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lien de téléchargement caché */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      {/* Modal d'options de téléchargement */}
      {showDownloadOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Exporter les commandes</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-700">
                Choisissez le format d'exportation et les commandes à inclure :
              </p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={downloadFormat === 'csv'}
                    onChange={() => setDownloadFormat('csv')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-900">CSV (Excel, LibreOffice Calc)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={downloadFormat === 'json'}
                    onChange={() => setDownloadFormat('json')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-900">JSON (Développeurs)</span>
                </label>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Commandes à exporter :</h4>
                
                <div className="space-y-2">
                  <button
                    onClick={() => downloadOrdersList(downloadFormat, filteredOrders)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Commandes filtrées</div>
                    <div className="text-sm text-gray-600">{filteredOrders.length} commande(s) correspondant aux filtres actuels</div>
                  </button>
                  
                  <button
                    onClick={() => downloadOrdersList(downloadFormat, orders.filter(o => o.status === 'delivered'))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Commandes livrées</div>
                    <div className="text-sm text-gray-600">{orders.filter(o => o.status === 'delivered').length} commande(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadOrdersList(downloadFormat, orders.filter(o => ['pending', 'validated', 'paid', 'preparing', 'ready', 'in_transit'].includes(o.status)))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Commandes en cours</div>
                    <div className="text-sm text-gray-600">{orders.filter(o => ['pending', 'validated', 'paid', 'preparing', 'ready', 'in_transit'].includes(o.status)).length} commande(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadOrdersList(downloadFormat, orders)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Toutes les commandes</div>
                    <div className="text-sm text-gray-600">{orders.length} commande(s) au total</div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowDownloadOptions(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

export default OrdersPage;