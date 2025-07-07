// src/components/admin/ExpertDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { 
  Book, 
  CheckSquare, 
  PlusCircle, 
  List, 
  Settings, 
  Users, 
  LogOut, 
  BarChart2 
} from 'lucide-react';
import WordValidation from './WordValidation';
import WordForm from './WordForm';
import WordsList from './WordsList';
import StatsPanel from './StatsPanel';
import UserManagement from './UserManagement';

const ExpertDashboard = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Charger les informations de l'utilisateur connecté
    const fetchUserData = async () => {
      // Code pour récupérer les données de l'utilisateur depuis l'API
      // setUser(userData);
    };
    
    fetchUserData();
  }, []);

  const handleLogout = () => {
    // Déconnexion
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-blue-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out fixed z-30 md:relative inset-y-0 left-0 w-64 overflow-y-auto`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Book className="h-8 w-8 mr-2" />
              <span className="text-xl font-semibold">Dictionnaire Admin</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="md:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {user && (
            <div className="mt-6 mb-8">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {user.firstName ? user.firstName[0] : user.username[0]}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs font-medium text-blue-300">{user.role}</p>
                </div>
              </div>
            </div>
          )}
          
          <nav className="mt-8">
            <div className="space-y-1">
              <Link to="/admin" className="group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-blue-700">
                <BarChart2 className="mr-3 h-5 w-5" />
                Tableau de bord
              </Link>
              <Link to="/admin/words" className="group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-blue-700">
                <List className="mr-3 h-5 w-5" />
                Liste des mots
              </Link>
              <Link to="/admin/validation" className="group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-blue-700">
                <CheckSquare className="mr-3 h-5 w-5" />
                Validation
              </Link>
              <Link to="/admin/add-word" className="group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-blue-700">
                <PlusCircle className="mr-3 h-5 w-5" />
                Ajouter un mot
              </Link>
              {user && user.role === 'admin' && (
                <Link to="/admin/users" className="group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-blue-700">
                  <Users className="mr-3 h-5 w-5" />
                  Utilisateurs
                </Link>
              )}
              <Link to="/admin/settings" className="group flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-blue-700">
                <Settings className="mr-3 h-5 w-5" />
                Paramètres
              </Link>
            </div>
          </nav>
        </div>
        <div className="absolute bottom-0 w-full">
          <button 
            onClick={handleLogout}
            className="flex items-center px-6 py-4 text-sm font-medium text-white hover:bg-blue-700 w-full"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="flex justify-between items-center px-6 py-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="text-gray-600 md:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Administration du Dictionnaire</h1>
            <div className="flex items-center space-x-4">
              {/* Notification icon */}
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          <Routes>
            <Route path="/" element={<StatsPanel />} />
            <Route path="/words" element={<WordsList />} />
            <Route path="/validation" element={<WordValidation />} />
            <Route path="/add-word" element={<WordForm />} />
            <Route path="/edit-word/:id" element={<WordForm />} />
            <Route path="/users" element={<UserManagement />} />
            {/* Autres routes */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ExpertDashboard;