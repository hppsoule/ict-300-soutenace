import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, AlertCircle, Info, Eye } from 'lucide-react';
import { Medicine } from '../../types';

interface MedicineCardProps {
  medicine: Medicine;
  onAddToCart: (medicine: Medicine) => void;
  onRemoveFromCart: (medicineId: string) => void;
  cartQuantity: number;
  onViewDetails: (medicine: Medicine) => void;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ 
  medicine, 
  onAddToCart, 
  onRemoveFromCart, 
  cartQuantity,
  onViewDetails
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-w-16 aspect-h-9">
        <img
          src={medicine.imageUrl || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'}
          alt={medicine.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        
        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-t-lg">
            <button
              onClick={() => onViewDetails(medicine)}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Voir détails</span>
            </button>
          </div>
        )}
        
        {/* Prescription badge */}
        {medicine.requiresPrescription && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Ordonnance
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
            {medicine.name}
          </h3>
          <span className="text-lg font-bold text-blue-600 ml-2">
            {formatCFA(medicine.price)}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{medicine.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {medicine.category}
          </span>
          <span className="text-sm text-green-600">
            {medicine.quantity} en stock
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-4">
          {medicine.pharmacyName}
        </div>
        
        <div className="flex items-center justify-between">
          {cartQuantity > 0 ? (
            <div className="flex items-center space-x-2">
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
              <span>Ajouter</span>
            </button>
          )}
          
          {medicine.requiresPrescription && (
            <button
              onClick={() => onViewDetails(medicine)}
              className="text-red-600 hover:text-red-700"
              title="Information sur l'ordonnance"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineCard;