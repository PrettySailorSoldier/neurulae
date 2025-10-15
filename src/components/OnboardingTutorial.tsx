import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Star, Calendar, ListTodo, BookOpen, Sparkles, FolderKanban } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to Neurulae! 🎉',
    icon: Sparkles,
    description: 'Your personal productivity workspace designed to help you focus, plan, and achieve your goals.',
    spotlightSelector: null,
    content: [
      'Neurulae combines powerful time management tools with flexible organization',
      'Follow this quick tutorial to learn how to get the most out of your workspace',
      'You can always access this guide from the help icon in the top corner'
    ]
  },
  {
    title: 'Focus Timer ⏱️',
    icon: Clock,
    description: 'Start your productivity journey with focused work sessions',
    spotlightSelector: '[data-tutorial="focus-timer"]',
    content: [
      'Use preset timers (25, 15, or 5 minutes) for quick sessions',
      'Click Start to begin a focus session and track your progress',
      'Access Advanced Timers for Pomodoro, Flowtime, and more techniques',
      'Perfect for deep work and maintaining concentration'
    ]
  },
  {
    title: "Today's Priorities ⭐",
    icon: Star,
    description: 'Highlight what matters most each day',
    spotlightSelector: '[data-tutorial="priorities"]',
    content: [
      'Add your top 3-5 priorities for the day',
      'Check them off as you complete them',
      'Drag tasks here from your task list to prioritize',
      'Keep your focus on what truly matters'
    ]
  },
  {
    title: 'Daily Flow Timeline 📅',
    icon: Calendar,
    description: 'Visualize and structure your entire day',
    spotlightSelector: '[data-tutorial="timeline"]',
    content: [
      'Create Main Activity blocks for work, meetings, meals, and routines',
      'Add Dedicated Time blocks for focused project work',
      'See the current time indicator moving through your day',
      'Click any block to edit, add tasks, or adjust timing',
      'Schedule blocks for weekdays, weekends, or every day'
    ]
  },
  {
    title: 'Tasks & Projects 📋',
    icon: ListTodo,
    description: 'Organize everything you need to do',
    spotlightSelector: '[data-tutorial="tasks"]',
    content: [
      'Add tasks in the Unscheduled Tasks section',
      'Assign tasks to time blocks by editing the block',
      'Create Projects to group related tasks together',
      'Tasks automatically appear in your schedule when assigned'
    ]
  },
  {
    title: 'Playbooks 📖',
    icon: BookOpen,
    description: 'Reusable templates for recurring workflows',
    spotlightSelector: '[data-tutorial="playbooks"]',
    content: [
      'Create step-by-step guides for routines and processes',
      'Morning routines, workout plans, meeting agendas, and more',
      'Use templates or build your own from scratch',
      'Check off steps as you complete them'
    ]
  },
  {
    title: 'Widgets & More ✨',
    icon: Sparkles,
    description: 'Customize your workspace with powerful tools',
    spotlightSelector: '[data-tutorial="widgets"]',
    content: [
      'Click the widget icon on the right to open the Widget Panel',
      'Add reminders, energy trackers, mood gardens, and more',
      'Customize themes to match your style',
      'Create custom tabs for different areas of your life'
    ]
  },
  {
    title: "You're All Set! 🚀",
    icon: CheckCircle2,
    description: 'Ready to boost your productivity',
    spotlightSelector: null,
    content: [
      'Start by adding a few priorities for today',
      'Create your first time block to structure your day',
      'Explore the tabs to discover all features',
      'Remember: You can reopen this tutorial anytime from the help icon'
    ]
  }
];

export function OnboardingTutorial({ open, onOpenChange }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const step = tutorialSteps[currentStep];
    if (step.spotlightSelector) {
      const element = document.querySelector(step.spotlightSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect(rect);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setSpotlightRect(null);
      }
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep, open]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onOpenChange(false);
  };

  const step = tutorialSteps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  if (!open) return null;

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
        style={{ 
          backdropFilter: 'blur(8px)',
        }}
        onClick={() => onOpenChange(false)}
      >
        {spotlightRect && (
          <div
            className="absolute ring-4 ring-primary rounded-lg pointer-events-none animate-pulse"
            style={{
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
            }}
          />
        )}
      </div>

      {/* Tutorial Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl z-[101]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{step.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ul className="space-y-3">
            {step.content.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-base">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {currentStep < tutorialSteps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-primary">
              Get Started
              <CheckCircle2 className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
