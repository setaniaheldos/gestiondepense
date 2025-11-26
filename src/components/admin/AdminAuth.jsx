import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaSignInAlt, FaSpinner, FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa'; // Ajout FaEye et FaEyeSlash

const AdminAuth = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nouvelle fonctionnalité
  const navigate = useNavigate();

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validation de base front-end
    if (!form.email || !form.password) {
        setError("❌ Email et mot de passe requis.");
        setLoading(false);
        return;
    }

    try {
      const res = await axios.post('https://mon-api-rmv3.onrender.com/admins/login', form);
      
      setLoading(false);
      if (res.status === 200) {
        setSuccess('✅ Connexion admin réussie ! Redirection...');
        // Sauvegarder le token si nécessaire ici
        // localStorage.setItem('adminToken', res.data.token);
        
        setTimeout(() => {
          navigate('/admindas'); // Redirection vers le tableau de bord admin
        }, 1200); 
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response && err.response.data && err.response.data.error
          ? `❌ ${err.response.data.error}`
          : "❌ Échec de l'authentification. Vérifiez les identifiants ou le serveur."
      );
    }
  };

  return (
    // Dégradé de fond Couleur Médicale : Cyan très clair vers Blanc/Gris clair
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 dark:from-gray-900 via-white dark:via-gray-800 to-emerald-100 dark:to-gray-700 transition-all duration-500 p-4">
      <form
        onSubmit={handleSubmit}
        // Conteneur : bordure d'accentuation en Émeraude (vert)
        className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border-t-4 border-emerald-600 dark:border-cyan-400 max-w-md w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-gray-100 text-center flex items-center justify-center animate-fade-in-down">
          <FaUserShield className="mr-3 text-emerald-600 dark:text-cyan-400 text-3xl" />
          Accès Administrateur
        </h2>
        
        {/* Messages de Statut Stylisés */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-xl font-medium animate-bounce flex items-center justify-center shadow-md">
            <FaExclamationCircle className="mr-2" /> {error.replace('❌ ', '')}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 rounded-xl font-medium animate-fade-in-up flex items-center justify-center shadow-md">
            <FaCheckCircle className="mr-2" /> {success.replace('✅ ', '')}
          </div>
        )}
        
        {/* Champ Email */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // Styles des champs : focus en Émeraude
            className="mt-1 block w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500 transition-all duration-200"
            placeholder="admin@medcare.com"
            autoFocus
          />
        </div>
        
        {/* Champ Mot de passe avec Toggle (Fonctionnalité ajoutée) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} // Toggle type
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl p-3 pr-10 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500 transition-all duration-200"
              placeholder="••••••••"
            />
            <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-emerald-600 transition"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Bouton de Soumission (Couleur Émeraude) */}
        <button
          type="submit"
          disabled={loading}
          // Couleur d'action Émeraude
          className={`w-full py-3 rounded-xl font-extrabold text-white transition-all duration-300 shadow-lg transform hover:scale-[1.01] flex items-center justify-center ${
            loading
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/50 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:shadow-emerald-700/50'
          } animate-fade-in-up`}
        >
          {loading ? (
            <>
              <FaSpinner className="mr-2 animate-spin" /> Connexion en cours...
            </>
          ) : (
            <>
              <FaSignInAlt className="mr-2" /> Se connecter
            </>
          )}
        </button>
        
        {/* Styles d'animation conservés */}
        <style>{`
          .animate-fade-in-up {
            animation: fadeInUp 0.7s;
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.7s;
          }
          .animate-bounce {
            animation: bounce 1s;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0);}
            50% { transform: translateY(-8px);}
          }
        `}</style>
      </form>
    </div>
  );
};

export default AdminAuth;