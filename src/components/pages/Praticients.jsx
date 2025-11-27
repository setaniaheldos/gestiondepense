import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';

// NOTE: L'URL de l'API est définie ici. Remplacez par votre URL Render si nécessaire.
const API_BASE = 'https://mon-api-rmv3.onrender.com';

// --- Fonctions utilitaires de Local Storage pour la persistance ---

const getLocalStorageItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Erreur de lecture de localStorage pour ${key}:`, error);
    return defaultValue;
  }
};

const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erreur d'écriture de localStorage pour ${key}:`, error);
  }
};

const ActivityManager = () => {
  const [activites, setActivites] = useState([]);
  const [formData, setFormData] = useState({ titre: '', debut: '', fin: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('non testé');
  
  // PERSISTANCE 1/3 : Formulaire visible
  const [isFormVisible, setIsFormVisible] = useState(
    getLocalStorageItem('activityManagerFormVisible', false)
  ); 
  
  // PERSISTANCE 2/3 : Statut de filtrage
  const [filterStatus, setFilterStatus] = useState(
    getLocalStorageItem('activityManagerFilterStatus', 'tous')
  ); 
  
  // PERSISTANCE 3/3 : Filtre Mois/Année (format YYYY-MM)
  const today = new Date();
  const defaultMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthYear, setSelectedMonthYear] = useState(
    getLocalStorageItem('activityManagerMonthFilter', 'tous')
  );

  // Thème : Initialise en fonction de la préférence système ou à 'light'.
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
  
  // PERSISTANCE DE L'ÉTAT : Sauvegarder les filtres et l'affichage lors de chaque changement
  useEffect(() => {
    setLocalStorageItem('activityManagerFormVisible', isFormVisible);
  }, [isFormVisible]);
  
  useEffect(() => {
    setLocalStorageItem('activityManagerFilterStatus', filterStatus);
  }, [filterStatus]);
  
  useEffect(() => {
    setLocalStorageItem('activityManagerMonthFilter', selectedMonthYear);
  }, [selectedMonthYear]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const logApiStatus = (status, details = '') => {
    console.log(`[API STATUS] ${status}: ${details}`);
    setApiStatus(`${status} (${details})`);
  };

  // Fonction pour charger la liste des activités (Utilisation de useCallback pour la stabilité)
  const loadActivites = useCallback(async () => {
    setLoading(true);
    setError('');
    logApiStatus('loading', 'Début du fetch...');
    try {
      const response = await fetch(`${API_BASE}/activites`);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText || 'Erreur serveur'}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Données invalides (pas un tableau)');
      }
      
      // Assure que les dates sont dans le format YYYY-MM-DDTHH:MM pour l'affichage dans l'input datetime-local
      const formattedData = data.map(act => ({
        ...act,
        // Supprime les secondes et la zone Z pour être compatible avec datetime-local
        debut: act.debut ? act.debut.slice(0, 16) : '',
        fin: act.fin ? act.fin.slice(0, 16) : '',
      }));
      
      setActivites(formattedData);
      logApiStatus('succès', `${data.length} activités chargées`);

    } catch (err) {
      console.error('[FETCH ERROR] Plein détail:', err);
      setError(err.message);
      logApiStatus('échec', err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Dépendances vides pour n'être créée qu'une fois

  useEffect(() => {
    loadActivites();
    // Simulation de window.confirm
    if (typeof window !== 'undefined') {
        window.confirm = (message) => {
            return prompt(message + " (Tappez 'oui' pour confirmer)")?.toLowerCase() === 'oui';
        };
    }
  }, [loadActivites]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.debut || !formData.fin) {
      setError('Titre, date de début et date de fin sont requis.');
      return;
    }

    // Validation basique des dates
    const dateDebut = new Date(formData.debut);
    const dateFin = new Date(formData.fin);
    if (dateDebut >= dateFin) {
      setError('La date de début doit être strictement antérieure à la date de fin.');
      return;
    }
    
    // Le backend attend le format ISO complet (ajout de la zone Z)
    const submitData = {
        titre: formData.titre.trim(),
        debut: formData.debut + ':00.000Z', 
        fin: formData.fin + ':00.000Z',
        description: formData.description.trim() || null,
    };

    setLoading(true);
    setError('');
    const isEdit = !!editingId;
    const endpoint = isEdit ? `${API_BASE}/activites/${editingId}` : `${API_BASE}/activites`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${method} HTTP ${response.status}: ${errText}`);
      }
      
      await response.json();
      
      // RÉINITIALISATION et cache le formulaire après succès
      setFormData({ titre: '', debut: '', fin: '', description: '' });
      setEditingId(null);
      setIsFormVisible(false); // Cache le formulaire après un ajout/modification réussi
      await loadActivites();
      logApiStatus('opération réussie', isEdit ? 'mise à jour' : 'ajout');

    } catch (err) {
      console.error(`[${method} FULL ERROR]:`, err);
      setError(err.message);
      logApiStatus('opération échouée', err.message);
    } finally {
      setLoading(false);
    }
  };

  const editActivite = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/activites/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      const activite = await response.json();
      
      // Assure que les dates sont dans le format YYYY-MM-DDTHH:MM pour l'input datetime-local
      setFormData({
        titre: activite.titre,
        debut: activite.debut ? activite.debut.slice(0, 16) : '',
        fin: activite.fin ? activite.fin.slice(0, 16) : '',
        description: activite.description || '',
      });
      setEditingId(id);
      setIsFormVisible(true); // Ouvre le formulaire en mode édition
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteActivite = async (id) => {
    if (!window.confirm('Confirmer la suppression de cette activité ?')) return;
    try {
      const response = await fetch(`${API_BASE}/activites/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      loadActivites();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    setFormData({ titre: '', debut: '', fin: '', description: '' });
    setEditingId(null);
    setIsFormVisible(false); // Cache le formulaire après annulation
  };
  
  // Fonction utilitaire pour formater les dates pour l'affichage dans le tableau
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return dateString; 
      
      return date.toLocaleString('fr-FR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Logique pour déterminer le statut de l'activité
  const getActivityStatus = (debutString, finString) => {
    const now = new Date();
    const debut = new Date(debutString);
    const fin = new Date(finString);

    if (isNaN(debut) || isNaN(fin)) return { status: 'inconnu', label: 'Inconnu', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300' };

    if (now < debut) {
      return { status: 'futur', label: 'À Venir', color: 'text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300', icon: '⏰' };
    } else if (now >= debut && now <= fin) {
      return { status: 'actuel', label: 'En Cours', color: 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300', icon: '▶️' };
    } else {
      return { status: 'passe', label: 'Terminée', color: 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300', icon: '✅' };
    }
  };
  
  // NOUVEAU : Fonction pour générer la liste des mois/années pour le filtre
  const getMonthYearOptions = useMemo(() => {
    const minYear = 2020;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const options = [];

    // Afficher les 12 mois précédents, le mois en cours et les 12 mois suivants
    for (let i = -12; i <= 12; i++) {
        const date = new Date();
        date.setMonth(currentMonth + i);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const monthLabel = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        
        // Empêcher d'aller trop loin dans le passé si souhaité, mais ici on garde une bonne étendue.
        if (year >= minYear) {
            options.push({ value: `${year}-${month}`, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
        }
    }

    // Retirer les doublons et trier (le tri par défaut de l'objet Set est suffisant ici)
    const uniqueOptions = Array.from(new Set(options.map(o => JSON.stringify(o))))
        .map(s => JSON.parse(s))
        .sort((a, b) => (a.value > b.value ? 1 : -1));
        
    return uniqueOptions;
  }, []); // Se calcule une seule fois au chargement du composant

  // LOGIQUE FINALE : Filtrage et tri des activités
  const sortedAndFilteredActivites = useMemo(() => {
    let filtered = activites;
    
    // 1. Filtrage par Mois/Année
    if (selectedMonthYear !== 'tous') {
      const [filterYear, filterMonth] = selectedMonthYear.split('-');
      
      filtered = filtered.filter(activite => {
        // La date de début contient la partie YYYY-MM
        return activite.debut.startsWith(`${filterYear}-${filterMonth}`);
      });
    }

    // 2. Filtrage par Statut
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(activite => {
        const { status } = getActivityStatus(activite.debut, activite.fin);
        return status === filterStatus;
      });
    }

    // 3. Tri (Proche en premier/chronologique)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.debut);
      const dateB = new Date(b.debut);
      
      return dateA.getTime() - dateB.getTime();
    });

    return sorted;

  }, [activites, filterStatus, selectedMonthYear]);

  // FONCTION D'EXPORT PDF (MANUELLE AVEC jsPDF)
  const exportPdf = () => {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const periodTitle = selectedMonthYear === 'tous' ? 'Toutes les Activités' : 
      `Activités - ${monthNames[parseInt(selectedMonthYear.split('-')[1]) - 1]} ${selectedMonthYear.split('-')[0]}`;
    const statusLabel = filterStatus === 'tous' ? 'Tous' : 
      { futur: 'À Venir', actuel: 'En Cours', passe: 'Terminée' }[filterStatus] || 'Tous';
   
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
    y += 10;
    addText(`Filtré par Statut: ${statusLabel}`, 12);
    y += 15;
   
    // 2. Sommaire
    addText('LISTE DES ACTIVITÉS:', 14, true);
    drawLine();
    if (sortedAndFilteredActivites.length === 0) {
      addText('Aucune activité trouvée pour ce filtre.', 12);
    } else {
      sortedAndFilteredActivites.forEach((activite, index) => {
        const status = getActivityStatus(activite.debut, activite.fin);
        addText(`${index + 1}. ${activite.titre}`, 11, true);
        addText(`   Statut: ${status.label} (${status.icon})`, 11);
        addText(`   Début: ${formatDateForDisplay(activite.debut)}`, 11);
        addText(`   Fin: ${formatDateForDisplay(activite.fin)}`, 11);
        addText(`   Description: ${activite.description || 'N/A'}`, 11);
        y += 5; // Espacement entre activités
      });
    }
   
    // 3. Sauvegarder
    pdf.save(`rapport_activites_${selectedMonthYear === 'tous' ? 'tous' : selectedMonthYear}_${statusLabel}.pdf`);
  };

  return (
    <div className="p-4 md:p-10 bg-gray-100 dark:bg-gray-900 min-h-screen w-full font-[Inter]"> 
      <header className="flex justify-between items-start mb-8 border-b-4 border-purple-500 pb-2">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
            🗓️ Gestionnaire d'Activités
        </h1>
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition duration-300 shadow-md hover:ring-2 ring-purple-500"
            title="Basculer le Thème"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {/* Boutons d'Action (Ajouter/Cacher + Rafraîchir) */}
      <div className="flex justify-between items-center mb-6">
        
        <div className="flex gap-4">
            <button
                onClick={() => {
                    // Mettre à jour isFormVisible ET sauvegarder en localStorage
                    setIsFormVisible(current => {
                        const next = !current;
                        if (next) setFormData({ titre: '', debut: '', fin: '', description: '' }); // Réinitialiser si on ouvre
                        setEditingId(null);
                        return next;
                    });
                }}
                className={`px-6 py-3 font-bold rounded-lg transition duration-150 ease-in-out shadow-lg hover:shadow-xl ${
                    isFormVisible
                        ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                        : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'
                }`}
                disabled={loading}
            >
                {isFormVisible ? 'Cacher le Formulaire' : '➕ Nouvelle Activité'}
            </button>
            <button
                onClick={loadActivites}
                className="px-6 py-3 font-bold rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition duration-150 ease-in-out shadow-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                disabled={loading}
                title="Recharger les données depuis l'API"
            >
                {loading ? 'Rechargement...' : '🔄 Rafraîchir'}
            </button>
        </div>
      </div>


      {/* Formulaire - Affiché conditionnellement */}
      {isFormVisible && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                {editingId ? '✍️ Modifier l\'Activité' : '➕ Ajouter une Nouvelle Activité'}
            </h2>
            <form onSubmit={handleSubmit}>
              
              {/* GRILLE COMPACTE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                
                {/* Titre (Prend 2 colonnes sur desktop) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre de l'Activité</label>
                  <input
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleInputChange}
                    placeholder="Ex: Réunion projet A"
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150"
                  />
                </div>
                
                {/* Début (1 colonne sur desktop) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Début (Date & Heure)</label>
                  <input
                    type="datetime-local"
                    name="debut"
                    value={formData.debut}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150"
                  />
                </div>

                {/* Fin (1 colonne sur desktop) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fin (Date & Heure)</label>
                  <input
                    type="datetime-local"
                    name="fin"
                    value={formData.fin}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150"
                  />
                </div>
              </div>

              {/* Description (Pleine largeur) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optionnel)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Détails de l'activité, lieu, participants..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150 resize-y"
                ></textarea>
              </div>
              
              {/* Ligne des boutons */}
              <div className="flex justify-end pt-2 gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition duration-150 ease-in-out shadow-lg hover:shadow-xl min-w-[180px] dark:bg-purple-700 dark:hover:bg-purple-800"
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
      
      {/* FILTRES DE STATUT ET MOIS + BOUTON PDF */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Filtre par Mois */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrer par Mois :</label>
              <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 transition duration-150"
              >
                  <option value="tous">Tous les mois</option>
                  {getMonthYearOptions.map(option => (
                      <option key={option.value} value={option.value}>
                          {option.label}
                      </option>
                  ))}
              </select>
          </div>
          
          {/* Filtre par Statut */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrer par Statut :</label>
              <div className="flex space-x-2">
                  <button
                      onClick={() => setFilterStatus('tous')}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition duration-150 ${
                          filterStatus === 'tous' 
                              ? 'bg-purple-600 text-white shadow-md' 
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                      Tous
                  </button>
                  <button
                      onClick={() => setFilterStatus('futur')}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition duration-150 ${
                          filterStatus === 'futur' 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                      ⏰ À Venir
                  </button>
                  <button
                      onClick={() => setFilterStatus('actuel')}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition duration-150 ${
                          filterStatus === 'actuel' 
                              ? 'bg-green-600 text-white shadow-md' 
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                      ▶️ En Cours
                  </button>
                  <button
                      onClick={() => setFilterStatus('passe')}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition duration-150 ${
                          filterStatus === 'passe' 
                              ? 'bg-red-600 text-white shadow-md' 
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                      ✅ Terminée
                  </button>
              </div>
          </div>
        </div>
        <button
            onClick={exportPdf}
            disabled={sortedAndFilteredActivites.length === 0}
            className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition duration-150 shadow-lg"
        >
            🖨️ Exporter en PDF ({sortedAndFilteredActivites.length} Activités)
        </button>
      </div>


      {/* Tableau des Activités */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900 border-b border-purple-100 dark:border-purple-700 text-lg font-bold text-gray-700 dark:text-gray-200">
            Liste des Activités Filtrées ({sortedAndFilteredActivites.length} / {activites.length} Totales)
        </div>
        
        {loading && activites.length === 0 ? (
            <div className="text-center py-12 text-purple-600 dark:text-purple-400 text-xl font-medium">
                ⏳ Chargement initial des activités...
            </div>
        ) : sortedAndFilteredActivites.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400 border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-xl mb-2">📭 Aucune activité trouvée pour cette sélection.</p>
                <p>Modifiez le filtre, ou cliquez sur "Nouvelle Activité" pour ajouter un événement.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Début</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedAndFilteredActivites.map((activite) => {
                            const status = getActivityStatus(activite.debut, activite.fin);
                            return (
                                <tr key={activite.id} className="hover:bg-purple-50 dark:hover:bg-gray-700 transition duration-100">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color} shadow-sm`}>
                                            {status.icon} {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{activite.titre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {formatDateForDisplay(activite.debut)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {formatDateForDisplay(activite.fin)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate" title={activite.description}>
                                        {activite.description || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button
                                            onClick={() => editActivite(activite.id)}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-semibold transition duration-150 dark:text-purple-400 dark:hover:text-purple-500"
                                            title="Éditer l'activité"
                                        >
                                            ✏️ Éditer
                                        </button>
                                        <button
                                            onClick={() => deleteActivite(activite.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-semibold transition duration-150 dark:text-red-400 dark:hover:text-red-500"
                                            title="Supprimer l'activité"
                                        >
                                            🗑️ Supprimer
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default ActivityManager;