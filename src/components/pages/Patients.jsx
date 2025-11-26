import React, { useState, useEffect } from 'react';

// NOTE: L'URL de l'API est définie ici. Assurez-vous qu'elle est correcte.
const API_BASE = 'https://mon-api-rmv3.onrender.com';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  // AJOUT DE DESCRIPTION dans formData
  const [formData, setFormData] = useState({ categorie: '', montant: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('non testé');

  const logApiStatus = (status, details = '') => {
    console.log(`[API STATUS] ${status}: ${details}`);
    setApiStatus(`${status} (${details})`);
  };

  // Fonction pour charger les transactions depuis l'API
  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    logApiStatus('loading', 'Début du fetch...');
    try {
      const response = await fetch(`${API_BASE}/transactions`);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText || 'Erreur serveur'}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Données invalides (pas un tableau)');
      }

      setTransactions(data);
      logApiStatus('succès', `${data.length} transactions chargées`);
    } catch (err) {
      console.error('[FETCH ERROR] Plein détail:', err);
      setError(err.message);
      logApiStatus('échec', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // Utiliser window.confirm est une mauvaise pratique en Iframe, 
    // on le remplace par une fonction qui imite la confirmation.
    window.confirm = (message) => {
        return prompt(message + " (Tappez 'oui' pour confirmer)")?.toLowerCase() === 'oui';
    };
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categorie.trim()) {
      setError('Type de catégorie (dépense/revenu) requis');
      return;
    }
    const montantNum = parseFloat(formData.montant);
    if (isNaN(montantNum) || montantNum === 0) {
      setError('Montant doit être un nombre non nul');
      return;
    }

    // Le backend exige que la catégorie soit 'depense' ou 'revenu'
    const submitData = { 
      categorie: formData.categorie.trim().toLowerCase(), 
      montant: montantNum,
      // INCLUSION DE LA DESCRIPTION
      description: formData.description || null
    };

    setLoading(true);
    setError('');
    const isEdit = !!editingId;
    const endpoint = isEdit ? `${API_BASE}/transactions/${editingId}` : `${API_BASE}/transactions`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errText = await response.text();
        // Afficher l'erreur ENUM du backend si elle est présente
        if (errText.includes('invalid input value for enum')) {
            throw new Error(`Erreur API: La catégorie doit être 'depense' ou 'revenu'.`);
        }
        throw new Error(`${method} HTTP ${response.status}: ${errText}`);
      }

      await response.json();
      // RÉINITIALISATION AVEC DESCRIPTION
      setFormData({ categorie: '', montant: '', description: '' });
      setEditingId(null);
      await loadTransactions();
      logApiStatus('opération réussie', isEdit ? 'mise à jour' : 'ajout');
    } catch (err) {
      console.error(`[${method} FULL ERROR]:`, err);
      setError(err.message);
      logApiStatus('opération échouée', err.message);
    } finally {
      setLoading(false);
    }
  };

  const editTransaction = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`);
      if (!response.ok) throw new Error(`GET ${response.status}`);
      const transaction = await response.json();
      setFormData({ 
        categorie: transaction.categorie || '', 
        montant: transaction.montant ? transaction.montant.toString() : '',
        // RÉCUPÉRATION DE LA DESCRIPTION
        description: transaction.description || '' 
      });
      setEditingId(id);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTransaction = async (id) => {
    // Utilisation d'une simulation de prompt au lieu de window.confirm()
    if (!window.confirm('Confirmer la suppression ?')) return; 
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`DELETE ${response.status}`);
      await loadTransactions();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    // RÉINITIALISATION AVEC DESCRIPTION
    setFormData({ categorie: '', montant: '', description: '' });
    setEditingId(null);
  };

  const refresh = () => loadTransactions();
  
  // Détermination de la couleur en fonction du montant pour le tableau
  const getMontantColor = (montant) => {
    const numMontant = parseFloat(montant || 0);
    if (numMontant < 0) {
      return 'text-red-600 font-semibold'; // Dépense (si valeur négative est stockée)
    } else if (numMontant > 0) {
      return 'text-green-600 font-semibold'; // Revenu (si valeur positive est stockée)
    }
    return 'text-gray-900';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-100 min-h-screen font-[Inter]"> 
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 border-b-4 border-blue-500 pb-2">
        💰 Tableau de Bord des Transactions
      </h1>

      {/* Statut API - Design plus marqué */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl shadow-inner flex flex-wrap justify-between items-center">
        <div>
            <strong>📢 Statut API :</strong> {apiStatus}
            <br />
            <small className="text-xs">Vérifiez la console (F12) pour logs détaillés.</small>
        </div>
        <button 
          onClick={refresh} 
          className="ml-0 mt-2 sm:mt-0 sm:ml-4 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition duration-150 ease-in-out shadow-md"
        >
          🔄 Rafraîchir
        </button>
      </div>
      
      {/* Formulaire - Design en carte (card) plus élégant */}
      <div className="bg-white p-6 rounded-xl shadow-2xl mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            {editingId ? '✍️ Modifier la Transaction' : '➕ Ajouter une Nouvelle Transaction'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Colonne 1: Type de Transaction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de Transaction</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition duration-150"
              >
                <option value="" disabled>Sélectionnez le type</option>
                {/* Ces valeurs correspondent exactement à l'ENUM de la base de données PostgreSQL */}
                <option value="revenu">Revenu</option>
                <option value="depense">Dépense</option>
              </select>
            </div>
            
            {/* Colonne 2: Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant (€)</label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleInputChange}
                step="0.01"
                placeholder="Ex: 1000.50 ou -50.00"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition duration-150"
              />
            </div>

            {/* Colonne 3 & 4: Description (span sur deux colonnes) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optionnel)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="1" // Ajusté pour être sur une seule ligne
                placeholder="Ex: Achat de matériel de bureau ou Salaire mensuel"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition duration-150 resize-none"
              ></textarea>
            </div>
          </div>
          
          {/* Ligne des boutons */}
          <div className="flex justify-end pt-6 gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-150 ease-in-out shadow-lg hover:shadow-xl min-w-[180px]"
              >
                {loading ? '...Traitement' : editingId ? 'Sauvegarder' : 'Ajouter'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition duration-150 ease-in-out shadow-md min-w-[100px]"
                >
                  Annuler
                </button>
              )}
          </div>
        </form>
      </div>

      {/* Erreur - Design en alerte d'urgence */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md">
          <strong className="font-bold">❌ Erreur de l'Opération :</strong> {error}
          <br />
          <small className="text-sm">Veuillez corriger les données ou vérifier la connexion API (F12).</small>
        </div>
      )}
      
      {/* Affichage des Transactions */}
      {loading && transactions.length === 0 ? (
        <div className="text-center py-12 text-blue-600 bg-white rounded-xl shadow-md text-xl font-medium">
          ⏳ Chargement initial des transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-600 bg-white rounded-xl shadow-md border border-dashed border-gray-300">
          <p className="text-2xl mb-2">📭 Aucune transaction trouvée.</p>
          <p>Ajoutez votre première transaction ci-dessus pour commencer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 text-lg font-bold text-gray-700">
            Liste des {transactions.length} Transactions
          </div>
          <div className="overflow-x-auto"> {/* Rendre le tableau scrollable sur petit écran */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  {/* NOUVELLE ENTÊTE DE DESCRIPTION */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th> 
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-blue-50 transition duration-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.id}</td>
                    {/* Affichage: mettre la première lettre en majuscule */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.categorie.charAt(0).toUpperCase() + transaction.categorie.slice(1)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMontantColor(transaction.montant)}`}>
                        {/* Formatage amélioré */}
                        {parseFloat(transaction.montant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    {/* NOUVELLE CELLULE DE DESCRIPTION */}
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate" title={transaction.description}>
                        {transaction.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => editTransaction(transaction.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-150"
                        title="Éditer la transaction"
                      >
                        ✏️ Éditer
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold transition duration-150"
                        title="Supprimer la transaction"
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;