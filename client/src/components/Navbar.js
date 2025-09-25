import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  Home, 
  Key, 
  Plus, 
  LogOut, 
  User
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Licenses', href: '/licenses', icon: Key },
    { name: 'Create License', href: '/licenses/create', icon: Plus },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="shadow-lg border-b border-gray-200 w-full" style={{ backgroundColor: '#5c6bb5' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          
          {/* LEFT: Torro Logo - Leftmost corner */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/torro-logo.png" 
                alt="Torro Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-2xl font-bold text-white">Torro</span>
            </Link>
          </div>

          {/* CENTER: Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-white text-gray-800 shadow-md'
                      : 'text-white hover:text-gray-200 hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT: Account and Logout - Rightmost corner */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-white">
              <User className="h-5 w-5" />
              <span className="font-medium">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-white hover:text-gray-200 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;