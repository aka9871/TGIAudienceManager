#!/bin/bash

# DDB Assistant Manager - Script pour environnement virtuel existant
echo "🎯 Démarrage de DDB Assistant Manager (dans votre venv)..."

# Vérifier qu'on est dans un environnement virtuel
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "❌ Vous n'êtes pas dans un environnement virtuel"
    echo "Veuillez activer votre environnement virtuel d'abord :"
    echo "source votre_venv/bin/activate"
    echo ""
    echo "Ou utilisez le script setup_and_run.sh qui gère tout automatiquement"
    exit 1
fi

echo "✅ Environnement virtuel détecté: $VIRTUAL_ENV"

# Charger les variables d'environnement depuis .env
if [ -f ".env" ]; then
    echo "✅ Chargement des variables d'environnement depuis .env"
    # Lire et exporter chaque variable explicitement
    while IFS='=' read -r key value; do
        # Ignorer les commentaires et lignes vides
        if [[ ! $key =~ ^[[:space:]]*# && -n $key ]]; then
            # Supprimer les espaces et guillemets
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs | sed 's/^["'\'']//' | sed 's/["'\'']$//')
            export "$key"="$value"
            echo "  ✓ $key exporté"
        fi
    done < .env
else
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

# Vérifier que les variables critiques sont définies
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY non définie dans .env"
    exit 1
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    echo "❌ JWT_SECRET_KEY non définie dans .env"
    exit 1
fi

echo "✅ Variables d'environnement critiques vérifiées"

# Installer les dépendances du backend
echo "📦 Installation des dépendances Python..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Installer les dépendances du frontend
echo "📦 Vérification des dépendances npm..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances npm..."
    npm install
fi
cd ..

# Fonction pour démarrer le backend
start_backend() {
    echo "🚀 Démarrage du backend FastAPI..."
    cd backend
    # Exporter les variables d'environnement pour le processus Python
    export OPENAI_API_KEY="$OPENAI_API_KEY"
    export JWT_SECRET_KEY="$JWT_SECRET_KEY"
    python3 main.py &
    BACKEND_PID=$!
    echo "✅ Backend démarré (PID: $BACKEND_PID)"
    cd ..
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo "🎨 Démarrage du frontend React..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo "✅ Frontend démarré (PID: $FRONTEND_PID)"
    cd ..
}

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend arrêté"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend arrêté"
    fi
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGINT SIGTERM

# Démarrer les services
start_backend
sleep 5  # Attendre que le backend soit prêt
start_frontend

echo ""
echo "🎉 DDB Assistant Manager est maintenant en cours d'exécution !"
echo ""
echo "📍 URLs :"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔑 Identifiants de démonstration :"
echo "   Utilisateur: admin"
echo "   Mot de passe: admin123"
echo ""
echo "💡 Conseil : Attendez quelques secondes que les services se lancent complètement"
echo "Appuyez sur Ctrl+C pour arrêter les services..."

# Attendre indéfiniment
wait
