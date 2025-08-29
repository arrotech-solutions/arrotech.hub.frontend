import {
    AlertTriangle,
    BarChart3,
    Bot,
    Eye,
    GitBranch,
    HardHat,
    Link,
    Shield,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { ACCAmbientAgentStatus, ACCAnalytics } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any>({
    connections: 0,
    workflows: 0,
    agents: 0,
    requests: 0
  });
  const [accStatus, setAccStatus] = useState<ACCAmbientAgentStatus | null>(null);
  const [accAnalytics, setAccAnalytics] = useState<ACCAnalytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch connections count
        const connectionsRes = await apiService.getConnections();
        const connectionsCount = connectionsRes.data.length;

        // Fetch ACC ambient agent status
        try {
          const accStatusRes = await apiService.getACCWebhookStatus();
          if (accStatusRes.success) {
            setAccStatus(accStatusRes.data);
          }
        } catch (accError) {
          console.log('ACC webhook status not available');
        }

        // Fetch ACC analytics
        try {
          const accAnalyticsRes = await apiService.getACCAnalytics('7d');
          if (accAnalyticsRes.success) {
            setAccAnalytics(accAnalyticsRes.data);
          }
        } catch (accError) {
          console.log('ACC analytics not available');
        }

        // Update usage state
        setUsage({
          connections: connectionsCount,
          workflows: 12,
          agents: 5,
          requests: 1247
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Stats data
  const stats = [
    {
      label: 'Active Connections',
      value: usage.connections,
      change: 12,
      icon: Link,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      label: 'Workflows',
      value: usage.workflows,
      change: 8,
      icon: Zap,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      label: 'AI Agents',
      value: usage.agents,
      change: 15,
      icon: Bot,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      label: 'API Requests',
      value: usage.requests.toLocaleString(),
      change: 23,
      icon: BarChart3,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
  ];

  // Quick actions data
  const quickActions = [
    {
      title: 'ACC Ambient Agent',
      description: 'Monitor ACC issues & duplicates',
      icon: HardHat,
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
      onClick: () => navigate('/agents'),
      highlight: accStatus?.is_active
    },
    {
      title: 'Create Workflow',
      description: 'Build automated workflows',
      icon: Zap,
      color: 'bg-gradient-to-r from-blue-500 to-purple-600',
      onClick: () => navigate('/workflows')
    },
    {
      title: 'Add Connection',
      description: 'Connect new services',
      icon: Link,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      onClick: () => navigate('/connections')
    },
    {
      title: 'Browse MCP Tools',
      description: 'Run tools from your connections',
      icon: Zap,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      onClick: () => navigate('/mcp-tools')
    }
  ];

  // Recent activity data (dynamically include ACC activities)
  const recentActivity = [
    ...(accAnalytics?.recent_activity.slice(0, 2).map(activity => ({
      title: activity.description,
      time: new Date(activity.timestamp).toLocaleString(),
      icon: activity.type === 'duplicate_detected' ? GitBranch : 
            activity.type === 'validation_failed' ? AlertTriangle : HardHat,
      color: activity.type === 'duplicate_detected' ? 'bg-yellow-500' : 
             activity.type === 'validation_failed' ? 'bg-red-500' : 'bg-orange-500'
    })) || []),
    {
      title: 'Workflow "Email Automation" executed',
      time: '2 minutes ago',
      icon: Zap,
      color: 'bg-blue-500'
    },
    {
      title: 'New connection added: Slack',
      time: '15 minutes ago',
      icon: Link,
      color: 'bg-green-500'
    },
    {
      title: 'Agent "Customer Support" activated',
      time: '1 hour ago',
      icon: Bot,
      color: 'bg-purple-500'
    }
  ].slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="dashboard-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your Mini-Hub today
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}% from last month
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ACC Ambient Agent Status */}
        {accStatus && (
          <div className="acc-ambient-status bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 shadow-sm border border-orange-200/50 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                  <HardHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">ACC Ambient Agent</h3>
                  <p className="text-gray-600">Real-time ACC issue monitoring & duplicate detection</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                  accStatus.is_active 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${accStatus.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span>{accStatus.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <button
                  onClick={() => navigate('/agents')}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-sm"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Manage
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-orange-200/50">
                <div className="flex items-center space-x-2 mb-2">
                  <HardHat className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Issues Processed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{accStatus.issues_processed}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200/50">
                <div className="flex items-center space-x-2 mb-2">
                  <GitBranch className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Duplicates Found</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{accStatus.duplicates_detected}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200/50">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Incomplete Issues</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{accStatus.incomplete_issues}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200/50">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Webhook Status</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  accStatus.webhook_status === 'registered' 
                    ? 'bg-green-100 text-green-800'
                    : accStatus.webhook_status === 'error'
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {accStatus.webhook_status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200/50 hover:shadow-md hover:border-blue-200 transition-all duration-200 text-left relative ${
                  action.highlight ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                }`}
              >
                {action.highlight && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  {action.highlight && (
                    <p className="text-xs text-green-600 font-medium mt-1">● Currently Active</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="recent-activity bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${activity.color}`}>
                    <activity.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status & Usage */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Usage</span>
                <span className="text-sm font-medium text-gray-900">2.4 GB / 10 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 