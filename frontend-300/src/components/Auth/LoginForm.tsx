import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle,
  Zap,
  Globe,
  Phone,
  Heart,
  Users,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import Logo from '../common/Logo';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      if (err.message.includes('attente d\'approbation')) {
        setError('Votre compte est en attente d\'approbation par un administrateur. Vous recevrez un email une fois votre compte activé.');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    }
  };

  const quickFillDemo = () => {
    setEmail('patient@example.com');
    setPassword('123456');
  };

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Info */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <div className="text-center lg:text-left mb-8">
              {/* Logo */}
              <div className="flex items-center justify-center lg:justify-start mb-8">
                <Logo size="lg" />
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Bienvenue sur
                <span className="block bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent">
                  Mavoily
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                La première plateforme camerounaise de livraison pharmaceutique. 
                Vos médicaments livrés en 30 minutes, 24h/24 avec suivi médical professionnel.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-red-100 hover:border-red-200 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mr-4">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sécurisé & Certifié</div>
                    <div className="text-sm text-gray-600">Pharmacies agréées</div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-100 hover:border-blue-200 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Livraison Express</div>
                    <div className="text-sm text-gray-600">En moins de 30min</div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-green-100 hover:border-green-200 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Suivi Médical</div>
                    <div className="text-sm text-gray-600">Pharmaciens qualifiés</div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-purple-100 hover:border-purple-200 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">150K+ Clients</div>
                    <div className="text-sm text-gray-600">Nous font confiance</div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 text-center lg:text-left">
                  Pourquoi choisir Mavoily ?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Plus de 15,000 médicaments disponibles</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Pharmaciens diplômés et certifiés</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Livraison géolocalisée en temps réel</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Service client 24h/24, 7j/7</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <div className="flex items-center justify-center lg:justify-start bg-white/50 rounded-lg px-4 py-2">
                  <Phone className="h-4 w-4 mr-2 text-red-600" />
                  <span>Urgence : <strong className="text-red-600">237 697 65 68 50</strong></span>
                </div>
                <div className="flex items-center justify-center lg:justify-start bg-white/50 rounded-lg px-4 py-2">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Service <strong className="text-blue-600">24h/24</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <div className="bg-white/90 backdrop-blur-lg p-8 lg:p-10 rounded-3xl shadow-2xl border border-white/30">
              
              {/* Back Button */}
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Retour à l'accueil
                </button>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h3>
                <p className="text-gray-600">
                  Accédez à votre espace personnel Mavoily
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 text-lg"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 text-lg"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-red-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl flex items-start">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-sm font-bold">!</span>
                    </div>
                    <span className="text-sm leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Quick Demo Fill */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Test rapide</p>
                      <p className="text-xs text-blue-700">Utilisez un compte de démonstration</p>
                    </div>
                    <button
                      type="button"
                      onClick={quickFillDemo}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Remplir
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white py-4 px-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6 mr-3" />
                      Se connecter
                    </>
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors text-lg"
                  >
                    Pas encore de compte ? <span className="underline decoration-2">S'inscrire maintenant</span>
                  </button>
                </div>
              </form>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    En vous connectant, vous acceptez nos conditions d'utilisation
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Données sécurisées
                    </span>
                    <span className="flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      Conforme RGPD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;