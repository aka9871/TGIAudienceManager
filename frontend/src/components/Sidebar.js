import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Bot as RobotIcon, 
  MessageCircle as MessageCircleIcon, 
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Target as TargetIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Base navigation items for all users
  const baseNavigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Assistants',
      href: '/assistants',
      icon: RobotIcon,
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageCircleIcon,
    },
  ];

  // Admin-only navigation items
  const adminNavigationItems = [
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3Icon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
    },
  ];

  // Combine navigation items based on user role
  const navigationItems = user?.role === 'admin' 
    ? [...baseNavigationItems, ...adminNavigationItems]
    : baseNavigationItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-ddb-yellow rounded-lg">
          <TargetIcon className="w-6 h-6 text-ddb-black" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-ddb-black">DDB TGI</h1>
          <p className="text-sm text-gray-500">Audience Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile and Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="flex items-center justify-center w-8 h-8 bg-ddb-yellow rounded-full">
            <span className="text-sm font-semibold text-ddb-black">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username}
              </p>
              {user?.role === 'admin' && (
                <span className="px-2 py-1 text-xs font-medium text-ddb-black bg-ddb-yellow rounded-full">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'Utilisateur'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Plateforme interne DDB
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Usage strictement confidentiel
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
