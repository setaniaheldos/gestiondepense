import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserMd, FaCalendarAlt, FaFileMedical, FaHeartbeat, FaUsers, FaUserShield, FaNotesMedical, FaUserInjured, FaEnvelope, FaPaperPlane } from 'react-icons/fa'; // Ajout d'icônes
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Composant Formulaire de Contact
const ContactForm = ({ recipientEmail }) => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(''); // 'success', 'error', 'submitting'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    // NOTE IMPORTANTE:
    // Pour un vrai envoi d'email, vous auriez besoin d'un service back-end (ex: Node.js avec Nodemailer, SendGrid, etc.).
    // Ici, nous simulons l'envoi.
    
    try {
      // Simulation d'une requête API (remplacez ceci par votre vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      console.log('Message envoyé (simulé) à:', recipientEmail, 'Données:', formData);

      // Si vous utilisiez un service comme Formspree, l'URL serait différente:
      // const response = await axios.post('https://formspree.io/f/votre_code_formspree', formData);
      
      // Ici, nous vérifions si tous les champs sont remplis pour simuler le succès
      if (formData.name && formData.email && formData.subject && formData.message) {
          setStatus('success');
          setFormData({ name: '', email: '', subject: '', message: '' }); // Réinitialiser
      } else {
           throw new Error("Veuillez remplir tous les champs.");
      }
      
    } catch (error) {
      console.error("Erreur lors de l'envoi simulé:", error);
      setStatus('error');
    }
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700 transition duration-500 hover:shadow-2xl">
      <h3 className="text-2xl font-extrabold mb-6 flex items-center text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-700 pb-3">
        <FaEnvelope className="mr-3 text-3xl" /> Contacter l'Administrateur
      </h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* LIGNE 1 : Nom et Email (2 colonnes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Champ Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nom</label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="mt-1 block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 dark:bg-gray-700 dark:text-white transition duration-300 placeholder-gray-400"
                placeholder="Votre nom complet"
              />
            </div>
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                className="mt-1 block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 dark:bg-gray-700 dark:text-white transition duration-300 placeholder-gray-400"
                placeholder="votre.email@example.com"
              />
            </div>
        </div>
         
        {/* LIGNE 2 : Sujet (1 colonne) */}
        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sujet</label>
          <input 
            type="text" 
            name="subject" 
            id="subject" 
            value={formData.subject} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 dark:bg-gray-700 dark:text-white transition duration-300 placeholder-gray-400"
            placeholder="Objet de votre message"
          />
        </div>
        
        {/* LIGNE 3 : Message (1 colonne) */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea 
            name="message" 
            id="message" 
            rows="5"
            value={formData.message} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 dark:bg-gray-700 dark:text-white transition duration-300 placeholder-gray-400"
            placeholder="Écrivez votre message ici..."
          ></textarea>
        </div>
        
        {/* Bouton de Soumission (Hors des 3 lignes de champs) */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white transition duration-300 transform ${
            status === 'submitting' 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01]'
          } focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50`}
        >
          <FaPaperPlane className={`mr-2 ${status === 'submitting' ? 'animate-pulse' : ''}`} /> 
          {status === 'submitting' ? 'Envoi en cours...' : 'Envoyer le Message'}
        </button>
      </form>
      
      {/* Messages de Statut */}
      {status === 'success' && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-3 text-center text-base font-semibold bg-green-50 dark:bg-gray-600 border border-green-300 rounded-lg text-green-700 dark:text-green-400"
        >
          Message envoyé avec succès ! Merci.
        </motion.p>
      )}
      {status === 'error' && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-3 text-center text-base font-semibold bg-red-50 dark:bg-gray-600 border border-red-300 rounded-lg text-red-700 dark:text-red-400"
        >
          Échec de l'envoi. Veuillez vérifier les champs et réessayer.
        </motion.p>
      )}
    </div>
  );
};

// Composant Pied de Page (Footer)
const Footer = ({ recipientEmail }) => {
    return (
        <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-12">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Section Information */}
                    <div className="space-y-4">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-500 pb-2">MedCare Platform</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Votre solution intégrée pour la gestion des dossiers médicaux, des rendez-vous, et des consultations.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <strong className="text-gray-800 dark:text-gray-200">Contact Admin:</strong> <a href={`mailto:${recipientEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">{recipientEmail}</a>
                        </p>
                    </div>

                    {/* Section Liens Rapides */}
                    <div className="space-y-4">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-green-500 pb-2">Liens Rapides</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/patients" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Patients</Link></li>
                            <li><Link to="/praticiens" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Praticiens</Link></li>
                            <li><Link to="/rendezvous" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Rendez-vous</Link></li>
                            <li><Link to="/utilisateurs" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Gestion Utilisateurs</Link></li>
                        </ul>
                    </div>

                    {/* Section Formulaire de Contact */}
                    <ContactForm recipientEmail={recipientEmail} />
                </div>

                <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} MedCare. Tous droits réservés. Développé par Sethaniel Dasseva.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Composant Principal Home
export default function Home() {
  // ... (votre état existant)
  const [counts, setCounts] = useState({
    praticiens: 0,
    rendezvous: 0,
    consultations: 0,
    prescriptions: 0,
    patients: 0,
    utilisateurs: 0,
  });
  const [adminName, setAdminName] = useState('');
  const [userName, setUserName] = useState('');
  const [monthlyPatients, setMonthlyPatients] = useState([]); // Data for monthly chart
  const [weeklyPatients, setWeeklyPatients] = useState([]);   // Data for weekly chart
  
  // Email du destinataire pour le formulaire de contact
  const RECIPIENT_EMAIL = 'setaniaheldasseva@gmail.com'; 

  // ... (votre useEffect existant)
  useEffect(() => {
    // --- Existing API Calls for Counts ---
    axios.get('https://mon-api-rmv3.onrender.com/praticiens').then(res => {
      setCounts(c => ({ ...c, praticiens: res.data.length }));
    });
    axios.get('https://mon-api-rmv3.onrender.com/rendezvous').then(res => {
      setCounts(c => ({ ...c, rendezvous: res.data.length }));
    });
    axios.get('https://mon-api-rmv3.onrender.com/consultations').then(res => {
      setCounts(c => ({ ...c, consultations: res.data.length }));
    });
    axios.get('https://mon-api-rmv3.onrender.com/prescriptions').then(res => {
      setCounts(c => ({ ...c, prescriptions: res.data.length }));
    });
    axios.get('https://mon-api-rmv3.onrender.com/patients').then(res => {
      setCounts(c => ({ ...c, patients: res.data.length }));
    });
    // NOTE: La route /utilisateurs n'existe peut-être pas. Assurez-vous d'utiliser la bonne route (/users ou /admins)
    axios.get('https://mon-api-rmv3.onrender.com/utilisateurs').then(res => {
      setCounts(c => ({ ...c, utilisateurs: res.data.length }));
    }).catch(() => {
      // Fallback si la route /utilisateurs échoue
      axios.get('https://mon-api-rmv3.onrender.com/users').then(res => {
        setCounts(c => ({ ...c, utilisateurs: res.data.length }));
      });
    });

    axios.get('https://mon-api-rmv3.onrender.com/admins')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setAdminName(res.data[0].nom || res.data[0].email || 'Administrateur');
        } else {
          setAdminName('Administrateur');
        }
      })
      .catch(() => setAdminName('Administrateur'));

    const userId = localStorage.getItem('userId');
    if (userId) {
      // NOTE: Ajustez la route si /utilisateurs/:id n'est pas la bonne
      axios.get(`https://mon-api-rmv3.onrender.com/utilisateurs/${userId}`)
        .then(res => {
          if (res.data && (res.data.nom || res.data.email)) {
            setUserName(res.data.nom || res.data.email);
          } else {
            setUserName('Utilisateur');
          }
        })
        .catch(() => setUserName('Utilisateur'));
    } else {
      setUserName('Utilisateur');
    }

    // --- New API Calls for Chart Data (Mock Data for demonstration) ---
    const fetchChartData = async () => {
      // Mock Monthly Data for the last 6 months
      const currentMonth = new Date().getMonth();
      const months = Array.from({ length: 6 }).map((_, i) => {
        const date = new Date();
        date.setMonth(currentMonth - (5 - i));
        return date.toLocaleString('fr-FR', { month: 'short' });
      });
      const monthlyData = Array.from({ length: 6 }).map(() => Math.floor(Math.random() * 50) + 20); // Random numbers

      setMonthlyPatients({
        labels: months,
        datasets: [{
          label: 'Nouveaux Patients',
          data: monthlyData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }],
      });

      // Helper pour obtenir le numéro de semaine
      Date.prototype.getWeek = function() {
          var date = new Date(this.getTime());
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
          var week1 = new Date(date.getFullYear(), 0, 4);
          return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      };
      
      // Mock Weekly Data for the last 4 weeks
      const currentWeek = new Date().getWeek();
      const weeks = Array.from({ length: 4 }).map((_, i) => {
          const weekNum = currentWeek - (3 - i);
          return `Semaine ${weekNum > 0 ? weekNum : 52 + weekNum}`; // Gère le passage à l'année précédente
      });
      const weeklyData = Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 30) + 10); // Random numbers

      setWeeklyPatients({
        labels: weeks,
        datasets: [{
          label: 'Nouveaux Patients',
          data: weeklyData,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          tension: 0.3, // Makes the line curved
          pointBackgroundColor: 'rgba(153, 102, 255, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(153, 102, 255, 1)',
        }],
      });
    };

    fetchChartData();
  }, []);

  // Helper to get week number (Approximation, déplacé dans useEffect mais gardé pour complétude)
  Date.prototype.getWeek = function() {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    var week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  
  // ... (votre AnimatedNumber et chartOptions existants)
  const AnimatedNumber = ({ value }) => (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 block" // Smaller text
    >
      {value}
    </motion.span>
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(107, 114, 128)' // Tailwind gray-500
        }
      },
      title: {
        display: true,
        text: '',
        color: 'rgb(107, 114, 128)' // Tailwind gray-500
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' patients';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(107, 114, 128)' // Tailwind gray-500
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.2)' // Light grid lines
        }
      },
      y: {
        ticks: {
          color: 'rgb(107, 114, 128)' // Tailwind gray-500
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.2)' // Light grid lines
        }
      }
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-teal-900 text-gray-800 dark:text-white font-sans"
    >
      {/* Reste du Dashboard (Admin Bar, Header, Cards, Charts) */}
      {/* ... (votre code existant pour Admin/User Bar, Header, Cards, Charts) ... */}
      
      {/* Admin and User Info Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-100 to-white dark:from-gray-800 dark:to-gray-900 px-6 py-4 shadow-sm mb-6 rounded-b-xl border-b border-blue-200 dark:border-gray-700">
        <div className="flex items-center gap-6 mb-3 md:mb-0">
          <div className="flex items-center gap-3">
            <FaUserShield className="text-blue-700 dark:text-blue-300 text-2xl" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">Admin :</span>
            <span className="text-blue-800 dark:text-blue-200 font-medium">{adminName}</span>
          </div>
          <div className="flex items-center gap-3">
            <FaUsers className="text-green-600 dark:text-green-300 text-xl" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">Utilisateur connecté :</span>
            <span className="text-green-700 dark:text-green-200 font-medium">{userName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FaUsers className="text-green-600 dark:text-green-300 text-xl" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">Total utilisateurs :</span>
          <span className="text-green-700 dark:text-green-200 font-medium">{counts.utilisateurs}</span>
        </div>
      </div>

      <header className="p-6 shadow-md bg-white/80 dark:bg-gray-900/80 flex justify-between items-center backdrop-blur-md rounded-lg mx-6">
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
          <FaNotesMedical className="inline-block mr-3 text-blue-600 dark:text-blue-300" />
          MedCare Dashboard
        </h1>
        <Link to="/patients">
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Gérer les patients
          </button>
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mt-12 px-4"
      >
        <h2 className="text-3xl font-extrabold mb-3 text-gray-800 dark:text-white">Bienvenue, {userName}!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Votre plateforme centrale pour la gestion optimisée des soins médicaux.
        </p>
      </motion.div>

      {/* Animated and Responsive Summary Cards (Smaller Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-6 mt-10">
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 6px 24px 0 rgba(0,128,128,0.1)" }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center border border-teal-100 dark:border-gray-700"
        >
          <FaUserMd className="text-4xl text-teal-600 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Praticiens</h3>
          <AnimatedNumber value={counts.praticiens} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Médecins enregistrés</p>
          <Link to="/praticiens" className="mt-3 text-teal-600 hover:underline font-medium text-xs transition">Voir la liste</Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 6px 24px 0 rgba(76,175,80,0.1)" }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center border border-green-100 dark:border-gray-700"
        >
          <FaUserInjured className="text-4xl text-green-600 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Patients</h3>
          <AnimatedNumber value={counts.patients} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Patients enregistrés</p>
          <Link to="/patients" className="mt-3 text-green-600 hover:underline font-medium text-xs transition">Voir la liste</Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 6px 24px 0 rgba(0,150,136,0.1)" }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center border border-emerald-100 dark:border-gray-700"
        >
          <FaCalendarAlt className="text-4xl text-emerald-600 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Rendez-vous</h3>
          <AnimatedNumber value={counts.rendezvous} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total planifiés</p>
          <Link to="/rendezvous" className="mt-3 text-emerald-600 hover:underline font-medium text-xs transition">Voir la liste</Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 6px 24px 0 rgba(100,0,150,0.1)" }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center border border-purple-100 dark:border-gray-700"
        >
          <FaFileMedical className="text-4xl text-purple-600 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Consultations</h3>
          <AnimatedNumber value={counts.consultations} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Consultations réalisées</p>
          <Link to="/consultations" className="mt-3 text-purple-600 hover:underline font-medium text-xs transition">Voir la liste</Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 6px 24px 0 rgba(220,53,69,0.1)" }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center border border-red-100 dark:border-gray-700"
        >
          <FaHeartbeat className="text-4xl text-red-600 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Prescriptions</h3>
          <AnimatedNumber value={counts.prescriptions} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ordonnances générées</p>
          <Link to="/prescriptions" className="mt-3 text-red-600 hover:underline font-medium text-xs transition">Voir la liste</Link>
        </motion.div>
         
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 6px 24px 0 rgba(230,126,34,0.1)" }}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center border border-yellow-100 dark:border-gray-700"
        >
          <FaUsers className="text-4xl text-yellow-600 mb-2 animate-bounce" />
          <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Utilisateurs</h3>
          <AnimatedNumber value={counts.utilisateurs} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Accès système</p>
          <Link to="/utilisateurs" className="mt-3 text-yellow-600 hover:underline font-medium text-xs transition">Gérer les accès</Link>
        </motion.div>
      </div>

      {/* Chart.js Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Monthly Patients Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-gray-700"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Nouveaux Patients par Mois</h3>
          {monthlyPatients.labels && <Bar data={monthlyPatients} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Nouveaux Patients par Mois' } } }} />}
        </motion.div>

        {/* Weekly Patients Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-green-100 dark:border-gray-700"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Nouveaux Patients par Semaine</h3>
          {weeklyPatients.labels && <Line data={weeklyPatients} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Nouveaux Patients par Semaine' } } }} />}
        </motion.div>
      </div>
      
      {/* NOUVEAU FOOTER AVEC FORMULAIRE DE CONTACT */}
      <Footer recipientEmail={RECIPIENT_EMAIL} />

      <style>{`
        .animate-bounce {
          animation: bounce 1.5s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-8px);}
        }
      `}</style>
    </div>
  );
}