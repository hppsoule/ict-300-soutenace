import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Edit, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Pill,
  Users,
  Star,
  Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import PharmacyForm from '../../components/Pharmacy/PharmacyForm';

const PharmacyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (user?.role !== 'pharmacist') {
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les pharmacies de l'utilisateur
      const pharmacies = await apiService.getPharmacies();
      const userPharmacy = pharmacies.find((p: any) => p.ownerId === user?.id);
      
      if (userPharmacy) {
        setPharmacy(userPharmacy);
        
        // Charger les statistiques
        const [medicines, orders] = await Promise.all([
          apiService.getPharmacistMedicines(),
          apiService.getOrders()
        ]);
        
        const pharmacyOrders = orders.filter((o: any) => o.pharmacyId === userPharmacy.id);
        
        setStats({
          totalMedicines: medicines.length,
          totalOrders: pharmacyOrders.length,
          pendingOrders: pharmacyOrders.filter((o: any) => o.status === 'pending').length,
          totalRevenue: pharmacyOrders
            .filter((o: any) => o.status === 'delivered')
            .reduce((sum: number, o: any) => sum + o.total, 0)
        });
      }
      
      setError('');
    } catch (err: any) {
      console.error('Error loading pharmacy data:', err);
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

  const handleUpdatePharmacy = async (pharmacyData: any) => {
    try {
      if (pharmacy) {
        await apiService.updatePharmacy(pharmacy.id, pharmacyData);
        setIsEditing(false);
        await loadData();
        alert('Pharmacie mise à jour avec succès!');
      } else {
        await apiService.createPharmacy(pharmacyData);
        await loadData();
        alert('Pharmacie créée avec succès!');
      }
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isEditing || !pharmacy) {
    return (
      <PharmacyForm
        pharmacy={pharmacy}
        onSubmit={handleUpdatePharmacy}
        onCancel={() => {
          if (pharmacy) {
            setIsEditing(false);
          } else {
            navigate('/dashboard');
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma Pharmacie</h1>
          <p className="text-gray-600">Gérez les informations de votre pharmacie</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Médicaments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMedicines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus</p>
              <p className="text-2xl font-bold text-gray-900">{formatCFA(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations de la pharmacie */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                {pharmacy.imageUrl ? (
                  <img 
                    src={pharmacy.imageUrl} 
                    alt={pharmacy.name} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{pharmacy.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {pharmacy.isOpen ? 'Ouverte' : 'Fermée'}
                  </span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-600 ml-1">{pharmacy.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                Approuvée
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">
                      {pharmacy.address.street}, {pharmacy.address.postalCode} {pharmacy.address.city}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{pharmacy.phone}</p>
                  </div>
                  <div className="flex items-center mt-1">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{pharmacy.email}</p>
                  </div>
                </div>
                {pharmacy.licenseNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Licence</p>
                    <p className="text-gray-900 mt-1">{pharmacy.licenseNumber}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Horaires d'ouverture</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {pharmacy.openingHours && pharmacy.openingHours.length > 0 ? (
                  <div className="space-y-2">
                    {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, index) => {
                      const dayHours = pharmacy.openingHours.find((h: any) => h.day === index);
                      return (
                        <div key={day} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{day}</span>
                          <span className="text-sm text-gray-600">
                            {dayHours ? (
                              dayHours.isClosed ? 'Fermé' : `${dayHours.openTime} - ${dayHours.closeTime}`
                            ) : 'Non renseigné'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-2">Horaires non disponibles</p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations supplémentaires</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Date de création</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">
                        {new Date(pharmacy.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dernière mise à jour</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">
                        {new Date(pharmacy.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/medicines')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les médicaments</p>
                <p className="text-sm text-gray-600">{stats.totalMedicines} médicaments</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/orders')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les commandes</p>
                <p className="text-sm text-gray-600">{stats.pendingOrders} en attente</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setIsEditing(true)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <Edit className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Modifier la pharmacie</p>
                <p className="text-sm text-gray-600">Mettre à jour les informations</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyManagementPage;