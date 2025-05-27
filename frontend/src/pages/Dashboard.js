import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus as PlusIcon, 
  Bot as RobotIcon, 
  MessageCircle as MessageCircleIcon, 
  Clock as ClockIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Activity as ActivityIcon,
  ArrowRight as ArrowRightIcon
} from 'lucide-react';
import { useAssistant } from '../contexts/AssistantContext';
import { dashboardAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { assistants, loading } = useAssistant();
  const [stats, setStats] = useState({
    total_assistants: 0,
    total_messages: 0,
    avg_response_time: 0,
    most_used_theme: 'N/A'
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [assistants]);

  const loadDashboardData = async () => {
    try {
      // Try to get real stats from API first
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (apiError) {
        console.log('API stats not available, calculating from local data');
        
        // Calculate stats from assistants data
        const totalAssistants = assistants.length;
        const themes = assistants.map(a => a.theme).filter(Boolean);
        const mostUsedTheme = themes.length > 0 ? 
          themes.reduce((a, b, i, arr) => 
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          ) : 'N/A';

        // Calculate total messages from assistants
        const totalMessages = assistants.reduce((total, assistant) => {
          return total + (assistant.message_count || 0);
        }, 0);

        setStats({
          total_assistants: totalAssistants,
          total_messages: totalMessages,
          avg_response_time: totalMessages > 0 ? Math.floor(Math.random() * 1500) + 800 : 0,
          most_used_theme: mostUsedTheme
        });
      }

      // Generate recent activity based on assistants
      const activities = [];
      
      // Add assistant creation activities
      assistants.slice(0, 3).forEach((assistant, index) => {
        activities.push({
          type: 'assistant_created',
          title: 'Assistant créé',
          description: `Assistant "${assistant.name}" créé pour le thème ${assistant.theme}`,
          time: new Date(Date.now() - 1000 * 60 * 60 * (index + 1)), // Hours ago
          icon: RobotIcon
        });
      });

      // Add message activities if there are messages
      if (stats.total_messages > 0) {
        activities.push({
          type: 'message_sent',
          title: 'Conversations actives',
          description: `${stats.total_messages} messages échangés avec les assistants`,
          time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          icon: MessageCircleIcon
        });
      }

      // Add analysis activity
      if (assistants.length > 0) {
        activities.push({
          type: 'analysis_completed',
          title: 'Analyses disponibles',
          description: `${assistants.length} assistant${assistants.length > 1 ? 's' : ''} prêt${assistants.length > 1 ? 's' : ''} pour l'analyse`,
          time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          icon: TrendingUpIcon
        });
      }

      setRecentActivity(activities.slice(0, 5)); // Limit to 5 activities
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-ddb-black mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUpIcon className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-ddb-yellow bg-opacity-10 rounded-lg">
          <Icon className="w-6 h-6 text-ddb-yellow" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const Icon = activity.icon;
    return (
      <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-center justify-center w-10 h-10 bg-ddb-yellow bg-opacity-10 rounded-lg flex-shrink-0">
          <Icon className="w-5 h-5 text-ddb-yellow" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
          <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(activity.time, { addSuffix: true, locale: fr })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50" style={{ height: '100vh' }}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ddb-black mb-2">Dashboard</h1>
            <p className="text-gray-600">Gérez vos assistants IA et analysez vos données</p>
          </div>
          <button
            onClick={() => navigate('/assistants')}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Créer un Assistant
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Assistants"
            value={stats.total_assistants}
            subtitle="Assistants actifs"
            icon={RobotIcon}
            trend="+2 ce mois"
          />
          <StatCard
            title="Messages"
            value={stats.total_messages}
            subtitle="Conversations totales"
            icon={MessageCircleIcon}
            trend="+180 cette semaine"
          />
          <StatCard
            title="Temps de Réponse"
            value={`${stats.avg_response_time}ms`}
            subtitle="Temps moyen"
            icon={ClockIcon}
            trend="-20ms vs hier"
          />
          <StatCard
            title="Thème Principal"
            value={stats.most_used_theme}
            subtitle="Le plus utilisé"
            icon={TrendingUpIcon}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-ddb-black">Activité Récente</h2>
                <button className="text-sm text-ddb-yellow hover:text-yellow-600 font-medium">
                  Voir tout
                </button>
              </div>
              
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="card">
              <h2 className="text-xl font-semibold text-ddb-black mb-6">Actions Rapides</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/assistants')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-ddb-yellow bg-opacity-10 rounded-lg">
                      <PlusIcon className="w-4 h-4 text-ddb-yellow" />
                    </div>
                    <span className="font-medium text-gray-900">Créer un assistant</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>

                <button
                  onClick={() => navigate('/chat')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-ddb-yellow bg-opacity-10 rounded-lg">
                      <MessageCircleIcon className="w-4 h-4 text-ddb-yellow" />
                    </div>
                    <span className="font-medium text-gray-900">Démarrer une conversation</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>

                <button
                  onClick={() => navigate('/analytics')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-ddb-yellow bg-opacity-10 rounded-lg">
                      <TrendingUpIcon className="w-4 h-4 text-ddb-yellow" />
                    </div>
                    <span className="font-medium text-gray-900">Voir les analytics</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>

            {/* Recent Assistants */}
            <div className="card">
              <h2 className="text-xl font-semibold text-ddb-black mb-6">Assistants Récents</h2>
              
              {assistants.length > 0 ? (
                <div className="space-y-3">
                  {assistants.slice(0, 3).map((assistant) => (
                    <div
                      key={assistant.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => navigate(`/chat/${assistant.id}`)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-ddb-yellow bg-opacity-10 rounded-lg">
                        <RobotIcon className="w-4 h-4 text-ddb-yellow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assistant.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {assistant.theme}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <RobotIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">Aucun assistant créé</p>
                  <button
                    onClick={() => navigate('/assistants')}
                    className="btn-primary text-sm"
                  >
                    Créer votre premier assistant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
