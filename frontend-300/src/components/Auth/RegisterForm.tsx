import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Pill, Eye, EyeOff, User, Truck, Building2, Upload, Camera, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'patient',
    // Champs pharmacien
    licenseNumber: '',
    pharmacyDegree: '',
    specialization: '',
    yearsExperience: '',
    professionalOrderNumber: '',
    // Champs livreur
    licenseType: 'B',
    licenseExpiryDate: '',
    vehicleType: '',
    vehicleRegistration: '',
    insuranceNumber: '',
    insuranceExpiryDate: ''
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roles = [
    { value: 'patient', label: 'Patient', icon: User, description: 'Commander des médicaments' },
    { value: 'pharmacist', label: 'Pharmacien', icon: Building2, description: 'Gérer une pharmacie' },
    { value: 'driver', label: 'Livreur', icon: Truck, description: 'Livrer des commandes' }
  ];

  const licenseTypes = [
    { value: 'A', label: 'Permis A - Moto' },
    { value: 'A1', label: 'Permis A1 - Moto légère' },
    { value: 'A2', label: 'Permis A2 - Moto intermédiaire' },
    { value: 'B', label: 'Permis B - Voiture' },
    { value: 'BE', label: 'Permis BE - Voiture + remorque' },
    { value: 'C', label: 'Permis C - Poids lourd' },
    { value: 'CE', label: 'Permis CE - Poids lourd + remorque' }
  ];

  const vehicleTypes = [
    { value: 'vélo', label: 'Vélo' },
    { value: 'moto', label: 'Moto' },
    { value: 'voiture', label: 'Voiture' },
    { value: 'camionnette', label: 'Camionnette' }
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }

      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Validation spécifique selon le rôle
    if (formData.role === 'pharmacist' && !formData.licenseNumber) {
      setError('Le numéro de licence pharmacien est requis');
      return;
    }

    if (formData.role === 'driver') {
      if (!formData.licenseNumber) {
        setError('Le numéro de permis de conduire est requis');
        return;
      }
      if (!formData.licenseExpiryDate) {
        setError('La date d\'expiration du permis est requise');
        return;
      }
      const expiryDate = new Date(formData.licenseExpiryDate);
      if (expiryDate <= new Date()) {
        setError('Le permis de conduire ne doit pas être expiré');
        return;
      }
    }

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role
      };

      // Ajouter les champs spécifiques selon le rôle
      if (formData.role === 'pharmacist') {
        Object.assign(registrationData, {
          licenseNumber: formData.licenseNumber,
          pharmacyDegree: formData.pharmacyDegree,
          specialization: formData.specialization,
          yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
          professionalOrderNumber: formData.professionalOrderNumber
        });
      }

      if (formData.role === 'driver') {
        Object.assign(registrationData, {
          licenseNumber: formData.licenseNumber,
          licenseType: formData.licenseType,
          licenseExpiryDate: formData.licenseExpiryDate,
          vehicleType: formData.vehicleType,
          vehicleRegistration: formData.vehicleRegistration,
          insuranceNumber: formData.insuranceNumber,
          insuranceExpiryDate: formData.insuranceExpiryDate || null
        });
      }

      const response = await register(registrationData);

      if (response.requiresApproval) {
        setSuccess('Votre compte a été créé avec succès. Il est en attente d\'approbation par un administrateur. Vous recevrez un email de confirmation une fois approuvé.');
      } else {
        setSuccess('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
      }

      // Réinitialiser le formulaire
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'patient',
        licenseNumber: '',
        pharmacyDegree: '',
        specialization: '',
        yearsExperience: '',
        professionalOrderNumber: '',
        licenseType: 'B',
        licenseExpiryDate: '',
        vehicleType: '',
        vehicleRegistration: '',
        insuranceNumber: '',
        insuranceExpiryDate: ''
      });
      setAvatar(null);
      setAvatarPreview('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Bouton retour */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </button>
        </div>

        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Créer un compte</h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez Mavoily
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {/* Photo de profil */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-red-500 to-blue-600 text-white p-2 rounded-full cursor-pointer hover:from-red-600 hover:to-blue-700 transition-colors">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600">Photo de profil (optionnelle)</p>
          </div>

          {/* Sélection du rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de compte
            </label>
            <div className="grid grid-cols-1 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <label
                    key={role.value}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <Icon className={`w-5 h-5 mr-3 ${
                      formData.role === role.value ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className={`font-medium ${
                        formData.role === role.value ? 'text-red-900' : 'text-gray-900'
                      }`}>
                        {role.label}
                      </div>
                      <div className={`text-sm ${
                        formData.role === role.value ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {role.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prénom *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Jean"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="+33123456789"
            />
          </div>

          {/* Champs spécifiques aux pharmaciens */}
          {formData.role === 'pharmacist' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900">Informations professionnelles - Pharmacien</h3>
              
              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  Numéro de licence pharmacien *
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Ex: PHARM123456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pharmacyDegree" className="block text-sm font-medium text-gray-700">
                    Diplôme
                  </label>
                  <input
                    id="pharmacyDegree"
                    name="pharmacyDegree"
                    type="text"
                    value={formData.pharmacyDegree}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Docteur en Pharmacie"
                  />
                </div>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                    Spécialisation
                  </label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Pharmacie Clinique"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                    Années d'expérience
                  </label>
                  <input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min="0"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label htmlFor="professionalOrderNumber" className="block text-sm font-medium text-gray-700">
                    N° Ordre professionnel
                  </label>
                  <input
                    id="professionalOrderNumber"
                    name="professionalOrderNumber"
                    type="text"
                    value={formData.professionalOrderNumber}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="ORD123456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Champs spécifiques aux livreurs */}
          {formData.role === 'driver' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Informations professionnelles - Livreur</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    Numéro de permis *
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 123456789012"
                  />
                </div>
                <div>
                  <label htmlFor="licenseType" className="block text-sm font-medium text-gray-700">
                    Type de permis *
                  </label>
                  <select
                    id="licenseType"
                    name="licenseType"
                    required
                    value={formData.licenseType}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {licenseTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="licenseExpiryDate" className="block text-sm font-medium text-gray-700">
                  Date d'expiration du permis *
                </label>
                <input
                  id="licenseExpiryDate"
                  name="licenseExpiryDate"
                  type="date"
                  required
                  value={formData.licenseExpiryDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                    Type de véhicule
                  </label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {vehicleTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="vehicleRegistration" className="block text-sm font-medium text-gray-700">
                    Immatriculation
                  </label>
                  <input
                    id="vehicleRegistration"
                    name="vehicleRegistration"
                    type="text"
                    value={formData.vehicleRegistration}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="AB-123-CD"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700">
                    N° d'assurance
                  </label>
                  <input
                    id="insuranceNumber"
                    name="insuranceNumber"
                    type="text"
                    value={formData.insuranceNumber}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="INS123456789"
                  />
                </div>
                <div>
                  <label htmlFor="insuranceExpiryDate" className="block text-sm font-medium text-gray-700">
                    Expiration assurance
                  </label>
                  <input
                    id="insuranceExpiryDate"
                    name="insuranceExpiryDate"
                    type="date"
                    value={formData.insuranceExpiryDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mots de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe *
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe *
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création en cours...' : 'Créer le compte'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;