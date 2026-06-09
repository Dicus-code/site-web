// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./vote.db', (err) => {
  if (err) {
    console.error("Erreur d'ouverture de la base:", err.message);
  } else {
    console.log('Base de données connectée.');
  }
});

function initDatabase(callback) {
  const candidatsInit = [
    ["Arnaud", "photos/photos/arnaud.jpg", "MIAGE-001", "Amélioration de la cantine et des activités parascolaires"],
    ["Fatima", "photos/photos/fatima.jpg", "MIAGE-002", "Modernisation de la bibliothèque et soutien scolaire"],
    ["Claude", "photos/photos/claude.jpg", "MIAGE-003", "Organisation d'événements et sorties culturelles"],
    ["Rachel", "photos/photos/rachel.jpg", "MIAGE-004", "Développement du sport et bien-être étudiant"]
  ];

  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS candidates (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      name TEXT NOT NULL,\n      photo TEXT,\n      matricule TEXT,\n      program TEXT NOT NULL\n    )');

    db.run('CREATE TABLE IF NOT EXISTS votes (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      student_id TEXT NOT NULL,\n      candidate_id INTEGER NOT NULL,\n      UNIQUE(student_id),\n      FOREIGN KEY(candidate_id) REFERENCES candidates(id)\n    )');

    db.all('PRAGMA table_info(candidates)', (err, columns) => {
      if (!err && columns && !columns.find(col => col.name === 'matricule')) {
        db.run('ALTER TABLE candidates ADD COLUMN matricule TEXT', (alterErr) => {
          if (alterErr) {
            console.error("Impossible d'ajouter la colonne matricule :", alterErr.message);
          }
          populateCandidates();
        });
      } else {
        populateCandidates();
      }
    });

    function populateCandidates() {
      db.get('SELECT COUNT(*) as count FROM candidates', (err, row) => {
        if (err) {
          console.error('Erreur lors du comptage des candidats :', err.message);
          return callback && callback(err);
        }

        if (row.count === 0) {
          const stmt = db.prepare('INSERT INTO candidates (name, photo, matricule, program) VALUES (?, ?, ?, ?)');
          candidatsInit.forEach(c => stmt.run(c));
          stmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              console.error("Erreur lors de l'insertion des candidats :", finalizeErr.message);
              return callback && callback(finalizeErr);
            }
            console.log('Candidats d\'exemple insérés.');
            callback && callback(null);
          });
        } else {
          candidatsInit.forEach(([name, photo, matricule]) => {
            db.run('UPDATE candidates SET matricule = ? WHERE name = ? AND (matricule IS NULL OR matricule = "")', [matricule, name]);
          });
          callback && callback(null);
        }
      });
    }
  });
}

module.exports = { db, initDatabase };
