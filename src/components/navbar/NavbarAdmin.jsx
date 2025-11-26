import React, { useState } from 'react';
import { Menu, X, Users, UserPlus, LogOut, Shield, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function NavbarAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Ajout d'un lien vers le Dashboard Admin (si /admindas est la page principale)
  const navItems = [
    // { to: '/admindas', label: 'Tableau de bord', icon: <Home size={20} className="mr-2" /> },
    { to: '/admin-auth', label: 'Gest. Admins', icon: <Shield size={20} className="mr-2" /> },
    { to: '/utilisateur-login', label: 'Connexion utilisateurs ', icon: <Users size={20} className="mr-2" /> },
    { to: '/utilisateur', label: 'Inscription utilisateurs', icon: <UserPlus size={20} className="mr-2" /> },
  ];

  // Remplacement des couleurs d'accentuation (blue -> emerald)
  const navLink = (to) =>
    `flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
      location.pathname === to
        ? 'bg-emerald-600 bg-opacity-90 text-white shadow-md shadow-emerald-500/30' // Couleur active Émeraude
        : 'hover:bg-cyan-100 dark:hover:bg-gray-700 hover:text-emerald-700 dark:hover:text-cyan-300 text-gray-700 dark:text-gray-200'
    }`;

  const handleLogout = () => {
    // localStorage.removeItem('adminToken'); // décommente si tu utilises un token
    navigate('/admin-auth');
  };

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 shadow-lg sticky top-0 z-50 animate-fade-in-down backdrop-blur-sm border-b border-emerald-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          
          {/* Logo et Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-emerald-100 dark:hover:bg-gray-700 transition"
              aria-label="Ouvrir le menu"
            >
              {sidebarOpen ? <X size={28} className="animate-fade-in-up" /> : <Menu size={28} className="animate-fade-in-down" />}
            </button>
            <span 
                // Couleur du titre : Émeraude
                className="text-2xl font-extrabold text-emerald-700 dark:text-cyan-300 tracking-tight flex items-center gap-2"
            >
              <Shield size={28} className="animate-bounce" />
              Espace Administration
            </span>
          </div>
          
          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(item => (
              <Link key={item.to} to={item.to} className={navLink(item.to)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {/* <button
              onClick={handleLogout}
              // Bouton Déconnexion : Couleur d'alerte Rouge
              className="flex items-center px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all ml-4 shadow-md shadow-red-500/30 animate-fade-in-up"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button> */}
          </div>
        </div>
      </nav>

      {/* Sidebar responsive */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!sidebarOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-500 backdrop-blur-sm ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white/95 dark:bg-gray-900/95 shadow-2xl transform transition-transform duration-500 border-r border-emerald-100 dark:border-gray-700
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} animate-slide-in backdrop-blur-lg`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-emerald-100 dark:border-gray-700">
            <span className="text-xl font-bold text-emerald-700 dark:text-cyan-300 flex items-center gap-2">
              <Shield size={24} className="animate-bounce" />
              Menu Admin
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-gray-700 transition"
              aria-label="Fermer le menu"
            >
              <X size={28} />
            </button>
          </div>
          
          <nav className="flex flex-col gap-1 mt-4 px-3">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={navLink(item.to)}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {/* <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all mt-6 shadow-md shadow-red-500/30 animate-fade-in-up"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button> */}
          </nav>
        </aside>
      </div>

      {/* Animations CSS (Conservées) */}
      <style>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.7s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s;
        }
        .animate-bounce {
          animation: bounce 1.2s infinite;
        }
        .animate-slide-in {
          animation: slideInSidebar 0.5s;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-8px);}
        }
        @keyframes slideInSidebar {
          from { opacity: 0; transform: translateX(-100%);}
          to { opacity: 1; transform: translateX(0);}
        }
      `}</style>
    </>
  );
}