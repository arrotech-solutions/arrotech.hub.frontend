import {
    Activity,
    AlertCircle,
    AlertTriangle,
    BarChart3,
    Bot,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Cpu,
    Edit,
    Eye,
    Filter,
    GitBranch,
    Grid,
    HardDrive,
    HardHat,
    List,
    MoreVertical,
    Pause,
    Play,
    Plus,
    Search,
    Settings,
    Shield,
    Trash2,
    Users,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { ACCAmbientAgentStatus, ACCAnalytics, AgentCreate, AgentResponse, AgentStatusResponse, Workflow } from '../types';

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentResponse | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
  const [newAgent, setNewAgent] = useState<AgentCreate>({
    workflow_id: 0,
    agent_config: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    completed: 0
  });

  // ACC Ambient Agent state
  const [accStatus, setAccStatus] = useState<ACCAmbientAgentStatus | null>(null);
  const [accAnalytics, setAccAnalytics] = useState<ACCAnalytics | null>(null);
  const [showACCModal, setShowACCModal] = useState(false);
  const [projectId, setProjectId] = useState<string>('');
  const [callbackUrl, setCallbackUrl] = useState('https://15a2e6bfcc71.ngrok-free.app');

  useEffect(() => {
    loadAgents();
    loadWorkflows();
    loadACCData();
  }, []);

  const loadACCData = async () => {
    try {
      // Load ACC ambient agent status
      const statusRes = await apiService.getACCWebhookStatus();
      if (statusRes.success) {
        setAccStatus(statusRes.data);
      }

      // Load ACC analytics
      const analyticsRes = await apiService.getACCAnalytics('7d');
      if (analyticsRes.success) {
        setAccAnalytics(analyticsRes.data);
      }
    } catch (error) {
      console.log('ACC data not available:', error);
    }
  };

  useEffect(() => {
    // Calculate stats when agents change
    const total = agents.length;
    const active = agents.filter(a => a.status === 'active').length;
    const paused = agents.filter(a => a.status === 'paused').length;
    const completed = agents.filter(a => a.status === 'completed').length;
    
    setStats({ total, active, paused, completed });
  }, [agents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAgents();
      if (response.success) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await apiService.getWorkflows();
      if (response.success) {
        setWorkflows(response.data);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.workflow_id) {
        toast.error('Please select a workflow');
        return;
      }

      const response = await apiService.createAgent(newAgent);
      if (response.success) {
        toast.success('Agent created successfully');
        setShowCreateModal(false);
        setNewAgent({ workflow_id: 0, agent_config: {} });
        loadAgents();
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    }
  };

  const handlePauseAgent = async (agentId: string) => {
    try {
      const response = await apiService.pauseAgent(agentId);
      if (response.success) {
        toast.success('Agent paused successfully');
        loadAgents();
      }
    } catch (error) {
      console.error('Error pausing agent:', error);
      toast.error('Failed to pause agent');
    }
  };

  const handleResumeAgent = async (agentId: string) => {
    try {
      const response = await apiService.resumeAgent(agentId);
      if (response.success) {
        toast.success('Agent resumed successfully');
        loadAgents();
      }
    } catch (error) {
      console.error('Error resuming agent:', error);
      toast.error('Failed to resume agent');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    try {
      await apiService.deleteAgent(agentId);
      toast.success('Agent deleted successfully');
      loadAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleExecuteAgent = async (agentId: string) => {
    try {
      const response = await apiService.executeAgent(agentId);
      if (response.success) {
        toast.success('Agent executed successfully');
        loadAgents();
      }
    } catch (error) {
      console.error('Error executing agent:', error);
      toast.error('Failed to execute agent');
    }
  };

  const loadAgentStatus = async (agentId: string) => {
    try {
      const response = await apiService.getAgentStatus(agentId);
      if (response.success) {
        setAgentStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading agent status:', error);
    }
  };

  // ACC Ambient Agent management
  const handleStartACCAgent = async () => {
    if (!projectId.trim()) {
      toast.error('Please enter a project ID');
      return;
    }

    try {
      const response = await apiService.startACCAmbientAgent(projectId.trim(), callbackUrl);
      if (response.success) {
        toast.success('ACC Ambient Agent started successfully');
        setShowACCModal(false);
        setProjectId(''); // Clear the form
        loadACCData();
      }
    } catch (error) {
      console.error('Error starting ACC agent:', error);
      toast.error('Failed to start ACC ambient agent');
    }
  };

  const handleStopACCAgent = async () => {
    try {
      const response = await apiService.stopACCAmbientAgent();
      if (response.success) {
        toast.success('ACC Ambient Agent stopped successfully');
        loadACCData();
      }
    } catch (error) {
      console.error('Error stopping ACC agent:', error);
      toast.error('Failed to stop ACC ambient agent');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'completed':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceColor = (metric: number, threshold: number = 80) => {
    if (metric >= threshold) return 'text-green-600';
    if (metric >= threshold * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.agent_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.workflow_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderAgentCard = (agent: AgentResponse) => (
    <div key={agent.agent_id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {agent.workflow_name || `Agent ${agent.agent_id}`}
              </h3>
              <p className="text-sm text-gray-500">ID: {agent.agent_id}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(agent.status)}`}>
            {getStatusIcon(agent.status)}
            <span className="capitalize">{agent.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">Agent for workflow: {agent.workflow_name}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>Executions: {agent.performance_metrics?.execution_count || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(agent.created_at).toLocaleDateString()}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Workflow: {agent.workflow_id}</span>
          </span>
        </div>

        {/* Performance Metrics */}
        {agentStatus && agentStatus.agent_id === agent.agent_id && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Metrics:</span>
                <span className="font-medium text-gray-900">
                  {Object.keys(agentStatus.performance_metrics || {}).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900">
                  {agentStatus.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            {agent.status === 'active' ? (
              <button
                onClick={() => handlePauseAgent(agent.agent_id)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 shadow-sm"
              >
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => handleResumeAgent(agent.agent_id)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
              >
                <Play className="w-3 h-3" />
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={() => handleExecuteAgent(agent.agent_id)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
            >
              <Zap className="w-3 h-3" />
              <span>Execute</span>
            </button>
            <button
              onClick={() => {
                setSelectedAgent(agent);
                loadAgentStatus(agent.agent_id);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => {/* Handle edit */}}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteAgent(agent.agent_id)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgentList = (agent: AgentResponse) => (
    <div key={agent.agent_id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-purple-300 group">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {agent.workflow_name || `Agent ${agent.agent_id}`}
                </h3>
                <span className="text-sm text-gray-500">ID: {agent.agent_id}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Agent for workflow: {agent.workflow_name}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{agent.performance_metrics?.execution_count || 0} executions</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Workflow {agent.workflow_id}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(agent.status)}`}>
              {getStatusIcon(agent.status)}
              <span className="capitalize">{agent.status}</span>
            </div>
            <div className="flex space-x-2">
              {agent.status === 'active' ? (
                <button
                  onClick={() => handlePauseAgent(agent.agent_id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 shadow-sm"
                >
                  <Pause className="w-3 h-3" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => handleResumeAgent(agent.agent_id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
                >
                  <Play className="w-3 h-3" />
                  <span>Resume</span>
                </button>
              )}
                              <button
                  onClick={() => handleExecuteAgent(agent.agent_id)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
              >
                <Zap className="w-3 h-3" />
                <span>Execute</span>
              </button>
                              <button
                  onClick={() => {
                    setSelectedAgent(agent);
                    loadAgentStatus(agent.agent_id);
                  }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
                              <button
                  onClick={() => handleDeleteAgent(agent.agent_id)}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="agents-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                  Autonomous Agents
                </h1>
              </div>
              <p className="text-gray-600">Create and manage intelligent autonomous agents</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="create-agent-btn flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create Agent</span>
            </button>
          </div>
        </div>

        {/* ACC Ambient Agent Section */}
        <div className="acc-ambient-section bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 shadow-sm border border-orange-200/50 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">ACC Ambient Agent</h2>
                <p className="text-gray-600">Intelligent monitoring for Autodesk Construction Cloud issues</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {accStatus?.is_active ? (
                <button
                  onClick={handleStopACCAgent}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop Agent</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowACCModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Agent</span>
                </button>
              )}
            </div>
          </div>

          {/* ACC Agent Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-orange-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${accStatus?.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">Agent Status</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {accStatus?.is_active ? 'Active' : 'Inactive'}
              </p>
              <p className="text-xs text-gray-500">
                {accStatus?.project_id ? `Project: ${accStatus.project_id.slice(0, 8)}...` : 'No project selected'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <HardHat className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Issues Monitored</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{accStatus?.issues_processed || 0}</p>
              <p className="text-xs text-gray-500">Total processed</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <GitBranch className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Duplicates</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{accStatus?.duplicates_detected || 0}</p>
              <p className="text-xs text-gray-500">Duplicates detected</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200/50">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Incomplete</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{accStatus?.incomplete_issues || 0}</p>
              <p className="text-xs text-gray-500">Missing information</p>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-orange-200/50">
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Real-time Monitoring</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Webhook-based instant notifications</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Duplicate issue detection using AI</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Information completeness validation</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200/50">
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Slack Integration</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Alerts to #acc-alerts channel</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Notifications to #acc-management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Comprehensive issue details</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="agents-stats grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Pause className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="agents-filters bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="agents-filter-btn flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showFilters && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="error">Error</option>
                </select>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Agents Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading agents...</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Bot className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Create your first autonomous agent to automate complex tasks and workflows.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAgents.map(viewMode === 'grid' ? renderAgentCard : renderAgentList)}
          </div>
        )}

        {/* Create Agent Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Create New Agent</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Workflow</label>
                  <select
                    value={newAgent.workflow_id}
                    onChange={(e) => setNewAgent({ ...newAgent, workflow_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={0}>Select a workflow...</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name} (v{workflow.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Configuration (JSON)</label>
                  <textarea
                    value={JSON.stringify(newAgent.agent_config, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setNewAgent({ ...newAgent, agent_config: parsed });
                      } catch (error) {
                        // Handle invalid JSON
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    rows={6}
                    placeholder="{}"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAgent}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Details Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                                     <div>
                     <h2 className="text-xl font-semibold">{selectedAgent.workflow_name || `Agent ${selectedAgent.agent_id}`}</h2>
                     <p className="text-sm text-gray-600">ID: {selectedAgent.agent_id}</p>
                   </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <span>Agent Details</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Description</span>
                      <p className="text-sm text-gray-900 mt-1">Agent for workflow: {selectedAgent.workflow_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedAgent.status)}`}>
                            {selectedAgent.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Workflow ID</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedAgent.workflow_id}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Created</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(selectedAgent.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Performance Metrics</span>
                  </h3>
                  {agentStatus ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Cpu className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Performance</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {Object.keys(agentStatus.performance_metrics || {}).length} metrics
                          </p>
                        </div>
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <HardDrive className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Status</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {agentStatus.status}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Execution Count</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedAgent.performance_metrics?.execution_count || 0}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No performance data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACC Start Agent Modal */}
        {showACCModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Start ACC Ambient Agent</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ACC Project ID</label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                    placeholder="a9d0e667-0611-44ea-ab8e-82b4884a8223"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the ACC project ID to monitor for new issues
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Callback URL</label>
                  <input
                    type="text"
                    value={callbackUrl}
                    onChange={(e) => setCallbackUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                    placeholder="https://your-webhook-url.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL where ACC will send webhook notifications
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">What will the agent do?</h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>• Monitor for new issues in real-time</li>
                    <li>• Detect duplicate issues using AI analysis</li>
                    <li>• Validate issue completeness and quality</li>
                    <li>• Send alerts to Slack channels automatically</li>
                    <li>• Route notifications based on issue status</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowACCModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartACCAgent}
                  disabled={!projectId.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents; 