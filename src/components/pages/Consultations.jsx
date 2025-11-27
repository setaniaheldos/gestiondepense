import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, MinusCircle, TrendingUp, BarChart3 } from 'lucide-react';

// URL de base de votre API Express/PostgreSQL.
// *** IMPORTANT : Remplacez ceci par votre URL de production (ex: 'https://votre-app-render.onrender.com') ***
const API_BASE_URL = 'http://localhost:3000';

// Helper pour formater une date selon le 'timeframe'
const getDateFormat = (date, timeframe) => {
  const d = new Date(date);
  switch (timeframe) {
    case 'weekly':
      // Jours (ex: 20/11)
      return `${d.getDate()}/${d.getMonth() + 1}`;
    case 'monthly':
      // Jours (ex: 20/11)
      return `${d.getDate()}/${d.getMonth() + 1}`;
    case 'yearly':
      // Mois (ex: Nov 2023)
      return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    default:
      return d.toLocaleDateString();
  }
};

// Fonction pour grouper et agréger les données brutes de l'API en séries temporelles
const groupDataByTimeframe = (transactions, activities, timeframe) => {
  const groupedData = new Map();
  const today = new Date();
  
  // Fonction pour déterminer la clé de regroupement temporelle (unique par jour/mois/année)
  const getGroupKey = (dateStr, tf) => {
    const d = new Date(dateStr);
    switch (tf) {
      case 'weekly': // Regrouper par jour
      case 'monthly':
        return d.toISOString().substring(0, 10); // Année-Mois-Jour
      case 'yearly': // Regrouper par mois
        return d.toISOString().substring(0, 7); // Année-Mois
      default:
        return d.toISOString().substring(0, 10);
    }
  };

  // 1. Traitement des Transactions (Revenue & Depense)
  transactions.forEach(t => {
    const montant = parseFloat(t.montant);
    const key = getGroupKey(t.date, timeframe);
    const displayDate = getDateFormat(t.date, timeframe);

    if (!groupedData.has(key)) {
      groupedData.set(key, { 
        dateKey: key, 
        displayKey: displayDate,
        Revenue: 0, 
        Depense: 0, 
        ActivitiesCount: 0 
      });
    }

    const dataPoint = groupedData.get(key);

    if (t.categorie.toLowerCase() === 'revenu') {
      dataPoint.Revenue += montant;
    } else if (t.categorie.toLowerCase() === 'depense') {
      dataPoint.Depense += montant;
    }
  });

  // 2. Traitement des Activités (Compte)
  // NOTE: On suppose que 'debut' dans la table activite est une date valide
  activities.forEach(a => {
    const key = getGroupKey(a.debut, timeframe);
    const displayDate = getDateFormat(a.debut, timeframe);

    if (!groupedData.has(key)) {
      groupedData.set(key, { 
        dateKey: key, 
        displayKey: displayDate,
        Revenue: 0, 
        Depense: 0, 
        ActivitiesCount: 0 
      });
    }
    groupedData.get(key).ActivitiesCount += 1;
  });

  // 3. Conversion en tableau et tri
  let finalData = Array.from(groupedData.values())
    .map(item => ({
        [timeframe === 'yearly' ? 'Month' : 'Day']: item.displayKey, // Utiliser la clé d'affichage
        Revenue: Math.round(item.Revenue), // Arrondir pour l'affichage
        Depense: Math.round(item.Depense),
        ActivitiesCount: item.ActivitiesCount
    }))
    .sort((a, b) => {
        // Tenter de trier par la clé numérique si possible (par jour/mois)
        // Pour des raisons de simplicité, on se base sur l'ordre de la dateKey générée (Year-Month-Day)
        return new Date(Object.keys(groupedData.keys().next().value)[0]) - new Date(Object.keys(groupedData.keys().next().value)[0]);
    });
  
  // Limiter les données en fonction du timeframe (ex: 7 jours, 30 jours, 12 mois)
  const limit = timeframe === 'weekly' ? 7 : (timeframe === 'monthly' ? 30 : 12);
  
  // Retourner seulement les données les plus récentes
  return finalData.slice(-limit);
};


const TimeframeButton = ({ timeframe, current, onClick }) => (
  <button
    onClick={() => onClick(timeframe)}
    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
      current === timeframe
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
        : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
    }`}
  >
    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, valueColor = 'text-gray-900' }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);


const App = () => {
  const [timeframe, setTimeframe] = useState('weekly');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction mémoïsée pour calculer les métriques financières
  const calculateMetrics = useCallback((data) => {
    // Si pas de données, retourner zéro
    if (data.length === 0) {
      return { totalRevenue: '$0.00', totalDepense: '$0.00', netBalance: '$0.00', netBalanceColor: 'text-gray-900', totalActivities: '0' };
    }
    
    const totalRevenue = data.reduce((sum, item) => sum + item.Revenue, 0);
    const totalDepense = data.reduce((sum, item) => sum + item.Depense, 0);
    const totalActivities = data.reduce((sum, item) => sum + item.ActivitiesCount, 0);
    const netBalance = totalRevenue - totalDepense;

    // Fonction pour formater en $K ou $M
    const formatCurrency = (amount) => {
      const sign = amount < 0 ? '-' : '';
      const absAmount = Math.abs(amount);
      if (absAmount >= 1000000) return `${sign}${(absAmount / 1000000).toFixed(1)}M`;
      if (absAmount >= 1000) return `${sign}${(absAmount / 1000).toFixed(1)}k`;
      return `${sign}$${absAmount.toFixed(2)}`;
    };
    
    // Déterminer la couleur du solde net
    const netBalanceColor = netBalance >= 0 ? 'text-green-600' : 'text-red-600';

    return {
      totalRevenue: formatCurrency(totalRevenue),
      totalDepense: formatCurrency(totalDepense),
      netBalance: formatCurrency(netBalance),
      netBalanceColor,
      totalActivities: totalActivities.toLocaleString(),
    };
  }, []);

  // Fonction pour charger les données de l'API
  const fetchDataFromAPI = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch des transactions
      const transactionsResponse = await fetch(`${API_BASE_URL}/transactions`);
      if (!transactionsResponse.ok) throw new Error('Erreur de chargement des transactions');
      const transactions = await transactionsResponse.json();

      // Fetch des activités
      const activitiesResponse = await fetch(`${API_BASE_URL}/activites`);
      if (!activitiesResponse.ok) throw new Error('Erreur de chargement des activités');
      const activities = await activitiesResponse.json();

      // Agrégation des données
      const aggregatedData = groupDataByTimeframe(transactions, activities, timeframe);
      
      // Mise à jour de l'état
      setChartData(aggregatedData);

    } catch (error) {
      console.error("Erreur lors de la récupération des données de l'API:", error);
      // En cas d'échec, vider les données pour afficher un message d'erreur
      setChartData([]); 
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);


  // Effet pour charger les données à chaque changement de 'timeframe'
  useEffect(() => {
    fetchDataFromAPI();
  }, [timeframe, fetchDataFromAPI]);

  const metrics = calculateMetrics(chartData);
  const dataKeyName = timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
  const dataKeyForXAxis = chartData.length > 0 ? Object.keys(chartData[0])[0] : 'Day';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-inter">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Financial Overview Dashboard
        </h1>
        <p className="text-gray-500">Visualisation des revenus, dépenses et solde net (Source: API Backend).</p>
      </header>

      {/* --- Timeframe Selector --- */}
      <div className="mb-8 flex space-x-3">
        <TimeframeButton timeframe="weekly" current={timeframe} onClick={setTimeframe} />
        <TimeframeButton timeframe="monthly" current={timeframe} onClick={setTimeframe} />
        <TimeframeButton timeframe="yearly" current={timeframe} onClick={setTimeframe} />
      </div>

      {/* --- Key Metrics Grid (Revenu, Dépense, Solde Net, Total Activités) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title={`Solde Net (${dataKeyName})`}
          value={metrics.netBalance}
          icon={TrendingUp}
          color={metrics.netBalanceColor.includes('green') ? "bg-green-500" : "bg-red-500"}
          valueColor={metrics.netBalanceColor}
        />
        <StatCard
          title={`Total Revenue (${dataKeyName})`}
          value={metrics.totalRevenue}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <StatCard
          title={`Total Dépense (${dataKeyName})`}
          value={metrics.totalDepense}
          icon={MinusCircle}
          color="bg-orange-500"
        />
        <StatCard
          title={`Total Activités (${dataKeyName})`}
          value={metrics.totalActivities}
          icon={BarChart3}
          color="bg-purple-500"
        />
      </div>

      {/* --- Chart Panel --- */}
      <div className="bg-white p-6 rounded-xl shadow-2xl h-96 w-full overflow-hidden">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Revenue vs. Dépense</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-blue-500">
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement des données...
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Dégradé pour le Revenu (Bleu) */}
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                {/* Dégradé pour la Dépense (Orange) */}
                <linearGradient id="colorDepense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey={dataKeyForXAxis} tickLine={false} axisLine={false} />
              
              {/* Axe Y pour le Revenu/Dépense (Gauche) */}
              <YAxis yAxisId="left" stroke="#3b82f6" orientation="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold' }}
                formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {/* Courbe du Revenu */}
              <Area
                type="monotone"
                dataKey="Revenue"
                name="Revenu"
                yAxisId="left"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6 }}
              />
              
              {/* Courbe de la Dépense */}
              <Area
                type="monotone"
                dataKey="Depense"
                name="Dépense"
                yAxisId="left"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorDepense)"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <p className="font-bold text-lg mb-2">Aucune donnée disponible.</p>
            <p className="text-sm">Vérifiez que votre API backend est démarrée et accessible à l'adresse: {API_BASE_URL}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;