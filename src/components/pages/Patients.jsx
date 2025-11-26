// TransactionManager.jsx - Composant React pour la gestion des transactions
// Assurez-vous d'avoir installé React, Tailwind CSS (via CDN ou build), et d'exécuter via Vite/Create React App.
// Pour Tailwind via CDN (développement seulement) : Ajoutez <script src="https://cdn.tailwindcss.com"></script> dans index.html.

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://mon-api-rmv3.onrender.com'; // Remplacez par votre URL Render si déployé

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ categorie: '', montant: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger la liste des transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/transactions`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categorie || !formData.montant) {
      setError('Catégorie et montant requis');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Mise à jour
        const response = await fetch(`${API_BASE}/transactions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      } else {
        // Ajout
        const response = await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      }
      setFormData({ categorie: '', montant: '' });
      setEditingId(null);
      loadTransactions();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editTransaction = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      const transaction = await response.json();
      setFormData({ categorie: transaction.categorie, montant: transaction.montant.toString() });
      setEditingId(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      const response = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      loadTransactions();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    setFormData({ categorie: '', montant: '' });
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestion des Transactions</h1>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input
              type="text"
              name="categorie"
              value={formData.categorie}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              name="montant"
              value={formData.montant}
              onChange={handleInputChange}
              step="0.01"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Erreur */}
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>}

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-4">Chargement...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.categorie}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${transaction.montant.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => editTransaction(transaction.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;