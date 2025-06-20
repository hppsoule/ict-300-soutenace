import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowLeft,
  RefreshCw,
  Calendar,
  User,
  PieChart,
  BarChart,
  Plus,
  Star,
  Download,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Composant pour le graphique à barres
const BarChartComponent: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full" 
              style={{ 
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color 
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PharmaciesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showPharmacyDetails, setShowPharmacyDetails] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pharmacyToDelete, setPharmacyToDelete] = useState<any>(null);
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
      const pharmaciesData = await apiService.getPharmacies();
      setPharmacies(pharmaciesData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPharmacy = (pharmacy: any) => {
    setSelectedPharmacy(pharmacy);
    setShowPharmacyDetails(true);
  };

  const handleApprovePharmacy = async (pharmacyId: string) => {
    try {
      // Simuler l'approbation d'une pharmacie
      // Dans une vraie implémentation, il faudrait un endpoint API dédié
      await apiService.updatePharmacy(pharmacyId, { isApproved: true });
      await loadData();
      showSuccessNotification('Pharmacie approuvée avec succès');
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    }
  };

  const handleDeletePharmacy = (pharmacy: any) => {
    setPharmacyToDelete(pharmacy);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePharmacy = async () => {
    if (!pharmacyToDelete) return;
    
    try {
      // Dans une vraie implémentation, il faudrait un endpoint API dédié
      // Ici on simule la suppression
      await apiService.updatePharmacy(pharmacyToDelete.id, { isApproved: false, isOpen: false });
      await loadData();
      showSuccessNotification('Pharmacie supprimée avec succès');
      setShowDeleteConfirm(false);
      setPharmacyToDelete(null);
      
      // Si la pharmacie supprimée est celle qu'on visualise, revenir à la liste
      if (selectedPharmacy && selectedPharmacy.id === pharmacyToDelete.id) {
        setShowPharmacyDetails(false);
        setSelectedPharmacy(null);
      }
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    }
  };

  const handleDownloadPharmacies = () => {
    setShowDownloadOptions(true);
  };

  const downloadPharmaciesList = (format: string, pharmacyList: any[] = filteredPharmacies) => {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (format === 'csv') {
      // Générer le contenu CSV
      const headers = ['ID', 'Nom', 'Propriétaire', 'Adresse', 'Ville', 'Code Postal', 'Téléphone', 'Email', 'Statut', 'Note'];
      content = headers.join(',') + '\n';
      
      pharmacyList.forEach(pharmacy => {
        const row = [
          pharmacy.id,
          `"${pharmacy.name}"`,
          `"${pharmacy.ownerName}"`,
          `"${pharmacy.address.street}"`,
          `"${pharmacy.address.city}"`,
          `"${pharmacy.address.postalCode}"`,
          `"${pharmacy.phone}"`,
          `"${pharmacy.email}"`,
          `"${pharmacy.isApproved ? 'Approuvée' : 'En attente'}"`,
          pharmacy.rating
        ];
        content += row.join(',') + '\n';
      });
      
      filename = `pharmacies_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      // Générer le contenu JSON
      const jsonData = pharmacyList.map(pharmacy => ({
        id: pharmacy.id,
        name: pharmacy.name,
        owner: pharmacy.ownerName,
        address: pharmacy.address,
        phone: pharmacy.phone,
        email: pharmacy.email,
        isApproved: pharmacy.isApproved,
        isOpen: pharmacy.isOpen,
        rating: pharmacy.rating,
        createdAt: pharmacy.createdAt
      }));
      
      content = JSON.stringify(jsonData, null, 2);
      filename = `pharmacies_${new Date().toISOString().split('T')[0]}.json`;
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

  // Extraire les villes uniques pour le filtre
  const cities = Array.from(new Set(pharmacies.map(p => p.address.city)));

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch = 
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || pharmacy.address.city === selectedCity;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'approved' && pharmacy.isApproved) || 
      (selectedStatus === 'pending' && !pharmacy.isApproved);
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  // Données pour les graphiques
  const cityData = cities.map(city => ({
    label: city,
    value: pharmacies.filter(p => p.address.city === city).length,
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
  }));

  const statusData = [
    { label: 'Approuvées', value: pharmacies.filter(p => p.isApproved).length, color: '#10B981' },
    { label: 'En attente', value: pharmacies.filter(p => !p.isApproved).length, color: '#F59E0B' }
  ];

  const ratingData = [
    { label: '5 étoiles', value: pharmacies.filter(p => p.rating >= 4.5).length, color: '#10B981' },
    { label: '4 étoiles', value: pharmacies.filter(p => p.rating >= 3.5 && p.rating < 4.5).length, color: '#3B82F6' },
    { label: '3 étoiles', value: pharmacies.filter(p => p.rating >= 2.5 && p.rating < 3.5).length, color: '#F59E0B' },
    { label: '2 étoiles', value: pharmacies.filter(p => p.rating >= 1.5 && p.rating < 2.5).length, color: '#F97316' },
    { label: '1 étoile', value: pharmacies.filter(p => p.rating < 1.5).length, color: '#EF4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showPharmacyDetails && selectedPharmacy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowPharmacyDetails(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détails de la Pharmacie</h1>
            <p className="text-gray-600">Informations et gestion</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPharmacy.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {selectedPharmacy.isApproved ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Approuvée
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        En attente
                      </span>
                    )}
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {selectedPharmacy.isOpen ? 'Ouverte' : 'Fermée'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star 
                      key={index}
                      className={`w-5 h-5 ${
                        index < Math.floor(selectedPharmacy.rating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                  <span className="ml-1 text-sm text-gray-600">
                    ({selectedPharmacy.rating.toFixed(1)})
                  </span>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => downloadPharmaciesList('json', [selectedPharmacy])}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeletePharmacy(selectedPharmacy)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
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
                        {selectedPharmacy.address.street}, {selectedPharmacy.address.postalCode} {selectedPharmacy.address.city}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{selectedPharmacy.phone}</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{selectedPharmacy.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Propriétaire</p>
                    <div className="flex items-center mt-1">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{selectedPharmacy.ownerName}</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{selectedPharmacy.ownerEmail}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Licence</p>
                    <p className="text-gray-900 mt-1">{selectedPharmacy.licenseNumber || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horaires d'ouverture</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedPharmacy.openingHours && selectedPharmacy.openingHours.length > 0 ? (
                    <div className="space-y-2">
                      {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, index) => {
                        const dayHours = selectedPharmacy.openingHours.find((h: any) => h.day === index);
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
                          {new Date(selectedPharmacy.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dernière mise à jour</p>
                      <div className="flex items-center mt-1">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <p className="text-gray-900">
                          {new Date(selectedPharmacy.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
              {!selectedPharmacy.isApproved && (
                <button
                  onClick={() => handleApprovePharmacy(selectedPharmacy.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approuver</span>
                </button>
              )}
              
              <button
                onClick={() => navigate(`/chat?recipientId=${selectedPharmacy.ownerId}&recipientName=${encodeURIComponent(selectedPharmacy.ownerName)}&recipientRole=pharmacist`)}
                className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Contacter le propriétaire</span>
              </button>
              
              <button
                onClick={() => setShowPharmacyDetails(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la liste</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Pharmacies</h1>
          <p className="text-gray-600">Administrez les pharmacies de la plateforme</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadPharmacies}
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
          
          <button
            onClick={() => navigate('/admin/add-pharmacy')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une pharmacie</span>
          </button>
        </div>
      </div>

      {/* Statistiques et graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-blue-600" />
            Pharmacies par ville
          </h2>
          <BarChartComponent data={cityData} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-green-600" />
            Répartition par note
          </h2>
          <BarChartComponent data={ratingData} />
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une pharmacie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les villes</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="approved">Approuvées</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des pharmacies */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des pharmacies ({filteredPharmacies.length})
          </h2>
        </div>

        {filteredPharmacies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune pharmacie trouvée</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredPharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-r from-green-400 to-blue-500 relative">
                  {pharmacy.imageUrl ? (
                    <img 
                      src={pharmacy.imageUrl} 
                      alt={pharmacy.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {pharmacy.isApproved ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-white">
                        Approuvée
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-white">
                        En attente
                      </span>
                    )}
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-white">
                      {pharmacy.isOpen ? 'Ouverte' : 'Fermée'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{pharmacy.name}</h3>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star 
                          key={index}
                          className={`w-4 h-4 ${
                            index < Math.floor(pharmacy.rating) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="ml-1 text-xs text-gray-600">
                        ({pharmacy.rating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{pharmacy.address.city}, {pharmacy.address.postalCode}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{pharmacy.ownerName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{pharmacy.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span>Créée le {new Date(pharmacy.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewPharmacy(pharmacy)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Détails</span>
                    </button>
                    
                    {!pharmacy.isApproved && (
                      <button
                        onClick={() => handleApprovePharmacy(pharmacy.id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approuver</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeletePharmacy(pharmacy)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lien de téléchargement caché */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement la pharmacie <strong>{pharmacyToDelete?.name}</strong> ?
              <br /><br />
              <span className="text-red-600 font-medium">Cette action est irréversible et supprimera toutes les données associées à cette pharmacie.</span>
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPharmacyToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeletePharmacy}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'options de téléchargement */}
      {showDownloadOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Exporter les pharmacies</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-700">
                Choisissez le format d'exportation et les pharmacies à inclure :
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
                <h4 className="font-medium text-gray-900 mb-2">Pharmacies à exporter :</h4>
                
                <div className="space-y-2">
                  <button
                    onClick={() => downloadPharmaciesList(downloadFormat, filteredPharmacies)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Pharmacies filtrées</div>
                    <div className="text-sm text-gray-600">{filteredPharmacies.length} pharmacie(s) correspondant aux filtres actuels</div>
                  </button>
                  
                  <button
                    onClick={() => downloadPharmaciesList(downloadFormat, pharmacies.filter(p => p.isApproved))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Pharmacies approuvées</div>
                    <div className="text-sm text-gray-600">{pharmacies.filter(p => p.isApproved).length} pharmacie(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadPharmaciesList(downloadFormat, pharmacies.filter(p => !p.isApproved))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Pharmacies en attente</div>
                    <div className="text-sm text-gray-600">{pharmacies.filter(p => !p.isApproved).length} pharmacie(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadPharmaciesList(downloadFormat, pharmacies)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Toutes les pharmacies</div>
                    <div className="text-sm text-gray-600">{pharmacies.length} pharmacie(s) au total</div>
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

export default PharmaciesPage;