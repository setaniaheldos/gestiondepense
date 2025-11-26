import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Loader, CheckCircle, XCircle } from 'lucide-react';

const ResisterUtil = () => {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email || !form.password) {
      setError("Email et mot de passe requis");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      // Assurez-vous que cette URL est correcte pour votre backend
      const res = await axios.post('https://mon-api-rmv3.onrender.com/register', { 
        email: form.email,
        password: form.password,
      });
      setSuccess(res.data.message || "Inscription réussie !");
      setError('');
      setForm({ email: '', password: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000); // Masquer le message après 3s
    } catch (err) {
      setSuccess('');
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur lors de l'inscription (Vérifiez le serveur et l'unicité de l'email)"
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-cyan-100 to-teal-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-emerald-200 max-w-sm w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-emerald-700 dark:text-emerald-300 text-center flex items-center justify-center gap-2 animate-fade-in-down">
          <UserPlus className="w-7 h-7" />
          Inscription d'utlisateur
        </h2>
        
        {/* Messages d'erreur et de succès avec icônes */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl flex items-center gap-2 animate-bounce text-sm font-medium">
            <XCircle className="w-5 h-5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded-xl flex items-center gap-2 animate-fade-in-up text-sm font-medium">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // Styles focus/bordure en vert/émeraude
            className="mt-1 block w-full border border-emerald-300 rounded-xl p-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            // Styles focus/bordure en vert/émeraude
            className="mt-1 block w-full border border-emerald-300 rounded-xl p-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirmer le mot de passe</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            // Styles focus/bordure en vert/émeraude
            className="mt-1 block w-full border border-emerald-300 rounded-xl p-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          // Bouton principal en vert émeraude (emerald)
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/50 transform hover:scale-[1.01]'
          } animate-fade-in-up`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Inscription...
            </>
          ) : (
            "S'inscrire"
          )}
        </button>
        {/* Les styles d'animation restent les mêmes */}
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

export default ResisterUtil;