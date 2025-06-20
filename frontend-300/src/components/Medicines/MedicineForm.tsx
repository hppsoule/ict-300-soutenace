import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Upload, Camera, Image } from 'lucide-react';
import apiService from '../../services/api';

interface MedicineFormProps {
  medicine?: any;
  categories: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ medicine, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    requiresPrescription: false,
    quantity: '',
    manufacturer: '',
    expiryDate: '',
    barcode: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        description: medicine.description || '',
        price: medicine.price?.toString() || '',
        categoryId: medicine.categoryId || '',
        requiresPrescription: medicine.requiresPrescription || false,
        quantity: medicine.quantity?.toString() || '',
        manufacturer: medicine.manufacturer || '',
        expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
        barcode: medicine.barcode || '',
        imageUrl: medicine.imageUrl || ''
      });
      
      if (medicine.imageUrl) {
        setImagePreview(medicine.imageUrl);
      }
    }
  }, [medicine]);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: 'La taille de l\'image ne doit pas dépasser 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Veuillez sélectionner une image valide' }));
        return;
      }

      setImageFile(file);
      setErrors(prev => ({ ...prev, image: '' }));
      setUploadingImage(true);
      
      try {
        // Upload vers Cloudinary
        const uploadResult = await apiService.uploadImageFile(file, 'medicines');
        
        setImagePreview(uploadResult.imageUrl);
        setFormData(prev => ({ ...prev, imageUrl: uploadResult.imageUrl }));
        
        console.log('Image uploadée avec succès:', uploadResult);
      } catch (error: any) {
        console.error('Erreur upload:', error);
        setErrors(prev => ({ ...prev, image: error.message || 'Erreur lors de l\'upload de l\'image' }));
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'La catégorie est requise';
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'La quantité doit être supérieure ou égale à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      categoryId: formData.categoryId,
      requiresPrescription: formData.requiresPrescription,
      quantity: parseInt(formData.quantity),
      manufacturer: formData.manufacturer.trim(),
      expiryDate: formData.expiryDate || null,
      barcode: formData.barcode.trim() || null,
      imageUrl: formData.imageUrl || null
    };

    onSubmit(submitData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {medicine ? 'Modifier le médicament' : 'Ajouter un médicament'}
            </h1>
            <p className="text-gray-600">
              {medicine ? 'Modifiez les informations du médicament' : 'Ajoutez un nouveau médicament à votre inventaire'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Image du médicament */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Image du médicament</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                {uploadingImage ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Upload en cours...</p>
                  </div>
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune image</p>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Image du médicament (optionnelle)</p>
              <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP - Max 5MB</p>
              <p className="text-xs text-blue-600">Stockage sécurisé via Cloudinary</p>
            </div>
            {errors.image && <p className="text-sm text-red-600">{errors.image}</p>}
          </div>
        </div>

        {/* Informations de base */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du médicament *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Doliprane 1000mg"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                Fabricant
              </label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Sanofi"
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.categoryId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                Code-barres
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 3400930000001"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description détaillée du médicament..."
            />
          </div>
        </div>

        {/* Prix et stock */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Prix et stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Prix (CFA) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              {formData.price && (
                <p className="mt-1 text-xs text-gray-500">
                  Équivalent: {formatCFA(parseFloat(formData.price))}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantité en stock *
              </label>
              <input
                type="number"
                min="0"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date d'expiration
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresPrescription"
              name="requiresPrescription"
              checked={formData.requiresPrescription}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requiresPrescription" className="ml-2 block text-sm text-gray-900">
              Ordonnance médicale requise
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Annuler</span>
          </button>
          <button
            type="submit"
            disabled={uploadingImage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{medicine ? 'Modifier' : 'Ajouter'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;