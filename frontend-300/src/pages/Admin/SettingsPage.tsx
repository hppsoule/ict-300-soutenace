import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Server, 
  Mail, 
  CreditCard, 
  Truck, 
  Shield, 
  Globe, 
  Bell,
  Lock,
  FileText,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Paramètres généraux
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'PharmaDelivery',
    siteDescription: 'Livraison de médicaments en temps réel',
    contactEmail: 'contact@pharmadelivery.com',
    supportPhone: '+33123456789',
    maintenanceMode: false,
    allowRegistrations: true,
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris'
  });

  // Paramètres de paiement
  const [paymentSettings, setPaymentSettings] = useState({
    enablePayments: true,
    paymentProviders: {
      stripe: true,
      paypal: true,
      applePay: false,
      googlePay: false
    },
    currency: 'XOF',
    deliveryFee: 5.00,
    minOrderAmount: 10.00,
    taxRate: 0.00
  });

  // Paramètres de livraison
  const [deliverySettings, setDeliverySettings] = useState({
    maxDeliveryRadius: 20, // km
    estimatedDeliveryTime: 30, // minutes
    allowScheduledDeliveries: false,
    workingHours: {
      start: '08:00',
      end: '20:00'
    },
    daysOff: []
  });

  // Paramètres de sécurité
  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: false,
    twoFactorAuth: false,
    passwordPolicy: {
      minLength: 6,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false
    },
    sessionTimeout: 24, // heures
    maxLoginAttempts: 5
  });

  // Paramètres de notification
  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enablePushNotifications: true,
    enableSmsNotifications: false,
    adminAlerts: {
      newUsers: true,
      newOrders: true,
      paymentIssues: true,
      systemErrors: true
    },
    emailTemplates: {
      welcome: true,
      orderConfirmation: true,
      deliveryUpdates: true,
      passwordReset: true
    }
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    // Simuler le chargement des paramètres depuis l'API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [user, navigate]);

  const handleSaveSettings = () => {
    setSaveLoading(true);
    
    // Simuler une sauvegarde API
    setTimeout(() => {
      setSaveLoading(false);
      setSuccess('Paramètres enregistrés avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    }, 1500);
  };

  const handleResetSettings = (settingType: string) => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser ces paramètres aux valeurs par défaut ?')) {
      return;
    }
    
    switch (settingType) {
      case 'general':
        setGeneralSettings({
          siteName: 'PharmaDelivery',
          siteDescription: 'Livraison de médicaments en temps réel',
          contactEmail: 'contact@pharmadelivery.com',
          supportPhone: '+33123456789',
          maintenanceMode: false,
          allowRegistrations: true,
          defaultLanguage: 'fr',
          timezone: 'Europe/Paris'
        });
        break;
      case 'payment':
        setPaymentSettings({
          enablePayments: true,
          paymentProviders: {
            stripe: true,
            paypal: true,
            applePay: false,
            googlePay: false
          },
          currency: 'XOF',
          deliveryFee: 5.00,
          minOrderAmount: 10.00,
          taxRate: 0.00
        });
        break;
      case 'delivery':
        setDeliverySettings({
          maxDeliveryRadius: 20,
          estimatedDeliveryTime: 30,
          allowScheduledDeliveries: false,
          workingHours: {
            start: '08:00',
            end: '20:00'
          },
          daysOff: []
        });
        break;
      case 'security':
        setSecuritySettings({
          requireEmailVerification: false,
          twoFactorAuth: false,
          passwordPolicy: {
            minLength: 6,
            requireUppercase: false,
            requireNumbers: false,
            requireSpecialChars: false
          },
          sessionTimeout: 24,
          maxLoginAttempts: 5
        });
        break;
      case 'notification':
        setNotificationSettings({
          enableEmailNotifications: true,
          enablePushNotifications: true,
          enableSmsNotifications: false,
          adminAlerts: {
            newUsers: true,
            newOrders: true,
            paymentIssues: true,
            systemErrors: true
          },
          emailTemplates: {
            welcome: true,
            orderConfirmation: true,
            deliveryUpdates: true,
            passwordReset: true
          }
        });
        break;
    }
    
    setSuccess('Paramètres réinitialisés avec succès');
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'delivery', label: 'Livraison', icon: Truck },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Base de données', icon: Database },
    { id: 'logs', label: 'Journaux', icon: FileText },
    { id: 'help', label: 'Aide', icon: HelpCircle }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du système</h1>
          <p className="text-gray-600">Configuration de la plateforme PharmaDelivery</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveSettings}
            disabled={saveLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {saveLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
          </button>
        </div>
      </div>

      {/* Messages d'état */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar avec navigation des onglets */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Version du système</p>
                <p>PharmaDelivery v1.0.0</p>
                <p className="mt-2 text-xs text-gray-500">Dernière mise à jour: 15/06/2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {/* Paramètres généraux */}
            {activeTab === 'general' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres généraux</h2>
                  <button
                    onClick={() => handleResetSettings('general')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du site
                      </label>
                      <input
                        type="text"
                        value={generalSettings.siteName}
                        onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description du site
                      </label>
                      <input
                        type="text"
                        value={generalSettings.siteDescription}
                        onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de contact
                      </label>
                      <input
                        type="email"
                        value={generalSettings.contactEmail}
                        onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone de support
                      </label>
                      <input
                        type="tel"
                        value={generalSettings.supportPhone}
                        onChange={(e) => setGeneralSettings({...generalSettings, supportPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Langue par défaut
                      </label>
                      <select
                        value={generalSettings.defaultLanguage}
                        onChange={(e) => setGeneralSettings({...generalSettings, defaultLanguage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="fr">Français</option>
                        <option value="en">Anglais</option>
                        <option value="es">Espagnol</option>
                        <option value="ar">Arabe</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuseau horaire
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Africa/Dakar">Africa/Dakar</option>
                        <option value="Africa/Abidjan">Africa/Abidjan</option>
                        <option value="Africa/Douala">Africa/Douala</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Mode maintenance</h3>
                        <p className="text-sm text-gray-600">
                          Activer le mode maintenance rendra le site inaccessible aux utilisateurs
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={generalSettings.maintenanceMode}
                          onChange={() => setGeneralSettings({...generalSettings, maintenanceMode: !generalSettings.maintenanceMode})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Autoriser les inscriptions</h3>
                        <p className="text-sm text-gray-600">
                          Permettre aux nouveaux utilisateurs de s'inscrire sur la plateforme
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={generalSettings.allowRegistrations}
                          onChange={() => setGeneralSettings({...generalSettings, allowRegistrations: !generalSettings.allowRegistrations})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paramètres de paiement */}
            {activeTab === 'payment' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres de paiement</h2>
                  <button
                    onClick={() => handleResetSettings('payment')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Activer les paiements</h3>
                      <p className="text-sm text-gray-600">
                        Permettre aux utilisateurs d'effectuer des paiements sur la plateforme
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={paymentSettings.enablePayments}
                        onChange={() => setPaymentSettings({...paymentSettings, enablePayments: !paymentSettings.enablePayments})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Fournisseurs de paiement</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img src="https://www.vectorlogo.zone/logos/stripe/stripe-icon.svg" alt="Stripe" className="w-6 h-6" />
                          <span className="text-sm text-gray-700">Stripe</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={paymentSettings.paymentProviders.stripe}
                            onChange={() => setPaymentSettings({
                              ...paymentSettings, 
                              paymentProviders: {
                                ...paymentSettings.paymentProviders,
                                stripe: !paymentSettings.paymentProviders.stripe
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img src="https://www.vectorlogo.zone/logos/paypal/paypal-icon.svg" alt="PayPal" className="w-6 h-6" />
                          <span className="text-sm text-gray-700">PayPal</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={paymentSettings.paymentProviders.paypal}
                            onChange={() => setPaymentSettings({
                              ...paymentSettings, 
                              paymentProviders: {
                                ...paymentSettings.paymentProviders,
                                paypal: !paymentSettings.paymentProviders.paypal
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img src="https://www.vectorlogo.zone/logos/apple/apple-icon.svg" alt="Apple Pay" className="w-6 h-6" />
                          <span className="text-sm text-gray-700">Apple Pay</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={paymentSettings.paymentProviders.applePay}
                            onChange={() => setPaymentSettings({
                              ...paymentSettings, 
                              paymentProviders: {
                                ...paymentSettings.paymentProviders,
                                applePay: !paymentSettings.paymentProviders.applePay
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google Pay" className="w-6 h-6" />
                          <span className="text-sm text-gray-700">Google Pay</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={paymentSettings.paymentProviders.googlePay}
                            onChange={() => setPaymentSettings({
                              ...paymentSettings, 
                              paymentProviders: {
                                ...paymentSettings.paymentProviders,
                                googlePay: !paymentSettings.paymentProviders.googlePay
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Devise
                      </label>
                      <select
                        value={paymentSettings.currency}
                        onChange={(e) => setPaymentSettings({...paymentSettings, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="XOF">Franc CFA (XOF)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dollar US (USD)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frais de livraison (CFA)
                      </label>
                      <input
                        type="number"
                        value={paymentSettings.deliveryFee}
                        onChange={(e) => setPaymentSettings({...paymentSettings, deliveryFee: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant minimum de commande (CFA)
                      </label>
                      <input
                        type="number"
                        value={paymentSettings.minOrderAmount}
                        onChange={(e) => setPaymentSettings({...paymentSettings, minOrderAmount: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taux de taxe (%)
                      </label>
                      <input
                        type="number"
                        value={paymentSettings.taxRate}
                        onChange={(e) => setPaymentSettings({...paymentSettings, taxRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paramètres de livraison */}
            {activeTab === 'delivery' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres de livraison</h2>
                  <button
                    onClick={() => handleResetSettings('delivery')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rayon de livraison maximum (km)
                      </label>
                      <input
                        type="number"
                        value={deliverySettings.maxDeliveryRadius}
                        onChange={(e) => setDeliverySettings({...deliverySettings, maxDeliveryRadius: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temps de livraison estimé (minutes)
                      </label>
                      <input
                        type="number"
                        value={deliverySettings.estimatedDeliveryTime}
                        onChange={(e) => setDeliverySettings({...deliverySettings, estimatedDeliveryTime: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure de début des livraisons
                      </label>
                      <input
                        type="time"
                        value={deliverySettings.workingHours.start}
                        onChange={(e) => setDeliverySettings({
                          ...deliverySettings, 
                          workingHours: {
                            ...deliverySettings.workingHours,
                            start: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure de fin des livraisons
                      </label>
                      <input
                        type="time"
                        value={deliverySettings.workingHours.end}
                        onChange={(e) => setDeliverySettings({
                          ...deliverySettings, 
                          workingHours: {
                            ...deliverySettings.workingHours,
                            end: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Autoriser les livraisons programmées</h3>
                      <p className="text-sm text-gray-600">
                        Permettre aux utilisateurs de planifier leurs livraisons à l'avance
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={deliverySettings.allowScheduledDeliveries}
                        onChange={() => setDeliverySettings({...deliverySettings, allowScheduledDeliveries: !deliverySettings.allowScheduledDeliveries})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Jours de fermeture</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => (
                        <label key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={deliverySettings.daysOff.includes(index)}
                            onChange={() => {
                              const newDaysOff = [...deliverySettings.daysOff];
                              if (newDaysOff.includes(index)) {
                                const idx = newDaysOff.indexOf(index);
                                newDaysOff.splice(idx, 1);
                              } else {
                                newDaysOff.push(index);
                              }
                              setDeliverySettings({...deliverySettings, daysOff: newDaysOff});
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paramètres de sécurité */}
            {activeTab === 'security' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres de sécurité</h2>
                  <button
                    onClick={() => handleResetSettings('security')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Vérification d'email obligatoire</h3>
                      <p className="text-sm text-gray-600">
                        Les utilisateurs doivent vérifier leur email avant de pouvoir se connecter
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={securitySettings.requireEmailVerification}
                        onChange={() => setSecuritySettings({...securitySettings, requireEmailVerification: !securitySettings.requireEmailVerification})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Authentification à deux facteurs</h3>
                      <p className="text-sm text-gray-600">
                        Activer l'authentification à deux facteurs pour tous les utilisateurs
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={securitySettings.twoFactorAuth}
                        onChange={() => setSecuritySettings({...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Politique de mot de passe</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">
                          Longueur minimale
                        </label>
                        <input
                          type="number"
                          min="6"
                          max="20"
                          value={securitySettings.passwordPolicy.minLength}
                          onChange={(e) => setSecuritySettings({
                            ...securitySettings, 
                            passwordPolicy: {
                              ...securitySettings.passwordPolicy,
                              minLength: parseInt(e.target.value)
                            }
                          })}
                          className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">
                          Exiger des majuscules
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={securitySettings.passwordPolicy.requireUppercase}
                            onChange={() => setSecuritySettings({
                              ...securitySettings, 
                              passwordPolicy: {
                                ...securitySettings.passwordPolicy,
                                requireUppercase: !securitySettings.passwordPolicy.requireUppercase
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">
                          Exiger des chiffres
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={securitySettings.passwordPolicy.requireNumbers}
                            onChange={() => setSecuritySettings({
                              ...securitySettings, 
                              passwordPolicy: {
                                ...securitySettings.passwordPolicy,
                                requireNumbers: !securitySettings.passwordPolicy.requireNumbers
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">
                          Exiger des caractères spéciaux
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={securitySettings.passwordPolicy.requireSpecialChars}
                            onChange={() => setSecuritySettings({
                              ...securitySettings, 
                              passwordPolicy: {
                                ...securitySettings.passwordPolicy,
                                requireSpecialChars: !securitySettings.passwordPolicy.requireSpecialChars
                              }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration de session (heures)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tentatives de connexion max
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paramètres de notification */}
            {activeTab === 'notification' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres de notification</h2>
                  <button
                    onClick={() => handleResetSettings('notification')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Notifications par email</h3>
                        <p className="text-sm text-gray-600">
                          Envoyer des notifications par email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationSettings.enableEmailNotifications}
                          onChange={() => setNotificationSettings({...notificationSettings, enableEmailNotifications: !notificationSettings.enableEmailNotifications})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Notifications push</h3>
                        <p className="text-sm text-gray-600">
                          Envoyer des notifications push
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationSettings.enablePushNotifications}
                          onChange={() => setNotificationSettings({...notificationSettings, enablePushNotifications: !notificationSettings.enablePushNotifications})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Notifications SMS</h3>
                        <p className="text-sm text-gray-600">
                          Envoyer des notifications par SMS
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationSettings.enableSmsNotifications}
                          onChange={() => setNotificationSettings({...notificationSettings, enableSmsNotifications: !notificationSettings.enableSmsNotifications})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Alertes administrateur</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Nouveaux utilisateurs
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.adminAlerts.newUsers}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                adminAlerts: {
                                  ...notificationSettings.adminAlerts,
                                  newUsers: !notificationSettings.adminAlerts.newUsers
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Nouvelles commandes
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.adminAlerts.newOrders}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                adminAlerts: {
                                  ...notificationSettings.adminAlerts,
                                  newOrders: !notificationSettings.adminAlerts.newOrders
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Problèmes de paiement
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.adminAlerts.paymentIssues}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                adminAlerts: {
                                  ...notificationSettings.adminAlerts,
                                  paymentIssues: !notificationSettings.adminAlerts.paymentIssues
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Erreurs système
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.adminAlerts.systemErrors}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                adminAlerts: {
                                  ...notificationSettings.adminAlerts,
                                  systemErrors: !notificationSettings.adminAlerts.systemErrors
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Modèles d'email</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Email de bienvenue
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.emailTemplates.welcome}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                emailTemplates: {
                                  ...notificationSettings.emailTemplates,
                                  welcome: !notificationSettings.emailTemplates.welcome
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Confirmation de commande
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.emailTemplates.orderConfirmation}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                emailTemplates: {
                                  ...notificationSettings.emailTemplates,
                                  orderConfirmation: !notificationSettings.emailTemplates.orderConfirmation
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Mises à jour de livraison
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.emailTemplates.deliveryUpdates}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                emailTemplates: {
                                  ...notificationSettings.emailTemplates,
                                  deliveryUpdates: !notificationSettings.emailTemplates.deliveryUpdates
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-700">
                            Réinitialisation de mot de passe
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.emailTemplates.passwordReset}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings, 
                                emailTemplates: {
                                  ...notificationSettings.emailTemplates,
                                  passwordReset: !notificationSettings.emailTemplates.passwordReset
                                }
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paramètres de base de données */}
            {activeTab === 'database' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Paramètres de base de données</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Database className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Informations de la base de données</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Type de base de données:</span>
                        <span className="font-medium">PostgreSQL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Version:</span>
                        <span className="font-medium">14.5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taille totale:</span>
                        <span className="font-medium">256 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nombre de tables:</span>
                        <span className="font-medium">15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière sauvegarde:</span>
                        <span className="font-medium">15/06/2025 03:00</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Sauvegardes</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Sauvegardes automatiques</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={true}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Fréquence</span>
                          <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                            <option>Quotidienne</option>
                            <option>Hebdomadaire</option>
                            <option>Mensuelle</option>
                          </select>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Rétention</span>
                          <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                            <option>7 jours</option>
                            <option>30 jours</option>
                            <option>90 jours</option>
                          </select>
                        </div>
                        
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Créer une sauvegarde maintenant
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Maintenance</h3>
                      <div className="space-y-4">
                        <button className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Optimiser les tables
                        </button>
                        <button className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Vérifier l'intégrité
                        </button>
                        <button className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Nettoyer les données obsolètes
                        </button>
                        <button className="w-full bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                          Réinitialiser la base de données
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-medium text-yellow-900">Zone de danger</h3>
                    </div>
                    
                    <p className="text-sm text-yellow-700 mb-4">
                      Ces actions sont potentiellement destructrices et ne doivent être utilisées qu'en dernier recours.
                    </p>
                    
                    <div className="space-y-3">
                      <button className="w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
                        Exporter toutes les données
                      </button>
                      <button className="w-full bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                        Purger les données utilisateurs
                      </button>
                      <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                        Réinitialiser complètement le système
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Journaux */}
            {activeTab === 'logs' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Journaux système</h2>
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <option>Tous les journaux</option>
                      <option>Erreurs</option>
                      <option>Avertissements</option>
                      <option>Informations</option>
                      <option>Débug</option>
                    </select>
                    <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Actualiser
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Journaux récents</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Niveau:</span>
                      <select className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                        <option>INFO</option>
                        <option>WARN</option>
                        <option>ERROR</option>
                        <option>DEBUG</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-80 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:32:45]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Utilisateur connecté: admin@example.com</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:30:12]</span>
                        <span className="text-yellow-400 mr-2">[WARN]</span>
                        <span>Tentative de connexion échouée: user123@example.com</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:28:55]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Nouvelle commande créée: #ORD-12345</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:25:33]</span>
                        <span className="text-red-400 mr-2">[ERROR]</span>
                        <span>Échec de paiement: transaction_id=tx_789012</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:22:18]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Nouvel utilisateur inscrit: patient@example.com</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:20:05]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Commande #ORD-12344 marquée comme livrée</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:15:42]</span>
                        <span className="text-yellow-400 mr-2">[WARN]</span>
                        <span>Utilisation élevée de CPU: 85%</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:10:30]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Sauvegarde de la base de données réussie</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:05:18]</span>
                        <span className="text-red-400 mr-2">[ERROR]</span>
                        <span>Échec de connexion à la base de données - tentative 1/3</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:05:20]</span>
                        <span className="text-red-400 mr-2">[ERROR]</span>
                        <span>Échec de connexion à la base de données - tentative 2/3</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:05:22]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Connexion à la base de données rétablie</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 mr-2">[2025-06-15 14:00:00]</span>
                        <span className="text-blue-400 mr-2">[INFO]</span>
                        <span>Démarrage du système PharmaDelivery v1.0.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Paramètres de journalisation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Niveau de journalisation</span>
                        <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                          <option>DEBUG</option>
                          <option>INFO</option>
                          <option>WARN</option>
                          <option>ERROR</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Rotation des journaux</span>
                        <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                          <option>Quotidienne</option>
                          <option>Hebdomadaire</option>
                          <option>Mensuelle</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Rétention des journaux</span>
                        <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                          <option>7 jours</option>
                          <option>30 jours</option>
                          <option>90 jours</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Journalisation des requêtes SQL</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={false}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Télécharger les journaux
                      </button>
                      <button className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        Vider les journaux
                      </button>
                      <button className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        Configurer les alertes
                      </button>
                      <button className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        Intégrer avec Sentry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aide */}
            {activeTab === 'help' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Aide et support</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Centre d'aide administrateur</h3>
                    </div>
                    
                    <p className="text-sm text-blue-800 mb-4">
                      Bienvenue dans le centre d'aide administrateur de PharmaDelivery. Vous trouverez ici des ressources pour vous aider à gérer efficacement la plateforme.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a href="#" className="bg-white p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                        <h4 className="font-medium text-blue-900 mb-1">Guide de l'administrateur</h4>
                        <p className="text-xs text-blue-700">Documentation complète pour les administrateurs</p>
                      </a>
                      
                      <a href="#" className="bg-white p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                        <h4 className="font-medium text-blue-900 mb-1">Tutoriels vidéo</h4>
                        <p className="text-xs text-blue-700">Apprenez par la pratique avec nos vidéos</p>
                      </a>
                      
                      <a href="#" className="bg-white p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                        <h4 className="font-medium text-blue-900 mb-1">FAQ</h4>
                        <p className="text-xs text-blue-700">Réponses aux questions fréquentes</p>
                      </a>
                      
                      <a href="#" className="bg-white p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                        <h4 className="font-medium text-blue-900 mb-1">Base de connaissances</h4>
                        <p className="text-xs text-blue-700">Articles détaillés sur les fonctionnalités</p>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Contacter le support</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">support@pharmadelivery.com</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Téléphone</p>
                            <p className="text-sm text-gray-600">+33 1 23 45 67 89</p>
                          </div>
                        </div>
                        
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Ouvrir un ticket de support
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Ressources</h3>
                      <div className="space-y-3">
                        <a href="#" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Documentation API</p>
                            <p className="text-xs text-gray-600">Intégrez avec notre API</p>
                          </div>
                        </a>
                        
                        <a href="#" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Guide de dépannage</p>
                            <p className="text-xs text-gray-600">Résoudre les problèmes courants</p>
                          </div>
                        </a>
                        
                        <a href="#" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Meilleures pratiques</p>
                            <p className="text-xs text-gray-600">Optimisez votre utilisation</p>
                          </div>
                        </a>
                        
                        <a href="#" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Notes de version</p>
                            <p className="text-xs text-gray-600">Dernières mises à jour</p>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Informations système</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version du système:</span>
                        <span className="font-medium text-gray-900">PharmaDelivery v1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version de la base de données:</span>
                        <span className="font-medium text-gray-900">PostgreSQL 14.5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version de Node.js:</span>
                        <span className="font-medium text-gray-900">v18.16.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Environnement:</span>
                        <span className="font-medium text-gray-900">Production</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dernière mise à jour:</span>
                        <span className="font-medium text-gray-900">15/06/2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium text-gray-900">15 jours, 7 heures</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;