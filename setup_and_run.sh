#!/bin/bash

# DDB Assistant Manager - Script de configuration et démarrage
echo "🎯 Configuration et démarrage de DDB Assistant Manager..."

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env non trouvé"
    echo "Le fichier .env a été créé avec votre clé API"
fi

# Charger les variables d'environnement depuis .env
set -a
source .env
set +a

echo "✅ Variables d'environnement chargées depuis .env"

# Fonction pour configurer le backend
setup_backend() {
    echo "🔧 Configuration du backend..."
    cd backend
    
    # Si vous êtes déjà dans un venv, on l'utilise, sinon on en crée un
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        echo "✅ Environnement virtuel détecté: $VIRTUAL_ENV"
        echo "📦 Installation des dépendances dans l'environnement actuel..."
        pip install --upgrade pip
        pip install -r requirements.txt
    else
        # Créer un environnement virtuel local si nécessaire
        if [ ! -d "venv" ]; then
            echo "📦 Création d'un environnement virtuel local..."
            python3 -m venv venv
        fi
        echo "🔄 Activation de l'environnement virtuel local..."
        source venv/bin/activate
        echo "📦 Installation des dépendances..."
        pip install --upgrade pip
        pip install -r requirements.txt
    fi
    
    cd ..
}

# Fonction pour configurer le frontend
setup_frontend() {
    echo "🔧 Configuration du frontend..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installation des dépendances npm..."
        npm install
    else
        echo "✅ Dépendances npm déjà installées"
    fi
    
    cd ..
}

# Fonction pour démarrer le backend
start_backend() {
    echo "🚀 Démarrage du backend FastAPI..."
    cd backend
    
    # Utiliser l'environnement virtuel approprié
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        # Déjà dans un venv
        python3 main.py &
    else
        # Activer le venv local
        source venv/bin/activate
        python3 main.py &
    fi
    
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

# Configuration
setup_backend
setup_frontend

echo ""
echo "🎉 Configuration terminée ! Démarrage des services..."
echo ""

# Démarrage
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
