import React from 'react';
import { ArrowLeft, Edit, Package, AlertCircle, Calendar, Barcode } from 'lucide-react';

interface MedicineDetailsProps {
  medicine: any;
  onEdit: () => void;
  onBack: () => void;
}

const MedicineDetails: React.FC<MedicineDetailsProps> = ({ medicine, onEdit, onBack }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR');
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

  const getStockStatus = () => {
    if (!medicine.inStock || medicine.quantity === 0) {
      return { label: 'Rupture de stock', color: 'bg-red-100 text-red-800' };
    } else if (medicine.quantity < 50) {
      return { label: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'En stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{medicine.name}</h1>
            <p className="text-gray-600">Détails du médicament</p>
          </div>
        </div>
        
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Edit className="w-4 h-4" />
          <span>Modifier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                <p className="text-gray-900">{medicine.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Catégorie</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {medicine.category}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Fabricant</label>
                <p className="text-gray-900">{medicine.manufacturer || 'Non spécifié'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Prix unitaire</label>
                <p className="text-gray-900 font-semibold">{formatCFA(medicine.price)}</p>
              </div>
              
              {medicine.barcode && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Code-barres</label>
                  <div className="flex items-center space-x-2">
                    <Barcode className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900 font-mono">{medicine.barcode}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date d'expiration</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(medicine.expiryDate)}</p>
                </div>
              </div>
            </div>
            
            {medicine.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{medicine.description}</p>
              </div>
            )}
          </div>

          {/* Historique des mouvements de stock (placeholder) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des mouvements</h2>
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun mouvement de stock enregistré</p>
              <p className="text-sm text-gray-400 mt-1">
                Les entrées et sorties de stock apparaîtront ici
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar avec statut et actions */}
        <div className="space-y-6">
          {/* Statut du stock */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du stock</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantité disponible</span>
                <span className="text-lg font-bold text-gray-900">{medicine.quantity}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Valeur totale</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCFA(medicine.price * medicine.quantity)}
                </span>
              </div>
            </div>

            {medicine.quantity < 50 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Stock faible</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Il est recommandé de réapprovisionner ce médicament
                </p>
              </div>
            )}
          </div>

          {/* Informations réglementaires */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations réglementaires</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ordonnance requise</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  medicine.requiresPrescription 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {medicine.requiresPrescription ? 'Oui' : 'Non'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Disponible en ligne</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  medicine.inStock 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {medicine.inStock ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Ajuster le stock</div>
                <div className="text-sm text-gray-600">Modifier la quantité disponible</div>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Historique des ventes</div>
                <div className="text-sm text-gray-600">Voir les commandes passées</div>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Dupliquer</div>
                <div className="text-sm text-gray-600">Créer un médicament similaire</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;