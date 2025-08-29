import {
    Activity,
    AlertCircle,
    BarChart3,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    Filter,
    Grid,
    List,
    MoreVertical,
    Pause,
    Play,
    Plus,
    Search,
    Settings,
    Trash2,
    Workflow,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { WorkflowCreateRequest, WorkflowExecuteRequest, WorkflowTemplate, Workflow as WorkflowType } from '../types';

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [executingWorkflow, setExecutingWorkflow] = useState<WorkflowType | null>(null);
  const [newWorkflow, setNewWorkflow] = useState<WorkflowCreateRequest>({
    description: '',
    name: ''
  });
  const [executeData, setExecuteData] = useState<WorkflowExecuteRequest>({
    workflow_id: 0,
    input_data: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    completed: 0
  });

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, []);

  useEffect(() => {
    // Calculate stats when workflows change
    const total = workflows.length;
    const active = workflows.filter(w => w.status === 'active').length;
    const draft = workflows.filter(w => w.status === 'draft').length;
    const completed = workflows.filter(w => w.status === 'completed').length;
    
    setStats({ total, active, draft, completed });
  }, [workflows]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWorkflows();
      if (response.success) {
        setWorkflows(response.data);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.getWorkflowTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      if (!newWorkflow.name?.trim()) {
        toast.error('Please provide a workflow name');
        return;
      }
      if (!newWorkflow.description?.trim()) {
        toast.error('Please provide a workflow description');
        return;
      }

      const response = await apiService.createWorkflow(newWorkflow);
      if (response.success) {
        toast.success('Workflow created successfully');
        setShowCreateModal(false);
        setNewWorkflow({ description: '', name: '' });
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    }
  };

  const handleExecuteWorkflow = async () => {
    try {
      if (!executingWorkflow) return;
      
      const response = await apiService.executeWorkflow(executingWorkflow.id, executeData);
      if (response.success) {
        toast.success('Workflow executed successfully');
        setShowExecuteModal(false);
        setExecuteData({ workflow_id: 0, input_data: {} });
        setExecutingWorkflow(null);
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await apiService.deleteWorkflow(workflowId);
      toast.success('Workflow deleted successfully');
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'paused':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'completed':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'draft':
        return 'bg-yellow-50 border-yellow-200';
      case 'paused':
        return 'bg-orange-50 border-orange-200';
      case 'completed':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderWorkflowCard = (workflow: WorkflowType) => (
    <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {workflow.name}
              </h3>
              <p className="text-sm text-gray-500">Version {workflow.version}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(workflow.status)}`}>
            {getStatusIcon(workflow.status)}
            <span className="capitalize">{workflow.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workflow.description}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>{workflow.steps?.length || 0} steps</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>{workflow.trigger_type}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setExecutingWorkflow(workflow);
                setExecuteData({ workflow_id: workflow.id, input_data: {} });
                setShowExecuteModal(true);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
            >
              <Play className="w-3 h-3" />
              <span>Execute</span>
            </button>
            <button
              onClick={() => setSelectedWorkflow(workflow)}
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
              onClick={() => handleDeleteWorkflow(workflow.id)}
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

  const renderWorkflowList = (workflow: WorkflowType) => (
    <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {workflow.name}
                </h3>
                <span className="text-sm text-gray-500">v{workflow.version}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{workflow.steps?.length || 0} steps</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>{workflow.trigger_type}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(workflow.status)}`}>
              {getStatusIcon(workflow.status)}
              <span className="capitalize">{workflow.status}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setExecutingWorkflow(workflow);
                  setExecuteData({ workflow_id: workflow.id, input_data: {} });
                  setShowExecuteModal(true);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
              >
                <Play className="w-3 h-3" />
                <span>Execute</span>
              </button>
              <button
                onClick={() => setSelectedWorkflow(workflow)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              <button
                onClick={() => handleDeleteWorkflow(workflow.id)}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="workflows-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Workflows
              </h1>
              <p className="text-gray-600">
                Create and manage automated workflows
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="workflow-builder flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Workflow className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Edit className="w-6 h-6 text-yellow-600" />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showFilters && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Workflows Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading workflows...</p>
            </div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Workflow className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Create your first workflow to automate your business processes and save time.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredWorkflows.map(viewMode === 'grid' ? renderWorkflowCard : renderWorkflowList)}
          </div>
        )}

        {/* Create Workflow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Create New Workflow</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
                  <input
                    type="text"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe what this workflow should do..."
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
                  onClick={handleCreateWorkflow}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Execute Workflow Modal */}
        {showExecuteModal && executingWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Execute Workflow</h2>
                  <p className="text-sm text-gray-600">"{executingWorkflow.name}"</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input Data (JSON)</label>
                  <textarea
                    value={JSON.stringify(executeData.input_data, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setExecuteData({ ...executeData, input_data: parsed });
                      } catch (error) {
                        // Handle invalid JSON
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    rows={6}
                    placeholder="{}"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExecuteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteWorkflow}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                >
                  Execute Workflow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Details Modal */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Workflow className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedWorkflow.name}</h2>
                    <p className="text-sm text-gray-600">Version {selectedWorkflow.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>Workflow Details</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Description</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedWorkflow.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedWorkflow.status)}`}>
                            {selectedWorkflow.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Trigger Type</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedWorkflow.trigger_type}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Created</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(selectedWorkflow.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Workflow Steps</span>
                  </h3>
                  <div className="space-y-3">
                    {selectedWorkflow.steps?.map((step: any, index: number) => (
                      <div key={step.id} className={`bg-white border rounded-lg p-4 ${getStatusBgColor(step.status || 'draft')}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{step.step_number}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{step.tool_name}</p>
                              <p className="text-xs text-gray-600">{step.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No steps defined</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflows; 