import {
    ChevronLeft,
    ChevronRight,
    SkipForward,
    Sparkles,
    X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTutorial } from '../hooks/useTutorial';

const TutorialOverlay: React.FC = () => {
  const { 
    isActive, 
    currentStep, 
    currentStepIndex, 
    totalSteps,
    nextStep, 
    previousStep, 
    skipTutorial, 
    completeTutorial 
  } = useTutorial();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && currentStep) {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        setOverlayPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, [isActive, currentStep]);

  if (!isActive || !currentStep) return null;

  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%' };

    const rect = targetElement.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    if (!tooltip) return { top: '50%', left: '50%' };

    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = rect.bottom + 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Adjust position based on currentStep.position
    switch (currentStep.position) {
      case 'top':
        top = rect.top - tooltipRect.height - 10;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - 10;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + 10;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > windowWidth - 10) {
      left = windowWidth - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > windowHeight - 10) {
      top = windowHeight - tooltipRect.height - 10;
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      
      {/* Highlight overlay */}
      <div
        className="fixed z-50 border-2 border-blue-500 rounded-lg shadow-2xl"
        style={{
          top: overlayPosition.top - 4,
          left: overlayPosition.left - 4,
          width: overlayPosition.width + 8,
          height: overlayPosition.height + 8,
          pointerEvents: 'none'
        }}
      >
        <div className="absolute inset-0 bg-blue-500/20 rounded-lg animate-pulse" />
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200"
        style={getTooltipPosition()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStep.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex space-x-1">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === currentStepIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {currentStepIndex + 1} of {totalSteps}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={skipTutorial}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={skipTutorial}
                className="flex items-center space-x-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>
              
              <button
                onClick={currentStepIndex === totalSteps - 1 ? completeTutorial : nextStep}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <span>{currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}</span>
                {currentStepIndex === totalSteps - 1 ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          className={`absolute w-4 h-4 bg-white transform rotate-45 border border-gray-200 ${
            currentStep.position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
            currentStep.position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
            currentStep.position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' :
            'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
          }`}
        />
      </div>
    </>
  );
};

export default TutorialOverlay; 