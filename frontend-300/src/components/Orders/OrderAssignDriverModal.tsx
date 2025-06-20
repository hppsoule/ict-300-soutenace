import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Truck, User, MapPin, Phone, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import apiService from '../../services/api';

interface OrderAssignDriverModalProps {
  orderId: string;
  onClose: () => void;
  onAssign: (driverId: string) => void;
}

const OrderAssignDriverModal: React.FC<OrderAssignDriverModalProps> = ({ 
  orderId, 
  onClose, 
  onAssign 
}) => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [notifyingAll, setNotifyingAll] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Utiliser l'API pour obtenir les livreurs disponibles
      const availableDrivers = await apiService.getAvailableDrivers();
      setDrivers(availableDrivers);
    } catch (err: any) {
      console.error('Erreur chargement livreurs:', err);
      setError(err.message || 'Erreur lors du chargement des livreurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) return;
    
    try {
      setAssigning(true);
      await apiService.assignDriver(orderId, selectedDriver);
      onAssign(selectedDriver);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'assignation du livreur');
    } finally {
      setAssigning(false);
    }
  };

  const handleNotifyAllDrivers = async () => {
    try {
      setNotifyingAll(true);
      // Mettre à jour le statut de la commande à "ready" sans assigner de livreur
      await apiService.updateOrderStatus(orderId, 'ready');
      onClose();
      // Afficher un message de succès
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out';
      toast.textContent = 'Tous les livreurs disponibles ont été notifiés';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la notification des livreurs');
    } finally {
      setNotifyingAll(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Assigner un livreur</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un livreur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button 
                    onClick={loadDrivers}
                    className="mt-2 text-sm text-red-700 font-medium"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notify all drivers option */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Notifier tous les livreurs</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Tous les livreurs disponibles seront notifiés de cette commande et pourront l'accepter.
                </p>
                <button
                  onClick={handleNotifyAllDrivers}
                  disabled={notifyingAll}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {notifyingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Notification en cours...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      <span>Notifier tous les livreurs</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4 border-b border-gray-200 pb-4">
            <h3 className="text-sm font-medium text-gray-700">Ou assigner un livreur spécifique</h3>
          </div>

          {/* Drivers list */}
          <div className="max-h-80 overflow-y-auto mb-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun livreur disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm ? 'Essayez un autre terme de recherche' : 'Aucun livreur actif trouvé'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDriver === driver.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {driver.name}
                        </div>
                        <div className="text-sm text-gray-600">Livreur</div>
                      </div>
                      {selectedDriver === driver.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAssignDriver}
              disabled={!selectedDriver || assigning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Assignation...</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  <span>Assigner</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAssignDriverModal;