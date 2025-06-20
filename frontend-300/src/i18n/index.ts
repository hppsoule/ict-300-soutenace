import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Navigation
      'nav.dashboard': 'Tableau de bord',
      'nav.catalog': 'Catalogue',
      'nav.orders': 'Commandes',
      'nav.chat': 'Chat',
      'nav.profile': 'Profil',
      'nav.logout': 'Déconnexion',
      
      // Auth
      'auth.login': 'Connexion',
      'auth.email': 'Email',
      'auth.password': 'Mot de passe',
      'auth.signin': 'Se connecter',
      'auth.demo': 'Comptes de démonstration:',
      
      // Dashboard
      'dashboard.welcome': 'Bienvenue',
      'dashboard.orders': 'Commandes',
      'dashboard.pending': 'En attente',
      'dashboard.completed': 'Terminées',
      'dashboard.revenue': 'Chiffre d\'affaires',
      
      // Orders
      'order.status.pending': 'En attente',
      'order.status.validated': 'Validée',
      'order.status.rejected': 'Rejetée',
      'order.status.paid': 'Payée',
      'order.status.preparing': 'En préparation',
      'order.status.ready': 'Prête',
      'order.status.in_transit': 'En livraison',
      'order.status.delivered': 'Livrée',
      'order.status.cancelled': 'Annulée',
      
      // Common
      'common.loading': 'Chargement...',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.confirm': 'Confirmer',
      'common.edit': 'Modifier',
      'common.delete': 'Supprimer',
      'common.view': 'Voir',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.price': 'Prix',
      'common.quantity': 'Quantité',
      'common.total': 'Total',
      'common.address': 'Adresse',
      'common.phone': 'Téléphone',
      'common.email': 'Email',
    }
  },
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.catalog': 'Catalog',
      'nav.orders': 'Orders',
      'nav.chat': 'Chat',
      'nav.profile': 'Profile',
      'nav.logout': 'Logout',
      
      // Auth
      'auth.login': 'Login',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.signin': 'Sign In',
      'auth.demo': 'Demo accounts:',
      
      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.orders': 'Orders',
      'dashboard.pending': 'Pending',
      'dashboard.completed': 'Completed',
      'dashboard.revenue': 'Revenue',
      
      // Orders
      'order.status.pending': 'Pending',
      'order.status.validated': 'Validated',
      'order.status.rejected': 'Rejected',
      'order.status.paid': 'Paid',
      'order.status.preparing': 'Preparing',
      'order.status.ready': 'Ready',
      'order.status.in_transit': 'In Transit',
      'order.status.delivered': 'Delivered',
      'order.status.cancelled': 'Cancelled',
      
      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.view': 'View',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.price': 'Price',
      'common.quantity': 'Quantity',
      'common.total': 'Total',
      'common.address': 'Address',
      'common.phone': 'Phone',
      'common.email': 'Email',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('pharmaDeliveryLanguage') || 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;