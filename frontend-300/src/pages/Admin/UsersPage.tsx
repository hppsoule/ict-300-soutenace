import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  User, 
  Building2, 
  Truck, 
  Shield, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowLeft,
  RefreshCw,
  Eye,
  PieChart,
  BarChart,
  UserPlus,
  Download,
  FileText,
  AlertTriangle
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

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
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
      const [allUsersData, pendingUsersData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getPendingUsers()
      ]);
      
      setUsers(allUsersData);
      setPendingUsers(pendingUsersData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await apiService.approveUser(userId);
      await loadData();
      showSuccessNotification('Utilisateur approuvé avec succès');
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return; // L'utilisateur a annulé
    
    try {
      await apiService.rejectUser(userId, reason);
      await loadData();
      showSuccessNotification('Utilisateur rejeté avec succès');
    } catch (err: any) {
      showErrorNotification('Erreur: ' + err.message);
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    setDeleteError('');
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteError('');
      
      // Appeler l'API pour supprimer l'utilisateur
      await apiService.rejectUser(userToDelete.id, "Compte supprimé par l'administrateur");
      
      // Recharger les données
      await loadData();
      
      // Fermer le modal et réinitialiser
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      
      // Afficher une notification de succès
      showSuccessNotification('Utilisateur supprimé avec succès');
      
      // Si l'utilisateur supprimé est celui qu'on visualise, revenir à la liste
      if (selectedUser && selectedUser.id === userToDelete.id) {
        setShowUserDetails(false);
        setSelectedUser(null);
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      
      // Afficher l'erreur dans le modal
      if (err.message.includes('foreign key constraint')) {
        setDeleteError('Impossible de supprimer cet utilisateur car il a des données associées (commandes, médicaments, etc.). Veuillez d\'abord supprimer ces données.');
      } else {
        setDeleteError(err.message || 'Une erreur est survenue lors de la suppression');
      }
    }
  };

  const handleDownloadUsers = () => {
    setShowDownloadOptions(true);
  };

  const downloadUsersList = (format: string, userList: any[] = filteredUsers) => {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (format === 'csv') {
      // Générer le contenu CSV
      const headers = ['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Date d\'inscription'];
      content = headers.join(',') + '\n';
      
      userList.forEach(user => {
        const row = [
          user.id,
          `"${user.firstName}"`,
          `"${user.lastName}"`,
          `"${user.email}"`,
          `"${user.phone || ''}"`,
          `"${getRoleLabel(user.role)}"`,
          `"${user.isActive ? 'Actif' : 'En attente'}"`,
          `"${new Date(user.createdAt).toLocaleDateString('fr-FR')}"`
        ];
        content += row.join(',') + '\n';
      });
      
      filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      // Générer le contenu JSON
      const jsonData = userList.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));
      
      content = JSON.stringify(jsonData, null, 2);
      filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.json`;
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.isActive) || 
      (selectedStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Données pour les graphiques
  const roleData = [
    { label: 'Patients', value: users.filter(u => u.role === 'patient').length, color: '#3B82F6' },
    { label: 'Pharmaciens', value: users.filter(u => u.role === 'pharmacist').length, color: '#10B981' },
    { label: 'Livreurs', value: users.filter(u => u.role === 'driver').length, color: '#8B5CF6' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#EF4444' }
  ];

  const statusData = [
    { label: 'Actifs', value: users.filter(u => u.isActive).length, color: '#10B981' },
    { label: 'En attente', value: users.filter(u => !u.isActive).length, color: '#F59E0B' }
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'patient': return <User className="w-5 h-5 text-blue-600" />;
      case 'pharmacist': return <Building2 className="w-5 h-5 text-green-600" />;
      case 'driver': return <Truck className="w-5 h-5 text-purple-600" />;
      case 'admin': return <Shield className="w-5 h-5 text-red-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'pharmacist': return 'Pharmacien';
      case 'driver': return 'Livreur';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'patient': return 'bg-blue-100 text-blue-800';
      case 'pharmacist': return 'bg-green-100 text-green-800';
      case 'driver': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>
      : <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">En attente</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showUserDetails && selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowUserDetails(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Utilisateur</h1>
            <p className="text-gray-600">Détails et gestion du compte</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                    {getStatusBadge(selectedUser.isActive)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadUsersList('json', [selectedUser])}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </button>
                
                <button
                  onClick={() => handleDeleteUser(selectedUser)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">{selectedUser.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date d'inscription</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du compte</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Statut</p>
                    {getStatusBadge(selectedUser.isActive)}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Email vérifié</p>
                    {selectedUser.isVerified ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Vérifié</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Non vérifié</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Rôle</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations spécifiques au rôle */}
            {selectedUser.role === 'pharmacist' && selectedUser.hasProfile && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations pharmacien</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Numéro de licence:</strong> {selectedUser.pharmacistProfile?.licenseNumber || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Diplôme:</strong> {selectedUser.pharmacistProfile?.pharmacyDegree || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Spécialisation:</strong> {selectedUser.pharmacistProfile?.specialization || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Années d'expérience:</strong> {selectedUser.pharmacistProfile?.yearsExperience || '0'}
                  </p>
                </div>
              </div>
            )}

            {selectedUser.role === 'driver' && selectedUser.hasProfile && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations livreur</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Numéro de permis:</strong> {selectedUser.driverProfile?.licenseNumber || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Type de permis:</strong> {selectedUser.driverProfile?.licenseType || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Type de véhicule:</strong> {selectedUser.driverProfile?.vehicleType || 'Non renseigné'}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Immatriculation:</strong> {selectedUser.driverProfile?.vehicleRegistration || 'Non renseigné'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
              {!selectedUser.isActive && (
                <button
                  onClick={() => handleApproveUser(selectedUser.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approuver</span>
                </button>
              )}
              
              {!selectedUser.isActive && (
                <button
                  onClick={() => handleRejectUser(selectedUser.id)}
                  className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeter</span>
                </button>
              )}
              
              <button
                onClick={() => navigate(`/chat?recipientId=${selectedUser.id}&recipientName=${encodeURIComponent(`${selectedUser.firstName} ${selectedUser.lastName}`)}&recipientRole=${selectedUser.role}`)}
                className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Contacter</span>
              </button>
              
              <button
                onClick={() => setShowUserDetails(false)}
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Administrez les comptes utilisateurs de la plateforme</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadUsers}
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
            onClick={() => navigate('/admin/add-user')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un utilisateur</span>
          </button>
        </div>
      </div>

      {/* Statistiques et graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-600" />
            Répartition par rôle
          </h2>
          <PieChartComponent data={roleData} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-green-600" />
            Statut des comptes
          </h2>
          <PieChartComponent data={statusData} />
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les rôles</option>
              <option value="patient">Patients</option>
              <option value="pharmacist">Pharmaciens</option>
              <option value="driver">Livreurs</option>
              <option value="admin">Administrateurs</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Tous les utilisateurs ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>En attente d'approbation ({pendingUsers.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'all' ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Liste des utilisateurs</h2>
              
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                  <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date d'inscription
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getRoleIcon(user.role)}
                              <span className="ml-2 text-sm text-gray-900">{getRoleLabel(user.role)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user.isActive)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewUser(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/chat?recipientId=${user.id}&recipientName=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&recipientRole=${user.role}`)}
                                className="text-green-600 hover:text-green-900"
                                title="Contacter"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              {!user.isActive && (
                                <>
                                  <button
                                    onClick={() => handleApproveUser(user.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Approuver"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Rejeter"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs en attente d'approbation</h2>
              
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune approbation en attente</h3>
                  <p className="text-gray-600">Toutes les demandes d'inscription ont été traitées</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                                  {getRoleLabel(user.role)}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approuver</span>
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Rejeter</span>
                          </button>
                          <button
                            onClick={() => handleViewUser(user)}
                            className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Détails</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Informations spécifiques au rôle */}
                      {user.role === 'pharmacist' && user.pharmacistProfile && (
                        <div className="mt-4 bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Licence pharmacien:</strong> {user.pharmacistProfile.licenseNumber}
                            {user.pharmacistProfile.specialization && (
                              <span> • <strong>Spécialisation:</strong> {user.pharmacistProfile.specialization}</span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      {user.role === 'driver' && user.driverProfile && (
                        <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                          <p className="text-sm text-purple-800">
                            <strong>Permis:</strong> {user.driverProfile.licenseNumber} 
                            {user.driverProfile.licenseType && (
                              <span> (Type {user.driverProfile.licenseType})</span>
                            )}
                            {user.driverProfile.vehicleType && (
                              <span> • <strong>Véhicule:</strong> {user.driverProfile.vehicleType}</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
              Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ?
              <br /><br />
              <span className="text-red-600 font-medium">Cette action est irréversible et supprimera toutes les données associées à cet utilisateur.</span>
            </p>
            
            {deleteError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                  setDeleteError('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteUser}
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
              <h3 className="text-lg font-semibold text-gray-900">Exporter les utilisateurs</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-700">
                Choisissez le format d'exportation et les utilisateurs à inclure :
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
                <h4 className="font-medium text-gray-900 mb-2">Utilisateurs à exporter :</h4>
                
                <div className="space-y-2">
                  <button
                    onClick={() => downloadUsersList(downloadFormat, filteredUsers)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Utilisateurs filtrés</div>
                    <div className="text-sm text-gray-600">{filteredUsers.length} utilisateur(s) correspondant aux filtres actuels</div>
                  </button>
                  
                  <button
                    onClick={() => downloadUsersList(downloadFormat, users.filter(u => u.role === 'patient'))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Tous les patients</div>
                    <div className="text-sm text-gray-600">{users.filter(u => u.role === 'patient').length} patient(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadUsersList(downloadFormat, users.filter(u => u.role === 'pharmacist'))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Tous les pharmaciens</div>
                    <div className="text-sm text-gray-600">{users.filter(u => u.role === 'pharmacist').length} pharmacien(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadUsersList(downloadFormat, users.filter(u => u.role === 'driver'))}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Tous les livreurs</div>
                    <div className="text-sm text-gray-600">{users.filter(u => u.role === 'driver').length} livreur(s)</div>
                  </button>
                  
                  <button
                    onClick={() => downloadUsersList(downloadFormat, users)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">Tous les utilisateurs</div>
                    <div className="text-sm text-gray-600">{users.length} utilisateur(s) au total</div>
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

export default UsersPage;