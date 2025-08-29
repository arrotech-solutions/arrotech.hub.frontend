import {
    Activity,
    AlertCircle,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    Database,
    Edit,
    FileText,
    Globe,
    Grid,
    List,
    MessageCircle,
    MoreVertical,
    Pause,
    Plus,
    RefreshCw,
    Search,
    Settings,
    TestTube,
    Trash2,
    Users,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Connection, ConnectionCreate, ConnectionPlatform, PlatformCapability } from '../types';

const Connections: React.FC = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platforms, setPlatforms] = useState<ConnectionPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<ConnectionPlatform | null>(null);
  const [formData, setFormData] = useState<ConnectionCreate>({
    platform: '',
    name: '',
    config: {}
  });
  const [jsonErrors, setJsonErrors] = useState<{[key: string]: string}>({});
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [syncingConnection, setSyncingConnection] = useState<number | null>(null);
  const [oauthInProgress, setOauthInProgress] = useState<number | null>(null);
  const [showPlatformDetails, setShowPlatformDetails] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0
  });

  useEffect(() => {
    fetchConnections();
    fetchPlatforms();
  }, []);

  useEffect(() => {
    // Calculate stats when connections change
    const total = connections.length;
    const active = connections.filter(c => c.status === 'active').length;
    const inactive = connections.filter(c => c.status === 'inactive').length;
    const error = connections.filter(c => c.status === 'error').length;

    setStats({ total, active, inactive, error });
  }, [connections]);

  // Stats data for display
  const statsData = [
    {
      label: 'Total Connections',
      value: stats.total,
      change: 12,
      icon: Globe,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      label: 'Active',
      value: stats.active,
      change: 8,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      change: -5,
      icon: Pause,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    {
      label: 'Errors',
      value: stats.error,
      change: -2,
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-red-500 to-red-600'
    }
  ];

  const fetchConnections = async () => {
    try {
      const response = await apiService.getConnections();
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await apiService.getAvailablePlatforms();
      console.log('[DEBUG] Raw platform response:', response);
      
      // The API service already handles the data extraction
      const platformsData = response.data || [];
      console.log('[DEBUG] Extracted platforms data:', platformsData);
      console.log('[DEBUG] Loaded platforms:', platformsData.map(p => p.id));
      
      // Check if ACC platform is loaded
      const accPlatform = platformsData.find(p => p.id === 'acc');
      if (accPlatform) {
        console.log('[DEBUG] ACC platform loaded successfully:');
        console.log('[DEBUG] ACC config schema:', JSON.stringify(accPlatform.config_schema, null, 2));
      } else {
        console.warn('[DEBUG] ACC platform NOT found in available platforms!');
        console.log('[DEBUG] Available platform IDs:', platformsData.map(p => p.id));
      }
      
      setPlatforms(platformsData);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast.error('Failed to load available platforms');
      setPlatforms([]); // Set empty array to prevent undefined errors
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    // Skip JSON validation for ACC platform (uses hardcoded form)
    if (formData.platform !== 'acc') {
      // Check if there are any JSON errors
      const hasJsonErrors = Object.values(jsonErrors).some(error => error !== '');
      if (hasJsonErrors) {
        toast.error('Please fix JSON formatting errors before creating the connection');
        return;
      }
    }

    console.log('[DEBUG] Frontend sending connection data:');
    console.log('[DEBUG] Platform:', formData.platform);
    console.log('[DEBUG] Name:', formData.name);
    console.log('[DEBUG] Config keys:', Object.keys(formData.config));
    console.log('[DEBUG] Full config:', JSON.stringify(formData.config, null, 2));
    console.log('[DEBUG] Full payload:', JSON.stringify(formData, null, 2));
    
    // Special validation for ACC platform
    if (formData.platform === 'acc') {
      console.log('[DEBUG] ACC VALIDATION:');
      console.log('[DEBUG] - transport:', formData.config?.transport);
      console.log('[DEBUG] - command:', formData.config?.command);
      console.log('[DEBUG] - cwd:', formData.config?.cwd);
      console.log('[DEBUG] - env object:', formData.config?.env);
      console.log('[DEBUG] - APS_CLIENT_ID:', formData.config?.env?.APS_CLIENT_ID);
      console.log('[DEBUG] - APS_CLIENT_SECRET:', formData.config?.env?.APS_CLIENT_SECRET ? '[HIDDEN]' : 'MISSING');
      console.log('[DEBUG] - timeoutMs:', formData.config?.timeoutMs);
      console.log('[DEBUG] - maxRetries:', formData.config?.maxRetries);
      
      // Check if required fields are present
      const requiredFields = ['transport', 'command', 'cwd', 'env'];
      const missing = requiredFields.filter(field => !formData.config[field]);
      if (missing.length > 0) {
        console.error('[DEBUG] Missing required fields:', missing);
      } else {
        console.log('[DEBUG] ✅ All required top-level fields present');
      }
    }

    try {
      await apiService.createConnection(formData);
      toast.success('Connection created successfully');
      setShowCreateModal(false);
      setFormData({ platform: '', name: '', config: {} });
      setJsonErrors({});
      fetchConnections();
    } catch (error: any) {
      console.error('Error creating connection:', error);
      console.error('Error details:', error?.response?.data);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      toast.error(`Failed to create connection: ${errorMessage}`);
    }
  };

  const handleDeleteConnection = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        await apiService.deleteConnection(id);
        toast.success('Connection deleted successfully');
        fetchConnections();
      } catch (error) {
        console.error('Error deleting connection:', error);
        toast.error('Failed to delete connection');
      }
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      setTestingConnection(id);
      
      // Get connection details to check if it's ACC
      const connection = connections.find(conn => conn.id === id);
      const isACCConnection = connection?.platform === 'acc';
      
      const response = await apiService.testConnection(id);
      console.log('[DEBUG] Test connection response:', response);
      
      // Handle ACC OAuth flow - cast to any to handle dynamic response structure
      const responseData = response.data as any;
      if (isACCConnection && responseData?.test_result?.oauth_url) {
        const testResult = responseData.test_result;
        const oauthUrl = testResult.oauth_url;
        const redirectUri = testResult.redirect_uri;
        const nextSteps = testResult.next_steps || [];
        
        console.log('[DEBUG] ACC OAuth Response:', testResult);
        console.log('[DEBUG] Opening OAuth URL:', oauthUrl);
        console.log('[DEBUG] Redirect URI:', redirectUri);
        console.log('[DEBUG] Next Steps:', nextSteps);
        
        setOauthInProgress(id);
        
        try {
          // Open OAuth URL in new window/tab
          const oauthWindow = window.open(oauthUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
          
          if (oauthWindow) {
            // Show success message with next steps
            toast.success(
              `🔐 ${testResult.message || 'OAuth authentication opened in new window'}\n\nNext Steps:\n${nextSteps.slice(0,2).join('\n')}`,
              { duration: 8000 }
            );
            
            // Monitor OAuth window
            const checkClosed = setInterval(() => {
              if (oauthWindow.closed) {
                clearInterval(checkClosed);
                setOauthInProgress(null);
                
                // Check if authentication was completed (could poll backend status here)
                toast('🔒 OAuth window closed. If authentication completed, your connection should now be active.');
                
                // Optionally refresh connections to update status
                setTimeout(() => {
                  fetchConnections();
                }, 2000);
              }
            }, 1000);
            
            // Auto-clear OAuth state after 10 minutes (increased timeout)
            setTimeout(() => {
              clearInterval(checkClosed);
              if (oauthInProgress === id) {
                setOauthInProgress(null);
                toast('⏰ OAuth session timed out. Please try testing the connection again if needed.');
              }
            }, 600000); // 10 minutes
            
          } else {
            throw new Error('Popup blocked');
          }
        } catch (error) {
          console.error('Failed to open OAuth URL:', error);
          setOauthInProgress(null);
          
          // Enhanced fallback with next steps
          navigator.clipboard.writeText(oauthUrl).then(() => {
            toast.success(
              `📋 OAuth URL copied to clipboard!\n\nNext Steps:\n1. Open the copied URL in your browser\n2. Complete Autodesk authentication\n3. Grant permissions when prompted`,
              { duration: 10000 }
            );
          }).catch(() => {
            toast.error(
              `🔗 Please manually open this URL:\n${oauthUrl}\n\nThen complete the authentication process.`,
              { duration: 15000 }
            );
          });
        }
        return;
      }
      
      // Standard connection test handling
      if (response.data.status === 'active' || responseData?.test_result?.success) {
        toast.success('Connection test successful');
      } else {
        const errorMsg = responseData?.test_result?.error || response.data?.message || 'Connection test failed';
        toast.error(`Connection test failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      toast.error(`Failed to test connection: ${errorMessage}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const clearOauthState = (connectionId: number) => {
    setOauthInProgress(prev => prev === connectionId ? null : prev);
    toast('OAuth state cleared');
  };

  const handleSyncConnection = async (id: number) => {
    try {
      setSyncingConnection(id);
      // Use updateConnection to mark as syncing, then refresh
      await apiService.updateConnection(id, { status: 'syncing' });
      toast.success('Connection sync initiated');
      fetchConnections();
    } catch (error) {
      console.error('Error syncing connection:', error);
      toast.error('Failed to sync connection');
    } finally {
      setSyncingConnection(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'pending':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      hubspot: <Globe className="w-5 h-5" />,
      ga4: <BarChart3 className="w-5 h-5" />,
      slack: <MessageCircle className="w-5 h-5" />,
      mcp_remote: <Settings className="w-5 h-5" />,
      whatsapp: <MessageCircle className="w-5 h-5" />,
      facebook: <Users className="w-5 h-5" />,
      twitter: <MessageCircle className="w-5 h-5" />,
      linkedin: <Users className="w-5 h-5" />,
      instagram: <Users className="w-5 h-5" />,
      powerbi: <BarChart3 className="w-5 h-5" />,
      asana: <FileText className="w-5 h-5" />,
      zoom: <MessageCircle className="w-5 h-5" />,
      teams: <Users className="w-5 h-5" />,
      salesforce: <Database className="w-5 h-5" />,
      default: <Settings className="w-5 h-5" />
    };
    return iconMap[platformId] || iconMap.default;
  };

  const getPlatformColor = (platformId: string) => {
    const colorMap: { [key: string]: string } = {
      hubspot: 'bg-orange-100 text-orange-800',
      ga4: 'bg-blue-100 text-blue-800',
      slack: 'bg-purple-100 text-purple-800',
      mcp_remote: 'bg-gray-100 text-gray-800',
      whatsapp: 'bg-green-100 text-green-800',
      facebook: 'bg-blue-100 text-blue-800',
      twitter: 'bg-blue-100 text-blue-800',
      linkedin: 'bg-blue-100 text-blue-800',
      instagram: 'bg-pink-100 text-pink-800',
      powerbi: 'bg-yellow-100 text-yellow-800',
      asana: 'bg-orange-100 text-orange-800',
      zoom: 'bg-blue-100 text-blue-800',
      teams: 'bg-purple-100 text-purple-800',
      salesforce: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colorMap[platformId] || colorMap.default;
  };

  const renderPlatformCapabilities = (capabilities: PlatformCapability[]) => {
    return (
      <div className="space-y-2">
        {capabilities.map((capability, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <Zap className="w-3 h-3 text-blue-600" />
            <span className="font-medium">{capability.name}:</span>
            <span className="text-gray-600">{capability.description}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderConfigFields = (platform: ConnectionPlatform) => {
    // Special hardcoded form for ACC platform
    if (platform.id === 'acc') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Name
            </label>
            <input
              type="text"
              placeholder="Enter a name for this connection"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transport <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.config?.transport || 'stdio'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, transport: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Command <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.config?.command || '/app/acc-mcp-published/ACC-MCP'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, command: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Directory <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.config?.cwd || '/app'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, cwd: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={formData.config?.timeoutMs || 30000}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, timeoutMs: parseInt(e.target.value) || 30000 }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                value={formData.config?.maxRetries || 3}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, maxRetries: parseInt(e.target.value) || 3 }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment Variables <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">APS Client ID</label>
                <input
                  type="text"
                  placeholder="Your Autodesk APS Client ID"
                  value={formData.config?.env?.APS_CLIENT_ID || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { 
                      ...formData.config, 
                      env: { 
                        ...formData.config?.env, 
                        APS_CLIENT_ID: e.target.value 
                      }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">APS Client Secret</label>
                <input
                  type="password"
                  placeholder="Your Autodesk APS Client Secret"
                  value={formData.config?.env?.APS_CLIENT_SECRET || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { 
                      ...formData.config, 
                      env: { 
                        ...formData.config?.env, 
                        APS_CLIENT_SECRET: e.target.value 
                      }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">APS Redirect URI</label>
                <input
                  type="text"
                  value={formData.config?.env?.APS_REDIRECT_URI || 'https://arrotech-hub.onrender.com/api/aps/callback/oauth'}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { 
                      ...formData.config, 
                      env: { 
                        ...formData.config?.env, 
                        APS_REDIRECT_URI: e.target.value 
                      }
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-green-600 mt-1">✅ Correct URI for backend OAuth callback (port 8000)</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Original dynamic form for other platforms
    const configSchema = platform.config_schema?.properties || {};
    
    // Debug ACC platform specifically
    if (platform.id === 'acc') {
      console.log('[DEBUG] Rendering ACC config fields:');
      console.log('[DEBUG] Config schema properties:', Object.keys(configSchema));
      console.log('[DEBUG] Platform required fields:', platform.config_schema?.required);
      console.log('[DEBUG] Current formData.config:', formData.config);
    }

    const renderField = (name: string, schema: any) => {
      const fieldType = schema.type || 'text';
      const isRequired = platform.config_schema?.required?.includes(name) || false;
      const colSpanClass = (fieldType === 'object' || name.toLowerCase().includes('headers')) ? 'md:col-span-2' : '';

      // Debug field rendering for ACC
      if (platform.id === 'acc') {
        console.log(`[DEBUG] Rendering field "${name}" of type "${fieldType}", required: ${isRequired}`);
        console.log(`[DEBUG] Field schema:`, schema);
        console.log(`[DEBUG] Current field value:`, formData.config[name]);
      }

      // Transport-aware rendering for mcp_remote
      const isMcpRemote = platform.id === 'mcp_remote';
      const transport = isMcpRemote ? (formData.config['transport'] || platform.config_schema?.properties?.transport?.default || 'http') : undefined;

      switch (fieldType) {
        case 'string':
          if (schema.enum && Array.isArray(schema.enum)) {
            return (
              <div key={name} className={`space-y-2 ${colSpanClass}`}>
                <label className="block text-sm font-medium text-gray-700">
                  {schema.title || name}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={formData.config[name] ?? (schema.default ?? '')}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, [name]: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select {schema.title || name}</option>
                  {schema.enum.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {schema.description && (
                  <p className="text-xs text-gray-500">{schema.description}</p>
                )}
              </div>
            );
          }
          if (schema.format === 'password') {
            return (
              <div key={name} className={`space-y-2 ${colSpanClass}`}>
                <label className="block text-sm font-medium text-gray-700">
                  {schema.title || name}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="password"
                  placeholder={schema.description || `Enter ${schema.title || name}`}
                  value={formData.config[name] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, [name]: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {schema.description && (
                  <p className="text-xs text-gray-500">{schema.description}</p>
                )}
              </div>
            );
          }
          return (
            <div key={name} className={`space-y-2 ${colSpanClass}`}>
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                placeholder={schema.description || `Enter ${schema.title || name}`}
                value={formData.config[name] || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (platform.id === 'acc') {
                    console.log(`[DEBUG] Updating field "${name}" with value:`, newValue);
                  }
                  setFormData({
                    ...formData,
                    config: { ...formData.config, [name]: newValue }
                  });
                  if (platform.id === 'acc') {
                    console.log(`[DEBUG] New formData.config after update:`, { ...formData.config, [name]: newValue });
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );

        case 'number':
        case 'integer':
          return (
            <div key={name} className={`space-y-2 ${colSpanClass}`}>
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="number"
                placeholder={schema.description || `Enter ${schema.title || name}`}
                value={formData.config[name] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [name]: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );

        case 'boolean':
          return (
            <div key={name} className={`flex items-center space-x-3 ${colSpanClass}`}>
              <input
                type="checkbox"
                id={name}
                checked={formData.config[name] || false}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [name]: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={name} className="text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {schema.description && (
                <p className="text-xs text-gray-500 ml-7">{schema.description}</p>
              )}
            </div>
          );

        case 'object':
          // For mcp_remote, give quick hints for known object fields
          const isACC = platform.id === 'acc';
          const jsonError = jsonErrors[name] || '';
          
          return (
            <div key={name} className={`space-y-2 ${colSpanClass}`}>
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                placeholder={schema.description || `Enter ${schema.title || name} as JSON`}
                value={formData.config[name] ? JSON.stringify(formData.config[name], null, 2) : ''}
                onChange={(e) => {
                  const value = e.target.value || '{}';
                  try {
                    const parsed = JSON.parse(value);
                    setFormData({ ...formData, config: { ...formData.config, [name]: parsed } });
                    // Clear error on successful parse
                    setJsonErrors({ ...jsonErrors, [name]: '' });
                  } catch (error) {
                    // Show error but don't update formData with invalid JSON
                    setJsonErrors({ ...jsonErrors, [name]: 'Invalid JSON format' });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y min-h-[100px] max-h-[300px] overflow-auto whitespace-pre-wrap ${
                  jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={6}
              />
              {jsonError && (
                <p className="text-xs text-red-600">{jsonError}</p>
              )}
              {isMcpRemote && name === 'headers' && (
                <p className="text-xs text-gray-500">Example: {`{"Authorization": "Bearer YOUR_TOKEN"}`}</p>
              )}
              {isMcpRemote && name === 'env' && (
                <p className="text-xs text-gray-500">Example: {`{"NODE_ENV": "production"}`}</p>
              )}
              {isACC && name === 'env' && (
                <p className="text-xs text-gray-500">Example: {`{
  "APS_CLIENT_ID": "your_client_id_here",
  "APS_CLIENT_SECRET": "your_client_secret_here", 
  "APS_REDIRECT_URI": "https://arrotech-hub.onrender.com/api/aps/callback/oauth"
}`}</p>
              )}
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );

        default:
          return (
            <div key={name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                placeholder={schema.description || `Enter ${schema.title || name}`}
                value={formData.config[name] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [name]: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Name
          </label>
          <input
            type="text"
            placeholder="Enter a name for this connection"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Transport-aware field grouping for mcp_remote */}
        {platform.id === 'mcp_remote' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('transport', configSchema['transport'])}
              {renderField('namespace', configSchema['namespace'])}
              {/* HTTP/WS fields */}
              {(formData.config['transport'] ?? 'http') !== 'stdio' && (
                <>
                  {renderField('url', configSchema['url'])}
                  {renderField('apiKey', configSchema['apiKey'])}
                  {renderField('headers', configSchema['headers'])}
                  {renderField('timeoutMs', configSchema['timeoutMs'])}
                  {renderField('maxRetries', configSchema['maxRetries'])}
                </>
              )}
              {/* STDIO fields */}
              {(formData.config['transport'] ?? 'http') === 'stdio' && (
                <>
                  {renderField('command', configSchema['command'])}
                  {renderField('cwd', configSchema['cwd'])}
                  {renderField('env', configSchema['env'])}
                </>
              )}
            </div>
          </>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
            {Object.entries(configSchema).map(([name, schema]) => renderField(name, schema))}
          </div>
        )}
      </div>
    );
  };

  const openCreateModal = (platform: ConnectionPlatform) => {
    setSelectedPlatform(platform);
    
    // Special handling for ACC platform to ensure correct structure
    if (platform.id === 'acc') {
      setFormData({ 
        platform: 'acc', 
        name: '', 
        config: {
          transport: 'stdio',
          command: '/app/acc-mcp-published/ACC-MCP',
          cwd: '/app',
          env: {
            APS_CLIENT_ID: '',
            APS_CLIENT_SECRET: '',
            APS_REDIRECT_URI: 'https://arrotech-hub.onrender.com/api/aps/callback/oauth'
          },
          timeoutMs: 30000,
          maxRetries: 3
        }
      });
    } else {
      setFormData({ platform: platform.id, name: '', config: {} });
    }
    
    setJsonErrors({}); // Clear any previous JSON errors
    setShowCreateModal(true);
  };

  const getFilteredConnections = () => {
    return connections.filter(connection => {
      const matchesStatus = filterStatus === 'all' || connection.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.platform.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };

  const filteredConnections = getFilteredConnections();

  const renderConnectionCard = (connection: Connection) => (
    <div key={connection.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              {getPlatformIcon(connection.platform)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {connection.name}
              </h3>
              <p className="text-sm text-gray-500">Platform: {connection.platform}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(connection.status)}`}>
            {getStatusIcon(connection.status)}
            <span className="capitalize">{connection.status}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>Last sync: {connection.last_sync ? new Date(connection.last_sync).toLocaleDateString() : 'Never'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Created: {new Date(connection.created_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

        {/* Error Message */}
        {connection.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{connection.error_message}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => handleTestConnection(connection.id)}
              disabled={testingConnection === connection.id || oauthInProgress === connection.id}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 shadow-sm ${
                oauthInProgress === connection.id 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {testingConnection === connection.id ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Testing...</span>
                </>
              ) : oauthInProgress === connection.id ? (
                <>
                  <div className="animate-pulse">🔐</div>
                  <span>OAuth...</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearOauthState(connection.id);
                    }}
                    className="ml-1 text-white hover:text-red-200 transition-colors"
                    title="Clear OAuth state"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <TestTube className="w-3 h-3" />
                  <span>Test</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleSyncConnection(connection.id)}
              disabled={syncingConnection === connection.id}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {syncingConnection === connection.id ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync</span>
                </>
              )}
            </button>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => {/* Handle edit */ }}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteConnection(connection.id)}
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

  const renderConnectionList = (connection: Connection) => (
    <div key={connection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              {getPlatformIcon(connection.platform)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {connection.name}
                </h3>
                <span className="text-sm text-gray-500">Platform: {connection.platform}</span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>Last sync: {connection.last_sync ? new Date(connection.last_sync).toLocaleDateString() : 'Never'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Created: {new Date(connection.created_at).toLocaleDateString()}</span>
                </span>
              </div>
              {connection.error_message && (
                <div className="flex items-center space-x-2 mt-2">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600">{connection.error_message}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(connection.status)}`}>
              {getStatusIcon(connection.status)}
              <span className="capitalize">{connection.status}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleTestConnection(connection.id)}
                disabled={testingConnection === connection.id || oauthInProgress === connection.id}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 shadow-sm ${
                  oauthInProgress === connection.id 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {testingConnection === connection.id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </>
                ) : oauthInProgress === connection.id ? (
                  <>
                    <div className="animate-pulse">🔐</div>
                    <span>OAuth...</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearOauthState(connection.id);
                      }}
                      className="ml-1 text-white hover:text-red-200 transition-colors"
                      title="Clear OAuth state"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <TestTube className="w-3 h-3" />
                    <span>Test</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleSyncConnection(connection.id)}
                disabled={syncingConnection === connection.id}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {syncingConnection === connection.id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDeleteConnection(connection.id)}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading connections...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="connections-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Connections
              </h1>
              <p className="text-gray-600">
                Manage your third-party service integrations
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="add-connection-btn flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Add Connection</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50"
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

        {/* Filters and Search */}
        <div className="connection-filters mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {filteredConnections.length > 0 ? (
          <div className={`connection-cards ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {filteredConnections.map(viewMode === 'grid' ? renderConnectionCard : renderConnectionList)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Globe className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No connections found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Connect your marketing tools to start using AI-powered automation.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Available Platforms */}
      <div>
        <h2 className="available-platforms-title text-xl font-semibold text-gray-900 mb-6">Available Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div key={platform.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      {getPlatformIcon(platform.id)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{platform.name}</h3>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(platform.id)}`}>
                    {platform.id}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {platform.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {platform.capabilities && platform.capabilities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Capabilities:</h4>
                    {renderPlatformCapabilities(platform.capabilities)}
                  </div>
                )}

                <button
                  onClick={() => openCreateModal(platform)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Connect {platform.name}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Connection Modal */}
      {showCreateModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 sm:p-6 z-50 overflow-y-auto">
          <div className={`bg-white rounded-xl max-w-md w-full mx-4 my-8 max-h-[85vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Connect {selectedPlatform.name}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setJsonErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">{selectedPlatform.description}</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {renderConfigFields(selectedPlatform)}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateConnection}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Create Connection
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setJsonErrors({});
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections; 