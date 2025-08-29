import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  page: string; // Which page this step belongs to
  order: number;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  isCompleted: boolean;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Tutorial steps configuration
const tutorialSteps: TutorialStep[] = [
  // Dashboard steps
  {
    id: 'welcome',
    title: 'Welcome to Mini-Hub!',
    description: 'Let\'s take a quick tour of your dashboard to get you started.',
    target: '.dashboard-header',
    position: 'bottom',
    page: 'dashboard',
    order: 1
  },
  {
    id: 'stats-overview',
    title: 'Quick Stats',
    description: 'Here you can see your key metrics at a glance - connections, workflows, and usage.',
    target: '.stats-overview',
    position: 'bottom',
    page: 'dashboard',
    order: 2
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Access your most common tasks quickly - create workflows, manage connections, and more.',
    target: '.quick-actions',
    position: 'top',
    page: 'dashboard',
    order: 3
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    description: 'Stay updated with your latest workflow executions and system activities.',
    target: '.recent-activity',
    position: 'left',
    page: 'dashboard',
    order: 4
  },
  
  // Chat page steps
  {
    id: 'chat-intro',
    title: 'AI Chat Interface',
    description: 'Welcome to your AI chat interface! This is where you can have conversations with AI agents and interact with your connected tools and services.',
    target: '.chat-header',
    position: 'bottom',
    page: 'chat',
    order: 5
  },
  {
    id: 'chat-sidebar',
    title: 'Conversation Sidebar',
    description: 'Your conversations are organized here by time periods. Click on any conversation to continue where you left off.',
    target: '.flex-1.overflow-y-auto',
    position: 'right',
    page: 'chat',
    order: 6
  },
  {
    id: 'chat-provider',
    title: 'AI Provider Selection',
    description: 'Choose which AI provider to use for your conversations. The green dot indicates the provider is ready.',
    target: 'select[value]',
    position: 'bottom',
    page: 'chat',
    order: 7
  },
  {
    id: 'chat-new-conversation',
    title: 'Start New Conversation',
    description: 'Click here to start a fresh conversation with the AI. Your previous conversations will be saved.',
    target: 'button[onClick*="setShowNewConversationModal"]',
    position: 'top',
    page: 'chat',
    order: 8
  },
  {
    id: 'chat-input',
    title: 'Message Input',
    description: 'Type your questions, commands, or requests here. You can also use voice input for hands-free interaction.',
    target: '.chat-input',
    position: 'top',
    page: 'chat',
    order: 9
  },
  {
    id: 'chat-voice',
    title: 'Voice Input',
    description: 'Click the microphone to use voice-to-text for hands-free interaction with the AI.',
    target: '.voice-input-btn',
    position: 'left',
    page: 'chat',
    order: 10
  },
  {
    id: 'chat-send',
    title: 'Send Message',
    description: 'Click here or press Enter to send your message to the AI.',
    target: 'button[onClick*="sendMessage"]',
    position: 'right',
    page: 'chat',
    order: 11
  },
  {
    id: 'chat-navigation',
    title: 'Navigation',
    description: 'Click the chat icon to return to the dashboard, or use the collapse button to adjust the sidebar width.',
    target: 'button[onClick*="handleBackToDashboard"]',
    position: 'bottom',
    page: 'chat',
    order: 12
  },
  
  // Workflows page steps
  {
    id: 'workflows-intro',
    title: 'Workflows Management',
    description: 'Create and manage automated workflows that connect your tools and services.',
    target: '.workflows-header',
    position: 'bottom',
    page: 'workflows',
    order: 13
  },
  {
    id: 'workflow-builder',
    title: 'Create New Workflow',
    description: 'Click here to create a new automated workflow with a visual builder.',
    target: '.workflow-builder',
    position: 'bottom',
    page: 'workflows',
    order: 14
  },
  {
    id: 'workflow-stats',
    title: 'Workflow Statistics',
    description: 'View your workflow performance metrics - total, active, draft, and completed workflows.',
    target: '.grid.grid-cols-1.md\\:grid-cols-4.gap-4.mb-8',
    position: 'bottom',
    page: 'workflows',
    order: 15
  },
  {
    id: 'workflow-search',
    title: 'Search Workflows',
    description: 'Use the search bar to quickly find specific workflows by name or description.',
    target: 'input[placeholder="Search workflows..."]',
    position: 'bottom',
    page: 'workflows',
    order: 16
  },
  {
    id: 'workflow-filters',
    title: 'Filter Workflows',
    description: 'Use filters to view workflows by status - active, draft, paused, or completed.',
    target: 'button.flex.items-center.space-x-2.px-4.py-2\\.5.border.border-gray-300.rounded-lg.hover\\:bg-gray-50.transition-colors',
    position: 'bottom',
    page: 'workflows',
    order: 17
  },

  
  // Connections page steps
  {
    id: 'connections-intro',
    title: 'Manage Your Connections',
    description: 'Connect and manage your third-party services and tools here.',
    target: '.connections-header',
    position: 'bottom',
    page: 'connections',
    order: 18
  },
  {
    id: 'connection-stats',
    title: 'Connection Statistics',
    description: 'View your connection metrics - total, active, inactive, and error status.',
    target: '.stats-overview',
    position: 'bottom',
    page: 'connections',
    order: 19
  },
  {
    id: 'add-connection',
    title: 'Add New Connection',
    description: 'Click the "Add Connection" button in the header to open the connection creation modal.',
    target: '.add-connection-btn',
    position: 'top',
    page: 'connections',
    order: 20
  },
  {
    id: 'connection-filters',
    title: 'Filter & Search',
    description: 'Use filters and search to quickly find specific connections.',
    target: '.connection-filters',
    position: 'bottom',
    page: 'connections',
    order: 21
  },
  {
    id: 'available-platforms',
    title: 'Available Platforms',
    description: 'Browse and connect to supported third-party services and tools.',
    target: '.available-platforms-title',
    position: 'bottom',
    page: 'connections',
    order: 22
  },
  {
    id: 'platform-connect-buttons',
    title: 'Connect Specific Platforms',
    description: 'Click "Connect [Platform]" buttons to set up connections for specific services.',
    target: '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6',
    position: 'top',
    page: 'connections',
    order: 23
  },
  {
    id: 'connection-cards',
    title: 'Your Connections',
    description: 'View and manage your active connections. Test, sync, or delete connections as needed.',
    target: '.connection-cards',
    position: 'top',
    page: 'connections',
    order: 24
  },
  
  // Agents page steps
  {
    id: 'agents-intro',
    title: 'Autonomous Agents',
    description: 'Create and manage intelligent autonomous agents that can execute workflows automatically.',
    target: '.agents-header',
    position: 'bottom',
    page: 'agents',
    order: 25
  },
  {
    id: 'create-agent',
    title: 'Create New Agent',
    description: 'Click here to create a new autonomous agent that can execute workflows.',
    target: '.create-agent-btn',
    position: 'bottom',
    page: 'agents',
    order: 26
  },
  {
    id: 'agents-stats',
    title: 'Agent Statistics',
    description: 'View your agent performance metrics - total, active, paused, and completed agents.',
    target: '.agents-stats',
    position: 'bottom',
    page: 'agents',
    order: 27
  },
  {
    id: 'agents-search',
    title: 'Search Agents',
    description: 'Use the search bar to quickly find specific agents by name or workflow.',
    target: 'input[placeholder="Search agents..."]',
    position: 'bottom',
    page: 'agents',
    order: 28
  },
  {
    id: 'agents-filters',
    title: 'Filter Agents',
    description: 'Use filters to view agents by status - active, paused, or completed.',
    target: '.agents-filter-btn',
    position: 'bottom',
    page: 'agents',
    order: 29
  },
  
  // Payments page steps
  {
    id: 'payments-intro',
    title: 'Payment Management',
    description: 'Manage your payments, subscriptions, and billing information.',
    target: '.payments-header',
    position: 'bottom',
    page: 'payments',
    order: 30
  },
  {
    id: 'payment-stats',
    title: 'Payment Statistics',
    description: 'View your payment metrics - total payments, revenue, and subscription status.',
    target: '.payment-stats',
    position: 'bottom',
    page: 'payments',
    order: 31
  },
  {
    id: 'payment-actions',
    title: 'Payment Actions',
    description: 'Initiate new payments using M-Pesa or Stripe payment methods.',
    target: '.payment-actions',
    position: 'top',
    page: 'payments',
    order: 28
  },
  {
    id: 'payment-filters',
    title: 'Payment Filters',
    description: 'Search and filter payments by status, method, or reference.',
    target: '.payment-filters',
    position: 'bottom',
    page: 'payments',
    order: 29
  },
  {
    id: 'payment-history',
    title: 'Payment History',
    description: 'View detailed payment history with status, amounts, and transaction details.',
    target: '.payment-history',
    position: 'top',
    page: 'payments',
    order: 30
  },
  
  // Activity page steps
  {
    id: 'activity-intro',
    title: 'Activity Monitor',
    description: 'Monitor system activity, user actions, and performance metrics.',
    target: '.activity-header',
    position: 'bottom',
    page: 'activity',
    order: 31
  },
  {
    id: 'system-metrics',
    title: 'System Metrics',
    description: 'Monitor real-time system performance - CPU, memory, connections, and error rates.',
    target: '.system-metrics',
    position: 'bottom',
    page: 'activity',
    order: 32
  },
  {
    id: 'activity-stats',
    title: 'Activity Statistics',
    description: 'View activity metrics - total activities, success rates, and average duration.',
    target: '.activity-stats',
    position: 'bottom',
    page: 'activity',
    order: 33
  },
  {
    id: 'activity-filters',
    title: 'Activity Filters',
    description: 'Search and filter activities by category, status, priority, or view mode.',
    target: '.activity-filters',
    position: 'bottom',
    page: 'activity',
    order: 34
  },
  {
    id: 'activity-list',
    title: 'Activity List',
    description: 'View detailed activity logs with timestamps, status, and metadata.',
    target: '.activity-list',
    position: 'top',
    page: 'activity',
    order: 35
  },
  
  // Settings page steps
  {
    id: 'settings-intro',
    title: 'Settings Management',
    description: 'Manage your account preferences and system configurations.',
    target: '.settings-header',
    position: 'bottom',
    page: 'settings',
    order: 36
  },
  {
    id: 'settings-categories',
    title: 'Settings Categories',
    description: 'Navigate between different settings categories - notifications, API, dashboard, integrations, and security.',
    target: '.settings-categories',
    position: 'right',
    page: 'settings',
    order: 37
  },
  {
    id: 'settings-content',
    title: 'Settings Content',
    description: 'Configure specific settings for the selected category.',
    target: '.settings-content',
    position: 'left',
    page: 'settings',
    order: 38
  },
  {
    id: 'settings-actions',
    title: 'Settings Actions',
    description: 'Reset settings to defaults or save changes.',
    target: '.settings-actions',
    position: 'top',
    page: 'settings',
    order: 39
  },
  
  // Profile page steps
  {
    id: 'profile-intro',
    title: 'Profile Management',
    description: 'Manage your personal information, security settings, and account preferences.',
    target: '.profile-header',
    position: 'bottom',
    page: 'profile',
    order: 40
  },
  {
    id: 'personal-information',
    title: 'Personal Information',
    description: 'Update your name and email address. Changes are automatically saved when you click "Save Changes".',
    target: '.bg-white.rounded-2xl.p-6.shadow-sm.border.border-gray-200\\/50.hover\\:shadow-md.transition-shadow',
    position: 'bottom',
    page: 'profile',
    order: 41
  },
  {
    id: 'api-key-management',
    title: 'API Key Management',
    description: 'Securely manage your API key for integrations. You can show/hide, copy, or regenerate your API key.',
    target: '.bg-white.rounded-2xl.p-6.shadow-sm.border.border-gray-200\\/50.hover\\:shadow-md.transition-shadow:nth-of-type(2)',
    position: 'top',
    page: 'profile',
    order: 42
  },
  {
    id: 'password-security',
    title: 'Password Security',
    description: 'Change your account password securely. Click "Change Password" to open the password form.',
    target: '.bg-white.rounded-2xl.p-6.shadow-sm.border.border-gray-200\\/50.hover\\:shadow-md.transition-shadow:nth-of-type(3)',
    position: 'top',
    page: 'profile',
    order: 43
  },
  {
    id: 'account-overview',
    title: 'Account Overview',
    description: 'View your account details including User ID, subscription tier, and membership information.',
    target: '.bg-white.rounded-2xl.p-6.shadow-sm.border.border-gray-200\\/50.hover\\:shadow-md.transition-shadow:nth-of-type(4)',
    position: 'left',
    page: 'profile',
    order: 44
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Access common account management tasks like email preferences, usage analytics, and billing history.',
    target: '.bg-white.rounded-2xl.p-6.shadow-sm.border.border-gray-200\\/50.hover\\:shadow-md.transition-shadow:nth-of-type(5)',
    position: 'left',
    page: 'profile',
    order: 45
  },
  {
    id: 'danger-zone',
    title: 'Danger Zone',
    description: 'Perform irreversible actions like deleting your account. Use with caution.',
    target: '.bg-white.rounded-2xl.p-6.shadow-sm.border.border-red-200\\/50.hover\\:shadow-md.transition-shadow',
    position: 'left',
    page: 'profile',
    order: 46
  }
];

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Update current page based on location
  useEffect(() => {
    const pathname = location.pathname;
    let page = 'dashboard';
    
    if (pathname === '/') page = 'dashboard';
    else if (pathname === '/chat') page = 'chat';
    else if (pathname === '/connections') page = 'connections';
    else if (pathname === '/workflows') page = 'workflows';
    else if (pathname === '/agents') page = 'agents';
    else if (pathname === '/settings') page = 'settings';
    else if (pathname === '/payments') page = 'payments';
    else if (pathname === '/activity') page = 'activity';
    else if (pathname === '/profile') page = 'profile';
    
    setCurrentPage(page);
  }, [location.pathname]);

  // Check if tutorial should be shown for new users
  useEffect(() => {
    if (user && !isCompleted) {
      const hasSeenTutorial = localStorage.getItem('tutorial_completed');
      if (!hasSeenTutorial) {
        // Show tutorial for new users after a short delay
        const timer = setTimeout(() => {
          setIsActive(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isCompleted]);

  // Filter steps for current page
  const currentPageSteps = tutorialSteps.filter(step => step.page === currentPage);
  const currentStep = currentPageSteps[currentStepIndex] || null;
  const totalSteps = currentPageSteps.length;

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (currentStepIndex < currentPageSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Move to next page or complete
      const currentPageIndex = tutorialSteps.findIndex(step => step.page === currentPage);
      const nextPageStep = tutorialSteps.find(step => step.order > currentPageSteps[currentStepIndex]?.order);
      
      if (nextPageStep) {
        setCurrentPage(nextPageStep.page);
        setCurrentStepIndex(0);
      } else {
        completeTutorial();
      }
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      // Move to previous page
      const prevPageStep = tutorialSteps.find(step => step.order < currentPageSteps[0]?.order);
      if (prevPageStep) {
        setCurrentPage(prevPageStep.page);
        setCurrentStepIndex(tutorialSteps.filter(step => step.page === prevPageStep.page).length - 1);
      }
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    localStorage.setItem('tutorial_completed', 'true');
    setIsCompleted(true);
  };

  const completeTutorial = () => {
    setIsActive(false);
    localStorage.setItem('tutorial_completed', 'true');
    setIsCompleted(true);
  };

  const value: TutorialContextType = {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    isCompleted,
    currentPage,
    setCurrentPage
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}; 