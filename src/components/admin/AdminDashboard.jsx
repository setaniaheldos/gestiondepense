import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserTie, FaUsers, FaTrash, FaHome, FaUserPlus, FaUserCheck, FaSpinner, FaLockOpen, FaClock, FaTimesCircle, FaStethoscope, FaHospital, FaUserMd, FaCheckCircle } from 'react-icons/fa';

const API_BASE_URL = 'https://mon-api-rmv3.onrender.com';

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');

  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  // Fonction pour charger toutes les données
  const fetchAllData = useCallback(async () => {
    setLoadingAdmins(true);
    setLoadingUsers(true);
    try {
        const [adminsRes, usersRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/admins`),
            axios.get(`${API_BASE_URL}/users`)
        ]);
        setAdmins(adminsRes.data);
        setUsers(usersRes.data);
    } catch (err) {
        showMessage("❌ Erreur de connexion : impossible de charger les données Administrateurs/Utilisateurs.");
    } finally {
        setLoadingAdmins(false);
        setLoadingUsers(false);
    }
  }, []); 

  // Chargement initial
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); 

  // Supprimer un admin (sauf le premier)
  const handleDeleteAdmin = async (id, idx) => {
    // Correction : Assurer que l'ID est un entier pour la comparaison
    const adminId = parseInt(id); 
    
    if (idx === 0) {
        showMessage("⚠️ Le premier administrateur n'est pas supprimable pour garantir l'accès.", 4000);
        return;
    } 
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet Administrateur ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/admins/${adminId}`);
      setAdmins(prevAdmins => prevAdmins.filter(a => a.id !== adminId)); 
      showMessage("🗑️ Administrateur supprimé avec succès !");
    } catch {
      showMessage("❌ Erreur lors de la suppression de l'administrateur.");
    }
  };

  // 📢 CORRECTION APPLIQUÉE : Valider un utilisateur
  const approveUser = async (id) => {
    // Correction : Assurer que l'ID est un entier pour la comparaison de l'état
    const userId = parseInt(id); 

    try {
      // Appel à l'API
      await axios.put(`${API_BASE_URL}/users/${userId}/approve`);
      
      // Mise à jour de l'état local : on utilise l'ID converti
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, isApproved: 1 } : u)
      );
      showMessage("✅ Utilisateur validé avec succès ! (Statut mis à jour)");
    } catch (err) {
      // Afficher une erreur plus spécifique si possible
      const errorMsg = err.response?.data?.error || "Erreur lors de la validation.";
      showMessage(`❌ ${errorMsg}`);
    }
  };


  // Supprimer un utilisateur
  const handleDeleteUser = async (id) => {
    // Correction : Assurer que l'ID est un entier pour la comparaison
    const userId = parseInt(id); 

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet Utilisateur ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      // Mise à jour rapide de l'UI
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      showMessage("🗑️ Utilisateur archivé/supprimé avec succès !");
    } catch {
      showMessage("❌ Erreur lors de la suppression de l'utilisateur.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 dark:from-teal-900 dark:via-blue-900 dark:to-cyan-900 p-6 relative overflow-hidden">
      {/* ... (Éléments décoratifs inchangés) ... */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl">⚕️</div>
        <div className="absolute top-1/4 right-20 text-4xl">🩺</div>
        <div className="absolute bottom-20 left-1/4 text-5xl">💊</div>
        <div className="absolute bottom-10 right-10 text-6xl">🏥</div>
        <div className="absolute top-1/2 left-20 text-4xl">➕</div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border-t-4 border-teal-500 dark:border-teal-400 transition duration-500 relative z-10">
        
        {/* En-tête avec thème médical */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-teal-100 dark:bg-teal-900 p-4 rounded-full mr-4">
              <FaHospital className="text-3xl text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Tableau de Bord d'Administrateurs
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
            Gestion des accès administrateurs et utilisateurs du système médical
          </p>
        </div>
        
        {/* Message de Statut */}
        {message && (
          <div className={`mb-6 px-6 py-4 rounded-xl font-medium text-center shadow-lg border-l-4 ${
            message.includes('succès') || message.includes('🗑️') ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-500' 
            : message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-500'
            : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-500'
          } animate-fade-in-up backdrop-blur-sm`}>
            <div className="flex items-center justify-center">
              {message.includes('succès') && <FaUserCheck className="mr-2" />}
              {message.includes('🗑️') && <FaTrash className="mr-2" />}
              {message.includes('Erreur') || message.includes('⚠️') && <FaTimesCircle className="mr-2" />}
              {message}
            </div>
          </div>
        )}
        
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
          {/* Tableau des administrateurs - Carte médicale (inchangé) */}
          <div className="bg-gradient-to-br from-white to-teal-50 dark:from-gray-700 dark:to-teal-900/30 p-6 rounded-2xl shadow-lg border border-teal-100 dark:border-teal-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-teal-100 dark:bg-teal-800 p-3 rounded-lg mr-4">
                <FaUserMd className="text-2xl text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                Administrateurs ({admins.length})
              </h3>
            </div>
            {loadingAdmins ? (
              <div className="text-teal-600 text-center py-10 flex justify-center items-center">
                <FaSpinner className="mr-3 animate-spin" /> 
                Chargement des données médicales...
              </div>
            ) : admins.length === 0 ? (
              <div className="text-gray-500 text-center py-10 bg-white/50 dark:bg-gray-600/50 rounded-lg">
                Aucun administrateur médical trouvé.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-teal-500/20 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                    <tr>
                      <th scope="col" className="p-4 text-left rounded-tl-lg">Email Professionnel</th>
                      <th scope="col" className="p-4 text-center rounded-tr-lg">Privilèges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, idx) => (
                      <tr key={admin.id} className="bg-white/70 dark:bg-gray-700/70 border-b border-teal-100 dark:border-teal-800 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition duration-150">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <FaUserTie className="mr-3 text-teal-500" />
                            {admin.email}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {idx === 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-xs font-bold">
                              <FaLockOpen className="mr-1" /> Super Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, idx)}
                              className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase shadow-md transition-all duration-200 transform hover:scale-105 flex items-center mx-auto"
                            >
                              <FaTrash className="mr-1" /> Révoquer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tableau des utilisateurs - Carte patients (inchangé) */}
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-700 dark:to-blue-900/30 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-lg mr-4">
                <FaUsers className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                Utilisateurs ({users.length})
              </h3>
            </div>
            {loadingUsers ? (
              <div className="text-blue-600 text-center py-10 flex justify-center items-center">
                <FaSpinner className="mr-3 animate-spin" /> 
                Chargement des utilisateurs...
              </div>
            ) : users.length === 0 ? (
              <div className="text-gray-500 text-center py-10 bg-white/50 dark:bg-gray-600/50 rounded-lg">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-blue-500/20 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    <tr>
                      <th scope="col" className="p-4 text-left rounded-tl-lg">Email Sécretaire</th>
                      <th scope="col" className="p-4 text-center">Statut</th>
                      <th scope="col" className="p-4 text-center rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="bg-white/70 dark:bg-gray-700/70 border-b border-blue-100 dark:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition duration-150">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <FaStethoscope className="mr-3 text-blue-500" />
                            {user.email}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {/* Logique de statut */}
                          {user.isApproved == 1 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-bold">
                              <FaUserCheck className="mr-1" /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs font-bold">
                              <FaClock className="mr-1" /> En attente
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center flex justify-center gap-2 flex-wrap">
                          
                          {/* Affichage des boutons d'action conditionnel */}
                          {user.isApproved == 1 ? (
                            // Utilisateur ACTIF
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase shadow-md transition-all duration-200 transform hover:scale-105 flex items-center"
                              title="Archiver/Supprimer l'utilisateur actif"
                            >
                              <FaTimesCircle className="mr-1" /> Archiver
                            </button>
                          ) : (
                            // Utilisateur EN ATTENTE
                            <>
                              <button
                                onClick={() => approveUser(user.id)}
                                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase shadow-md transition-all duration-200 transform hover:scale-105 flex items-center"
                                title="Valider l'inscription de l'utilisateur"
                              >
                                <FaCheckCircle className="mr-1" /> Valider
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase shadow-md transition-all duration-200 transform hover:scale-105 flex items-center"
                                title="Refuser et supprimer l'utilisateur en attente"
                              >
                                <FaTrash className="mr-1" /> Refuser
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action avec style médical (inchangé) */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-6 flex-wrap">
          <Link
            to="/accueil"
            className="px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center group"
          >
            <FaHome className="mr-3 group-hover:scale-110 transition-transform" /> 
            Accueil Médical
          </Link>
          <Link
            to="/authen"
            className="px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center group"
          >
            <FaUserPlus className="mr-3 group-hover:scale-110 transition-transform" /> 
            Nouveau Administrateur
          </Link>
          {/* Le bouton pour la page /action est conservé, mais moins nécessaire maintenant */}
          <Link
            to="/action"
            className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center group"
          >
            <FaUserCheck className="mr-3 group-hover:scale-110 transition-transform" /> 
            (Ancienne) Validation
          </Link>
        </div>

        {/* Pied de page médical (inchangé) */}
        <div className="mt-10 text-center text-gray-500 dark:text-gray-400 text-sm">
          <div className="flex items-center justify-center">
            <FaHospital className="mr-2 text-teal-500" />
            Système Médical Sécurisé • {new Date().getFullYear()}
          </div>
        </div>

        {/* Style d'animation (inchangé) */}
        <style>{`
          .animate-fade-in-up {
            animation: fadeInUp 0.7s;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminDashboard;
