import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, Package, AlertCircle, Eye, Image } from 'lucide-react';
import apiService from '../../services/api';
import MedicineForm from '../../components/Medicines/MedicineForm';
import MedicineDetails from '../../components/Medicines/MedicineDetails';

const MedicinesPage: React.FC = () => {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      // Utiliser la nouvelle méthode pour récupérer les médicaments du pharmacien
      const [medicinesData, categoriesData] = await Promise.all([
        apiService.getPharmacistMedicines(params),
        apiService.getMedicineCategories()
      ]);

      setMedicines(medicinesData);
      setCategories(categoriesData);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      
      // Si c'est une erreur de pharmacie non trouvée, afficher un message spécifique
      if (err.message.includes('Aucune pharmacie trouvée')) {
        setError('Votre pharmacie n\'est pas encore configurée. Veuillez contacter l\'administrateur ou créer votre première pharmacie.');
      }
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

  const handleCreateMedicine = () => {
    setEditingMedicine(null);
    setShowForm(true);
  };

  const handleEditMedicine = (medicine: any) => {
    setEditingMedicine(medicine);
    setShowForm(true);
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      return;
    }

    try {
      await apiService.deleteMedicine(medicineId);
      await loadData();
      alert('Médicament supprimé avec succès!');
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleFormSubmit = async (medicineData: any) => {
    try {
      if (editingMedicine) {
        await apiService.updateMedicine(editingMedicine.id, medicineData);
        alert('Médicament modifié avec succès!');
      } else {
        await apiService.createMedicine(medicineData);
        alert('Médicament ajouté avec succès!');
      }
      
      setShowForm(false);
      setEditingMedicine(null);
      await loadData();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockMedicines = medicines.filter(med => med.quantity < 50);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des médicaments</h1>
          <p className="text-gray-600">Gérez votre inventaire de médicaments</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-medium text-red-800">Erreur de configuration</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          
          {error.includes('pharmacie') && (
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Solutions possibles :</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Essayez d'ajouter un médicament - une pharmacie sera créée automatiquement</li>
                <li>Contactez l'administrateur pour vérifier votre compte pharmacien</li>
                <li>Vérifiez que votre compte est bien approuvé</li>
              </ul>
              
              <button
                onClick={handleCreateMedicine}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Essayer d'ajouter un médicament</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <MedicineForm
        medicine={editingMedicine}
        categories={categories}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingMedicine(null);
        }}
      />
    );
  }

  if (selectedMedicine) {
    return (
      <MedicineDetails
        medicine={selectedMedicine}
        onEdit={() => {
          setEditingMedicine(selectedMedicine);
          setSelectedMedicine(null);
          setShowForm(true);
        }}
        onBack={() => setSelectedMedicine(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des médicaments</h1>
          <p className="text-gray-600">Gérez votre inventaire de médicaments</p>
        </div>
        
        <button
          onClick={handleCreateMedicine}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un médicament</span>
        </button>
      </div>

      {/* Alertes de stock faible */}
      {lowStockMedicines.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Alertes de stock faible</h3>
          </div>
          <p className="text-yellow-700 text-sm mb-3">
            {lowStockMedicines.length} médicament(s) ont un stock inférieur à 50 unités
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStockMedicines.slice(0, 3).map(med => (
              <span key={med.id} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                {med.name} ({med.quantity} restants)
              </span>
            ))}
            {lowStockMedicines.length > 3 && (
              <span className="text-yellow-600 text-xs">
                +{lowStockMedicines.length - 3} autres...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total médicaments</p>
              <p className="text-2xl font-bold text-gray-900">{medicines.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {medicines.filter(m => m.inStock && m.quantity > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock faible</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockMedicines.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCFA(medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille de cartes des médicaments */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Médicaments ({filteredMedicines.length})
          </h2>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier médicament'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={handleCreateMedicine}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Ajouter un médicament
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMedicines.map((medicine) => (
                <div key={medicine.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  {/* Image du médicament */}
                  <div className="aspect-w-16 aspect-h-9 bg-gray-50 rounded-t-lg overflow-hidden">
                    {medicine.imageUrl ? (
                      <img
                        src={medicine.imageUrl}
                        alt={medicine.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* En-tête avec nom et prix */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                        {medicine.name}
                      </h3>
                      <span className="text-lg font-bold text-blue-600 ml-2">
                        {formatCFA(medicine.price)}
                      </span>
                    </div>

                    {/* Catégorie et fabricant */}
                    <div className="space-y-1 mb-3">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {medicine.category}
                      </span>
                      {medicine.manufacturer && (
                        <p className="text-xs text-gray-500">{medicine.manufacturer}</p>
                      )}
                    </div>

                    {/* Stock et statut */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm">
                        <span className="text-gray-600">Stock: </span>
                        <span className={`font-medium ${medicine.quantity < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {medicine.quantity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {medicine.requiresPrescription && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            Ordonnance
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          medicine.inStock && medicine.quantity > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {medicine.inStock && medicine.quantity > 0 ? 'Disponible' : 'Rupture'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedMedicine(medicine)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditMedicine(medicine)}
                          className="text-indigo-600 hover:text-indigo-800 p-1"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedicine(medicine.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;