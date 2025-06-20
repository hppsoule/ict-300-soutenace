import React, { useState } from 'react';
import { ArrowLeft, Package, Truck, MapPin, Clock, MessageCircle, Phone, Navigation, CheckCircle, AlertCircle, Eye, Download, UserPlus } from 'lucide-react';
import { Order } from '../../types';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import OrderAssignDriverModal from './OrderAssignDriverModal';

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
  onContactDriver?: (driverId: string, driverName: string) => void;
  onContactPharmacy?: (pharmacyId: string, pharmacyName: string) => void;
  onContactPatient?: (patientId: string, patientName: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ 
  order, 
  onBack,
  onContactDriver,
  onContactPharmacy,
  onContactPatient
}) => {
  const { user } = useAuth();
  const [viewingPrescription, setViewingPrescription] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const handleOpenGPS = () => {
    if (order.deliveryAddress) {
      const address = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`;
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  const handleViewPrescription = () => {
    if (order.prescriptionUrl) {
      setViewingPrescription(true);
    }
  };

  const handleDownloadPrescription = () => {
    if (order.prescriptionUrl) {
      window.open(order.prescriptionUrl, '_blank');
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    try {
      await apiService.assignDriver(order.id, driverId);
      // Recharger la page ou mettre à jour l'état
      window.location.reload();
    } catch (err: any) {
      alert('Erreur lors de l\'assignation du livreur: ' + err.message);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setUpdatingStatus(true);
      await apiService.updateOrderStatus(order.id, status);
      // Recharger la page ou mettre à jour l'état
      window.location.reload();
    } catch (err: any) {
      alert('Erreur lors de la mise à jour du statut: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Détails de la commande</h1>
          <p className="text-gray-600">Commande #{order.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: getStatusColor(order.status).split(' ')[0] }}>
                {order.status === 'in_transit' ? (
                  <Truck className="w-6 h-6 text-blue-600" />
                ) : order.status === 'delivered' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Package className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Commande #{order.id.slice(-6).toUpperCase()}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
            
            {order.prescriptionUrl && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleViewPrescription}
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Voir ordonnance</span>
                </button>
                <button
                  onClick={handleDownloadPrescription}
                  className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informations de livraison</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.deliveryAddress.street}</p>
                    <p className="text-xs text-gray-600">{order.deliveryAddress.postalCode} {order.deliveryAddress.city}</p>
                  </div>
                </div>
                {order.status === 'in_transit' && (
                  <button
                    onClick={handleOpenGPS}
                    className="mt-2 w-full bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Ouvrir dans GPS</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informations pharmacie</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.pharmacyName}</p>
                    <p className="text-xs text-gray-600">Pharmacie</p>
                  </div>
                </div>
                {onContactPharmacy && (
                  <button
                    onClick={() => onContactPharmacy(order.pharmacyId, order.pharmacyName || 'Pharmacie')}
                    className="mt-2 w-full bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                {user?.role === 'pharmacist' ? 'Informations patient' : 'Informations livreur'}
              </h3>
              {user?.role === 'pharmacist' ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.patientName}</p>
                      <p className="text-xs text-gray-600">Patient</p>
                    </div>
                  </div>
                  {onContactPatient && (
                    <button
                      onClick={() => onContactPatient(order.patientId, order.patientName)}
                      className="mt-2 w-full bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contacter</span>
                    </button>
                  )}
                </div>
              ) : order.driverName ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.driverName}</p>
                      <p className="text-xs text-gray-600">Livreur</p>
                    </div>
                  </div>
                  {onContactDriver && (
                    <button
                      onClick={() => onContactDriver(order.driverId || '', order.driverName || 'Livreur')}
                      className="mt-2 w-full bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contacter</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <p className="text-sm text-gray-500">Aucun livreur assigné</p>
                  {user?.role === 'pharmacist' && order.status === 'ready' && (
                    <button
                      onClick={() => setShowAssignDriverModal(true)}
                      className="ml-3 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Assigner</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {order.status === 'rejected' && order.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Commande rejetée</h3>
                  <p className="text-sm text-red-700 mt-1">{order.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions pour le pharmacien */}
          {user?.role === 'pharmacist' && ['pending', 'paid', 'preparing'].includes(order.status) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-3">Actions disponibles</h3>
              <div className="flex flex-wrap gap-3">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('validated')}
                      disabled={updatingStatus}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Valider la commande</span>
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Raison du rejet:');
                        if (reason) {
                          handleUpdateStatus('rejected');
                        }
                      }}
                      disabled={updatingStatus}
                      className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Rejeter</span>
                    </button>
                  </>
                )}
                
                {order.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus('preparing')}
                    disabled={updatingStatus}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Package className="w-4 h-4" />
                    <span>Commencer la préparation</span>
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus('ready')}
                    disabled={updatingStatus}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Marquer comme prête</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions pour le livreur */}
          {user?.role === 'driver' && ['ready', 'in_transit'].includes(order.status) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-3">Actions disponibles</h3>
              <div className="flex flex-wrap gap-3">
                {order.status === 'ready' && !order.driverId && (
                  <button
                    onClick={() => handleUpdateStatus('in_transit')}
                    disabled={updatingStatus}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Prendre en charge la livraison</span>
                  </button>
                )}
                
                {order.status === 'in_transit' && order.driverId === user.id && (
                  <>
                    <button
                      onClick={handleOpenGPS}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Naviguer vers l'adresse</span>
                    </button>
                    
                    <button
                      onClick={() => handleUpdateStatus('delivered')}
                      disabled={updatingStatus}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Marquer comme livrée</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Articles commandés</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
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
                <span className="text-xl font-bold text-blue-600">{formatCFA(order.total)}</span>
              </div>
            </div>
          </div>

          {order.trackingInfo && order.trackingInfo.updates && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Historique de suivi</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {order.trackingInfo.updates.map((update, index) => (
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

      {/* Prescription Viewer Modal */}
      {viewingPrescription && order.prescriptionUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Ordonnance</h3>
              <button
                onClick={() => setViewingPrescription(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <img 
                src={order.prescriptionUrl} 
                alt="Ordonnance" 
                className="max-w-full h-auto mx-auto"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleDownloadPrescription}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignDriverModal && (
        <OrderAssignDriverModal
          order={order}
          onClose={() => setShowAssignDriverModal(false)}
          onAssignDriver={handleAssignDriver}
        />
      )}
    </div>
  );
};

export default OrderDetails;