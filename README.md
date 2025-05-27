# 🚀 DDB TGI Audience Manager

**Plateforme d'analyse de données TGI avec assistants IA multi-projets**

Une application web moderne permettant de créer et gérer des assistants IA spécialisés dans l'analyse de données d'audience TGI (Target Group Index), avec support multi-projets OpenAI.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-18.0+-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.104+-red.svg)

## 📋 Table des Matières

- [🎯 Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [⚡ Installation Rapide](#-installation-rapide)
- [🔧 Configuration](#-configuration)
- [🚀 Démarrage](#-démarrage)
- [📖 Guide Utilisateur](#-guide-utilisateur)
- [🔧 API Documentation](#-api-documentation)
- [🛠️ Développement](#️-développement)
- [📁 Structure du Projet](#-structure-du-projet)
- [🤝 Contribution](#-contribution)

## 🎯 Fonctionnalités

### 🗂️ **Gestion Multi-Projets OpenAI**
- **Projet par défaut** automatiquement créé depuis les variables d'environnement
- **Ajout de projets** avec validation automatique des clés API
- **Basculement instantané** entre projets avec rechargement automatique
- **Isolation complète** des assistants et données par projet

### 🤖 **Assistants IA Spécialisés**
- **Création guidée** en 3 étapes avec interface dédiée
- **Spécialisation TGI** : analyse d'indices, pourcentages, segments
- **Support multi-formats** : JSON, JSONL, TXT
- **Vector stores** pour recherche sémantique avancée

### 💬 **Interface de Chat Avancée**
- **Conversations en temps réel** avec les assistants
- **Historique persistant** par assistant et projet
- **Markdown support** avec syntaxe highlighting
- **Gestion des erreurs** et retry automatique

### 📊 **Analytics et Monitoring**
- **Dashboard temps réel** avec métriques d'usage
- **Coûts par projet** et tracking détaillé
- **Graphiques interactifs** avec Chart.js
- **Export des données** d'analyse

### 🎨 **Interface Utilisateur Moderne**
- **Design DDB** avec identité visuelle cohérente
- **Responsive design** adaptatif
- **Animations fluides** et feedback utilisateur
- **Thème sombre/clair** (à venir)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    OpenAI       │
│   React 18      │◄──►│   FastAPI       │◄──►│   GPT-4o        │
│   Tailwind CSS  │    │   Python 3.8+   │    │   Assistants    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  LocalStorage   │    │    SQLite       │    │  Vector Stores  │
│  Projects       │    │   Chat History  │    │   File Search   │
│  Settings       │    │   Analytics     │    │   Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Stack Technique**

**Frontend**
- ⚛️ **React 18** - Interface utilisateur moderne
- 🎨 **Tailwind CSS** - Styling utilitaire
- 🚦 **React Router** - Navigation SPA
- 🔥 **React Hot Toast** - Notifications
- 📊 **Chart.js** - Graphiques interactifs
- 📅 **date-fns** - Manipulation des dates

**Backend**
- ⚡ **FastAPI** - API REST haute performance
- 🗄️ **SQLite** - Base de données légère
- 🤖 **OpenAI SDK** - Intégration assistants IA
- 🔒 **CORS** - Sécurité cross-origin
- 📝 **Pydantic** - Validation des données

## ⚡ Installation Rapide

### **Prérequis**
- Python 3.8+ installé
- Node.js 16+ installé
- Clé API OpenAI valide
- Git installé

### **1. Cloner le Projet**
```bash
git clone https://github.com/aka9871/TGIAudienceManager.git
cd TGIAudienceManager
```

### **2. Configuration Backend**
```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate
# Activer l'environnement (macOS/Linux)
source venv/bin/activate

# Installer les dépendances
pip install -r backend/requirements.txt
```

### **3. Configuration Frontend**
```bash
cd frontend
npm install
cd ..
```

### **4. Variables d'Environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
OPENAI_API_KEY=sk-votre-cle-api-openai
```

### **5. Démarrage**
```bash
# Démarrage automatique (recommandé)
chmod +x start.sh
./start.sh

# OU démarrage manuel
./start_manual.sh
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## 🔧 Configuration

### **Variables d'Environnement (.env)**
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-votre-cle-api-openai-ici

# Backend Configuration (optionnel)
BACKEND_HOST=localhost
BACKEND_PORT=8000

# Frontend Configuration (optionnel)
FRONTEND_PORT=3000

# Database Configuration (optionnel)
DATABASE_URL=sqlite:///./backend/ddb_manager.db

# CORS Configuration (optionnel)
ALLOWED_ORIGINS=http://localhost:3000
```

### **Configuration Multi-Projets**
La plateforme supporte plusieurs projets OpenAI :

1. **Projet par défaut** : Créé automatiquement depuis `OPENAI_API_KEY`
2. **Projets additionnels** : Ajoutés via l'interface Settings
3. **Basculement** : Changement instantané entre projets
4. **Isolation** : Chaque projet a ses propres assistants

## 🚀 Démarrage

### **Démarrage Automatique (Recommandé)**
```bash
./start.sh
```
Ce script :
- ✅ Vérifie les prérequis
- ✅ Active l'environnement virtuel
- ✅ Démarre le backend FastAPI
- ✅ Démarre le frontend React
- ✅ Ouvre automatiquement le navigateur

### **Démarrage Manuel**
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

### **Démarrage en Production**
```bash
# Backend avec Gunicorn
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend build
cd frontend
npm run build
npx serve -s build -l 3000
```

## 📖 Guide Utilisateur

### **1. Première Connexion**
1. **Accéder** à http://localhost:3000
2. **Se connecter** avec n'importe quel nom d'utilisateur
3. **Projet par défaut** créé automatiquement

### **2. Gestion des Projets**
1. **Settings** → Onglet "Projets OpenAI"
2. **Voir le projet par défaut** ⭐ (impossible à supprimer)
3. **Ajouter un projet** → Nom + Clé API
4. **Basculer** entre projets en un clic

### **3. Création d'Assistant**
1. **Assistants** → "Créer un Assistant"
2. **Étape 1** : Nom + Thème (13 thèmes disponibles)
3. **Étape 2** : Upload fichier (JSON/JSONL/TXT)
4. **Étape 3** : Progression en temps réel
5. **Finalisation** : Assistant prêt à l'usage

### **4. Chat avec Assistant**
1. **Sélectionner** un assistant
2. **Démarrer** une conversation
3. **Poser des questions** sur vos données TGI
4. **Historique** sauvegardé automatiquement

### **5. Analytics**
1. **Dashboard** → Métriques en temps réel
2. **Coûts** par projet et assistant
3. **Usage** et statistiques détaillées
4. **Export** des données

## 🔧 API Documentation

### **Endpoints Principaux**

#### **Assistants**
```http
GET    /assistants              # Liste des assistants
POST   /assistants              # Créer un assistant
DELETE /assistants/{id}         # Supprimer un assistant
```

#### **Chat**
```http
POST   /assistants/{id}/chat    # Envoyer un message
GET    /assistants/{id}/history # Historique des conversations
DELETE /assistants/{id}/history # Effacer l'historique
```

#### **Analytics**
```http
GET    /analytics/dashboard     # Métriques du dashboard
GET    /analytics/costs         # Analyse des coûts
GET    /analytics/usage         # Statistiques d'usage
```

### **Authentification**
```http
# Header requis pour les projets personnalisés
X-OpenAI-Key: sk-votre-cle-api-projet
```

### **Exemples d'Usage**

#### **Créer un Assistant**
```bash
curl -X POST "http://localhost:8000/assistants" \
  -H "X-OpenAI-Key: sk-votre-cle" \
  -F "name=Expert Automobile" \
  -F "theme=AUTOMOBILE" \
  -F "file=@data.json"
```

#### **Envoyer un Message**
```bash
curl -X POST "http://localhost:8000/assistants/asst_123/chat" \
  -H "Content-Type: application/json" \
  -H "X-OpenAI-Key: sk-votre-cle" \
  -d '{"message": "Analyse les données automobile"}'
```

## 🛠️ Développement

### **Structure de Développement**
```bash
# Installation en mode développement
pip install -r backend/requirements.txt
cd frontend && npm install

# Variables d'environnement de dev
cp .env.example .env.dev

# Démarrage en mode dev
npm run dev  # Frontend avec hot reload
uvicorn main:app --reload  # Backend avec auto-reload
```

### **Tests**
```bash
# Tests backend
cd backend
pytest

# Tests frontend
cd frontend
npm test

# Tests end-to-end
npm run test:e2e
```

### **Linting et Formatage**
```bash
# Backend
black backend/
flake8 backend/

# Frontend
npm run lint
npm run format
```

### **Build de Production**
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
pip install gunicorn
```

## 📁 Structure du Projet

```
DocumentAiAssistant/
├── 📁 backend/                 # API FastAPI
│   ├── 📄 main.py             # Point d'entrée FastAPI
│   ├── 📄 database.py         # Configuration SQLite
│   ├── 📄 requirements.txt    # Dépendances Python
│   └── 📄 ddb_manager.db      # Base de données SQLite
│
├── 📁 frontend/               # Application React
│   ├── 📁 public/            # Fichiers statiques
│   ├── 📁 src/               # Code source React
│   │   ├── 📁 components/    # Composants réutilisables
│   │   ├── 📁 contexts/      # Contexts React
│   │   ├── 📁 pages/         # Pages de l'application
│   │   ├── 📁 services/      # Services API
│   │   ├── 📄 App.js         # Composant principal
│   │   └── 📄 index.js       # Point d'entrée React
│   ├── 📄 package.json       # Dépendances Node.js
│   └── 📄 tailwind.config.js # Configuration Tailwind
│
├── 📁 attached_assets/        # Assets et captures d'écran
├── 📄 .env                   # Variables d'environnement
├── 📄 .env.example           # Exemple de configuration
├── 📄 start.sh               # Script de démarrage auto
├── 📄 start_manual.sh        # Script de démarrage manuel
├── 📄 pyproject.toml         # Configuration Python
├── 📄 README.md              # Documentation principale
└── 📄 DOCUMENTATION.md       # Documentation technique
```

### **Composants Frontend Clés**

```
src/
├── 📁 components/
│   └── 📄 Sidebar.js          # Navigation principale
├── 📁 contexts/
│   ├── 📄 AuthContext.js      # Gestion authentification
│   └── 📄 AssistantContext.js # Gestion assistants
├── 📁 pages/
│   ├── 📄 Dashboard.js        # Tableau de bord
│   ├── 📄 Assistants.js       # Liste des assistants
│   ├── 📄 CreateAssistant.js  # Création d'assistant
│   ├── 📄 Chat.js             # Interface de chat
│   ├── 📄 Analytics.js        # Analytics et métriques
│   ├── 📄 Settings.js         # Gestion des projets
│   └── 📄 Login.js            # Page de connexion
└── 📁 services/
    └── 📄 api.js              # Client API REST
```

## 🤝 Contribution

### **Guidelines de Contribution**
1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** les changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### **Standards de Code**
- **Python** : PEP 8, Black formatting
- **JavaScript** : ESLint, Prettier formatting
- **Commits** : Conventional Commits
- **Tests** : Coverage minimum 80%

### **Roadmap**
- [ ] 🌙 Mode sombre/clair
- [ ] 📱 Application mobile React Native
- [ ] 🔐 Authentification OAuth
- [ ] 📊 Export PDF des analyses
- [ ] 🌍 Internationalisation (i18n)
- [ ] 🚀 Déploiement Docker
- [ ] ☁️ Support cloud (AWS, Azure)

---

## 📞 Support

- **Documentation** : [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Issues** : GitHub Issues
- **Email** : support@ddb-tgi.com

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

**Développé avec ❤️ par l'équipe DDB TGI**

*Plateforme d'analyse de données d'audience avec IA - Version 2.0.0*
