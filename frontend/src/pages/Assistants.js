import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus as PlusIcon, 
  Bot as RobotIcon, 
  Upload as UploadIcon, 
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  MessageCircle as MessageCircleIcon,
  Trash as TrashIcon,
  Play as PlayIcon
} from 'lucide-react';
import { useAssistant } from '../contexts/AssistantContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Assistants = () => {
  const navigate = useNavigate();
  const { assistants, deleteAssistant, loading } = useAssistant();

  const handleDelete = async (assistantId, assistantName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'assistant "${assistantName}" ?`)) {
      await deleteAssistant(assistantId);
    }
  };

  const AssistantCard = ({ assistant }) => (
    <div className="card hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-ddb-yellow bg-opacity-10 rounded-lg">
            <RobotIcon className="w-6 h-6 text-ddb-yellow" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ddb-black">{assistant.name}</h3>
            <p className="text-sm text-gray-500">{assistant.theme}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/chat/${assistant.id}`)}
            className="btn-secondary p-2"
            title="Démarrer une conversation"
          >
            <PlayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(assistant.id, assistant.name)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer l'assistant"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileTextIcon className="w-4 h-4" />
          <span>{assistant.file_name || 'Fichier non spécifié'}</span>
          {assistant.file_type && (
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
              {assistant.file_type.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>
            Créé {assistant.created_at ? 
              formatDistanceToNow(new Date(assistant.created_at), { addSuffix: true, locale: fr }) :
              'récemment'
            }
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MessageCircleIcon className="w-4 h-4" />
          <span>{assistant.message_count || 0} messages</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => navigate(`/chat/${assistant.id}`)}
          className="w-full btn-primary"
        >
          Démarrer une conversation
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 h-screen">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ddb-black mb-2">Assistants</h1>
            <p className="text-gray-600">Créez et gérez vos assistants d'analyse de données</p>
          </div>
          <button
            onClick={() => navigate('/assistants/create')}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Créer un Assistant
          </button>
        </div>

        {/* Assistants Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des assistants...</p>
            </div>
          </div>
        ) : assistants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {assistants.map((assistant) => (
              <AssistantCard key={assistant.id} assistant={assistant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6">
              <RobotIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun assistant créé</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Créez votre premier assistant d'analyse de données pour commencer à analyser vos fichiers structurés.
            </p>
            <button
              onClick={() => navigate('/assistants/create')}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="w-5 h-5" />
              Créer votre premier assistant
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assistants;
