import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft as ArrowLeftIcon,
  Upload as UploadIcon,
  FileText as FileTextIcon,
  Bot as BotIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Loader as LoaderIcon,
  Zap as ZapIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  RefreshCw as RefreshCwIcon
} from 'lucide-react';
import { useAssistant } from '../contexts/AssistantContext';
import toast from 'react-hot-toast';

const CreateAssistant = () => {
  const navigate = useNavigate();
  const { createAssistant } = useAssistant();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    theme: '',
    file: null
  });
  const [progress, setProgress] = useState({
    fileValidation: false,
    excelConversion: false,
    vectorStore: false,
    assistantCreation: false,
    completed: false
  });
  const [isExcelFile, setIsExcelFile] = useState(false);

  const themes = [
    'AUTOMOBILE',
    'TECHNOLOGIE',
    'SANTÉ',
    'FINANCE',
    'RETAIL',
    'MÉDIA',
    'ÉDUCATION',
    'IMMOBILIER',
    'VOYAGE',
    'ALIMENTAIRE',
    'MODE',
    'SPORT',
    'AUTRE'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - now including Excel files
      const allowedTypes = ['application/json', 'text/plain', 
                           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                           'application/vnd.ms-excel'];
      const isJsonl = file.name.endsWith('.jsonl');
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!allowedTypes.includes(file.type) && !isJsonl && !isExcel) {
        toast.error('Type de fichier non supporté. Utilisez JSON, JSONL, TXT, XLS ou XLSX.');
        return;
      }
      
      // Check if it's an Excel file
      setIsExcelFile(isExcel);
      
      setFormData({
        ...formData,
        file: file
      });
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Veuillez entrer un nom pour l\'assistant');
      return false;
    }
    if (!formData.theme) {
      toast.error('Veuillez sélectionner un thème');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.file) {
      toast.error('Veuillez sélectionner un fichier');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit(); // Start creation process
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const simulateProgress = async (callback, delay = 1000) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    callback();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStep(3);

    try {
      // Step 1: File validation
      setProgress(prev => ({ ...prev, fileValidation: true }));
      await simulateProgress(() => {}, 800);

      // Step 2: Excel conversion (if needed)
      if (isExcelFile) {
        setProgress(prev => ({ ...prev, excelConversion: true }));
        await simulateProgress(() => {}, 2000); // Longer delay for conversion
      }

      // Step 3: Vector store creation
      setProgress(prev => ({ ...prev, vectorStore: true }));
      await simulateProgress(() => {}, 1500);

      // Step 4: Assistant creation
      setProgress(prev => ({ ...prev, assistantCreation: true }));
      
      const result = await createAssistant(formData, formData.file);
      
      if (result.success) {
        setProgress(prev => ({ ...prev, completed: true }));
        await simulateProgress(() => {}, 1000);
        
        toast.success('Assistant créé avec succès !');
        navigate('/assistants');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création');
      setStep(2); // Return to file selection
      setProgress({
        fileValidation: false,
        excelConversion: false,
        vectorStore: false,
        assistantCreation: false,
        completed: false
      });
    } finally {
      setLoading(false);
    }
  };

  const ProgressStep = ({ icon: Icon, title, description, completed, active, error }) => (
    <div className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-300 ${
      completed ? 'bg-green-50 border border-green-200' :
      active ? 'bg-blue-50 border border-blue-200' :
      error ? 'bg-red-50 border border-red-200' :
      'bg-gray-50 border border-gray-200'
    }`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
        completed ? 'bg-green-100' :
        active ? 'bg-blue-100' :
        error ? 'bg-red-100' :
        'bg-gray-100'
      }`}>
        {completed ? (
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        ) : active ? (
          <LoaderIcon className="w-6 h-6 text-blue-600 animate-spin" />
        ) : error ? (
          <AlertCircleIcon className="w-6 h-6 text-red-600" />
        ) : (
          <Icon className={`w-6 h-6 ${
            completed ? 'text-green-600' :
            active ? 'text-blue-600' :
            'text-gray-400'
          }`} />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-medium ${
          completed ? 'text-green-900' :
          active ? 'text-blue-900' :
          error ? 'text-red-900' :
          'text-gray-700'
        }`}>
          {title}
        </h3>
        <p className={`text-sm mt-1 ${
          completed ? 'text-green-700' :
          active ? 'text-blue-700' :
          error ? 'text-red-700' :
          'text-gray-500'
        }`}>
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 h-screen">
      <div className="p-8 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/assistants')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-ddb-black mb-2">Créer un Assistant</h1>
            <p className="text-gray-600">Configurez votre assistant IA d'analyse de données</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Étape {step} sur 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% complété</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-ddb-yellow h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <BotIcon className="w-6 h-6 text-ddb-yellow" />
                <h2 className="text-xl font-semibold text-ddb-black">Informations de base</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'assistant
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="ex: Analyse Automobile Q4 2024"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Choisissez un nom descriptif pour identifier facilement cet assistant
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thème d'analyse
                  </label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Sélectionnez un thème</option>
                    {themes.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le thème détermine le contexte d'analyse de votre assistant
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">À propos des assistants</h3>
                  <p className="text-sm text-blue-700">
                    Votre assistant sera spécialisé dans l'analyse de données sectorielles avec une compréhension 
                    approfondie des métriques TGI (indices, pourcentages, segments).
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 2 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <UploadIcon className="w-6 h-6 text-ddb-yellow" />
                <h2 className="text-xl font-semibold text-ddb-black">Fichier de données</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Sélectionnez votre fichier de données
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-ddb-yellow transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".json,.jsonl,.txt,.xlsx,.xls"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isExcelFile ? (
                        <FileSpreadsheetIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      ) : (
                        <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      )}
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Cliquez pour sélectionner un fichier
                      </p>
                      <p className="text-sm text-gray-500">
                        Formats supportés : JSON, JSONL, TXT, XLS, XLSX
                      </p>
                    </label>
                  </div>

                  {formData.file && (
                    <div className="mt-4 space-y-3">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">{formData.file.name}</p>
                            <p className="text-sm text-green-700">
                              {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {isExcelFile && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheetIcon className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">Fichier Excel détecté</p>
                              <p className="text-sm text-blue-700">
                                Le fichier sera automatiquement converti au format JSON lors de la création
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">Format des données</h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    Votre fichier doit contenir des données structurées avec les champs :
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>Interview</strong> : caractéristiques démographiques</li>
                    <li>• <strong>Segment</strong> : segments étudiés</li>
                    <li>• <strong>Indice</strong> : indicateurs de surreprésentation</li>
                    <li>• <strong>% Vert/Horz</strong> : pourcentages d'analyse</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="btn-secondary"
                >
                  Retour
                </button>
                <button
                  onClick={nextStep}
                  className="btn-primary"
                  disabled={!formData.file}
                >
                  Créer l'assistant
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Creation Progress */}
          {step === 3 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <ZapIcon className="w-6 h-6 text-ddb-yellow" />
                <h2 className="text-xl font-semibold text-ddb-black">Création en cours</h2>
              </div>

              <div className="space-y-4 mb-8">
                <ProgressStep
                  icon={FileTextIcon}
                  title="Validation du fichier"
                  description="Vérification du format et du contenu"
                  completed={progress.fileValidation}
                  active={!progress.fileValidation && loading}
                />
                
                {isExcelFile && (
                  <ProgressStep
                    icon={RefreshCwIcon}
                    title="Conversion Excel vers JSON"
                    description="Transformation du fichier TGI Excel en format JSON exploitable"
                    completed={progress.excelConversion}
                    active={progress.fileValidation && !progress.excelConversion && loading}
                  />
                )}
                
                <ProgressStep
                  icon={UploadIcon}
                  title="Création du vector store"
                  description="Indexation des données pour la recherche"
                  completed={progress.vectorStore}
                  active={(isExcelFile ? progress.excelConversion : progress.fileValidation) && !progress.vectorStore && loading}
                />
                
                <ProgressStep
                  icon={BotIcon}
                  title="Configuration de l'assistant"
                  description="Initialisation avec GPT-4o et instructions spécialisées"
                  completed={progress.assistantCreation}
                  active={progress.vectorStore && !progress.assistantCreation && loading}
                />
                
                <ProgressStep
                  icon={CheckCircleIcon}
                  title="Finalisation"
                  description="Assistant prêt à l'utilisation"
                  completed={progress.completed}
                  active={progress.assistantCreation && !progress.completed && loading}
                />
              </div>

              {progress.completed && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Assistant créé avec succès !
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Votre assistant "{formData.name}" est maintenant prêt à analyser vos données {formData.theme}.
                  </p>
                  <button
                    onClick={() => navigate('/assistants')}
                    className="btn-primary"
                  >
                    Voir mes assistants
                  </button>
                </div>
              )}

              {loading && !progress.completed && (
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Création en cours, veuillez patienter...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAssistant;
