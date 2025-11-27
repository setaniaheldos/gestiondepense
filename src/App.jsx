import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Correction: Ajout de l'extension .jsx à tous les imports de composants
import Navbar from './components/navbar/Navbar.jsx';
import NavbarAdmin from './components/navbar/NavbarAdmin.jsx';
import Accueil from './components/pages/Accueil.jsx';
import Patients from './components/pages/Patients.jsx';
import Praticiens from './components/pages/Praticients.jsx';
import RendezVous from './components/pages/RendezVous.jsx';
import Adminaction from './components/admin/AdminAction.jsx';
import Authen from './components/admin/AdminForm.jsx';
import AdminList from './components/admin/AdminList.jsx';
import Utilisateur from './components/Utlisateur/ResisterUtil.jsx';
import UtilisateurLogin from './components/Utlisateur/utilisateurLogin.jsx';
import AdminAuth from './components/admin/AdminAuth.jsx'; // C'est ici que l'Admin se connecte
import AdminDAs from './components/admin/AdminDashboard.jsx';
import Consultations from './components/pages/Consultations.jsx';
import Prescription from './components/pages/Prescription.jsx';
import Examen from './components/pages/Examen.jsx';
// import Consultation from './components/pages/Consultations';

export default function App() {
  // showAdminNavbar est VRAI par défaut, affichant NavbarAdmin
  const [showAdminNavbar, setShowAdminNavbar] = useState(true);

  // Fonction à passer à UtilisateurLogin (user) pour basculer vers Navbar
  // Ceci met showAdminNavbar à FAUX, affichant Navbar.
  const handleUserLogin = () => setShowAdminNavbar(false);
  
  // NOUVELLE FONCTION : Pour basculer vers Navbar après connexion Admin
  // Ceci met showAdminNavbar à FAUX, affichant Navbar.
  const handleAdminLogin = () => setShowAdminNavbar(false); 

  // Fonction à passer à Navbar pour revenir à NavbarAdmin lors de la déconnexion
  // Ceci met showAdminNavbar à VRAI, affichant NavbarAdmin.
  const handleUserLogout = () => setShowAdminNavbar(true);

  return (
    <Router>
      <div className="bg-gray-50 dark:bg-gray-100 min-h-screen text-gray-900 dark:text-white transition">
        {/* L'affichage de la Navbar dépend de l'état de connexion */}
        {showAdminNavbar ? <NavbarAdmin /> : <Navbar onLogout={handleUserLogout} />}
        <Routes>
          {/* Redirige la route par défaut (/) vers /admin-auth pour forcer la connexion au démarrage */}
          <Route path="/" element={<Navigate to="/admin-auth" replace />} />

          <Route path="/accueil" element={<Accueil />} />
          <Route path="/examen" element={<Examen />} />
    
          <Route path="/patients" element={<Patients />} />
          <Route path="/praticiens" element={<Praticiens />} />
          <Route path="/admindas" element={<AdminDAs />} />
          
          <Route path="/authen" element={<Authen />} />
          <Route path="/admin" element={<AdminList />} />
          <Route path="/action" element={<Adminaction />} />
          <Route path="/utilisateur" element={<Utilisateur />} />
          
          {/* Route de connexion Admin */}
          <Route 
            path="/admin-auth" 
            element={<AdminAuth onAdminLogin={handleAdminLogin} />} 
          />
        
          {/* Route de connexion Utilisateur */}
          <Route
            path="/utilisateur-login"
            element={<UtilisateurLogin onLogin={handleUserLogin} />}
          />
          {/* Autres routes de l'application */}
          <Route path="/consultations" element={<Consultations />} />
          <Route path="/prescription" element={<Prescription />} />
          <Route path="/rendezvous" element={<RendezVous />} />
        </Routes>
      </div>
    </Router>
  );
}