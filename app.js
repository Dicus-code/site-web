// app.js
const API_URL = '';

let selectedCandidateId = null;
let selectedCandidateName = null;

// ===== ÉLÉMENTS DOM =====
const btnCandidats   = document.getElementById('btnCandidats');
const btnResultats   = document.getElementById('btnResultats');
const candidatsSec   = document.getElementById('candidatsSection');
const resultatsSec   = document.getElementById('resultatsSection');
const candidatesBox  = document.getElementById('candidatesContainer');
const resultsBox     = document.getElementById('resultsContainer');
const messageBox     = document.getElementById('message');
const voteModal      = document.getElementById('voteModal');
const candidateName          = document.getElementById('candidateName');
const candidateMatriculeInput = document.getElementById('candidateMatricule');
const studentIdInput         = document.getElementById('studentId');
const confirmBtn             = document.getElementById('confirmVote');
const cancelBtn              = document.getElementById('cancelVote');
const refreshBtn             = document.getElementById('refreshResults');

let selectedCandidateMatricule = null;

// Delegate clicks for static .btn-vote buttons (fallback when fetch fails)
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.btn-vote');
  if (btn) openVoteModal(btn.dataset.id, btn.dataset.name, btn.dataset.matricule);
});

// ===== NAVIGATION =====
btnCandidats.addEventListener('click', () => switchSection('candidats'));
btnResultats.addEventListener('click', () => switchSection('resultats'));

function switchSection(section) {
  if (section === 'candidats') {
    candidatsSec.classList.remove('hidden');
    resultatsSec.classList.add('hidden');
    btnCandidats.classList.add('active');
    btnResultats.classList.remove('active');
    loadCandidates();
  } else {
    candidatsSec.classList.add('hidden');
    resultatsSec.classList.remove('hidden');
    btnCandidats.classList.remove('active');
    btnResultats.classList.add('active');
    loadResults();
  }
}

// ===== AFFICHAGE DES CANDIDATS =====
async function loadCandidates() {
  try {
    const res = await fetch(`${API_URL}/candidates`);
    const candidats = await res.json();
    
    candidatesBox.innerHTML = '';
    candidats.forEach(c => {
      const card = document.createElement('div');
      card.className = 'candidate-card';
      card.innerHTML = `
        <img src="${c.photo}" alt="${c.name}">
        <h3>${c.name}</h3>
        <p class="candidate-matricule">Matricule : ${c.matricule || 'N/A'}</p>
        <p>${c.program}</p>
        <button class="btn-vote" data-id="${c.id}" data-name="${c.name}" data-matricule="${c.matricule || ''}">
          Voter pour ce candidat
        </button>
      `;
      candidatesBox.appendChild(card);
    });

    // Ajouter les écouteurs de vote
    document.querySelectorAll('.btn-vote').forEach(btn => {
      btn.addEventListener('click', () => openVoteModal(btn.dataset.id, btn.dataset.name, btn.dataset.matricule));
    });
  } catch (err) {
    showMessage('Erreur de chargement des candidats', 'error');
  }
}

// ===== MODAL DE VOTE =====
function openVoteModal(id, name, matricule = '') {
  selectedCandidateId = id;
  selectedCandidateName = name;
  selectedCandidateMatricule = matricule;
  candidateName.textContent = name;
  candidateMatriculeInput.value = matricule;
  studentIdInput.value = '';
  voteModal.classList.remove('hidden');
}

cancelBtn.addEventListener('click', () => voteModal.classList.add('hidden'));

confirmBtn.addEventListener('click', async () => {
  const studentId = studentIdInput.value.trim();
  const candidateMatricule = candidateMatriculeInput.value.trim();

  if (!studentId || !candidateMatricule) {
    alert('Veuillez saisir votre identifiant et le matricule du candidat.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, candidateId: selectedCandidateId, candidateMatricule })
    });
    const data = await res.json();

    if (res.ok) {
      showMessage(data.message, 'success');
    } else {
      showMessage(data.error, 'error');
    }
    voteModal.classList.add('hidden');
  } catch (err) {
    showMessage('Erreur de connexion au serveur', 'error');
  }
});

// ===== AFFICHAGE DES RÉSULTATS =====
async function loadResults() {
  resultsBox.innerHTML = '<p>Chargement des résultats...</p>';

  try {
    const res = await fetch(`${API_URL}/results`);
    if (!res.ok) {
      throw new Error(`Erreur HTTP ${res.status}`);
    }
    const data = await res.json();

    // Supporter deux formats de réponse et normaliser les données
    let results = [];
    let totalVotes = 0;

    if (Array.isArray(data)) {
      // Le serveur renvoie un tableau simple
      results = data.map((r) => ({
        id: r.id,
        name: r.name,
        photo: r.photo,
        matricule: r.matricule || r.MATRICULE || '',
        voteCount: Number(r.voteCount) || 0
      }));
    } else if (data.results) {
      // Le serveur renvoie { results: [...], totalVotes, totalCandidates }
      results = data.results.map((r) => ({
        id: r.id,
        name: r.name,
        photo: r.photo,
        matricule: r.matricule || '',
        voteCount: Number(r.voteCount) || 0
      }));
      totalVotes = Number(data.totalVotes) || 0;
    } else {
      throw new Error('Format de réponse invalide');
    }

    if (!results || results.length === 0) {
      resultsBox.innerHTML = '<p>Aucun résultat disponible.</p>';
      return;
    }

    // Recalculer les statistiques pour assurer la cohérence
    totalVotes = results.reduce((sum, r) => sum + (Number(r.voteCount) || 0), 0);
    
    // Trier par nombre de votes décroissant
    results.sort((a, b) => b.voteCount - a.voteCount);
    
    // Ajouter les pourcentages et rangs
    results = results.map((r, index) => ({
      ...r,
      percentage: totalVotes > 0 ? ((r.voteCount / totalVotes) * 100).toFixed(1) : '0.0',
      rank: index + 1
    }));

    resultsBox.innerHTML = '';

    // Afficher le résumé général
    const summary = document.createElement('div');
    summary.className = 'results-summary';
    summary.innerHTML = `
      <div class="summary-stats">
        <div class="stat-box">
          <span class="stat-label">Total des votes</span>
          <span class="stat-value">${totalVotes}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Candidats</span>
          <span class="stat-value">${results.length}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Vote gagné par</span>
          <span class="stat-value">${results.length > 0 ? results[0].name : 'N/A'}</span>
        </div>
      </div>
    `;
    resultsBox.appendChild(summary);

    // Afficher les résultats détaillés
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-detailed';
    
    results.forEach((r, index) => {
      const pct = parseFloat(r.percentage) || 0;
      const isLeading = index === 0 ? 'leading' : '';
      
      const item = document.createElement('div');
      item.className = `result-item ${isLeading}`;
      item.innerHTML = `
        <div class="result-rank">#${r.rank}</div>
        <img src="${r.photo}" alt="${r.name}" class="result-photo" onerror="this.style.display='none'">
        <div class="result-details">
          <strong class="result-name">${r.name}</strong>
          <span class="result-matricule">${r.matricule || 'N/A'}</span>
        </div>
        <div class="result-bar-container">
          <div class="result-bar">
            <div class="result-fill" style="width:${Math.min(pct, 100)}%"></div>
          </div>
        </div>
        <div class="result-stats">
          <span class="result-count">${r.voteCount} vote${r.voteCount > 1 ? 's' : ''}</span>
          <span class="result-percent">${pct}%</span>
        </div>
      `;
      resultsDiv.appendChild(item);
    });
    
    resultsBox.appendChild(resultsDiv);
  } catch (err) {
    console.error('Erreur lors du chargement des résultats:', err);
    resultsBox.innerHTML = '<p>Impossible d\'afficher les résultats.</p>';
    showMessage('Erreur de chargement des résultats : ' + err.message, 'error');
  }
}

refreshBtn.addEventListener('click', loadResults);

// ===== MESSAGES =====
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  setTimeout(() => messageBox.classList.add('hidden'), 4000);
}

// ===== CHARGEMENT INITIAL =====
loadCandidates();