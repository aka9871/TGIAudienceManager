import React, { useState } from 'react';
import { Target as TargetIcon, Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        toast.success('Connexion réussie!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-ddb-yellow rounded-2xl mx-auto mb-4 shadow-lg">
            <TargetIcon className="w-8 h-8 text-ddb-black" />
          </div>
          <h1 className="text-3xl font-bold text-ddb-black mb-2">DDB Manager</h1>
          <p className="text-gray-600">Gestionnaire d'Assistants IA</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ddb-black mb-2">Connexion</h2>
            <p className="text-gray-600">Accédez à votre tableau de bord</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Entrez votre nom d'utilisateur"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Entrez votre mot de passe"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="loading-spinner"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Identifiants de démonstration :</p>
            <div className="text-sm space-y-3">
              <div className="p-3 bg-white rounded border border-ddb-yellow/20">
                <p className="font-medium text-ddb-black mb-1">👑 Administrateur</p>
                <p><span className="font-medium">Utilisateur :</span> admin</p>
                <p><span className="font-medium">Mot de passe :</span> admin123</p>
                <p className="text-xs text-gray-500 mt-1">Accès complet (Analytics + Settings)</p>
              </div>
              <div className="p-3 bg-white rounded border border-gray-200">
                <p className="font-medium text-gray-700 mb-1">👤 Utilisateur</p>
                <p><span className="font-medium">Utilisateur :</span> user</p>
                <p><span className="font-medium">Mot de passe :</span> user123</p>
                <p className="text-xs text-gray-500 mt-1">Accès limité (Dashboard, Assistants, Chat)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 DDB Manager. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
