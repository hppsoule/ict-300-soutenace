import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Upload, Camera, MapPin, Phone, Mail, Clock, Plus, Minus } from 'lucide-react';
import apiService from '../../services/api';

interface PharmacyFormProps {
  pharmacy?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PharmacyForm: React.FC<PharmacyFormProps> = ({ pharmacy, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: '',
    email: '',
    isOpen: true,
    licenseNumber: '',
    imageUrl: ''
  });
  
  const [openingHours, setOpeningHours] = useState([
    { day: 0, dayName: 'Dimanche', openTime: '10:00', closeTime: '18:00', isClosed: false },
    { day: 1, dayName: 'Lundi', openTime: '08:00', closeTime: '19:00', isClosed: false },
    { day: 2, dayName: 'Mardi', openTime: '08:00', closeTime: '19:00', isClosed: false },
    { day: 3, dayName: 'Mercredi', openTime: '08:00', closeTime: '19:00', isClosed: false },
    { day: 4, dayName: 'Jeudi', openTime: '08:00', closeTime: '19:00', isClosed: false },
    { day: 5, dayName: 'Vendredi', openTime: '08:00', closeTime: '19:00', isClosed: false },
    { day: 6, dayName: 'Samedi', openTime: '09:00', closeTime: '18:00', isClosed: false }
  ]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (pharmacy) {
      setFormData({
        name: pharmacy.name || '',
        street: pharmacy.address?.street || '',
        city: pharmacy.address?.city || '',
        postalCode: pharmacy.address?.postalCode || '',
        country: pharmacy.address?.country || 'France',
        phone: pharmacy.phone || '',
        email: pharmacy.email || '',
        isOpen: pharmacy.isOpen !== undefined ? pharmacy.isOpen : true,
        licenseNumber: pharmacy.licenseNumber || '',
        imageUrl: pharmacy.imageUrl || ''
      });
      
      if (pharmacy.imageUrl) {
        setImagePreview(pharmacy.imageUrl);
      }
      
      // Mettre à jour les horaires d'ouverture si disponibles
      if (pharmacy.openingHours && pharmacy.openingHours.length > 0) {
        const updatedHours = [...openingHours];
        
        pharmacy.openingHours.forEach((hour: any) => {
          const index = updatedHours.findIndex(h => h.day === hour.day);
          if (index !== -1) {
            updatedHours[index] = {
              ...updatedHours[index],
              openTime: hour.openTime,
              closeTime: hour.closeTime,
              isClosed: hour.isClosed || false
            };
          }
        });
        
        setOpeningHours(updatedHours);
      }
    }
  }, [pharmacy]);

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
        const uploadResult = await apiService.uploadImageFile(file, 'pharmacies');
        
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

  const handleOpeningHourChange = (index: number, field: string, value: any) => {
    const updatedHours = [...openingHours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setOpeningHours(updatedHours);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'L\'adresse est requise';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Le code postal est requis';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
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
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country
      },
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      isOpen: formData.isOpen,
      licenseNumber: formData.licenseNumber.trim() || null,
      imageUrl: formData.imageUrl || null,
      openingHours: openingHours.map(hour => ({
        day: hour.day,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isClosed: hour.isClosed
      }))
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
              {pharmacy ? 'Modifier ma pharmacie' : 'Configurer ma pharmacie'}
            </h1>
            <p className="text-gray-600">
              {pharmacy ? 'Modifiez les informations de votre pharmacie' : 'Configurez votre pharmacie pour commencer à vendre des médicaments'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Image de la pharmacie */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Image de la pharmacie</h3>
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
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
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
              <p className="text-sm text-gray-600">Image de la pharmacie (optionnelle)</p>
              <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP - Max 5MB</p>
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
                Nom de la pharmacie *
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
                placeholder="Ex: Pharmacie du Centre"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de licence
              </label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: PHARM123456"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: +33 1 23 45 67 89"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: contact@pharmacie.fr"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Rue *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.street ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 123 Rue de la Pharmacie"
                />
              </div>
              {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Paris"
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.postalCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 75001"
                />
                {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="France">France</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Suisse">Suisse</option>
                  <option value="Canada">Canada</option>
                  <option value="Cameroun">Cameroun</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Horaires d'ouverture */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Horaires d'ouverture</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Pharmacie ouverte
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isOpen"
                  checked={formData.isOpen}
                  onChange={(e) => setFormData(prev => ({ ...prev, isOpen: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-4">
                {openingHours.map((hour, index) => (
                  <div key={hour.day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <span className="text-sm font-medium text-gray-700">{hour.dayName}</span>
                    </div>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hour.isClosed}
                        onChange={(e) => handleOpeningHourChange(index, 'isClosed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Fermé</span>
                    </label>
                    
                    {!hour.isClosed && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={hour.openTime}
                            onChange={(e) => handleOpeningHourChange(index, 'openTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) => handleOpeningHourChange(index, 'closeTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
            <span>{pharmacy ? 'Mettre à jour' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PharmacyForm;