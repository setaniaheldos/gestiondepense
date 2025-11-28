const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connexion à PostgreSQL via Render (utilisez DATABASE_URL en env var)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://test_wn7g_user:3ELJ6oKB5jOgG2BSiel0GzMR5CYQRDlU@dpg-d4kgcei4d50c73dg60vg-a.oregon-postgres.render.com/test_wn7g',
  ssl: { rejectUnauthorized: false } // Nécessaire pour Render
});

pool.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à PostgreSQL :', err.message);
  } else {
    console.log('✅ Connecté à la base de données PostgreSQL sur Render');
  }
});

// 🔧 Création des tables (exécutée au démarrage)
async function createTables() {
  try {
    // ⚠️ Suppression temporaire pour la phase de développement
   
    // Création du type ENUM pour la catégorie de transaction (si inexistant)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_categorie') THEN
          CREATE TYPE transaction_categorie AS ENUM ('depense', 'revenu');
        END IF;
      END $$;
    `);

    // Table transactions (avec ENUM pour categorie ET AJOUT DE DESCRIPTION)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction (
        id SERIAL PRIMARY KEY,
        categorie transaction_categorie NOT NULL,
        montant NUMERIC NOT NULL,
        description TEXT, -- Nouvelle colonne ajoutée
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

   

    // Table activites
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activite (
        id SERIAL PRIMARY KEY,
        titre TEXT NOT NULL,
        debut TEXT NOT NULL,
        fin TEXT NOT NULL,
        description TEXT
      );
    `);

    // Table des admins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    // Table des utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isApproved INTEGER DEFAULT 0 -- 0 = non validé, 1 = validé par l'admin
      );
    `);

    console.log('✅ Toutes les tables ont été créées (si elles n’existaient pas) et la colonne description est présente.');
  } catch (err) {
    console.error('Erreur lors de la création des tables :', err.message);
  }
}

createTables();

// Helper pour les queries async
async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

// Fonction helper pour valider la catégorie
function validateCategorie(categorie) {
  return ['depense', 'revenu'].includes(categorie.toLowerCase());
}

// ===== CRUD pour les Transactions =====

// GET : Lister toutes les transactions
app.get('/transactions', async (req, res) => {
  try {
    // Sélectionner la nouvelle colonne description
    const result = await query('SELECT id, categorie, montant, description, date FROM transaction ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET : Récupérer une transaction par ID
app.get('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT id, categorie, montant, description, date FROM transaction WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST : Créer une nouvelle transaction
app.post('/transactions', async (req, res) => {
  try {
    // Récupérer la description
    const { categorie, montant, description } = req.body; 
    
    if (!categorie || montant === undefined) return res.status(400).json({ error: 'Type de catégorie et montant requis' });
    
    // Validation stricte de la catégorie
    if (!validateCategorie(categorie)) {
      return res.status(400).json({ error: 'Catégorie doit être "depense" ou "revenu"' });
    }

    // Inclure la description dans la requête
    const result = await query(
      'INSERT INTO transaction (categorie, montant, description) VALUES ($1, $2, $3) RETURNING *',
      [categorie.toLowerCase(), montant, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Gérer l'erreur ENUM si violation
    if (err.code === '42804') { // Invalid input syntax for type
      return res.status(400).json({ error: 'Catégorie invalide. Doit être "depense" ou "revenu"' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT : Mettre à jour une transaction
app.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Récupérer la description
    const { categorie, montant, description } = req.body; 
    
    if (!categorie || montant === undefined) return res.status(400).json({ error: 'Type de catégorie et montant requis pour la mise à jour' });
    
    // Validation stricte de la catégorie
    if (!validateCategorie(categorie)) {
      return res.status(400).json({ error: 'Catégorie doit être "depense" ou "revenu"' });
    }

    // Inclure la description dans la requête
    const result = await query(
      'UPDATE transaction SET categorie = $1, montant = $2, description = $3 WHERE id = $4 RETURNING *',
      [categorie.toLowerCase(), montant, description, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    // Gérer l'erreur ENUM si violation
    if (err.code === '42804') { // Invalid input syntax for type
      return res.status(400).json({ error: 'Catégorie invalide. Doit être "depense" ou "revenu"' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE : Supprimer une transaction
app.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM transaction WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction non trouvée' });
    res.json({ message: 'Transaction supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CRUD pour les Activités (inchangé) =====

// GET : Lister toutes les activités
app.get('/activites', async (req, res) => {
  try {
    const result = await query('SELECT * FROM activite ORDER BY debut ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET : Récupérer une activité par ID
app.get('/activites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM activite WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Activité non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST : Créer une nouvelle activité
app.post('/activites', async (req, res) => {
  try {
    const { titre, debut, fin, description } = req.body;
    if (!titre || !debut || !fin) return res.status(400).json({ error: 'Titre, début et fin requis' });

    const result = await query(
      'INSERT INTO activite (titre, debut, fin, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [titre, debut, fin, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT : Mettre à jour une activité
app.put('/activites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, debut, fin, description } = req.body;
    if (!titre || !debut || !fin) return res.status(400).json({ error: 'Titre, début et fin requis pour la mise à jour' });

    const result = await query(
      'UPDATE activite SET titre = $1, debut = $2, fin = $3, description = $4 WHERE id = $5 RETURNING *',
      [titre, debut, fin, description, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Activité non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE : Supprimer une activité
app.delete('/activites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM activite WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Activité non trouvée' });
    res.json({ message: 'Activité supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Routes Utilisateurs et Admins (inchangées) =====

// Route GET : Lister les utilisateurs en attente de validation
app.get('/users/pending', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE isApproved = 0');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Valider un utilisateur (autoriser l'accès)
app.put('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE users SET isApproved = 1 WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur validé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Refuser/supprimer un utilisateur en attente
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Connexion utilisateur (corrigé : isApproved)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    if (!user.isApproved) return res.status(403).json({ error: 'Compte en attente de validation' });

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const { password: _, ...safeUser } = user;
      res.json({ message: 'Connexion réussie', user: safeUser });
    } else {
      res.status(401).json({ error: 'Mot de passe incorrect' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Inscription utilisateur (non validé)
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const result = await query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *', [email, hashed]);
    res.json({ message: 'Compte créé. En attente de validation par un administrateur.' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Utilisateur déjà existant' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Route pour ajouter un admin
app.post('/admins', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

    // Vérifier le nombre d'admins (max 3)
    const countResult = await query('SELECT COUNT(*) as count FROM admins');
    if (countResult.rows[0].count >= 3) return res.status(400).json({ error: "Nombre maximum d'administrateurs atteint (3)" });

    // Vérifier si l'email existe déjà
    const adminResult = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (adminResult.rows.length > 0) return res.status(400).json({ error: "Cet email existe déjà." });

    // Hash du mot de passe
    const hashed = await bcrypt.hash(password, 10);
    const result = await query('INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id, email', [email, hashed]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: "Cet email existe déjà." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Route POST : Authentification admin
app.post('/admins/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: "Admin non trouvé" });

    const match = await bcrypt.compare(password, admin.password);
    if (match) {
      res.status(200).json({ message: "Connexion admin réussie", admin: { id: admin.id, email: admin.email } });
    } else {
      res.status(401).json({ error: "Mot de passe incorrect" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste de tous les admins
app.get('/admins', async (req, res) => {
  try {
    const result = await query('SELECT id, email FROM admins');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liste de tous les utilisateurs
app.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, email, isApproved FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un administrateur par son id
app.delete('/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM admins WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Admin non trouvé" });
    res.json({ message: "Admin supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un utilisateur par son id (général)
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Démarrer serveur
app.listen(PORT, () => {
  console.log(`🚀 API démarrée et prête à l'utilisation sur le port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu, fermeture de la connexion PG...');
  await pool.end();
  process.exit(0);
});