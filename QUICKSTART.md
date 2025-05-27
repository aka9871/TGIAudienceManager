# ⚡ Guide de Démarrage Rapide - DDB TGI Audience Manager

## 🚀 Installation en 5 Minutes

### **1. Prérequis**
```bash
# Vérifiez que vous avez :
python --version  # Python 3.8+
node --version    # Node.js 16+
git --version     # Git
```

### **2. Clonage et Configuration**
```bash
# Cloner le projet
git clone https://github.com/aka9871/TGIAudienceManager.git
cd TGIAudienceManager

# Configuration des variables d'environnement
cp .env.example .env
# Éditez .env et ajoutez votre clé OpenAI API
```

### **3. Installation des Dépendances**
```bash
# Backend Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate     # Windows
pip install -r backend/requirements.txt

# Frontend React
cd frontend
npm install
cd ..
```

### **4. Démarrage**
```bash
# Option A : Démarrage automatique (recommandé)
chmod +x start.sh
./start.sh

# Option B : Démarrage manuel
./start_manual.sh
```

### **5. Accès à l'Application**
- **Frontend** : http://localhost:3000
- **API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

---

## 🎯 Premier Usage

### **1. Connexion**
- Ouvrez http://localhost:3000
- Entrez n'importe quel nom d'utilisateur
- Le projet par défaut est créé automatiquement ⭐

### **2. Créer votre Premier Assistant**
1. **Cliquez** sur "Assistants" dans la sidebar
2. **Cliquez** sur "Créer un Assistant"
3. **Étape 1** : Nom (ex: "Expert Automobile") + Thème
4. **Étape 2** : Upload fichier JSON/JSONL/TXT
5. **Étape 3** : Attendez la création (progression en temps réel)

### **3. Chatter avec votre Assistant**
1. **Sélectionnez** votre assistant créé
2. **Cliquez** sur "Démarrer une conversation"
3. **Posez des questions** sur vos données TGI
4. **Analysez** les réponses expertes

---

## 📊 Exemple de Données TGI

### **Format JSON Attendu**
```json
[
  {
    "Interview": "Homme 25-34 ans, CSP+",
    "Segment": "Automobile Premium",
    "Indice": 145,
    "Pourcentage_Vertical": 23.5,
    "Pourcentage_Horizontal": 18.2
  },
  {
    "Interview": "Femme 35-49 ans, CSP-",
    "Segment": "Automobile Économique", 
    "Indice": 89,
    "Pourcentage_Vertical": 31.2,
    "Pourcentage_Horizontal": 22.8
  }
]
```

### **Questions d'Exemple**
- "Quels sont les segments les plus performants ?"
- "Analyse l'indice TGI pour les hommes 25-34 ans"
- "Recommandations marketing pour l'automobile premium"
- "Comparaison des pourcentages verticaux par segment"

---

## 🗂️ Gestion Multi-Projets

### **Ajouter un Nouveau Projet**
1. **Settings** → "Projets OpenAI"
2. **Cliquer** "Ajouter un Projet"
3. **Saisir** nom + clé API OpenAI
4. **Validation** automatique de la clé

### **Basculer Entre Projets**
1. **Voir** la liste des projets
2. **Cliquer** "Basculer vers ce projet"
3. **Assistants rechargés** automatiquement

---

## 🛠️ Résolution de Problèmes

### **Erreur : "Module not found"**
```bash
# Réinstaller les dépendances
pip install -r backend/requirements.txt
cd frontend && npm install
```

### **Erreur : "OpenAI API Key invalid"**
```bash
# Vérifier votre clé API dans .env
cat .env | grep OPENAI_API_KEY
# La clé doit commencer par "sk-"
```

### **Erreur : "Port already in use"**
```bash
# Tuer les processus sur les ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
```

### **Erreur : "Database locked"**
```bash
# Supprimer la base de données et redémarrer
rm backend/ddb_manager.db
./start.sh
```

---

## 📱 Raccourcis Utiles

### **Commandes de Développement**
```bash
# Logs backend en temps réel
tail -f backend/logs/app.log

# Rebuild frontend
cd frontend && npm run build

# Reset complet
rm -rf venv node_modules backend/*.db
# Puis réinstaller
```

### **URLs Importantes**
- **App** : http://localhost:3000
- **API Docs** : http://localhost:8000/docs
- **API Health** : http://localhost:8000/health
- **Redoc** : http://localhost:8000/redoc

---

## 🎨 Personnalisation

### **Thèmes Disponibles**
- AUTOMOBILE
- TECHNOLOGIE  
- SANTÉ
- FINANCE
- RETAIL
- MÉDIA
- ÉDUCATION
- IMMOBILIER
- VOYAGE
- ALIMENTAIRE
- MODE
- SPORT
- AUTRE

### **Formats de Fichiers Supportés**
- **JSON** : Données structurées
- **JSONL** : JSON Lines (une ligne = un objet)
- **TXT** : Texte brut avec données tabulaires

---

## 🚀 Prochaines Étapes

1. **Explorez** le Dashboard pour voir les analytics
2. **Testez** différents types de questions
3. **Ajoutez** plusieurs assistants spécialisés
4. **Configurez** des projets pour différents clients
5. **Consultez** la [Documentation Complète](./DOCUMENTATION.md)

---

## 📞 Aide

- **Documentation** : [DOCUMENTATION.md](./DOCUMENTATION.md)
- **README** : [README.md](./README.md)
- **Issues** : GitHub Issues
- **Email** : ali.khedji@tribal.paris

**Bon usage de DDB TGI Audience Manager ! 🎉**

*Développé avec ❤️ par Ali Khedji pour l'équipe DDB TGI*
