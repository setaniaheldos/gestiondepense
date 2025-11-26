import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, LogIn, Loader } from 'lucide-react'; 

const UtilisateurLogin = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  // ⭐ AMÉLIORATION : Réinitialise l'erreur si l'utilisateur commence à taper à nouveau.
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(''); 
  };
  
  // ⭐ AMÉLIORATION : Fonction pour basculer la visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    // Validation côté client (si le serveur est lent, c'est mieux)
    if (!form.email || !form.password) {
        setError("Veuillez saisir votre email et votre mot de passe.");
        return; 
    }
    
    setLoading(true);

    try {
      // ⭐ AMÉLIORATION : Utilisation de `withCredentials: true` si des cookies/sessions sont utilisés
      const res = await axios.post('https://mon-api-rmv3.onrender.com/login', form);
      
      // Assurez-vous que l'API renvoie des informations utiles, par exemple un token ou un statut 200
      
      setLoading(false);
      // Connexion réussie, masquer NavbarAdmin et afficher Navbar
      if (onLogin) onLogin();
      // Redirection vers la page d'accueil
      navigate('/accueil');
      
    } catch (err) {
      setLoading(false);
      
      // Gestion d'erreurs plus précise
      let errorMessage = "Une erreur inconnue est survenue.";

      if (err.response) {
          // Erreur du serveur (code 4xx ou 5xx)
          errorMessage = err.response.data?.error || "Identifiants invalides ou non approuvés.";
      } else if (err.request) {
          // Serveur non joignable (problème réseau/CORS/API non démarrée)
          errorMessage = "Impossible de joindre le serveur. Veuillez vérifier votre connexion.";
      } 
      
      setError(errorMessage);
    }
  };

  return (
    // Arrière-plan Couleur Médicale : Émeraude/Cyan
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-cyan-100 to-teal-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-emerald-300 max-w-sm w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 
            className="text-3xl font-extrabold mb-8 text-emerald-700 dark:text-emerald-300 text-center flex items-center justify-center gap-2 animate-fade-in-down"
        >
            <User className="w-7 h-7" />
            Accès Utilisateur
        </h2>
        
        {/* Affichage des Erreurs (Style amélioré) */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-300 rounded-xl flex items-center justify-center gap-2 text-sm font-medium animate-bounce-once">
            {error}
          </div>
        )}
        
        {/* Champ Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
          <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input
                type="email"
                id="email" // ⭐ AMÉLIORATION A11Y : ID ajouté
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-emerald-300 rounded-xl pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all outline-none"
                autoFocus
                placeholder="Votre email"
                autoComplete="email" // ⭐ AMÉLIORATION UX/A11Y
              />
          </div>
        </div>
        
        {/* Champ Mot de passe */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Mot de passe</label>
          <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password" // ⭐ AMÉLIORATION A11Y : ID ajouté
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-emerald-300 rounded-xl pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all outline-none"
                placeholder="Mot de passe"
                autoComplete="current-password" // ⭐ AMÉLIORATION UX/A11Y
              />
              {/* Bouton Afficher/Masquer MDP */}
              <button 
                  type="button" 
                  onClick={togglePasswordVisibility} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  tabIndex={0} // ⭐ AMÉLIORATION A11Y : Assure l'accessibilité au clavier
              >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
          </div>
        </div>
        
        {/* Liens de navigation supplémentaires */}
        <div className="flex justify-between text-sm mb-6 mt-2">
            <Link to="/utilisateur" className="text-emerald-600 hover:text-emerald-800 font-medium transition-all dark:text-emerald-400 dark:hover:text-emerald-300">
                S'inscrire
            </Link>
            <Link to="/mot-de-passe-oublie" className="text-gray-500 hover:text-emerald-600 transition-all dark:text-gray-400 dark:hover:text-emerald-400">
                Mot de passe oublié ?
            </Link>
        </div>

        {/* Bouton de Connexion (Couleur Émeraude) */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/50 transform hover:scale-[1.01]'
          } animate-fade-in-up`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Connexion en cours...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" /> Se connecter
            </>
          )}
        </button>

        {/* Styles d'animation */}
        <style>{`
          .animate-fade-in-up {
            animation: fadeInUp 0.7s;
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.7s;
          }
          /* ⭐ AMÉLIORATION : Animation "bounce" plus subtile pour les erreurs */
          .animate-bounce-once {
            animation: bounce-once 0.6s ease-out;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes bounce-once {
            0% { transform: translateY(0);}
            20% { transform: translateY(-3px);}
            40% { transform: translateY(0);}
            60% { transform: translateY(-2px);}
            100% { transform: translateY(0);}
          }
        `}</style>
      </form>
    </div>
  );
};

export default UtilisateurLogin;