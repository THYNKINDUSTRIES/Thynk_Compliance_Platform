import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userName?: string;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Thynk Compliance!',
    description: 'Your comprehensive platform for tracking and managing regulatory compliance across federal and state jurisdictions.',
    icon: <Sparkles className="w-12 h-12" />,
    features: [
      'Track regulations from 50+ jurisdictions',
      'Real-time updates on regulatory changes',
      'AI-powered analysis and insights',
      'Streamlined compliance workflows'
    ],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 2,
    title: 'Your Personal Dashboard',
    description: 'Access all your compliance activities in one place. Monitor your saved regulations, active alerts, and recent updates.',
    icon: <LayoutDashboard className="w-12 h-12" />,
    features: [
      'View total regulations and daily updates',
      'Quick access to saved favorites',
      'Manage your custom alerts',
      'Track comment submissions'
    ],
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 3,
    title: 'Discover & Track Regulations',
    description: 'Browse, search, and filter through thousands of regulations. Save the ones that matter most to your organization.',
    icon: <Search className="w-12 h-12" />,
    features: [
      'Full-text search across all regulations',
      'Filter by jurisdiction, agency, or type',
      'Save regulations to your favorites',
      'View detailed regulation information'
    ],
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 4,
    title: 'Stay Informed with Alerts',
    description: 'Never miss an important update. Set up custom alerts to get notified when regulations change or new ones are published.',
    icon: <Bell className="w-12 h-12" />,
    features: [
      'Create keyword-based alerts',
      'Filter by specific agencies or topics',
      'Receive email notifications',
      'Customize alert frequency'
    ],
    color: 'from-amber-500 to-orange-600'
  }
];

export default function OnboardingModal({ isOpen, onComplete, userName }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Get color for checkmarks based on step
  const getCheckColor = () => {
    switch (currentStep) {
      case 0: return '#6366f1';
      case 1: return '#a855f7';
      case 2: return '#10b981';
      case 3: return '#f59e0b';
      default: return '#6366f1';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{step.title}</DialogTitle>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-200">
          <div 
            className={`h-full bg-gradient-to-r ${step.color} transition-all duration-300`}
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header with Icon */}
        <div className={`bg-gradient-to-r ${step.color} p-8 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-full p-3">
              {step.icon}
            </div>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isFirstStep && userName ? `Welcome, ${userName}!` : step.title}
          </h2>
          <p className="text-white/90">
            {step.description}
          </p>
        </div>

        {/* Features List */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            What you can do
          </h3>
          <ul className="space-y-3">
            {step.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: getCheckColor() }}
                />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentStep 
                  ? `bg-gradient-to-r ${step.color} w-8` 
                  : index < currentStep 
                    ? 'bg-gray-400 w-2.5' 
                    : 'bg-gray-200 w-2.5'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 pt-0 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </Button>
          
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`gap-1 bg-gradient-to-r ${step.color} hover:opacity-90 text-white border-0`}
            >
              {isLastStep ? (
                <>
                  Get Started
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
