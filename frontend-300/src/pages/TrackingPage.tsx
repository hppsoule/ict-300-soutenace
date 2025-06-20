import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Package, Truck, MapPin, Clock, MessageCircle, Phone, Navigation, ArrowLeft, User, CheckSquare } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icon
const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="32" height="32">
      <path d="M19 7h-3V6a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom destination icon
const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const TrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, socket } = useAuth();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driverPosition, setDriverPosition] = useState({ lat: 48.8606, lng: 2.3376 });
  const [completingDelivery, setCompletingDelivery] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    } else {
      loadActiveOrder();
    }
  }, [orderId]);

  // Listen for real-time driver location updates
  useEffect(() => {
    if (socket && order) {
      socket.on('driver_location_update', (data: any) => {
        if (data.orderId === order.id) {
          setDriverPosition(data.driverLocation);
        }
      });

      return () => {
        socket.off('driver_location_update');
      };
    }
  }, [socket, order]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await apiService.getOrderById(orderId!);
      setOrder(orderData);
      
      // Set initial driver position if available
      if (orderData.trackingInfo?.updates) {
        const lastUpdate = orderData.trackingInfo.updates.find((u: any) => u.location);
        if (lastUpdate?.location) {
          setDriverPosition(lastUpdate.location);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrder = async () => {
    try {
      setLoading(true);
      const orders = await apiService.getOrders();
      const activeOrder = orders.find((o: any) => ['validated', 'paid', 'preparing', 'ready', 'in_transit'].includes(o.status));
      
      if (activeOrder) {
        const orderDetails = await apiService.getOrderById(activeOrder.id);
        setOrder(orderDetails);
      } else {
        setError('Aucune commande active trouvée');
      }
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

  const handleContactPatient = () => {
    if (order?.patientId) {
      navigate(`/chat?recipientId=${order.patientId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.patientName)}&recipientRole=patient`);
    }
  };

  const handleContactPharmacy = () => {
    if (order?.pharmacyId) {
      // Récupérer l'ID du propriétaire de la pharmacie
      navigate(`/chat?recipientId=${order.pharmacyOwnerId || order.pharmacyId}&orderId=${order.id}&recipientName=${encodeURIComponent(order.pharmacyName)}&recipientRole=pharmacist`);
    }
  };

  const handleCallPatient = () => {
    if (order?.patientPhone) {
      window.open(`tel:${order.patientPhone}`, '_self');
    } else {
      alert('Numéro de téléphone du patient non disponible');
    }
  };

  const handleOpenGPS = () => {
    if (order?.deliveryAddress) {
      const address = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`;
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  const handleCompleteDelivery = async () => {
    if (!order || completingDelivery) return;
    
    const notes = prompt('Notes de livraison (optionnel):');
    if (notes === null) return;
    
    try {
      setCompletingDelivery(true);
      await apiService.completeDelivery(order.id, { deliveryNotes: notes || '' });
      
      // Recharger les données
      await loadOrderDetails();
      
      alert('Livraison terminée avec succès!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erreur finalisation livraison:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setCompletingDelivery(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suivi de livraison</h1>
            <p className="text-gray-600">Aucune livraison en cours</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Aucune commande en cours'}
          </h3>
          <p className="text-gray-600">Vos livraisons apparaîtront ici une fois qu'elles seront en route</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const destination = order.deliveryAddress.coordinates || { lat: 48.8566, lng: 2.3522 };
  const route = [
    [driverPosition.lat, driverPosition.lng],
    [destination.lat, destination.lng]
  ] as [number, number][];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-indigo-100 text-indigo-800';
      case 'validated': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'validated': return 'Validée';
      case 'paid': return 'Payée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'in_transit': return 'En livraison';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'driver' ? 'Livraison en cours' : 'Suivi de livraison'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'driver' ? 'Gérez votre livraison' : 'Suivez votre commande en temps réel'}
          </p>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Commande #{order.id.slice(-6).toUpperCase()}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Articles</p>
              <p className="font-medium text-gray-900">{order.items.length} produits</p>
              <p className="text-sm text-gray-500">{formatCFA(order.total)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {user?.role === 'driver' ? 'Patient' : 'Livreur'}
              </p>
              <p className="font-medium text-gray-900">
                {user?.role === 'driver' ? order.patientName : (order.driverName || 'En cours d\'assignation')}
              </p>
              <p className="text-sm text-gray-500">{order.pharmacyName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Arrivée estimée</p>
              <p className="font-medium text-gray-900">
                {order.estimatedDelivery 
                  ? new Date(order.estimatedDelivery).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : 'Calcul en cours...'
                }
              </p>
              <p className="text-sm text-gray-500">
                <MapPin className="w-3 h-3 inline mr-1" />
                {order.deliveryAddress.street}
              </p>
            </div>
          </div>
        </div>

        {/* Adresse complète du patient pour le livreur */}
        {user?.role === 'driver' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">📍 Adresse de livraison</h3>
            <div className="space-y-1 text-blue-800">
              <p><strong>Patient:</strong> {order.patientName}</p>
              <p><strong>Adresse:</strong> {order.deliveryAddress.street}</p>
              <p><strong>Ville:</strong> {order.deliveryAddress.city} {order.deliveryAddress.postalCode}</p>
              <p><strong>Pays:</strong> {order.deliveryAddress.country}</p>
              {order.patientPhone && (
                <p><strong>Téléphone:</strong> {order.patientPhone}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {order.status === 'in_transit' && (
            <button 
              onClick={handleOpenGPS}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Ouvrir dans GPS</span>
            </button>
          )}
          
          {user?.role === 'driver' ? (
            <>
              <button 
                onClick={handleContactPatient}
                className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Patient</span>
              </button>
              
              <button 
                onClick={handleContactPharmacy}
                className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Pharmacie</span>
              </button>
              
              {order.patientPhone && (
                <button 
                  onClick={handleCallPatient}
                  className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appeler Patient</span>
                </button>
              )}
              
              {order.status === 'in_transit' && (
                <button 
                  onClick={handleCompleteDelivery}
                  disabled={completingDelivery}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completingDelivery ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckSquare className="w-4 h-4" />
                  )}
                  <span>Marquer comme livrée</span>
                </button>
              )}
            </>
          ) : (
            <>
              {order.driverName && (
                <>
                  <button 
                    onClick={handleContactPatient}
                    className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter {order.driverName}</span>
                  </button>
                  
                  {order.driverPhone && (
                    <button 
                      onClick={handleCallPatient}
                      className="border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center space-x-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Appeler</span>
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Map */}
      {order.status === 'in_transit' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Localisation en temps réel</h3>
            <p className="text-sm text-gray-600">Position mise à jour automatiquement</p>
          </div>
          <div className="h-96">
            <MapContainer
              center={[driverPosition.lat, driverPosition.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Driver Position */}
              <Marker position={[driverPosition.lat, driverPosition.lng]} icon={driverIcon}>
                <Popup>
                  <div className="text-center p-2">
                    <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium">{order.driverName || 'Livreur'}</p>
                    <p className="text-sm text-gray-600">
                      {user?.role === 'driver' ? 'Votre position' : 'Votre livreur'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Position mise à jour il y a quelques secondes
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Destination */}
              <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                <Popup>
                  <div className="text-center p-2">
                    <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="font-medium">
                      {user?.role === 'driver' ? 'Destination' : 'Votre adresse'}
                    </p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress.street}</p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress.city}</p>
                    {user?.role === 'driver' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Patient: {order.patientName}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Route */}
              <Polyline
                positions={route}
                color="#3B82F6"
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            </MapContainer>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Détails de la commande</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.medicineName}</p>
                    <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                    {item.requiresPrescription && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
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
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-blue-600">{formatCFA(order.total)}</span>
            </div>
            {user?.role === 'driver' && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Frais de livraison</span>
                <span className="text-sm font-medium text-green-600">+{formatCFA(5.00)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Updates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historique de livraison</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {order.trackingInfo?.updates.map((update: any, index: number) => (
              <div key={update.timestamp} className="flex items-start space-x-4">
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
    </div>
  );
};

export default TrackingPage;