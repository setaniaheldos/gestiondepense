import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, RefreshCw, 
  Check, X, CalendarCheck, CalendarX, Clock4, Download, FileText 
} from 'lucide-react';

// Constantes pour les statuts et les couleurs
const STATUT_MAP = {
  'en_attente': { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock4 },
  'confirme':   { label: 'Confirmé',   color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CalendarCheck },
  'annule':     { label: 'Annulé',     color: 'bg-red-100 text-red-700 border-red-300', icon: CalendarX }
};

export default function Rendezvous() {
  const [rdvs, setRdvs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  
  const [form, setForm] = useState({
    idRdv: null,
    cinPatient: '',
    cinPraticien: '',
    dateHeure: '',
    statut: 'en_attente',
    idRdvParent: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [search, setSearch] = useState({ patient: '', praticien: '', statut: '', dateFilter: '' });
  const [sortField, setSortField] = useState('dateHeure');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // --- Notifications ---
  const handleNotification = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 4000 : 2500);
  };
  const handleError = (msg) => handleNotification(`Erreur : ${msg}`, 'error');
  const handleSuccess = (msg) => handleNotification(`Succès : ${msg}`, 'success');

  // --- Chargement des données ---
  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      axios.get('https://mon-api-rmv3.onrender.com/rendezvous'),
      axios.get('https://mon-api-rmv3.onrender.com/patients'),
      axios.get('https://mon-api-rmv3.onrender.com/praticiens')
    ])
      .then(([rdvRes, patRes, pratRes]) => {
        setRdvs(rdvRes.data.map(r => ({
          ...r,
          dateHeure: r.dateHeure || new Date().toISOString()
        })));
        setPatients(patRes.data);
        setPraticiens(pratRes.data);
      })
      .catch(() => handleError("Impossible de charger les données. Vérifiez le serveur."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Gestion du formulaire ---
  const resetForm = () => {
    setForm({
      idRdv: null,
      cinPatient: '',
      cinPraticien: '',
      dateHeure: '',
      statut: 'en_attente',
      idRdvParent: ''
    });
    setIsEditing(false);
  };

  const toggleAddForm = () => {
    if (showAddForm) {
      // On ferme le formulaire
      setShowAddForm(false);
      resetForm();
    } else {
      // On ouvre pour un nouveau RDV
      setShowAddForm(true);
      resetForm();
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearch(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSort = (field) => {
    setPage(1);
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = isEditing ? 'put' : 'post';
    const url = isEditing
      ? `https://mon-api-rmv3.onrender.com/rendezvous/${form.idRdv}`
      : 'https://mon-api-rmv3.onrender.com/rendezvous';

    const dataToSend = isEditing ? form : {
      cinPatient: form.cinPatient,
      cinPraticien: form.cinPraticien,
      dateHeure: form.dateHeure,
      statut: form.statut,
      idRdvParent: form.idRdvParent || null
    };

    axios[method](url, dataToSend)
      .then(() => {
        fetchAll();
        toggleAddForm(); // ferme et réinitialise
        handleSuccess(isEditing ? "Rendez-vous mis à jour." : "Nouveau rendez-vous créé.");
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Erreur lors de l'opération.";
        handleError(msg);
      });
  };

  const handleEdit = (rdv) => {
    const formattedDate = new Date(rdv.dateHeure).toISOString().slice(0, 16);
    setForm({ ...rdv, dateHeure: formattedDate });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("⚠️ Supprimer définitivement ce rendez-vous ?")) {
      axios.delete(`https://mon-api-rmv3.onrender.com/rendezvous/${id}`)
        .then(() => {
          fetchAll();
          handleSuccess("Rendez-vous supprimé.");
        })
        .catch(() => handleError("Échec de la suppression."));
    }
  };

  // --- Utilitaires ---
  const getPatientName = (cin) => {
    const p = patients.find(p => p.cinPatient === cin);
    return p ? `${p.nom} ${p.prenom}` : `CIN: ${cin} (Inconnu)`;
  };

  const getPraticienName = (cin) => {
    const pr = praticiens.find(pr => pr.cinPraticien === cin);
    return pr ? `${pr.nom} ${pr.prenom}` : `CIN: ${cin} (Inconnu)`;
  };

  const getExportData = (data) => data.map(r => ({
    'ID RDV': r.idRdv,
    'Patient': getPatientName(r.cinPatient),
    'Praticien': getPraticienName(r.cinPraticien),
    'Date & Heure': new Date(r.dateHeure).toLocaleString('fr-FR'),
    'Statut': STATUT_MAP[r.statut]?.label || r.statut,
    'ID Parent': r.idRdvParent || '-'
  }));

  const handleExportExcel = () => {
    const dataToExport = getExportData(filteredRdvs);
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RendezVous");
    XLSX.writeFile(wb, "rendezvous_export.xlsx");
    handleSuccess("Export Excel terminé.");
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(12, 74, 110);
    doc.text("Rapport des Rendez-vous", 14, 15);

    const exportData = getExportData(filteredRdvs);
    doc.autoTable({
      head: [Object.keys(exportData[0] || {})],
      body: exportData.map(d => Object.values(d)),
      startY: 25,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 144, 255], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 248, 255] },
    });
    doc.save("rendezvous_export.pdf");
    handleSuccess("PDF généré.");
  };

  // --- Filtrage & tri ---
  const isDateMatch = (rdvDate, filter) => {
    const date = new Date(rdvDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':   return date >= today && date < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      case 'future':  return date > new Date();
      case 'past':    return date < today;
      default:        return true;
    }
  };

  const filteredRdvs = rdvs
    .filter(r =>
      (search.patient === '' || getPatientName(r.cinPatient).toLowerCase().includes(search.patient.toLowerCase())) &&
      (search.praticien === '' || getPraticienName(r.cinPraticien).toLowerCase().includes(search.praticien.toLowerCase())) &&
      (search.statut === '' || r.statut === search.statut) &&
      isDateMatch(r.dateHeure, search.dateFilter)
    )
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'dateHeure') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredRdvs.length / perPage);
  const paginatedRdvs = filteredRdvs.slice((page - 1) * perPage, page * perPage);

  // --- Composants UI ---
  const StatutTag = ({ statut }) => {
    const info = STATUT_MAP[statut] || STATUT_MAP['en_attente'];
    const Icon = info.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {info.label}
      </span>
    );
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline-block ml-1 text-sky-200" />
      : <ChevronDown className="w-4 h-4 inline-block ml-1 text-sky-200" />;
  };

  const getRowClass = (rdv) => {
    const now = new Date();
    const rdvDate = new Date(rdv.dateHeure);
    if (rdv.statut === 'annule') return 'bg-red-50/50 text-red-700 line-through hover:bg-red-100';
    if (rdvDate < now) return 'bg-gray-200/50 text-gray-600 italic hover:bg-gray-200';
    return 'bg-white hover:bg-sky-50/50';
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-gray-800 max-w-[1800px] mx-auto">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-semibold text-white flex items-center gap-2 transition-all ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      <h1 className="text-4xl font-extrabold mb-8 text-sky-800 text-center flex items-center justify-center gap-3">
        <CalendarCheck className='w-7 h-7 text-sky-600' />
        Gestion des Rendez-vous Médicaux
      </h1>

      {/* Filtres & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-6 border border-sky-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <p className='text-lg font-bold text-gray-700 flex items-center gap-2'>
            <Search className="w-6 h-6 text-sky-600" /> Filtres
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="text" placeholder="Patient" name="patient" value={search.patient} onChange={handleSearchChange} className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-sky-300 outline-none" />
            <input type="text" placeholder="Praticien" name="praticien" value={search.praticien} onChange={handleSearchChange} className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-sky-300 outline-none" />
            <select name="statut" value={search.statut} onChange={handleSearchChange} className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-sky-300 outline-none">
              <option value="">Tous statuts</option>
              {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select name="dateFilter" value={search.dateFilter} onChange={handleSearchChange} className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-sky-300 outline-none">
              <option value="">Toutes dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="future">À venir</option>
              <option value="past">Passés</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button onClick={handlePrintPDF} className="flex items-center bg-red-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-red-700 transition">
            <FileText className="w-5 h-5 mr-2" /> PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center bg-emerald-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-emerald-700 transition">
            <Download className="w-5 h-5 mr-2" /> Excel
          </button>
          <button onClick={toggleAddForm} className="flex items-center bg-sky-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-sky-700 transition transform hover:scale-105">
            {showAddForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {showAddForm ? 'Fermer' : 'Nouveau RDV'}
          </button>
          <button onClick={fetchAll} disabled={loading} className="flex items-center bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition disabled:opacity-60">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl mb-8 border border-sky-400">
          <h3 className="text-2xl font-bold text-sky-700 mb-4">{isEditing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Patient *</label>
              <select name="cinPatient" value={form.cinPatient} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-200">
                <option value="" disabled>Choisir...</option>
                {patients.map(p => <option key={p.cinPatient} value={p.cinPatient}>{p.cinPatient} - {p.nom} {p.prenom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Praticien *</label>
              <select name="cinPraticien" value={form.cinPraticien} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-200">
                <option value="" disabled>Choisir...</option>
                {praticiens.map(pr => <option key={pr.cinPraticien} value={pr.cinPraticien}>{pr.cinPraticien} - {pr.nom} {pr.prenom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Date & Heure *</label>
              <input type="datetime-local" name="dateHeure" value={form.dateHeure} onChange={handleChange} required className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-200" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Statut</label>
              <select name="statut" value={form.statut} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-200">
                {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">ID Parent (suivi)</label>
              <input type="text" name="idRdvParent" value={form.idRdvParent} onChange={handleChange} placeholder="Optionnel" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-sky-200" />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="submit" className={`flex items-center px-8 py-3 rounded-xl text-white font-bold transition ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'}`}>
              {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={toggleAddForm} className="flex items-center px-8 py-3 rounded-xl bg-gray-500 text-white font-bold hover:bg-gray-600 transition">
              <X className="w-5 h-5 mr-2" /> Annuler
            </button>
          </div>
        </form>
      )}

      {/* Tableau Desktop */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-xl border border-sky-100">
        <table className="min-w-full text-sm">
          <thead className="bg-sky-600 text-white uppercase font-bold">
            <tr>
              {['idRdv','cinPatient','cinPraticien','dateHeure','statut','idRdvParent'].map(f => (
                <th key={f} className="px-4 py-3 text-left cursor-pointer hover:bg-sky-700" onClick={() => handleSort(f)}>
                  {f === 'idRdv' ? 'ID' : f === 'cinPatient' ? 'Patient' : f === 'cinPraticien' ? 'Praticien' : f === 'dateHeure' ? 'Date & Heure' : f === 'statut' ? 'Statut' : 'ID Parent'} <SortIcon field={f} />
                </th>
              ))}
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10"><Clock4 className="w-6 h-6 animate-spin inline mr-2" /> Chargement...</td></tr>
            ) : paginatedRdvs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500">Aucun rendez-vous trouvé</td></tr>
            ) : paginatedRdvs.map(r => (
              <tr key={r.idRdv} className={`border-t transition ${getRowClass(r)}`}>
                <td className="px-4 py-3 font-mono text-xs">{r.idRdv}</td>
                <td className="px-4 py-3 font-medium">{getPatientName(r.cinPatient)}</td>
                <td className="px-4 py-3">{getPraticienName(r.cinPraticien)}</td>
                <td className="px-4 py-3">{new Date(r.dateHeure).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3"><StatutTag statut={r.statut} /></td>
                <td className="px-4 py-3 text-gray-500 italic">{r.idRdvParent || '-'}</td>
                <td className="px-4 py-3 text-center space-x-2">
                  <button onClick={() => handleEdit(r)} className="bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.idRdv)} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-6">
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-6 py-2 bg-sky-600 text-white rounded-xl disabled:bg-gray-400">Précédent</button>
        <span className="px-4 py-2 bg-white border border-sky-300 rounded-xl font-bold">Page {page} / {totalPages || 1}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-6 py-2 bg-sky-600 text-white rounded-xl disabled:bg-gray-400">Suivant</button>
      </div>

      {/* Version Mobile (cartes) */}
      <div className="md:hidden grid gap-4 mt-6">
        {paginatedRdvs.map(r => (
          <div key={r.idRdv} className={`p-5 rounded-xl shadow-lg border-l-4 ${r.statut === 'annule' ? 'border-red-500 bg-red-50' : new Date(r.dateHeure) < new Date() ? 'border-gray-400 bg-gray-100' : 'border-sky-500 bg-white'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-lg">{getPatientName(r.cinPatient)}</p>
                <p className="text-sky-600">Dr. {getPraticienName(r.cinPraticien)}</p>
              </div>
              <StatutTag statut={r.statut} />
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Date :</strong> {new Date(r.dateHeure).toLocaleString('fr-FR')}</p>
              {r.idRdvParent && <p><strong>ID Parent :</strong> {r.idRdvParent}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => handleEdit(r)} className="bg-amber-500 text-white p-2 rounded-lg"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => handleDelete(r.idRdv)} className="bg-red-600 text-white p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}