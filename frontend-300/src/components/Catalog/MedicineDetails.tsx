import React from 'react';
import { ArrowLeft, ShoppingCart, AlertCircle, Calendar, Barcode, Plus, Minus, Info, Upload } from 'lucide-react';
import { Medicine } from '../../types';

interface MedicineDetailsProps {
  medicine: Medicine;
  onClose: () => void;
  onAddToCart: (medicine: Medicine) => void;
  onRemoveFromCart: (medicineId: string) => void;
  cartQuantity: number;
  onUploadPrescription: () => void;
}

const MedicineDetails: React.FC<MedicineDetailsProps> = ({ 
  medicine, 
  onClose, 
  onAddToCart, 
  onRemoveFromCart, 
  cartQuantity,
  onUploadPrescription
}) => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div className="md:w-2/5 bg-gray-100 p-6 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={medicine.imageUrl || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'} 
                alt={medicine.name} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
              {medicine.requiresPrescription && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Ordonnance requise
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="md:w-3/5 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">Réf: {medicine.id.slice(-6).toUpperCase()}</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{medicine.name}</h2>
            
            <div className="flex items-center mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                {medicine.category}
              </span>
              {medicine.requiresPrescription && (
                <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Ordonnance obligatoire
                </span>
              )}
            </div>

            <div className="text-2xl font-bold text-blue-600 mb-6">
              {formatCFA(medicine.price)}
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {medicine.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700 mb-1">
                  <Barcode className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">Fabricant</span>
                </div>
                <p className="text-gray-900">{medicine.manufacturer || 'Non spécifié'}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">Date d'expiration</span>
                </div>
                <p className="text-gray-900">{formatDate(medicine.expiryDate)}</p>
              </div>
            </div>

            {medicine.requiresPrescription && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Ordonnance médicale requise</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Ce médicament nécessite une ordonnance valide délivrée par un médecin. 
                        Veuillez télécharger votre ordonnance avant de finaliser votre commande.
                      </p>
                      <button
                        onClick={onUploadPrescription}
                        className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2 w-full justify-center"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Télécharger mon ordonnance</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="text-gray-700 mr-3">Quantité:</span>
                {cartQuantity > 0 ? (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onRemoveFromCart(medicine.id)}
                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-gray-900 min-w-8 text-center">
                      {cartQuantity}
                    </span>
                    <button
                      onClick={() => onAddToCart(medicine)}
                      className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                      disabled={cartQuantity >= medicine.quantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onAddToCart(medicine)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Ajouter au panier</span>
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {medicine.quantity} en stock
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <Info className="w-4 h-4 mr-2" />
                <span>Vendu par <span className="font-medium text-gray-900">{medicine.pharmacyName}</span></span>
              </div>
              <p className="text-xs text-gray-500">
                Les médicaments sont préparés et vérifiés par des pharmaciens diplômés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;