import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Euro, 
  AlertCircle, 
  Pill, 
  CreditCard, 
  Check, 
  MessageCircle, 
  Phone, 
  X, 
  FileText,
  Eye,
  Download,
  Building2
} from 'lucide-react';
import apiService from '../../services/api';

const PharmacistDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les données en parallèle
      const [ordersData, medicinesData, pharmaciesData] = await Promise.all([
        apiService.getOrders(),
        apiService.getMedicines(),
        apiService.getPharmacies()
      ]);
      
      setOrders(ordersData);
      setMedicines(medicinesData);
      
      // Trouver la pharmacie de l'utilisateur connecté
      const userPharmacy = pharmaciesData.find((p: any) => p.ownerId === localStorage.getItem('userId'));
      setPharmacy(userPharmacy);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
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

  const handleOrderAction = async (orderId: string, status: string, rejectionReason?: string) => {
    try {
      await apiService.updateOrderStatus(orderId, status, rejectionReason);
      await loadData(); // Reload data
      
      if (status === 'rejected') {
        setShowRejectionModal(false);
        setRejectionReason('');
      }
      
      showSuccessNotification(`Commande ${getStatusText(status).toLowerCase()} avec succès`);
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    }
  };

  const handleValidatePayment = async (orderId: string) => {
    try {
      await apiService.validatePayment(orderId);
      await loadData(); // Reload data
      showSuccessNotification('Paiement validé avec succès!');
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    }
  };

  const handleContactPatient = (order: any) => {
    if (order.patientId && order.patientName) {
      navigate(`/chat?recipientId=${order.patientId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.patientName)}&recipientRole=patient`);
    }
  };

  const handleContactDriver = (order: any) => {
    if (order.driverId && order.driverName) {
      navigate(`/chat?recipientId=${order.driverId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.driverName)}&recipientRole=driver`);
    } else {
      showErrorNotification('Aucun livreur assigné pour cette commande');
    }
  };

  const handleCallPatient = (order: any) => {
    if (order.patientPhone) {
      window.location.href = `tel:${order.patientPhone}`;
    } else {
      showErrorNotification('Numéro de téléphone du patient non disponible');
    }
  };

  const handleViewPrescription = (prescriptionUrl: string, order: any) => {
    if (prescriptionUrl) {
      setSelectedPrescription(prescriptionUrl);
      setSelectedOrder(order);
      setShowPrescriptionModal(true);
    } else {
      showErrorNotification('Aucune ordonnance disponible pour cette commande');
    }
  };

  const handleRejectOrder = (order: any) => {
    setSelectedOrder(order);
    setShowRejectionModal(true);
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

  const lowStockMedicines = medicines.filter(med => med.quantity < 50);

  const stats = [
    {
      title: 'Commandes en attente',
      value: orders.filter(o => o.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Paiements reçus',
      value: orders.filter(o => o.status === 'paid').length,
      icon: CreditCard,
      color: 'bg-green-500',
    },
    {
      title: 'Revenus du jour',
      value: formatCFA(orders.filter(o => {
        const today = new Date().toDateString();
        return new Date(o.createdAt).toDateString() === today && o.status === 'delivered';
      }).reduce((sum, o) => sum + o.total, 0)),
      icon: Euro,
      color: 'bg-green-600',
    },
    {
      title: 'Stock faible',
      value: lowStockMedicines.length,
      icon: AlertCircle,
      color: 'bg-red-500',
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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord - Pharmacien</h1>
        <p className="text-gray-600">Gérez vos commandes et votre inventaire</p>
      </div>

      {/* Alerte de configuration de pharmacie */}
      {!pharmacy && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Configuration requise</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Vous n'avez pas encore configuré votre pharmacie. Configurez-la maintenant pour commencer à vendre des médicaments.</p>
                <button
                  onClick={() => navigate('/pharmacy')}
                  className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-2 inline-flex"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Configurer ma pharmacie</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Commandes à traiter</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {orders.filter(o => o.status === 'pending').slice(0, 5).map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">{order.items.length} articles</p>
                    <p className="text-sm text-gray-500">{order.patientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCFA(order.total)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items.map((item: any) => (
                    <div key={item.medicineId} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.medicineName} x{item.quantity}</span>
                      {item.requiresPrescription && (
                        <span className="text-red-600 text-xs flex items-center">
                          <FileText className="w-3 h-3 mr-1" />
                          Ordonnance requise
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ordonnance */}
                {order.prescriptionUrl ? (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-700">Ordonnance disponible</span>
                    </div>
                    <button
                      onClick={() => handleViewPrescription(order.prescriptionUrl, order)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Vérifier l'ordonnance
                    </button>
                  </div>
                ) : (
                  order.items.some((item: any) => item.requiresPrescription) && (
                    <div className="bg-red-50 rounded-lg p-3 mb-4 flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm text-red-700">
                        Ordonnance manquante pour médicament(s) sous prescription
                      </span>
                    </div>
                  )
                )}

                <div className="flex space-x-2 mb-3">
                  <button 
                    onClick={() => handleOrderAction(order.id, 'validated')}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Valider
                  </button>
                  <button 
                    onClick={() => handleRejectOrder(order)}
                    className="flex-1 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Rejeter
                  </button>
                </div>

                {/* Contact buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleContactPatient(order)}
                    className="flex-1 border border-blue-600 text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Chat
                  </button>
                  {order.patientPhone && (
                    <button 
                      onClick={() => handleCallPatient(order)}
                      className="border border-green-600 text-green-600 px-3 py-1 rounded text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center"
                    >
                      <Phone className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {orders.filter(o => o.status === 'pending').length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Aucune commande en attente
              </div>
            )}
          </div>
        </div>

        {/* Paid Orders - Waiting for validation */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Paiements reçus</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {orders.filter(o => o.status === 'paid').slice(0, 5).map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">{order.items.length} articles</p>
                    <p className="text-sm text-gray-500">{order.patientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCFA(order.total)} payé</p>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Paiement reçu
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 2).map((item: any) => (
                    <div key={item.medicineId} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.medicineName} x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-500">+{order.items.length - 2} autres articles</p>
                  )}
                </div>

                <button 
                  onClick={() => handleValidatePayment(order.id)}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mb-3"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider le paiement</span>
                </button>

                {/* Contact buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleContactPatient(order)}
                    className="flex-1 border border-blue-600 text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Patient
                  </button>
                  {order.driverName && (
                    <button 
                      onClick={() => handleContactDriver(order)}
                      className="flex-1 border border-purple-600 text-purple-600 px-3 py-1 rounded text-xs font-medium hover:bg-purple-50 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Livreur
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {orders.filter(o => o.status === 'paid').length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Aucun paiement en attente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockMedicines.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alertes de stock</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {lowStockMedicines.slice(0, 5).map((medicine) => (
              <div key={medicine.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{medicine.name}</p>
                      <p className="text-sm text-gray-600">{medicine.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">{medicine.quantity} restants</p>
                    <p className="text-xs text-gray-500">{formatCFA(medicine.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historique des commandes</h2>
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
                    <p className="text-sm text-gray-600">{order.patientName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCFA(order.total)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(order.status)}
                  </span>
                  
                  {/* Contact buttons for recent orders */}
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => handleContactPatient(order)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Patient
                    </button>
                    {order.driverName && (
                      <button
                        onClick={() => handleContactDriver(order)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Livreur
                      </button>
                    )}
                    {order.prescriptionUrl && (
                      <button
                        onClick={() => handleViewPrescription(order.prescriptionUrl, order)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Ordonnance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPrescription && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Vérification d'ordonnance - Commande #{selectedOrder.id.slice(-6).toUpperCase()}
              </h3>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setSelectedPrescription(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Ordonnance</h4>
                <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center">
                  {selectedPrescription.endsWith('.pdf') ? (
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-700">Document PDF</p>
                      <a 
                        href={selectedPrescription} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                      >
                        Ouvrir le document
                      </a>
                    </div>
                  ) : (
                    <img 
                      src={selectedPrescription} 
                      alt="Ordonnance" 
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => window.open(selectedPrescription || '', '_blank')}
                    className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Agrandir
                  </button>
                  <a
                    href={selectedPrescription || ''}
                    download
                    className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Détails de la commande</h4>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-medium text-gray-900">{selectedOrder.patientName}</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Médicaments sous ordonnance</p>
                    <ul className="mt-1 space-y-2">
                      {selectedOrder.items
                        .filter((item: any) => item.requiresPrescription)
                        .map((item: any) => (
                          <li key={item.medicineId} className="flex items-center text-sm">
                            <FileText className="w-4 h-4 text-red-600 mr-2" />
                            <span>{item.medicineName} x{item.quantity}</span>
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Date de commande</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')} à {' '}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleOrderAction(selectedOrder.id, 'validated');
                      setShowPrescriptionModal(false);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Valider l'ordonnance et la commande
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setShowRejectionModal(true);
                    }}
                    className="w-full border border-red-300 text-red-700 px-4 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Rejeter l'ordonnance
                  </button>
                  
                  <button
                    onClick={() => handleContactPatient(selectedOrder)}
                    className="w-full border border-blue-300 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contacter le patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Rejeter la commande
              </h3>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Veuillez indiquer la raison du rejet de cette commande. Cette information sera communiquée au patient.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Ex: Ordonnance expirée, médicament non disponible, etc."
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleOrderAction(selectedOrder.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard;