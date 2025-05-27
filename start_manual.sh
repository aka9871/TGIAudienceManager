#!/bin/bash

# DDB Assistant Manager - Démarrage manuel simple
echo "🎯 Démarrage manuel de DDB Assistant Manager..."

# Vérifier qu'on est dans un environnement virtuel
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "❌ Vous n'êtes pas dans un environnement virtuel"
    echo "Veuillez activer votre environnement virtuel d'abord :"
    echo "source votre_venv/bin/activate"
    exit 1
fi

echo "✅ Environnement virtuel détecté: $VIRTUAL_ENV"

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

# Démarrer le backend exactement comme vous le faites manuellement
echo "🚀 Démarrage du backend (comme manuellement)..."
cd backend
python3 main.py &
BACKEND_PID=$!
echo "✅ Backend démarré (PID: $BACKEND_PID)"
cd ..

# Attendre que le backend soit prêt
sleep 5

# Démarrer le frontend exactement comme vous le faites manuellement
echo "🎨 Démarrage du frontend (comme manuellement)..."
cd frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend démarré (PID: $FRONTEND_PID)"
cd ..

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
echo "💡 Ce script reproduit exactement votre démarrage manuel"
echo "Appuyez sur Ctrl+C pour arrêter les services..."

# Attendre indéfiniment
wait
