import { HelpCircle, Play } from 'lucide-react';
import React, { useState } from 'react';
import { useTutorial } from '../hooks/useTutorial';

const TutorialButton: React.FC = () => {
  const { startTutorial, isCompleted } = useTutorial();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={startTutorial}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
        title="Start Tutorial"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div className="fixed bottom-20 right-6 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              {isCompleted ? 'Replay Tutorial' : 'Start Tutorial'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isCompleted 
              ? 'Take another tour of Mini-Hub features'
              : 'Learn how to use Mini-Hub effectively'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TutorialButton; 