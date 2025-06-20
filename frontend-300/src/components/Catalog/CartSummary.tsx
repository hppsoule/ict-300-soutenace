import React, { useState } from 'react';
import { ShoppingCart, X, AlertCircle, ChevronRight, Upload } from 'lucide-react';
import { CartItem } from '../../types';

interface CartSummaryProps {
  items: CartItem[];
  onRemoveItem: (medicineId: string) => void;
  onCheckout: () => void;
  onUploadPrescription: () => void;
  prescriptionUrl?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ 
  items, 
  onRemoveItem, 
  onCheckout,
  onUploadPrescription,
  prescriptionUrl
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Vérifier si une ordonnance est requise
  const requiresPrescription = items.some(item => item.medicine.requiresPrescription);
  
  // Calculer le total
  const total = items.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  
  // Frais de livraison fixes
  const deliveryFee = 2.00;
  
  // Total avec livraison
  const grandTotal = total + deliveryFee;

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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-red-500 to-blue-600 p-4 text-white flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          <span className="font-semibold">Panier ({items.length})</span>
        </div>
        <div className="flex items-center">
          <span className="font-bold mr-2">{formatCFA(grandTotal)}</span>
          <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Items List */}
          <div className="max-h-64 overflow-y-auto mb-4">
            {items.map((item) => (
              <div key={item.medicine.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden mr-3">
                    <img 
                      src={item.medicine.imageUrl || 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg'} 
                      alt={item.medicine.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.medicine.name}</p>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500">{item.quantity} x {formatCFA(item.medicine.price)}</span>
                      {item.medicine.requiresPrescription && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-0.5" />
                          Ordonnance
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 mr-3">
                    {formatCFA(item.medicine.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.medicine.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Prescription Warning */}
          {requiresPrescription && !prescriptionUrl && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Ordonnance requise</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Certains médicaments dans votre panier nécessitent une ordonnance valide.
                  </p>
                  <button
                    onClick={onUploadPrescription}
                    className="mt-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Télécharger mon ordonnance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Uploaded */}
          {requiresPrescription && prescriptionUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Ordonnance téléchargée</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Votre ordonnance a été téléchargée et sera vérifiée par un pharmacien.
                  </p>
                  <button
                    onClick={onUploadPrescription}
                    className="mt-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Changer d'ordonnance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{formatCFA(total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span>{formatCFA(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{formatCFA(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            disabled={requiresPrescription && !prescriptionUrl}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center ${
              requiresPrescription && !prescriptionUrl
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-blue-600 text-white hover:from-red-600 hover:to-blue-700'
            } transition-colors`}
          >
            {requiresPrescription && !prescriptionUrl ? (
              <>
                <AlertCircle className="w-5 h-5 mr-2" />
                Téléchargez votre ordonnance
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Passer la commande
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSummary;