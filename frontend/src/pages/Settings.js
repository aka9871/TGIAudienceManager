import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon,
  Key as KeyIcon,
  Save as SaveIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Settings as SettingsIcon,
  ArrowLeft as ArrowLeftIcon,
  Check as CheckIcon,
  RefreshCw as RefreshCwIcon,
  Folder as FolderIcon,
  Plus as PlusIcon,
  Trash as TrashIcon,
  Play as PlayIcon,
  Star as StarIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAssistant } from '../contexts/AssistantContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshAssistants } = useAssistant();
  const [activeTab, setActiveTab] = useState('projects');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Projects state
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  
  // New project form state
  const [newProject, setNewProject] = useState({
    name: '',
    apiKey: ''
  });

  // Load projects from localStorage
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    let savedProjects = JSON.parse(localStorage.getItem('openai_projects') || '[]');
    const currentProjectId = localStorage.getItem('current_project_id');
    
    console.log('Loading projects:', savedProjects);
    console.log('Current project ID:', currentProjectId);
    
    // Check if default project exists
    const defaultProject = savedProjects.find(p => p.isDefault);
    
    // If no default project, create one from .env
    if (!defaultProject) {
      const envApiKey = process.env.REACT_APP_OPENAI_API_KEY || localStorage.getItem('openai_api_key');
      console.log('Creating default project with API key:', envApiKey?.substring(0, 10) + '...');
      
      if (envApiKey && envApiKey.startsWith('sk-')) {
        try {
          const testResult = await testApiKey(envApiKey);
          if (testResult.success) {
            const defaultProj = {
              id: 'default',
              name: 'Projet par défaut',
              apiKey: envApiKey,
              createdAt: new Date().toISOString(),
              modelCount: testResult.modelCount,
              isDefault: true
            };
            savedProjects.unshift(defaultProj); // Add at beginning
            localStorage.setItem('openai_projects', JSON.stringify(savedProjects));
            console.log('Default project created:', defaultProj);
          }
        } catch (error) {
          console.log('Could not validate default API key:', error);
        }
      }
    }
    
    setProjects(savedProjects);
    
    if (currentProjectId) {
      const current = savedProjects.find(p => p.id === currentProjectId);
      setCurrentProject(current);
      console.log('Set current project from ID:', current);
    } else if (savedProjects.length > 0) {
      // Set default project as current if no current project
      const defaultProj = savedProjects.find(p => p.isDefault) || savedProjects[0];
      setCurrentProject(defaultProj);
      localStorage.setItem('current_project_id', defaultProj.id);
      localStorage.setItem('openai_api_key', defaultProj.apiKey);
      localStorage.setItem('project_name', defaultProj.name);
      console.log('Set default project as current:', defaultProj);
    }
  };

  const saveProjects = (projectsList, currentId = null) => {
    localStorage.setItem('openai_projects', JSON.stringify(projectsList));
    if (currentId) {
      localStorage.setItem('current_project_id', currentId);
    }
  };

  const handleNewProjectChange = (e) => {
    setNewProject({
      ...newProject,
      [e.target.name]: e.target.value
    });
  };

  const testApiKey = async (apiKey) => {
    setTesting(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const gpt4Models = data.data.filter(model => model.id.includes('gpt-4'));
        return { success: true, modelCount: gpt4Models.length };
      } else {
        return { success: false, error: 'Clé API invalide ou expirée' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors du test de la clé API' };
    } finally {
      setTesting(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!newProject.name.trim()) {
        toast.error('Veuillez entrer un nom de projet');
        return;
      }

      if (!newProject.apiKey.startsWith('sk-')) {
        toast.error('La clé API OpenAI doit commencer par "sk-"');
        return;
      }

      // Test the API key
      const testResult = await testApiKey(newProject.apiKey);
      if (!testResult.success) {
        toast.error(testResult.error);
        return;
      }

      // Create new project
      const project = {
        id: Date.now().toString(),
        name: newProject.name,
        apiKey: newProject.apiKey,
        createdAt: new Date().toISOString(),
        modelCount: testResult.modelCount,
        isDefault: false
      };

      const updatedProjects = [...projects, project];
      setProjects(updatedProjects);
      saveProjects(updatedProjects);

      toast.success(`Projet "${newProject.name}" ajouté avec succès`);
      
      // Reset form
      setNewProject({ name: '', apiKey: '' });
      setShowAddForm(false);
      
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du projet');
    } finally {
      setSaving(false);
    }
  };

  const switchToProject = async (project) => {
    try {
      console.log('Switching to project:', project);
      
      // Update current project in state
      setCurrentProject(project);
      
      // Save to localStorage
      saveProjects(projects, project.id);
      localStorage.setItem('openai_api_key', project.apiKey);
      localStorage.setItem('project_name', project.name);
      
      console.log('Updated localStorage:');
      console.log('- current_project_id:', project.id);
      console.log('- openai_api_key:', project.apiKey.substring(0, 10) + '...');
      console.log('- project_name:', project.name);
      
      toast.success(`Basculement vers le projet "${project.name}"`);
      
      // Force a small delay to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show loading toast
      const loadingToast = toast.loading('Rechargement des assistants...');
      
      // Refresh assistants with new API key
      try {
        await refreshAssistants();
        toast.dismiss(loadingToast);
        toast.success('Assistants rechargés avec succès');
      } catch (refreshError) {
        console.error('Error refreshing assistants:', refreshError);
        toast.dismiss(loadingToast);
        toast.error('Erreur lors du rechargement des assistants');
      }
      
    } catch (error) {
      console.error('Error switching project:', error);
      toast.error('Erreur lors du changement de projet');
    }
  };

  const deleteProject = (projectId) => {
    // Prevent deletion of default project
    const project = projects.find(p => p.id === projectId);
    if (project?.isDefault) {
      toast.error('Impossible de supprimer le projet par défaut');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      // If deleting current project, switch to default
      if (currentProject?.id === projectId) {
        const defaultProject = updatedProjects.find(p => p.isDefault);
        if (defaultProject) {
          switchToProject(defaultProject);
        } else {
          setCurrentProject(null);
          localStorage.removeItem('current_project_id');
          localStorage.removeItem('openai_api_key');
          localStorage.removeItem('project_name');
        }
      }
      
      toast.success('Projet supprimé');
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === id
          ? 'bg-ddb-yellow text-ddb-black font-medium'
          : 'text-gray-600 hover:text-ddb-black hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-ddb-black mb-2">Paramètres</h1>
            <p className="text-gray-600">Gérez vos projets OpenAI et la configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <div className="space-y-2">
                <TabButton id="projects" label="Projets OpenAI" icon={FolderIcon} />
                <TabButton id="profile" label="Profil" icon={UserIcon} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'projects' && (
              <div className="space-y-6">
                {/* Current Project */}
                {currentProject && (
                  <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                      <PlayIcon className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-semibold text-ddb-black">Projet Actuel</h2>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-green-900">{currentProject.name}</h3>
                        {currentProject.isDefault && (
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-current" title="Projet par défaut" />
                        )}
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        {currentProject.modelCount} modèles GPT-4 disponibles
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Clé API : {currentProject.apiKey.substring(0, 10)}...
                      </p>
                    </div>
                  </div>
                )}

                {/* Projects List */}
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <FolderIcon className="w-6 h-6 text-ddb-yellow" />
                      <h2 className="text-xl font-semibold text-ddb-black">Mes Projets OpenAI</h2>
                    </div>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Ajouter un Projet
                    </button>
                  </div>

                  {/* Add Project Form */}
                  {showAddForm && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-blue-900 mb-4">Nouveau Projet</h3>
                      <form onSubmit={handleAddProject} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du Projet
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={newProject.name}
                            onChange={handleNewProjectChange}
                            className="input-field"
                            placeholder="ex: DDB Production, DDB Test..."
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clé API OpenAI
                          </label>
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            name="apiKey"
                            value={newProject.apiKey}
                            onChange={handleNewProjectChange}
                            className="input-field"
                            placeholder="sk-..."
                            disabled={saving}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="btn-secondary"
                            disabled={saving}
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary disabled:opacity-50"
                          >
                            {saving ? 'Test en cours...' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Projects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                          currentProject?.id === project.id
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-ddb-yellow'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{project.name}</h3>
                              {project.isDefault && (
                                <StarIcon className="w-4 h-4 text-yellow-500 fill-current" title="Projet par défaut" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {project.modelCount} modèles GPT-4
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {currentProject?.id === project.id && (
                              <div className="w-3 h-3 bg-green-500 rounded-full" title="Projet actuel"></div>
                            )}
                            {!project.isDefault && (
                              <button
                                onClick={() => deleteProject(project.id)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="Supprimer"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-3">
                          Clé : {project.apiKey.substring(0, 10)}...
                        </p>
                        
                        <button
                          onClick={() => switchToProject(project)}
                          disabled={currentProject?.id === project.id}
                          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            currentProject?.id === project.id
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-ddb-yellow text-ddb-black hover:bg-yellow-400'
                          }`}
                        >
                          {currentProject?.id === project.id ? 'Projet Actuel' : 'Basculer vers ce projet'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {projects.length === 0 && (
                    <div className="text-center py-8">
                      <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun projet configuré</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Ajoutez votre premier projet OpenAI pour commencer
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <UserIcon className="w-6 h-6 text-ddb-yellow" />
                  <h2 className="text-xl font-semibold text-ddb-black">Informations du Profil</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={user?.username || ''}
                        className="input-field"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || 'Utilisateur'}
                        className="input-field"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full flex-shrink-0 mt-0.5">
                        <span className="text-gray-600 text-sm font-bold">i</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Gestion Multi-Projets</h3>
                        <p className="text-sm text-gray-700">
                          Cette plateforme permet de gérer plusieurs projets OpenAI. 
                          Chaque projet a ses propres assistants et données isolées.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
