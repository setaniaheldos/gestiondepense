import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Importer les librairies PDF (assurez-vous de les avoir installées : npm install jspdf)
import jsPDF from 'jspdf';
// NOTE: L'URL de l'API est définie ici. Assurez-vous qu'elle est correcte.
const API_BASE = 'https://mon-api-rmv3.onrender.com';
const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ categorie: '', montant: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('non testé');
  const [isFormVisible, setIsFormVisible] = useState(false);
 
  // Nouveaux états pour le filtrage par mois/année
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  // Utiliser 0 pour 'Tous' comme valeur initiale si on veut afficher l'année complète
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(currentYear);
 
  // État pour le thème
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
  // LOGIQUE DU THÈME
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };
  const logApiStatus = (status, details = '') => {
    console.log(`[API STATUS] ${status}: ${details}`);
    setApiStatus(`${status} (${details})`);
  };
  // Fonction pour charger les transactions (Utilisation de useCallback)
  const loadTransactions = useCallback(async () => {
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
  }, []);
  useEffect(() => {
    loadTransactions();
    // Simulation de window.confirm pour l'Iframe
    if (typeof window !== 'undefined') {
        window.confirm = (message) => {
            return prompt(message + " (Tappez 'oui' pour confirmer)")?.toLowerCase() === 'oui';
        };
    }
  }, [loadTransactions]);
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
    const submitData = {
      categorie: formData.categorie.trim().toLowerCase(),
      montant: montantNum,
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
        if (errText.includes('invalid input value for enum')) {
            throw new Error(`Erreur API: La catégorie doit être 'depense' ou 'revenu'.`);
        }
        throw new Error(`${method} HTTP ${response.status}: ${errText}`);
      }
      await response.json();
      setFormData({ categorie: '', montant: '', description: '' });
      setEditingId(null);
      setIsFormVisible(false);
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
        description: transaction.description || ''
      });
      setEditingId(id);
      setIsFormVisible(true);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };
  const deleteTransaction = async (id) => {
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
    setFormData({ categorie: '', montant: '', description: '' });
    setEditingId(null);
    setIsFormVisible(false);
  };
 
  const getMontantColor = (montant) => {
    const numMontant = parseFloat(montant || 0);
    if (numMontant < 0) {
      return 'text-red-500 font-semibold';
    } else if (numMontant > 0) {
      return 'text-green-500 font-semibold';
    }
    return 'text-gray-900 dark:text-gray-100';
  };
  const formatAriary = (amount) => {
    return parseFloat(amount || 0).toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'MGA',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace('MGA', 'Ar');
  };
  // Filtrer les transactions en fonction du mois/année (Utilisation de useMemo)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const date = new Date(transaction.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthMatch = selectedMonth === 0 || month === selectedMonth;
      const yearMatch = selectedYear === 0 || year === selectedYear;
      return monthMatch && yearMatch;
    });
  }, [transactions, selectedMonth, selectedYear]);
  // LOGIQUE : Calcul du sommaire et regroupement (Utilisation de useMemo)
  const summary = useMemo(() => {
    const revenuTotal = filteredTransactions
      .filter(t => (t.categorie || '').toLowerCase() === 'revenu')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.montant || 0)), 0);
    const depenseTotal = filteredTransactions
      .filter(t => (t.categorie || '').toLowerCase() === 'depense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.montant || 0)), 0);
    const balance = revenuTotal - depenseTotal;
    const grouped = {
      revenu: filteredTransactions.filter(t => (t.categorie || '').toLowerCase() === 'revenu'),
      depense: filteredTransactions.filter(t => (t.categorie || '').toLowerCase() === 'depense')
    };
    return {
      totalRevenuMagnitude: revenuTotal,
      totalDepenseMagnitude: depenseTotal,
      balance: balance,
      grouped: grouped
    };
  }, [filteredTransactions]); // Recalculer lorsque les transactions filtrées changent
  const revenues = summary.grouped.revenu || [];
  const expenses = summary.grouped.depense || [];
  // NOUVEAU MODÈLE MANUEL D'EXPORTATION PDF AVEC jsPDF UNIQUEMENT (Sans html2canvas)
  const exportPdf = () => {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthName = selectedMonth === 0 ? 'Tous' : monthNames[selectedMonth - 1];
    const periodTitle = `Rapport - ${monthName} ${selectedYear}`;
   
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;
   
    // Fonction utilitaire pour ajouter du texte avec saut de ligne si nécessaire
    const addText = (text, fontSize = 12, bold = false) => {
      if (bold) pdf.setFont(undefined, 'bold');
      pdf.setFontSize(fontSize);
      const splitText = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      splitText.forEach(line => {
        if (y > pageHeight - margin - fontSize / 2) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += fontSize * 1.2; // Espacement ligne
      });
      if (bold) pdf.setFont(undefined, 'normal');
    };
   
    // Fonction pour dessiner une ligne horizontale
    const drawLine = () => {
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;
    };
   
    // 1. Titre
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(periodTitle, margin, y);
    y += 15;
   
    // 2. Sommaire
    addText('SOMMAIRE FINANCIER:', 14, true);
    drawLine();
    addText(`Total Revenus: ${formatAriary(summary.totalRevenuMagnitude)} (${revenues.length} transactions)`, 12);
    addText(`Total Dépenses: ${formatAriary(summary.totalDepenseMagnitude)} (${expenses.length} transactions)`, 12);
    // ✅ Ligne mise à jour avec 'Reste' pour le PDF
    addText(`Reste: ${formatAriary(summary.balance)}`, 12);
    y += 10;
    drawLine();
   
    // 3. Section Revenus
    addText('REVENUS:', 14, true);
    drawLine();
    if (revenues.length === 0) {
      addText('Aucune transaction de ce type pour l\'instant.', 12);
    } else {
      revenues.forEach((transaction, index) => {
        addText(`${index + 1}. ID: ${transaction.id}`, 11);
        addText(`   Montant: ${formatAriary(transaction.montant)}`, 11);
        addText(`   Description: ${transaction.description || 'N/A'}`, 11);
        addText(`   Date: ${new Date(transaction.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, 11);
        y += 5; // Espacement entre transactions
      });
    }
    y += 10;
    drawLine();
   
    // 4. Section Dépenses
    addText('DÉPENSES:', 14, true);
    drawLine();
    if (expenses.length === 0) {
      addText('Aucune transaction de ce type pour l\'instant.', 12);
    } else {
      expenses.forEach((transaction, index) => {
        addText(`${index + 1}. ID: ${transaction.id}`, 11);
        addText(`   Montant: ${formatAriary(transaction.montant)}`, 11);
        addText(`   Description: ${transaction.description || 'N/A'}`, 11);
        addText(`   Date: ${new Date(transaction.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, 11);
        y += 5; // Espacement entre transactions
      });
    }
   
    // 5. Sauvegarder
    pdf.save(`rapport_transactions_${monthName}_${selectedYear}.pdf`);
  };
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
              {/* Le tableau est maintenant dans le conteneur #report-container. La classe "action-buttons" est essentielle. */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider action-buttons">Actions</th>
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
                        {formatAriary(transaction.montant)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate" title={transaction.description}>
                        {transaction.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3 action-buttons">
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
   
  const getAvailableYears = () => {
      const years = transactions.map(t => new Date(t.date).getFullYear());
      const uniqueYears = [...new Set([...years, currentYear])].sort((a, b) => b - a);
      return uniqueYears;
  }
  return (
    <div className="p-4 md:p-10 bg-gray-100 dark:bg-gray-900 min-h-screen w-full font-[Inter]">
      <header className="flex justify-between items-start mb-8 border-b-4 border-blue-500 pb-2">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
            💰 Tableau de Bord des Transactions
        </h1>
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition duration-300 shadow-md hover:ring-2 ring-blue-500"
            title="Basculer le Thème"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      {/* Boutons d'Action (Ajouter/Cacher) */}
      <div className="flex justify-start items-center mb-6">
       
        <button
            onClick={() => {
                setIsFormVisible(!isFormVisible);
                setEditingId(null);
                if (isFormVisible) {
                    setFormData({ categorie: '', montant: '', description: '' });
                }
            }}
            className={`px-6 py-3 font-bold rounded-lg transition duration-150 ease-in-out shadow-lg hover:shadow-xl ${
                isFormVisible
                    ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
               
                {/* Type de Transaction */}
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
                    <option value="revenu">Revenu</option>
                    <option value="depense">Dépense</option>
                  </select>
                </div>
               
                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant (Ar)</label>
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
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optionnel)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="1"
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
      {/* Erreur */}
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
            {/* Filtres et Bouton PDF */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer par Mois :</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                        className="p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
                    >
                        <option value={0}>Tous les mois</option>
                        {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((monthName, index) => (
                            <option key={index + 1} value={index + 1}>{monthName}</option>
                        ))}
                    </select>
                   
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Année :</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        className="p-2 border rounded-lg dark:bg-gray-700 dark:text-gray-200"
                    >
                        {getAvailableYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
               
                <button
                    onClick={exportPdf}
                    disabled={filteredTransactions.length === 0}
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition duration-150 shadow-lg"
                >
                    🖨️ Exporter en PDF ({selectedMonth === 0 ? 'Année' : 'Mois'} Actuel)
                </button>
            </div>
            {/* Conteneur du Rapport pour l'Export PDF (ID OBLIGATOIRE) */}
            <div id="report-container">
                {/* Carte de Sommaire Financier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Revenus */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-l-8 border-green-500">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenus Filtrés</p>
                        <p className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-2">
                            {formatAriary(summary.totalRevenuMagnitude)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">({revenues.length} transactions)</p>
                    </div>
                   
                    {/* Total Dépenses */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-l-8 border-red-500">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Dépenses Filtrées</p>
                        <p className="text-4xl font-extrabold text-red-600 dark:text-red-400 mt-2">
                            {formatAriary(summary.totalDepenseMagnitude)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">({expenses.length} transactions)</p>
                    </div>
                   
                    {/* Solde Net -> Reste Filtré (Ligne modifiée) */}
                    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-l-8 ${summary.balance >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reste Filtré</p>
                        <p className={`text-4xl font-extrabold mt-2 ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {formatAriary(summary.balance)}
                        </p>
                    </div>
                </div>
                {/* Affichage des transactions regroupées par type */}
                {renderTransactionTable("Revenus Filtrés", revenues, 'green')}
                {renderTransactionTable("Dépenses Filtrées", expenses, 'red')}
            </div>
        </>
      )}
    </div>
  );
};
export default TransactionManager;