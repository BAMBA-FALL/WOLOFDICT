import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Book, 
  Home, 
  CheckSquare, 
  PlusCircle, 
  List, 
  BarChart2, 
  Users, 
  Settings, 
  HelpCircle, 
  ChevronLeft,
  LogOut 
} from 'lucide-react';

const Sidebar = ({ user, isOpen, toggleSidebar }) => {
  const location = useLocation();
  
  // Navigation links avec gestion des permissions
  const navigationLinks = [
    { 
      name: 'Tableau de bord', 
      icon: Home, 
      href: '/admin', 
      active: location.pathname === '/admin' 
    },
    { 
      name: 'Dictionnaire', 
      icon: Book, 
      href: '/admin/words', 
      active: location.pathname.includes('/admin/words') 
    },
    { 
      name: 'Validation', 
      icon: CheckSquare, 
      href: '/admin/validation', 
      active: location.pathname.includes('/admin/validation') 
    },
    { 
      name: 'Ajouter un mot', 
      icon: PlusCircle, 
      href: '/admin/add-word', 
      active: location.pathname.includes('/admin/add-word') 
    },
    { 
      name: 'Statistiques', 
      icon: BarChart2, 
      href: '/admin/stats', 
      active: location.pathname.includes('/admin/stats') 
    },
    // Admin only
    { 
      name: 'Utilisateurs', 
      icon: Users, 
      href: '/admin/users', 
      active: location.pathname.includes('/admin/users'),
      adminOnly: true 
    },
    { 
      name: 'Paramètres', 
      icon: Settings, 
      href: '/admin/settings', 
      active: location.pathname.includes('/admin/settings') 
    },
    { 
      name: 'Aide', 
      icon: HelpCircle, 
      href: '/admin/help', 
      active: location.pathname.includes('/admin/help') 
    }
  ];

  // Filtrer les liens selon le rôle de l'utilisateur
  const filteredNavigation = navigationLinks.filter(
    link => !link.adminOnly || user?.role === 'admin'
  );

  return (
    <div 
      className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-screen
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header du sidebar */}
        <div className="flex items-center justify-between h-16 px-4 bg-blue-900">
          <div className="flex items-center">
            <Book className="h-8 w-8 mr-2" />
            <div>
              <h1 className="text-lg font-bold">Dict. Admin</h1>
              <p className="text-xs text-blue-300">Gestion du dictionnaire</p>
            </div>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md text-blue-300 hover:text-white hover:bg-blue-700 md:hidden"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        
        {/* Profil utilisateur */}
        {user && (
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user.firstName ? user.firstName[0] : user.username[0]}
              </div>
              <div className="ml-3">
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-blue-300">{user.role === 'admin' ? 'Administrateur' : 'Expert'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="p-4 flex-grow overflow-y-auto">
          <nav className="space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                  ${item.active 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5 opacity-75" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-blue-700">
          <Link
            to="/admin/help"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 hover:text-white"
          >
            <HelpCircle className="mr-3 h-5 w-5" />
            Centre d'aide
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="flex items-center w-full px-3 py-2 mt-2 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
        
        <div className="px-4 py-2 bg-blue-900 text-center">
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} Dict. Wolof-Français
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;