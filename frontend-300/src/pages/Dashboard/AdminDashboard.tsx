import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Package, ShoppingCart, Euro, TrendingUp, AlertTriangle, Check, X, Eye } from 'lucide-react';
import apiService from '../../services/api';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, allUsersData] = await Promise.all([
        apiService.getPendingUsers(),
        apiService.getAllUsers()
      ]);
      
      setPendingUsers(pendingData);
      setAllUsers(allUsersData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await apiService.approveUser(userId);
      await loadData(); // Recharger les données
      alert('Utilisateur approuvé avec succès!');
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const reason = prompt('Raison du rejet (optionnel):');
    try {
      await apiService.rejectUser(userId, reason);
      await loadData(); // Recharger les données
      alert('Utilisateur rejeté avec succès!');
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const stats = [
    {
      title: 'Utilisateurs actifs',
      value: allUsers.filter(u => u.isActive).length,
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'En attente d\'approbation',
      value: pendingUsers.length,
      change: `${pendingUsers.length} nouveaux`,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Pharmaciens',
      value: allUsers.filter(u => u.role === 'pharmacist' && u.isActive).length,
      change: '+3',
      icon: Package,
      color: 'bg-green-500',
    },
    {
      title: 'Livreurs',
      value: allUsers.filter(u => u.role === 'driver' && u.isActive).length,
      change: '+2',
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'pharmacist': return 'Pharmacien';
      case 'driver': return 'Livreur';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  };

  const getStatusBadge = (user: any) => {
    if (user.isActive) {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>;
    } else {
      return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">En attente</span>;
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord - Administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme PharmaDelivery</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setSelectedTab('pending')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approbations en attente ({pendingUsers.length})
            </button>
            <button
              onClick={() => setSelectedTab('all')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                selectedTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous les utilisateurs ({allUsers.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'pending' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs en attente d'approbation</h2>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun utilisateur en attente d'approbation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <p className="text-sm text-gray-500">
                                {getRoleLabel(user.role)} • {user.phone}
                              </p>
                              <p className="text-xs text-gray-400">
                                Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approuver</span>
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Rejeter</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'all' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tous les utilisateurs</h2>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-600" />
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
                          <span className="text-sm text-gray-900">{getRoleLabel(user.role)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;