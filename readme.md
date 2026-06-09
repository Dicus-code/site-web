# Application Backend Node.js + Express + MySQL — Architecture MVC

> Guide complet — **APP Task Manager**

---

## 1. Créer le projet

### Les fichiers à créer

```bash
# 1. Créer le dossier du projet
mkdir task-manager
cd task-manager

# 2. Commandes pour créer tous les dossiers
mkdir -p config controllers models routes middlewares seeders

# 3. Créer tous les fichiers vides
touch config/db.js
touch controllers/userController.js controllers/taskController.js controllers/authController.js
touch models/userModel.js models/taskModel.js
touch routes/userRoutes.js routes/taskRoutes.js routes/authRoutes.js
touch middlewares/validate.js middlewares/authMiddleware.js
touch seeders/seed.js
touch server.js .env .env.example .gitignore
```

> Ordre de développement recommandé :

1. `.env`                    → variables d'environnement
2. `config/db.js`            → connexion DB
3. `models/`                 → requêtes SQL
4. `controllers/`            → logique métier
5. `middlewares/validate.js` → validation
6. `routes/`                 → définition des URL
7. `server.js`               → assemblage final

---

## 2. Initialisation du projet et installation des packages/librairies

```bash
# 1. Initialiser Node.js (crée package.json)
npm init -y

# 2. Installer les dépendances
npm install express mysql2 dotenv bcrypt jsonwebtoken validator

# 3. Installer nodemon en développement (redémarre auto le serveur)
npm install --save-dev nodemon

# 4. Génération de clés
# 4.1. Avec OpenSSL (recommandé) - Sous Linux / macOS :
openssl rand -hex 64

# 4.2. Avec Node.js :
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4.3. Avec PHP :
echo bin2hex(random_bytes(64));

# 4.4. Avec Python
import secrets
print(secrets.token_hex(64))
```

---

## 3. Configuration de l'environnement

### `.env`

```env
# Serveur
PORT=3000

# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=task_manager_db

# JWT
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire_ici
JWT_EXPIRES_IN=24h
```

### `.env.example` (à commiter sur Git)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=task_manager_db
JWT_SECRET=
JWT_EXPIRES_IN=24h
```

### `.gitignore`

```.gitignore
node_modules/
.env
```

---

## 4. Base de données

### Créer la base de données et les tables

```sql
-- Créer la base de données : utf8mb4_unicode_ci / utf8mb4_general_ci
CREATE DATABASE IF NOT EXISTS task_manager_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Sélectionner la base de données
USE task_manager_db;

-- ================================================
-- TABLE : users
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Contrainte d'unicité sur email
  CONSTRAINT email_unique UNIQUE (email)
);

-- ================================================
-- TABLE : tasks
-- ================================================
CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  -- status ENUM('suspendue', 'en cours', 'terminée') DEFAULT 'suspendue',
  status ENUM('pending', 'in_progress', 'done') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- INDEX idx_user_id_status (user_id, status),
  -- Clé étrangère : une tâche appartient à un seul utilisateur
  CONSTRAINT fk_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

## 5. Tests avec Postman

### Démarrer le serveur

```bash
# Faire ceci avant si le projet a été télécharger avec le fichier package.js inclus.
npm install

# Premier lancement : exécuter le script seeders/seed.js pour insérer les données de test
npm run seed

# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```
