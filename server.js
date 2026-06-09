// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du dossier courant (Frontend)
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.htm'));
});

// ======= API REST =======

// GET /candidates - Récupérer tous les candidats
app.get('/candidates', (req, res) => {
  db.all('SELECT * FROM candidates', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /vote - Enregistrer un vote
app.post('/vote', (req, res) => {
  const { studentId, candidateId } = req.body;
  
  if (!studentId || !candidateId) {
    return res.status(400).json({ error: 'Identifiant ou candidat manquant' });
  }

  db.run(
    'INSERT INTO votes (student_id, candidate_id) VALUES (?, ?)',
    [studentId, candidateId],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Cet étudiant a déjà voté !' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Vote enregistré avec succès !' });
    }
  );
});

// GET /results - Afficher les résultats
app.get('/results', (req, res) => {
  db.all(
    `SELECT 
       c.id, 
       c.name, 
       c.photo,
       c.matricule,
       c.program,
       COUNT(v.id) as voteCount 
     FROM candidates c 
     LEFT JOIN votes v ON c.id = v.candidate_id 
     GROUP BY c.id 
     ORDER BY voteCount DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalVotes = rows.reduce((sum, r) => sum + (Number(r.voteCount) || 0), 0);
      const resultsWithStats = rows.map((r, index) => ({
        id: r.id,
        name: r.name,
        photo: r.photo || 'photos/default.jpg',
        matricule: r.matricule || '',
        program: r.program || '',
        voteCount: Number(r.voteCount) || 0,
        percentage: totalVotes > 0 ? ((Number(r.voteCount) / totalVotes) * 100).toFixed(1) : '0.0',
        rank: index + 1
      }));

      res.json({
        results: resultsWithStats,
        totalVotes,
        totalCandidates: rows.length,
        success: true
      });
    }
  );
});

const PORT = 3000;
initDatabase((err) => {
  if (err) {
    console.error('Impossible d\'initialiser la base de données.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  });
});