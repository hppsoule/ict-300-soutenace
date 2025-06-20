import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageCircle,
  User,
  LogOut,
  Pill,
  Truck,
  Users,
  Settings,
  Map,
  Bell,
  Building2
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    ];

    switch (user?.role) {
      case 'patient':
        return [
          ...baseItems,
          { icon: Package, label: t('nav.catalog'), path: '/catalog' },
          { icon: ShoppingCart, label: t('nav.orders'), path: '/orders' },
          { icon: Map, label: 'Suivi', path: '/tracking' },
          { icon: MessageCircle, label: t('nav.chat'), path: '/chat' },
          { icon: Bell, label: 'Notifications', path: '/notifications' },
          { icon: User, label: t('nav.profile'), path: '/profile' },
        ];
      case 'pharmacist':
        return [
          ...baseItems,
          { icon: Building2, label: 'Ma Pharmacie', path: '/pharmacy' },
          { icon: Pill, label: 'Médicaments', path: '/medicines' },
          { icon: ShoppingCart, label: t('nav.orders'), path: '/orders' },
          { icon: MessageCircle, label: t('nav.chat'), path: '/chat' },
          { icon: Bell, label: 'Notifications', path: '/notifications' },
          { icon: User, label: t('nav.profile'), path: '/profile' },
        ];
      case 'driver':
        return [
          ...baseItems,
          { icon: Truck, label: 'Livraisons', path: '/deliveries' },
          { icon: Map, label: 'Carte', path: '/tracking' },
          { icon: MessageCircle, label: t('nav.chat'), path: '/chat' },
          { icon: Bell, label: 'Notifications', path: '/notifications' },
          { icon: User, label: t('nav.profile'), path: '/profile' },
        ];
      case 'admin':
        return [
          ...baseItems,
          { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
          { icon: Building2, label: 'Pharmacies', path: '/admin/pharmacies' },
          { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders' },
          { icon: Bell, label: 'Notifications', path: '/notifications' },
          { icon: Settings, label: 'Paramètres', path: '/admin/settings' },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PharmaDelivery</h1>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;