import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Pill, 
  Truck, 
  Clock, 
  Shield, 
  MapPin, 
  Phone, 
  Star, 
  ArrowRight,
  CheckCircle,
  Heart,
  Users,
  Zap,
  Menu,
  X,
  Award,
  Globe,
  Smartphone,
  ChevronDown,
  Play
} from 'lucide-react';
import Logo from '../components/common/Logo';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Animation d'entrée
    setIsVisible(true);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Pill,
      title: 'Catalogue Étendu',
      description: 'Plus de 15,000 médicaments et produits pharmaceutiques certifiés disponibles 24h/24',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Clock,
      title: 'Livraison Express',
      description: 'Livraison garantie en moins de 30 minutes dans un rayon de 10km',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Sécurité Maximale',
      description: 'Pharmacies agréées par le ministère et livreurs certifiés avec assurance',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: MapPin,
      title: 'Suivi GPS',
      description: 'Géolocalisation en temps réel de votre commande jusqu\'à votre porte',
      color: 'from-orange-400 to-red-500'
    }
  ];

  const testimonials = [
    {
      name: 'Soulemane Djacko',
      role: 'Fondateur & CEO MavoilyPharma',
      comment: 'Notre mission est de révolutionner l\'accès aux soins pharmaceutiques au Cameroun. Avec MavoilyPharma, nous rendons les médicaments accessibles à tous, partout et à tout moment.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/5327665/pexels-photo-5327665.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'Hawa Moussa',
      role: 'Pharmacienne partenaire',
      comment: 'Grâce à MavoilyPharma, je peux servir mes patients 24h/24. La plateforme est intuitive et me permet de gérer efficacement mes commandes tout en garantissant la qualité des soins.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'Fatouma Fotor',
      role: 'Cliente fidèle',
      comment: 'En tant que mère de famille, MavoilyPharma m\'a sauvé la vie ! Plus besoin de courir en pharmacie avec des enfants malades. Livraison rapide et médicaments toujours disponibles.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/5384588/pexels-photo-5384588.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    }
  ];

  const stats = [
    { icon: Users, number: '150K+', label: 'Clients satisfaits', color: 'text-blue-400' },
    { icon: Pill, number: '15K+', label: 'Médicaments disponibles', color: 'text-green-400' },
    { icon: Truck, number: '800+', label: 'Livreurs certifiés', color: 'text-purple-400' },
    { icon: Heart, number: '99.2%', label: 'Satisfaction client', color: 'text-red-400' }
  ];

  const certifications = [
    { name: 'Ministère de la Santé', icon: Award },
    { name: 'ISO 27001', icon: Shield },
    { name: 'Pharmacies Agréées', icon: CheckCircle },
    { name: 'Livraison Certifiée', icon: Truck }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo size="md" className="group cursor-pointer hover:scale-105 transition-transform duration-200" />
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-red-600 font-medium transition-colors">Services</a>
              <a href="#comment" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Comment ça marche</a>
              <a href="#temoignages" className="text-gray-700 hover:text-red-600 font-medium transition-colors">Témoignages</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</a>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-red-600 p-2"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t">
            <div className="px-4 py-6 space-y-4">
              <a href="#services" className="block text-gray-700 hover:text-red-600 font-medium">Services</a>
              <a href="#comment" className="block text-gray-700 hover:text-blue-600 font-medium">Comment ça marche</a>
              <a href="#temoignages" className="block text-gray-700 hover:text-red-600 font-medium">Témoignages</a>
              <a href="#contact" className="block text-gray-700 hover:text-blue-600 font-medium">Contact</a>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-red-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-red-50 via-white to-blue-50 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="inline-flex items-center bg-gradient-to-r from-red-100 to-blue-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Nouveau : Livraison 24h/24 disponible
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Vos médicaments
                <span className="block bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                  livrés en 30min
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                La première plateforme camerounaise de livraison pharmaceutique. 
                Commandez auprès de pharmacies certifiées et recevez vos médicaments 
                rapidement grâce à notre réseau de livreurs professionnels.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => navigate('/login')}
                  className="group bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button className="group flex items-center justify-center px-8 py-4 border-2 border-gray-300 hover:border-red-500 text-gray-700 hover:text-red-600 rounded-xl font-semibold transition-all duration-200">
                  <Play className="mr-2 h-5 w-5" />
                  Voir la démo
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-red-600" />
                  <span>Urgence : <strong>237 697 65 68 50</strong></span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Service 24h/24</span>
                </div>
              </div>
            </div>

            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-blue-100 rounded-full flex items-center justify-center">
                        <Pill className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <div className="font-semibold text-gray-900">Commande Express</div>
                        <div className="text-sm text-gray-500">En cours de livraison</div>
                      </div>
                    </div>
                    <div className="text-red-600 font-bold">15 min</div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Paracétamol 1000mg</span>
                      <span className="font-semibold">2,500 FCFA</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Vitamine C</span>
                      <span className="font-semibold">1,800 FCFA</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-gray-600">Total</span>
                    <span className="text-xl font-bold text-red-600">4,300 FCFA</span>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-full shadow-lg animate-bounce">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                  <Truck className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </div>
      </section>

      {/* Certifications Bar */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 font-medium">Certifié et approuvé par</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {certifications.map((cert, index) => {
              const Icon = cert.icon;
              return (
                <div key={index} className="flex flex-col items-center group cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                    <Icon className="h-8 w-8 text-gray-600 group-hover:text-red-600 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">{cert.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Mavoily en chiffres
            </h2>
            <p className="text-xl text-red-100">
              La confiance de milliers de Camerounais
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 group-hover:bg-white/30 transition-colors">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                    {stat.number}
                  </div>
                  <div className="text-red-100 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Mavoily ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme révolutionnaire qui transforme l'accès aux soins pharmaceutiques au Cameroun
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative">
                  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="comment" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Simple, rapide et sécurisé en 3 étapes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: 1,
                title: 'Commandez en ligne',
                description: 'Recherchez vos médicaments dans notre catalogue de plus de 15,000 produits et ajoutez-les à votre panier en quelques clics',
                color: 'from-red-500 to-pink-600'
              },
              {
                step: 2,
                title: 'Validation pharmacien',
                description: 'Un pharmacien diplômé vérifie votre ordonnance, valide votre commande et prépare vos médicaments avec soin',
                color: 'from-blue-500 to-cyan-600'
              },
              {
                step: 3,
                title: 'Livraison express',
                description: 'Recevez vos médicaments en moins de 30 minutes grâce à notre réseau de livreurs certifiés et géolocalisés',
                color: 'from-purple-500 to-indigo-600'
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r ${item.color} text-white rounded-full text-3xl font-bold mb-8 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-20 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-xl text-gray-600">
              Plus de 150,000 Camerounais nous font confiance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group transform hover:-translate-y-2">
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center">
                  <div className="relative">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 ring-4 ring-red-100 group-hover:ring-red-200 transition-all duration-300"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-2">
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-sm text-red-600 font-medium">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Prêt à révolutionner vos achats pharmaceutiques ?
          </h2>
          <p className="text-xl text-red-100 mb-10 max-w-3xl mx-auto">
            Rejoignez plus de 150,000 Camerounais qui font confiance à Mavoily 
            pour leurs besoins en médicaments
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/login')}
              className="group bg-white text-red-600 hover:bg-gray-100 px-10 py-4 rounded-xl text-lg font-bold transition-all duration-200 inline-flex items-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <CheckCircle className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              Commencer maintenant
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center text-red-100">
              <Smartphone className="h-5 w-5 mr-2" />
              <span>Application mobile bientôt disponible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Logo variant="white" size="md" className="mb-6" />
              <p className="text-gray-400 mb-6 leading-relaxed">
                La première plateforme camerounaise de livraison pharmaceutique. 
                Nous révolutionnons l'accès aux soins en rendant les médicaments 
                accessibles 24h/24 partout au Cameroun.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Services</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Livraison express</li>
                <li className="hover:text-white transition-colors cursor-pointer">Consultation en ligne</li>
                <li className="hover:text-white transition-colors cursor-pointer">Renouvellement d'ordonnances</li>
                <li className="hover:text-white transition-colors cursor-pointer">Pharmacie de garde</li>
                <li className="hover:text-white transition-colors cursor-pointer">Téléconsultation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-6">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Centre d'aide</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-white transition-colors cursor-pointer">FAQ</li>
                <li className="hover:text-white transition-colors cursor-pointer">Politique de confidentialité</li>
                <li className="hover:text-white transition-colors cursor-pointer">Conditions d'utilisation</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact d'urgence</h4>
                <div className="space-y-2 text-gray-400">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-red-400" />
                    <span className="font-semibold text-white">237 697 65 68 50</span>
                    <span className="ml-2">(24h/24)</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-blue-400" />
                    <span>Yaoundé, Douala, Bafoussam</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-gray-400 mb-2">
                  &copy; 2024 Mavoily. Tous droits réservés.
                </p>
                <p className="text-sm text-gray-500">
                  Agrément Ministère de la Santé Publique du Cameroun
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;