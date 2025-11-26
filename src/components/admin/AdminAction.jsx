import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaUserShield, FaSpinner, FaRegLaughBeam } from 'react-icons/fa';

const API_URL = 'https://mon-api-rmv3.onrender.com';

// Instance axios avec retry automatique pour Render
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 secondes max (important sur Render gratuit)
});

// Intercepteur pour retenter automatiquement si la DB dort
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Si c'est une erreur de connexion ou timeout → on retente 2 fois
    if (
      !config._retryCount &&
      (error.code === 'ECONNABORTED' ||
        error.message.includes('Network Error') ||
        error.message.includes('terminated unexpectedly') ||
        error.response?.status >= 500)
    ) {
      config._retryCount = (config._retryCount || 0) + 1;

      if (config._retryCount <= 2) {
        console.log(`Tentative ${config._retryCount} après erreur Render...`);
        await new Promise(resolve => setTimeout(resolve, 1500 * config._retryCount));
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

const AdminAction = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // { userId: true }
  const [message, setMessage] = useState('');

  const showMessage = (msg, duration = 4000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/pending');
      setPendingUsers(res.data || []);
    } catch (err) {
      console.error("Erreur chargement utilisateurs :", err);
      showMessage("Impossible de charger les demandes. La base de données se réveille... réessaie dans 10s");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    // Optionnel : rafraîchir toutes les 30s pour voir les nouvelles demandes
    const interval = setInterval(fetchPendingUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const approveUser = async (id) => {
    if (actionLoading[id]) return; // Empêche double clic
    setActionLoading(prev => ({ ...prev, [id]: true }));

    try {
      await api.put(`/users/${id}/approve`);
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      showMessage("Utilisateur validé avec succès !");
    } catch (err) {
      console.error("Erreur validation :", err);
      if (err.response?.status === 404) {
        showMessage("Cet utilisateur a déjà été traité.");
        setPendingUsers(prev => prev.filter(u => u.id !== id));
      } else {
        showMessage("Erreur lors de la validation (base en réveil ?). Réessaie...");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteUser = async (id) => {
    if (actionLoading[id]) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));

    try {
      await api.delete(`/users/${id}`);
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      showMessage("Utilisateur refusé et supprimé.");
    } catch (err) {
      console.error("Erreur suppression :", err);
      if (err.response?.status === 404) {
        setPendingUsers(prev => prev.filter(u => u.id !== id));
        showMessage("Utilisateur déjà supprimé.");
      } else {
        showMessage("Erreur lors de la suppression. Réessaie...");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto mt-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border-t-4 border-emerald-500 dark:border-blue-600">

        <h2 className="text-3xl font-extrabold mb-8 text-gray-800 dark:text-gray-100 flex items-center justify-center">
          <FaUserShield className="mr-3 text-emerald-500 dark:text-blue-500 text-3xl" />
          Gestion des Accès Utilisateurs
        </h2>

        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Demandes en Attente : {pendingUsers.length > 0 && <span className="ml-2 px-3 py-1 bg-emerald-500 text-white rounded-full text-sm">{pendingUsers.length}</span>}
          </h3>
          <Link
            to="/admindas"
            className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            Tableau de Bord Admin
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-6 py-4 rounded-lg font-medium text-center shadow-md transition-all ${
            message.includes('validé') || message.includes('supprimé') 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-16 text-xl font-medium text-emerald-600 dark:text-blue-400 flex flex-col items-center">
            <FaSpinner className="text-5xl mb-4 animate-spin" />
            Réveil de la base de données Render...
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-16 text-2xl text-gray-500 dark:text-gray-400 border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <FaRegLaughBeam className="inline mr-3 text-5xl mb-4 text-emerald-500" />
            <br />
            Aucune demande en attente
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">ID: {user.id}</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{user.email}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveUser(user.id)}
                      disabled={actionLoading[user.id]}
                      className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition ${
                        actionLoading[user.id]
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {actionLoading[user.id] ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                      Valider
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={actionLoading[user.id]}
                      className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition ${
                        actionLoading[user.id]
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {actionLoading[user.id] ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAction;