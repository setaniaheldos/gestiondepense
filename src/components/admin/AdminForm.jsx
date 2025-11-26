import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserPlus, UserCheck, Lock, Mail, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const AdminForm = ({ adminToEdit, onAdminUpdated, onAdminAdded, adminsCount }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Nouvelle fonctionnalité : Afficher/Masquer MDP

  useEffect(() => {
    if (adminToEdit) {
      setFormData({
        email: adminToEdit.email,
        // Le mot de passe n'est pas pré-rempli lors de l'édition pour des raisons de sécurité
        password: '',
      });
      setConfirmPassword('');
    } else {
      setFormData({
        email: '',
        password: '',
      });
      setConfirmPassword('');
    }
    setError('');
    setSuccess('');
  }, [adminToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation du nombre max d'admins (3)
    if (!adminToEdit && adminsCount >= 3) {
      setError("❌ Nombre maximum d'administrateurs atteint (3).");
      return;
    }
    
    // Validation des mots de passe (uniquement pour l'ajout)
    if (!adminToEdit && formData.password !== confirmPassword) {
      setError("❌ Les mots de passe ne correspondent pas.");
      return;
    }

    // Validation du mot de passe pour la modification: si l'utilisateur saisit un mot de passe, il doit être non vide
    const dataToSend = { email: formData.email };
    if (formData.password) {
        dataToSend.password = formData.password;
    }
    
    // Si on modifie et que le champ MDP est vide, ne pas l'envoyer
    if (adminToEdit && !formData.password) {
        // Envoi des données sans le mot de passe
        try {
            await axios.put(`https://mon-api-rmv3.onrender.com/admins/${adminToEdit.id}`, dataToSend);
            setSuccess("Administrateur modifié avec succès (Email mis à jour) !");
            onAdminUpdated();
        } catch (error) {
            handleError(error);
        }
        return;
    }
    
    // Si on ajoute ou on modifie avec un nouveau mot de passe
    try {
      if (adminToEdit) {
        await axios.put(`https://mon-api-rmv3.onrender.com/admins/${adminToEdit.id}`, dataToSend);
        setSuccess("Administrateur modifié avec succès !");
        onAdminUpdated();
      } else {
        // Ajout
        await axios.post('https://mon-api-rmv3.onrender.com/admins', dataToSend);
        setSuccess("Administrateur ajouté avec succès !");
        onAdminAdded();
      }
      setFormData({ email: '', password: '' });
      setConfirmPassword('');
      setShowPassword(false);
    } catch (error) {
      handleError(error);
    }
  };
  
  const handleError = (error) => {
       if (error.response && error.response.data && error.response.data.error) {
        setError(`❌ ${error.response.data.error}`);
      } else {
        setError("❌ Erreur lors de l'opération.");
      }
  };

  const isMaxAdmins = !adminToEdit && adminsCount >= 3;

  return (
    <form
      onSubmit={handleSubmit}
      // Styles ajustés à la palette médicale (Émeraude)
      className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl border border-emerald-300 max-w-lg w-full mx-auto animate-fade-in-up transition-all duration-500"
    >
      <div 
        className={`mb-4 px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${isMaxAdmins ? 'bg-red-100 text-red-700' : 'bg-cyan-100 text-cyan-700'}`}
      >
        <AlertTriangle className='w-4 h-4' />
        {isMaxAdmins 
            ? `Nombre maximum (${adminsCount}/3) atteint. Impossible d'ajouter.` 
            : `Limite de sécurité : ${adminsCount}/3 administrateurs créés.`
        }
      </div>
      
      <h2 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in-down">
        {adminToEdit ? <UserCheck className='w-6 h-6' /> : <UserPlus className='w-6 h-6' />}
        {adminToEdit ? 'Modifier cet Admin' : 'Ajouter un nouvel Admin'}
      </h2>
      
      {/* Messages de Statut Stylisés */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium animate-bounce flex items-center gap-2 text-sm">
          <XCircle className="w-5 h-5" /> {error.replace('❌ ', '')}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded-xl font-medium animate-fade-in-up flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5" /> {success.replace('✅ ', '')}
        </div>
      )}
      
      {/* Champ Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1"><Mail className='w-4 h-4 text-emerald-500' /> Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          // Focus en couleur Émeraude
          className="mt-1 block w-full border border-emerald-300 rounded-xl p-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
        />
      </div>
      
      {/* Champ Mot de passe */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
            <Lock className='w-4 h-4 text-emerald-500' /> 
            Mot de passe 
            {!adminToEdit && <span className="text-red-500">*</span>}
            {adminToEdit && <span className="text-xs text-gray-500 ml-2">(Laisser vide pour ne pas modifier)</span>}
        </label>
        <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!adminToEdit} // Requis seulement pour l'ajout
              // Focus en couleur Émeraude
              className="mt-1 block w-full border border-emerald-300 rounded-xl pr-10 p-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
              placeholder={adminToEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            />
             {/* Bouton Afficher/Masquer MDP */}
            <button 
                type="button" 
                onClick={() => setShowPassword(prev => !prev)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-emerald-600 transition"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
      </div>
      
      {/* Champ Confirmer Mot de passe (Uniquement pour l'ajout) */}
      {!adminToEdit && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
            <Lock className='w-4 h-4 text-emerald-500' /> Confirmer le mot de passe <span className="text-red-500">*</span>
          </label>
           <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              // Focus en couleur Émeraude
              className="mt-1 block w-full border border-emerald-300 rounded-xl pr-10 p-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
              placeholder="Confirmer le mot de passe"
            />
             {/* Le bouton toggle est réutilisé ici */}
             <button 
                type="button" 
                onClick={() => setShowPassword(prev => !prev)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-emerald-600 transition"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
           </div>
        </div>
      )}
      
      {/* Bouton de Soumission */}
      <button
        type="submit"
        disabled={isMaxAdmins}
        // Couleur d'action Émeraude
        className={`w-full py-3 rounded-xl font-bold transition-all duration-300 shadow-lg transform hover:scale-[1.01] flex items-center justify-center gap-2 ${
          isMaxAdmins
            ? 'bg-gray-400 cursor-not-allowed shadow-none text-gray-700'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/50'
        } animate-fade-in-up`}
      >
        {adminToEdit ? (
            <>
                <UserCheck className="w-5 h-5" /> Mettre à jour
            </>
        ) : (
            <>
                <UserPlus className="w-5 h-5" /> Ajouter l'Admin
            </>
        )}
      </button>
      
      {/* Lien d'authentification */}
      <div className="mt-4 text-center">
        <Link
          to="/admin-auth"
          className="text-emerald-600 dark:text-emerald-300 underline hover:text-emerald-800 transition-all animate-fade-in-up font-medium"
        >
          Accéder à l’authentification admin
        </Link>
      </div>
      
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
  );
};

export default AdminForm;