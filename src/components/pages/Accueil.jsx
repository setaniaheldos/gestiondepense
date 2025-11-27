import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Calendar, DollarSign, TrendingUp, TrendingDown, RefreshCw, Sun, Moon } from 'lucide-react';

// URL de base de votre API Express
const API_BASE_URL = 'https://mon-api-rmv3.onrender.com'; 

// Formatage de la date YYYY-MM-DD
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Fonction utilitaire pour formater en Ariary (Ar)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('MGA', 'Ar');
};

/**
 * Agrège les transactions brutes par jour pour le graphique linéaire.
 */
const aggregateDataByDay = (transactions) => {
  const dailyTotals = transactions.reduce((acc, transaction) => {
    const dateKey = formatDate(transaction.date);
    
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, Revenu: 0, Dépense: 0 };
    }

    const montant = parseFloat(transaction.montant);

    if (transaction.categorie === 'revenu') {
      acc[dateKey].Revenu += montant;
    } else if (transaction.categorie === 'depense') {
      acc[dateKey]['Dépense'] += montant;
    }

    return acc;
  }, {});

  const sortedData = Object.values(dailyTotals).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let cumulativeBalance = 0;
  const dataWithBalance = sortedData.map(item => {
    cumulativeBalance += item.Revenu - item['Dépense'];
    return {
      ...item,
      Solde: cumulativeBalance
    };
  });

  return dataWithBalance;
};

// Composant de carte réutilisable
const StatCard = ({ title, value, icon, color, theme }) => (
  <div className={`flex items-center p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
    theme === 'dark' 
      ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
      : 'bg-white hover:bg-gray-50 border border-gray-100'
  }`}>
    <div className={`p-4 rounded-2xl ${color} bg-opacity-15 mr-5`}>
      {icon}
    </div>
    <div>
      <p className={`text-sm font-medium ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        {title}
      </p>
      <p className={`text-2xl font-bold ${
        color.includes('green') 
          ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
          : color.includes('red')
          ? (theme === 'dark' ? 'text-red-400' : 'text-red-600')
          : color.includes('indigo')
          ? (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600')
          : (theme === 'dark' ? 'text-white' : 'text-gray-800')
      }`}>
        {formatCurrency(value)}
      </p>
    </div>
  </div>
);

// Composant Toggle pour dark/light mode
const ThemeToggle = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className={`p-3 rounded-2xl transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`}
    aria-label="Changer le thème"
  >
    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
  </button>
);

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');

  // Détection automatique du thème du système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error("Erreur de récupération des données:", err);
      setError(`Impossible de se connecter à l'API (${API_BASE_URL}). Assurez-vous que le backend est démarré.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const aggregatedData = aggregateDataByDay(transactions);
  
  const totalRevenu = transactions.filter(t => t.categorie === 'revenu').reduce((sum, t) => sum + parseFloat(t.montant), 0);
  const totalDepense = transactions.filter(t => t.categorie === 'depense').reduce((sum, t) => sum + parseFloat(t.montant), 0);
  const soldeActuel = totalRevenu - totalDepense;

  // Données pour le Pie Chart
  const pieData = [
    { name: 'Revenu Total', value: totalRevenu, color: theme === 'dark' ? '#10b981' : '#059669' },
    { name: 'Dépense Totale', value: totalDepense, color: theme === 'dark' ? '#ef4444' : '#dc2626' },
  ];

  // Couleurs pour les graphiques selon le thème
  const chartColors = {
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    text: theme === 'dark' ? '#d1d5db' : '#6b7280',
    tooltip: {
      bg: theme === 'dark' ? '#1f2937' : '#ffffff',
      border: theme === 'dark' ? '#374151' : '#e5e7eb',
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`p-8 rounded-2xl text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl`}>
          <RefreshCw className={`w-8 h-8 mx-auto mb-4 animate-spin ${
            theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
          }`} />
          <p className={`text-lg font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Chargement des données financières...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-red-50'
      } p-6`}>
        <div className={`text-center p-8 rounded-2xl max-w-md w-full ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl`}>
          <p className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-700'
          }`}>
            Erreur de connexion à l'API
          </p>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center mx-auto ${
              theme === 'dark' 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
          </button>
        </div>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-indigo-50'
      } p-4`}>
        <div className={`text-center p-8 rounded-2xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl`}>
          <DollarSign className={`w-12 h-12 mx-auto mb-4 ${
            theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'
          }`} />
          <h2 className={`text-2xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          }`}>
            Aucune transaction trouvée
          </h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Veuillez ajouter des transactions via votre API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    } p-4 sm:p-8 font-sans`}>
      
      {/* Header avec toggle de thème */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center">
            <Calendar className={`w-8 h-8 mr-3 ${
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
            }`} /> 
            Tableau de Bord Financier
          </h1>
          <p className={`mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Vue d'ensemble des finances en Ariary (Ar)
          </p>
        </div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </header>

      {/* Cartes des indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          title="Revenus Totaux" 
          value={totalRevenu} 
          icon={<TrendingUp className={`w-6 h-6 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`} />} 
          color={theme === 'dark' ? 'bg-green-400' : 'bg-green-500'}
          theme={theme}
        />
        <StatCard 
          title="Dépenses Totales" 
          value={totalDepense} 
          icon={<TrendingDown className={`w-6 h-6 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`} />} 
          color={theme === 'dark' ? 'bg-red-400' : 'bg-red-500'}
          theme={theme}
        />
        <StatCard 
          title="Solde Actuel" 
          value={soldeActuel} 
          icon={<DollarSign className={`w-6 h-6 ${
            soldeActuel >= 0 
              ? (theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600')
              : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
          }`} />} 
          color={soldeActuel >= 0 
            ? (theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-500')
            : (theme === 'dark' ? 'bg-red-400' : 'bg-red-500')
          }
          theme={theme}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Graphique Circulaire (Répartition) */}
        <div className={`p-6 rounded-2xl shadow-2xl transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 border-b pb-3 ${
            theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'
          }`}>
            Répartition Globale (Revenus vs Dépenses)
          </h2>
          <div className="h-80 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: chartColors.tooltip.bg,
                    borderColor: chartColors.tooltip.border,
                    borderRadius: '8px',
                    color: chartColors.text,
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ color: chartColors.text }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique du Solde Cumulé (Ligne) */}
        <div className={`p-6 rounded-2xl shadow-2xl transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 border-b pb-3 ${
            theme === 'dark' ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'
          }`}>
            Évolution du Solde Cumulé
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aggregatedData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={chartColors.grid} 
                />
                <XAxis 
                  dataKey="date" 
                  stroke={chartColors.text}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={chartColors.text}
                  tickFormatter={(value) => `${value} Ar`}
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Solde Cumulé']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: chartColors.tooltip.bg,
                    borderColor: chartColors.tooltip.border,
                    borderRadius: '8px',
                    color: chartColors.text,
                  }}
                />
                <Legend wrapperStyle={{ color: chartColors.text }} />
                <Line 
                  type="monotone" 
                  dataKey="Solde" 
                  stroke={theme === 'dark' ? '#818cf8' : '#4f46e5'}
                  strokeWidth={3} 
                  dot={false}
                  name="Solde"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}