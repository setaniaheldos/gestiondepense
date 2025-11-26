// ActivityManager.jsx - Composant React pour la gestion des activités
// Utilisez de la même manière que TransactionManager.

import React, { useState, useEffect } from 'react';

const API_BASE = 'https://mon-api-rmv3.onrender.com'; // Remplacez par votre URL Render si déployé

const ActivityManager = () => {
  const [activites, setActivites] = useState([]);
  const [formData, setFormData] = useState({ titre: '', debut: '', fin: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger la liste des activités
  const loadActivites = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/activites`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setActivites(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivites();
  }, []);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre || !formData.debut || !formData.fin) {
      setError('Titre, début et fin requis');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Mise à jour
        const response = await fetch(`${API_BASE}/activites/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      } else {
        // Ajout
        const response = await fetch(`${API_BASE}/activites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      }
      setFormData({ titre: '', debut: '', fin: '', description: '' });
      setEditingId(null);
      loadActivites();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editActivite = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/activites/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      const activite = await response.json();
      setFormData({
        titre: activite.titre,
        debut: activite.debut,
        fin: activite.fin,
        description: activite.description || '',
      });
      setEditingId(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteActivite = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      const response = await fetch(`${API_BASE}/activites/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      loadActivites();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    setFormData({ titre: '', debut: '', fin: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestion des Activités</h1>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Début (YYYY-MM-DD HH:MM)</label>
            <input
              type="text"
              name="debut"
              value={formData.debut}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin (YYYY-MM-DD HH:MM)</label>
            <input
              type="text"
              name="fin"
              value={formData.fin}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Début</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activites.map((activite) => (
                <tr key={activite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activite.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activite.titre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activite.debut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activite.fin}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{activite.description || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => editActivite(activite.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => deleteActivite(activite.id)}
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

export default ActivityManager;