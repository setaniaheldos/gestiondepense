import React, { useState, useEffect } from 'react';
// Si vous utilisez React Router, vous devez décommenter l'importation de Link.
// import { Link } from 'react-router-dom'; 
// NOTE : J'utilise ici un simple <a> tag pour éviter l'erreur si Link n'est pas importé.
// Si vous voulez utiliser Link, vous devrez l'importer dans votre fichier.

// NOTE: L'URL de l'API est définie ici. Assurez-vous qu'elle est correcte.
const API_BASE = 'https://mon-api-rmv3.onrender.com';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ categorie: '', montant: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('non testé');
  // NOUVEL ÉTAT : Gère la visibilité du formulaire d'ajout/édition
  const [isFormVisible, setIsFormVisible] = useState(true);
  
  // État pour le thème. Initialise en fonction de la préférence système ou à 'light'.
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // LOGIQUE DU THÈME : Appliquer la classe 'dark' au corps du document
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

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
      // Assure l'envoi d'une chaîne (trim) au lieu de 'null' si le champ est vide.
      description: formData.description.trim() 
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
      // RÉINITIALISATION et cache le formulaire après succès
      setFormData({ categorie: '', montant: '', description: '' });
      setEditingId(null);
      setIsFormVisible(false); // Cache le formulaire après un ajout/modification réussi
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
      setIsFormVisible(true); // Ouvre le formulaire en mode édition
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
    setIsFormVisible(false); // Cache le formulaire après annulation
  };

  const refresh = () => loadTransactions();
  
  // Détermination de la couleur en fonction du montant pour le tableau
  const getMontantColor = (montant) => {
    const numMontant = parseFloat(montant || 0);
    if (numMontant < 0) {
      return 'text-red-500 font-semibold'; // Dépense 
    } else if (numMontant > 0) {
      return 'text-green-500 font-semibold'; // Revenu
    }
    return 'text-gray-900 dark:text-gray-100'; // Neutre
  };

  // LOGIQUE : Calcul du sommaire et regroupement par type
  const calculateSummary = () => {
    return transactions.reduce((acc, transaction) => {
        const montantNum = parseFloat(transaction.montant || 0);
        const category = (transaction.categorie || '').toLowerCase();
        const absMontant = Math.abs(montantNum);

        // Grouping
        if (!acc.grouped[category]) {
            acc.grouped[category] = [];
        }
        acc.grouped[category].push(transaction);

        // Summing for Category Totals (using absolute magnitude for display)
        if (category === 'revenu') {
            acc.totalRevenuMagnitude += absMontant; // magnitude of all revenue
        } else if (category === 'depense') {
            acc.totalDepenseMagnitude += absMontant; // magnitude of all expense
        }

        // Balance Calculation (relying on the sign for net change)
        acc.balance += montantNum; 

        return acc;
    }, {
        totalRevenuMagnitude: 0,
        totalDepenseMagnitude: 0,
        balance: 0,
        grouped: { revenu: [], depense: [] }
    });
  };

  const summary = calculateSummary();
  const revenues = summary.grouped.revenu || [];
  const expenses = summary.grouped.depense || [];


  // Fonction utilitaire pour rendre un tableau de transactions
  const renderTransactionTable = (title, list, colorClass) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
      <div className={`px-6 py-4 bg-${colorClass}-50 dark:bg-${colorClass}-900 border-b border-${colorClass}-100 dark:border-${colorClass}-700 text-lg font-bold text-gray-700 dark:text-gray-200`}>
        {title} ({list.length} transactions)
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date/Heure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {list.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 italic">
                        Aucune transaction de ce type pour l'instant.
                    </td>
                </tr>
            ) : (
                list.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition duration-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{transaction.id}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMontantColor(transaction.montant)}`}>
                        {/* Formatage amélioré */}
                        {parseFloat(transaction.montant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate" title={transaction.description}>
                        {transaction.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                            onClick={() => editTransaction(transaction.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition duration-150 dark:text-blue-400 dark:hover:text-blue-500"
                            title="Éditer la transaction"
                        >
                            ✏️ Éditer
                        </button>
                        <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold transition duration-150 dark:text-red-400 dark:hover:text-red-500"
                            title="Supprimer la transaction"
                        >
                            🗑️ Supprimer
                        </button>
                    </td>
                </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    // Le padding a été ajusté pour rester agréable sur les grands écrans.
    <div className="p-4 md:p-10 bg-gray-100 dark:bg-gray-900 min-h-screen w-full font-[Inter]"> 
      <header className="flex justify-between items-start mb-8 border-b-4 border-blue-500 pb-2">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
            💰 Tableau de Bord des Transactions
        </h1>
        {/* MODIFICATION ICI : Conteneur pour les boutons de la barre de navigation */}
        <div className="flex space-x-3 items-center"> 
            
            {/* NOUVEAU BOUTON : Vers Activités (utilise un <a> standard ou Link) */}
            {/* Si vous utilisez React Router, remplacez <a> par <Link to="/activite">...</Link> */}
            <a 
                href="/praticiens" // Assurez-vous que cette URL est correcte
                className="p-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition duration-150 flex items-center"
                title="Voir toutes les activités"
            >
                📊 Activités
            </a>

            {/* Bouton de bascule du thème existant */}
            {/* <button 
                onClick={toggleTheme} 
                className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 shadow-lg hover:ring-2 ring-blue-500 transition duration-300"
                title={`Passer au mode ${theme === 'light' ? 'Sombre' : 'Clair'}`}
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </button> */}
        </div>
      </header>

      {/* Statut API - Design compatible dark mode */}
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-xl shadow-inner flex flex-wrap justify-between items-center">
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
      
      {/* Bouton pour basculer le formulaire */}
      <div className="flex justify-end mb-6">
        <button
            onClick={() => {
                setIsFormVisible(!isFormVisible);
                setEditingId(null); // S'assurer que le mode édition est désactivé si on le ferme/rouvre manuellement
                if (isFormVisible) {
                    setFormData({ categorie: '', montant: '', description: '' }); // Nettoyer si on ferme
                }
            }}
            className={`px-6 py-3 font-bold rounded-lg transition duration-150 ease-in-out shadow-lg hover:shadow-xl ${
                isFormVisible
                    ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                    : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
            }`}
        >
            {isFormVisible ? 'Cacher le Formulaire' : '➕ Nouvelle Transaction'}
        </button>
      </div>

      {/* Formulaire - Affiché conditionnellement */}
      {isFormVisible && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                {editingId ? '✍️ Modifier la Transaction' : '➕ Ajouter une Nouvelle Transaction'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* MODIFICATION ICI : Réduction du grid à md:grid-cols-3 pour le Montant et Type,
                  et Description reste sur une ligne complète */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                {/* Colonne 1: Type de Transaction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de Transaction</label>
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150"
                  >
                    <option value="" disabled>Sélectionnez le type</option>
                    {/* Ces valeurs correspondent exactement à l'ENUM de la base de données PostgreSQL */}
                    <option value="revenu">Revenu</option>
                    <option value="depense">Dépense</option>
                  </select>
                </div>
                
                {/* Colonne 2: Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant (€)</label>
                  <input
                    type="number"
                    name="montant"
                    value={formData.montant}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="Ex: 1000.50 ou -50.00"
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150"
                  />
                </div>

                {/* Colonne 3: Description (ne span plus, mais occupe l'espace restant) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optionnel)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="1" // Ajusté pour être sur une seule ligne
                    placeholder="Ex: Achat de matériel de bureau ou Salaire mensuel"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150 resize-none"
                  ></textarea>
                </div>
              </div>
              
              {/* Ligne des boutons */}
              <div className="flex justify-end pt-2 gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    // Les couleurs des boutons restent dynamiques et bien contrastées
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-150 ease-in-out shadow-lg hover:shadow-xl min-w-[180px] dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {loading ? '...Traitement' : editingId ? 'Sauvegarder' : 'Ajouter'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition duration-150 ease-in-out shadow-md min-w-[100px] dark:bg-gray-600 dark:hover:bg-gray-700"
                    >
                      Annuler
                    </button>
                  )}
              </div>
            </form>
        </div>
      )}

      {/* Erreur - Design en alerte compatible dark mode */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-lg shadow-md">
          <strong className="font-bold">❌ Erreur de l'Opération :</strong> {error}
          <br />
          <small className="text-sm">Veuillez corriger les données ou vérifier la connexion API (F12).</small>
        </div>
      )}

      {/* GESTION DU CHARGEMENT/ABSENCE DE DONNÉES */}
      {loading && transactions.length === 0 ? (
        <div className="text-center py-12 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-xl shadow-md text-xl font-medium">
          ⏳ Chargement initial des transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-2xl mb-2">📭 Aucune transaction trouvée.</p>
          <p>Cliquez sur "Nouvelle Transaction" pour commencer.</p>
        </div>
      ) : (
        <>
            {/* Carte de Sommaire Financier - AUCUN CHANGEMENT SUR CE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Revenus */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-l-8 border-green-500 hover:shadow-green-300/50 dark:border-green-600 dark:hover:shadow-green-900/50 transition duration-300 ease-in-out transform hover:scale-[1.02]">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenus (Magnitude)</p>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-2">
                        {summary.totalRevenuMagnitude.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">({revenues.length} transactions)</p>
                </div>
                
                {/* Total Dépenses */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-l-8 border-red-500 hover:shadow-red-300/50 dark:border-red-600 dark:hover:shadow-red-900/50 transition duration-300 ease-in-out transform hover:scale-[1.02]">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Dépenses (Magnitude)</p>
                    <p className="text-4xl font-extrabold text-red-600 dark:text-red-400 mt-2">
                        {summary.totalDepenseMagnitude.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">({expenses.length} transactions)</p>
                </div>
                
                {/* Solde Net */}
                {/* J'ai commenté la troisième carte Solde Net car elle n'était pas entièrement fournie dans l'original, mais la place est là. */}
            </div>

            {/* Affichage des transactions regroupées par type */}
            {renderTransactionTable("Revenus", revenues, 'green')}
            {renderTransactionTable("Dépenses", expenses, 'red')}
        </>
      )}
    </div>
  );
};

export default TransactionManager;