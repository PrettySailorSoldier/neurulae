import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAnchorPoints } from '@/hooks/useAnchorPoints';
import { useToast } from '@/hooks/use-toast';
import {
  AIPersonality,
  AI_PERSONALITIES,
  NaturalPattern,
  AnchorPoint,
  FrictionPoint,
} from '@/types';
import {
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Clock,
  Heart,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Anchor,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationalOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

// Common patterns that users might recognize
const COMMON_PATTERNS = [
  { id: 'coffee', activity: 'Morning coffee/tea', icon: Coffee, category: 'morning' },
  { id: 'medication', activity: 'Taking medication', icon: Heart, category: 'morning' },
  { id: 'partner-leaves', activity: 'Partner leaves for work', icon: Sun, category: 'morning' },
  { id: 'lunch', activity: 'Lunch break', icon: Clock, category: 'midday' },
  { id: 'pet-feeding', activity: 'Feeding pets', icon: Heart, category: 'morning' },
  { id: 'kids-school', activity: 'Kids go to school', icon: Sun, category: 'morning' },
  { id: 'dinner', activity: 'Dinner time', icon: Moon, category: 'evening' },
  { id: 'wind-down', activity: 'Evening wind-down', icon: Moon, category: 'evening' },
];

// Common friction points
const COMMON_FRICTION_POINTS = [
  'Getting out of bed',
  'Starting work/tasks',
  'Switching between tasks',
  'Stopping a task when time is up',
  'Starting after a break',
  'Transitioning from work to home mode',
  'Getting ready to leave the house',
  'Going to bed on time',
];

type OnboardingStep = 'welcome' | 'personality' | 'patterns' | 'anchors' | 'friction' | 'first-routine' | 'complete';

const STEP_ORDER: OnboardingStep[] = ['welcome', 'personality', 'patterns', 'anchors', 'friction', 'first-routine', 'complete'];

export function ConversationalOnboarding({ open, onOpenChange, onComplete }: ConversationalOnboardingProps) {
  const { toast } = useToast();
  const {
    onboardingState,
    updateOnboardingStep,
    updateOnboardingData,
    completeOnboarding,
    aiPersonality,
    setAIPersonality,
    addAnchorPoint,
    convertPatternToAnchor,
  } = useAnchorPoints();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    onboardingState.currentStep === 'complete' ? 'welcome' : onboardingState.currentStep
  );

  // Local state for collecting data before saving
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality>(aiPersonality);
  const [patterns, setPatterns] = useState<NaturalPattern[]>(onboardingState.collectedData.naturalPatterns);
  const [customPattern, setCustomPattern] = useState('');
  const [customPatternTime, setCustomPatternTime] = useState('');
  const [selectedAnchors, setSelectedAnchors] = useState<string[]>(
    onboardingState.collectedData.anchorPoints.map(a => a.id)
  );
  const [frictionPoints, setFrictionPoints] = useState<string[]>(
    onboardingState.collectedData.frictionPoints.map(f => f.transition)
  );
  const [customFriction, setCustomFriction] = useState('');

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length - 1; // Exclude 'complete' from count

  const handleNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      const nextStep = STEP_ORDER[nextIndex];
      setCurrentStep(nextStep);
      updateOnboardingStep(nextStep);
    }
  }, [currentStepIndex, updateOnboardingStep]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEP_ORDER[prevIndex];
      setCurrentStep(prevStep);
      updateOnboardingStep(prevStep);
    }
  }, [currentStepIndex, updateOnboardingStep]);

  const handleSavePersonality = useCallback(() => {
    setAIPersonality(selectedPersonality);
    handleNext();
  }, [selectedPersonality, setAIPersonality, handleNext]);

  const handleAddCustomPattern = useCallback(() => {
    if (!customPattern.trim()) return;

    const newPattern: NaturalPattern = {
      id: crypto.randomUUID(),
      activity: customPattern.trim(),
      typicalTime: customPatternTime || undefined,
      reliability: 'usually',
    };

    setPatterns(prev => [...prev, newPattern]);
    setCustomPattern('');
    setCustomPatternTime('');
  }, [customPattern, customPatternTime]);

  const handleTogglePattern = useCallback((pattern: typeof COMMON_PATTERNS[0]) => {
    setPatterns(prev => {
      const exists = prev.some(p => p.activity === pattern.activity);
      if (exists) {
        return prev.filter(p => p.activity !== pattern.activity);
      } else {
        return [...prev, {
          id: crypto.randomUUID(),
          activity: pattern.activity,
          reliability: 'usually' as const,
        }];
      }
    });
  }, []);

  const handleRemovePattern = useCallback((id: string) => {
    setPatterns(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleSavePatterns = useCallback(() => {
    updateOnboardingData({ naturalPatterns: patterns });
    handleNext();
  }, [patterns, updateOnboardingData, handleNext]);

  const handleToggleAnchorSelection = useCallback((patternId: string) => {
    setSelectedAnchors(prev => {
      if (prev.includes(patternId)) {
        return prev.filter(id => id !== patternId);
      } else if (prev.length < 3) {
        return [...prev, patternId];
      }
      return prev;
    });
  }, []);

  const handleSaveAnchors = useCallback(() => {
    // Convert selected patterns to anchor points
    const selectedPatterns = patterns.filter(p => selectedAnchors.includes(p.id));

    selectedPatterns.forEach(pattern => {
      const matchingCommon = COMMON_PATTERNS.find(cp => cp.activity === pattern.activity);
      const category = matchingCommon?.category as AnchorPoint['category'] || 'flex';
      convertPatternToAnchor(pattern, category);
    });

    updateOnboardingData({
      anchorPoints: selectedPatterns.map(p => ({
        id: p.id,
        name: p.activity,
        triggerType: p.typicalTime ? 'time' : 'event',
        triggerTime: p.typicalTime,
        triggerEvent: p.typicalTime ? undefined : p.activity,
        reliability: p.reliability === 'always' ? 'rock-solid' : p.reliability,
        linkedRoutineIds: [],
        attachmentPosition: 'after',
        category: 'flex',
        isActive: true,
        createdAt: new Date().toISOString(),
      })) as AnchorPoint[],
    });

    handleNext();
  }, [patterns, selectedAnchors, convertPatternToAnchor, updateOnboardingData, handleNext]);

  const handleToggleFriction = useCallback((friction: string) => {
    setFrictionPoints(prev => {
      if (prev.includes(friction)) {
        return prev.filter(f => f !== friction);
      }
      return [...prev, friction];
    });
  }, []);

  const handleAddCustomFriction = useCallback(() => {
    if (!customFriction.trim()) return;
    setFrictionPoints(prev => [...prev, customFriction.trim()]);
    setCustomFriction('');
  }, [customFriction]);

  const handleSaveFriction = useCallback(() => {
    const frictionData: FrictionPoint[] = frictionPoints.map(f => ({
      id: crypto.randomUUID(),
      transition: f,
      severity: 'moderate' as const,
    }));

    updateOnboardingData({ frictionPoints: frictionData });
    handleNext();
  }, [frictionPoints, updateOnboardingData, handleNext]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
    toast({
      title: 'Setup complete!',
      description: 'Your anchor points are ready. You can always adjust them in settings.',
    });
    onComplete?.();
    onOpenChange(false);
  }, [completeOnboarding, toast, onComplete, onOpenChange]);

  const handleSkip = useCallback(() => {
    toast({
      title: 'No problem!',
      description: 'You can set up anchor points anytime from settings.',
    });
    onOpenChange(false);
  }, [toast, onOpenChange]);

  const handleComeLaterResume = useCallback(() => {
    // Save current progress and close
    updateOnboardingStep(currentStep);
    toast({
      title: 'Progress saved',
      description: 'Pick up where you left off anytime.',
    });
    onOpenChange(false);
  }, [currentStep, updateOnboardingStep, toast, onOpenChange]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Anchor className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Building Structure That Works For You</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Instead of imposing a schedule, we'll find patterns that already exist in your life
                  and use them as <strong>anchor points</strong> to build sustainable routines.
                </p>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Structure as scaffolding, not a cage</p>
                    <p className="text-sm text-muted-foreground">Everything here is flexible and can be changed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Start with what already works</p>
                    <p className="text-sm text-muted-foreground">We'll identify reliable moments in your day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">"Good enough" is genuinely good</p>
                    <p className="text-sm text-muted-foreground">Every routine gets a low-energy version</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">How should I talk to you?</h3>
              <p className="text-muted-foreground">
                Choose the style that feels most helpful. You can change this anytime.
              </p>
            </div>

            <RadioGroup
              value={selectedPersonality}
              onValueChange={(v) => setSelectedPersonality(v as AIPersonality)}
              className="space-y-3"
            >
              {AI_PERSONALITIES.map((personality) => (
                <div
                  key={personality.id}
                  className={cn(
                    "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedPersonality === personality.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setSelectedPersonality(personality.id)}
                >
                  <RadioGroupItem value={personality.id} id={personality.id} className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={personality.id} className="font-semibold cursor-pointer">
                      {personality.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{personality.description}</p>
                    <div className="bg-muted p-3 rounded-md text-sm italic">
                      "{personality.sampleResponse}"
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'patterns':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">What happens reliably in your day?</h3>
              <p className="text-muted-foreground">
                Select activities that happen pretty consistently. These don't have to be at exact times.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {COMMON_PATTERNS.map((pattern) => {
                const isSelected = patterns.some(p => p.activity === pattern.activity);
                const Icon = pattern.icon;
                return (
                  <Button
                    key={pattern.id}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-3 justify-start"
                    onClick={() => handleTogglePattern(pattern)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="text-sm">{pattern.activity}</span>
                  </Button>
                );
              })}
            </div>

            {/* Custom pattern input */}
            <div className="space-y-3">
              <Label>Add your own</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., After my morning walk"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={customPatternTime}
                  onChange={(e) => setCustomPatternTime(e.target.value)}
                  className="w-32"
                  placeholder="Time (optional)"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddCustomPattern}
                  disabled={!customPattern.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selected patterns */}
            {patterns.length > 0 && (
              <div className="space-y-2">
                <Label>Selected patterns ({patterns.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {patterns.map((pattern) => (
                    <Badge
                      key={pattern.id}
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5"
                    >
                      {pattern.activity}
                      {pattern.typicalTime && (
                        <span className="text-muted-foreground ml-1">@ {pattern.typicalTime}</span>
                      )}
                      <button
                        onClick={() => handleRemovePattern(pattern.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'anchors':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Choose 1-3 Anchor Points</h3>
              <p className="text-muted-foreground">
                These are the most reliable moments in your day. We'll attach small routines to them.
              </p>
            </div>

            {patterns.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No patterns selected. Go back to add some!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {patterns.map((pattern) => {
                  const isSelected = selectedAnchors.includes(pattern.id);
                  const canSelect = isSelected || selectedAnchors.length < 3;

                  return (
                    <Card
                      key={pattern.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-accent",
                        !canSelect && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => canSelect && handleToggleAnchorSelection(pattern.id)}
                    >
                      <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} disabled={!canSelect} />
                          <div>
                            <p className="font-medium">{pattern.activity}</p>
                            {pattern.typicalTime && (
                              <p className="text-sm text-muted-foreground">Around {pattern.typicalTime}</p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="outline" className="bg-primary/10">
                            <Anchor className="w-3 h-3 mr-1" />
                            Anchor
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {selectedAnchors.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {selectedAnchors.length} anchor{selectedAnchors.length !== 1 ? 's' : ''} selected
                {selectedAnchors.length < 3 && ` (can add ${3 - selectedAnchors.length} more)`}
              </p>
            )}
          </div>
        );

      case 'friction':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Where do transitions feel hard?</h3>
              <p className="text-muted-foreground">
                This helps us add buffer time and support where you need it most. No judgment here!
              </p>
            </div>

            <div className="space-y-2">
              {COMMON_FRICTION_POINTS.map((friction) => {
                const isSelected = frictionPoints.includes(friction);
                return (
                  <div
                    key={friction}
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                    )}
                    onClick={() => handleToggleFriction(friction)}
                  >
                    <Checkbox checked={isSelected} />
                    <span>{friction}</span>
                  </div>
                );
              })}
            </div>

            {/* Custom friction input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add another struggle..."
                value={customFriction}
                onChange={(e) => setCustomFriction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomFriction()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddCustomFriction}
                disabled={!customFriction.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Custom friction points */}
            {frictionPoints.filter(f => !COMMON_FRICTION_POINTS.includes(f)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {frictionPoints
                  .filter(f => !COMMON_FRICTION_POINTS.includes(f))
                  .map((friction) => (
                    <Badge key={friction} variant="secondary" className="py-1.5">
                      {friction}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFriction(friction);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        );

      case 'first-routine':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">You're all set!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your anchor points are ready. The AI can now help you build small routines around them.
                </p>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <p className="font-medium">What's next:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 mt-0.5 text-primary" />
                      <span>Ask the AI to suggest a small routine for one of your anchors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 mt-0.5 text-primary" />
                      <span>Every routine gets a "low energy" version automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 mt-0.5 text-primary" />
                      <span>Check in weekly to see what's working</span>
                    </li>
                  </ul>
                </div>

                {selectedAnchors.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Your anchors:</p>
                    <div className="flex flex-wrap gap-2">
                      {patterns
                        .filter(p => selectedAnchors.includes(p.id))
                        .map((pattern) => (
                          <Badge key={pattern.id} variant="outline" className="bg-primary/5">
                            <Anchor className="w-3 h-3 mr-1" />
                            {pattern.activity}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine next button action
  const getNextAction = () => {
    switch (currentStep) {
      case 'welcome':
        return handleNext;
      case 'personality':
        return handleSavePersonality;
      case 'patterns':
        return handleSavePatterns;
      case 'anchors':
        return handleSaveAnchors;
      case 'friction':
        return handleSaveFriction;
      case 'first-routine':
        return handleComplete;
      default:
        return handleNext;
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 'first-routine':
        return 'Get Started';
      case 'anchors':
        return selectedAnchors.length === 0 ? 'Skip for now' : 'Continue';
      default:
        return 'Continue';
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 'patterns':
        return true; // Can continue with no patterns
      case 'anchors':
        return true; // Can skip anchors
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {currentStep === 'welcome' ? 'Welcome' : `Step ${currentStepIndex} of ${totalSteps - 1}`}
          </DialogTitle>
          {currentStep !== 'welcome' && currentStep !== 'first-routine' && (
            <DialogDescription>
              Take your time. You can come back to this later.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            {currentStep === 'welcome' ? (
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleComeLaterResume}>
                Come back later
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStepIndex > 0 && currentStep !== 'first-routine' && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={getNextAction()} disabled={!canContinue()}>
              {getNextButtonText()}
              {currentStep !== 'first-routine' && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
