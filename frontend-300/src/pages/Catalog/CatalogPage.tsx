import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ShoppingCart, AlertCircle, Plus, Minus, Upload, X, Check, FileText } from 'lucide-react';
import { Medicine, CartItem } from '../../types';
import apiService from '../../services/api';
import MedicineCard from '../../components/Catalog/MedicineCard';
import MedicineDetails from '../../components/Catalog/MedicineDetails';
import CartSummary from '../../components/Catalog/CartSummary';
import PrescriptionUploadModal from '../../components/Catalog/PrescriptionUploadModal';

const CatalogPage: React.FC = () => {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPharmacy, setSelectedPharmacy] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // État pour la gestion des ordonnances
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string>('');
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string>('');
  const [medicineRequiringPrescription, setMedicineRequiringPrescription] = useState<Medicine | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedPharmacy, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load medicines with filters
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedPharmacy !== 'all') params.pharmacyId = selectedPharmacy;
      if (searchTerm) params.search = searchTerm;

      const [medicinesData, categoriesData, pharmaciesData] = await Promise.all([
        apiService.getMedicines(params),
        apiService.getMedicineCategories(),
        apiService.getPharmacies({ isOpen: 'true' })
      ]);

      setMedicines(medicinesData);
      setCategories(categoriesData);
      setPharmacies(pharmaciesData);
    } catch (err: any) {
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

  const addToCart = (medicine: Medicine) => {
    // Vérifier si le médicament nécessite une ordonnance
    if (medicine.requiresPrescription && !prescriptionUrl) {
      setMedicineRequiringPrescription(medicine);
      setShowPrescriptionModal(true);
      return;
    }
    
    // Si pas d'ordonnance requise ou déjà fournie, ajouter au panier
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.medicine.id === medicine.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.medicine.id === medicineId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.medicine.id === medicineId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item.medicine.id !== medicineId);
    });
  };

  const getCartItemQuantity = (medicineId: string) => {
    const item = cart.find(item => item.medicine.id === medicineId);
    return item ? item.quantity : 0;
  };

  const handleViewMedicineDetails = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
  };

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('La taille de l\'ordonnance ne doit pas dépasser 5MB');
        return;
      }
      
      if (!file.type.match('image.*') && !file.type.match('application/pdf')) {
        alert('Veuillez sélectionner une image ou un PDF');
        return;
      }

      setPrescriptionFile(file);
      
      // Créer un aperçu pour les images
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPrescriptionPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Pour les PDF, afficher une icône
        setPrescriptionPreview('');
      }
    }
  };

  const uploadPrescription = async () => {
    if (!prescriptionFile) return;

    try {
      setUploadingPrescription(true);
      
      // Upload du fichier vers Cloudinary via notre API
      const uploadResult = await apiService.uploadImageFile(prescriptionFile, 'prescriptions');
      
      // Stocker l'URL de l'ordonnance
      setPrescriptionUrl(uploadResult.imageUrl);
      
      // Fermer le modal
      setShowPrescriptionModal(false);
      
      // Ajouter le médicament au panier si c'était une demande spécifique
      if (medicineRequiringPrescription) {
        setCart(prevCart => {
          const existingItem = prevCart.find(item => item.medicine.id === medicineRequiringPrescription.id);
          if (existingItem) {
            return prevCart.map(item =>
              item.medicine.id === medicineRequiringPrescription.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prevCart, { medicine: medicineRequiringPrescription, quantity: 1 }];
        });
        
        // Réinitialiser
        setMedicineRequiringPrescription(null);
      }
      
      alert('Ordonnance téléchargée avec succès!');
    } catch (err: any) {
      alert('Erreur lors du téléchargement de l\'ordonnance: ' + err.message);
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;

    // Vérifier si des médicaments nécessitent une ordonnance
    const requiresPrescription = cart.some(item => item.medicine.requiresPrescription);
    
    if (requiresPrescription && !prescriptionUrl) {
      setShowPrescriptionModal(true);
      return;
    }

    try {
      // Group items by pharmacy
      const ordersByPharmacy = cart.reduce((acc, item) => {
        const pharmacyId = item.medicine.pharmacyId;
        if (!acc[pharmacyId]) {
          acc[pharmacyId] = [];
        }
        acc[pharmacyId].push({
          medicineId: item.medicine.id,
          quantity: item.quantity
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Create orders for each pharmacy
      for (const [pharmacyId, items] of Object.entries(ordersByPharmacy)) {
        await apiService.createOrder({
          pharmacyId,
          items,
          prescriptionUrl: prescriptionUrl,
          deliveryAddress: {
            street: '123 Rue de la Santé',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
            latitude: 48.8566,
            longitude: 2.3522
          }
        });
      }

      setCart([]);
      setPrescriptionUrl('');
      setPrescriptionFile(null);
      setPrescriptionPreview('');
      alert('Commande(s) créée(s) avec succès!');
    } catch (err: any) {
      alert('Erreur lors de la création de la commande: ' + err.message);
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

  if (selectedMedicine) {
    return (
      <MedicineDetails
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        cartQuantity={getCartItemQuantity(selectedMedicine.id)}
        onUploadPrescription={() => setShowPrescriptionModal(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue de médicaments</h1>
          <p className="text-gray-600">Trouvez et commandez vos médicaments</p>
        </div>
        
        {cart.length > 0 && (
          <CartSummary
            items={cart}
            onRemoveItem={removeFromCart}
            onCheckout={handleCreateOrder}
            onUploadPrescription={() => setShowPrescriptionModal(true)}
            prescriptionUrl={prescriptionUrl}
          />
        )}
      </div>

      {/* Search and Filters */}
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
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
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
            
            <select
              value={selectedPharmacy}
              onChange={(e) => setSelectedPharmacy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les pharmacies</option>
              {pharmacies.map(pharmacy => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((medicine) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            cartQuantity={getCartItemQuantity(medicine.id)}
            onViewDetails={handleViewMedicineDetails}
          />
        ))}
      </div>

      {medicines.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {/* Modal d'upload d'ordonnance */}
      {showPrescriptionModal && (
        <PrescriptionUploadModal 
          onClose={() => setShowPrescriptionModal(false)}
          onUploadComplete={(url) => {
            setPrescriptionUrl(url);
            setShowPrescriptionModal(false);
            
            // Ajouter le médicament au panier si c'était une demande spécifique
            if (medicineRequiringPrescription) {
              setCart(prevCart => {
                const existingItem = prevCart.find(item => item.medicine.id === medicineRequiringPrescription.id);
                if (existingItem) {
                  return prevCart.map(item =>
                    item.medicine.id === medicineRequiringPrescription.id
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
                  );
                }
                return [...prevCart, { medicine: medicineRequiringPrescription, quantity: 1 }];
              });
              
              // Réinitialiser
              setMedicineRequiringPrescription(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default CatalogPage;