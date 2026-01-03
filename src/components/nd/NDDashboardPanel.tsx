import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnchorPointManager } from '@/components/anchor';
import { RoutineVariantEditor } from '@/components/routine';
import { ConversationalOnboarding } from '@/components/onboarding/ConversationalOnboarding';
import { useAnchorPoints } from '@/hooks/useAnchorPoints';
import { useRoutineVariants } from '@/hooks/useRoutineVariants';
import { Playbook, AnchorPoint } from '@/types';
import {
  Anchor,
  Battery,
  Brain,
  Sparkles,
  Settings2,
  TrendingUp,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NDDashboardPanelProps {
  playbooks: Playbook[];
  onNavigateToRoutine?: (routineId: string) => void;
  className?: string;
}

export function NDDashboardPanel({
  playbooks,
  onNavigateToRoutine,
  className,
}: NDDashboardPanelProps) {
  const {
    anchorPoints,
    activeAnchors,
    getNextAnchor,
    isOnboardingComplete,
    aiPersonality,
  } = useAnchorPoints();

  const {
    variants,
    hasVariants,
    getVariantCount,
  } = useRoutineVariants();

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [anchorManagerOpen, setAnchorManagerOpen] = useState(false);
  const [variantEditorOpen, setVariantEditorOpen] = useState(false);

  const nextAnchor = getNextAnchor();

  // Calculate quick stats
  const routinesWithVariants = playbooks.filter(p => hasVariants(p.id)).length;
  const totalVariants = variants.length;

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun };
    if (hour < 17) return { text: 'Good afternoon', icon: Brain };
    return { text: 'Good evening', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // If onboarding not complete, show onboarding prompt
  if (!isOnboardingComplete) {
    return (
      <>
        <Card className={cn('bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20', className)}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Let's set up your day</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Answer a few questions about your natural patterns and we'll help you build
                  a flexible structure that works with your brain, not against it.
                </p>
                <Button onClick={() => setOnboardingOpen(true)} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Start Setup (5 min)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ConversationalOnboarding
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
        />
      </>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GreetingIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{greeting.text}</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {aiPersonality} mode
            </Badge>
          </div>
          <CardDescription>
            Your flexible structure for today
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Next Anchor */}
          {nextAnchor && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Next anchor:</span>
                  <span className="text-sm">{nextAnchor.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {nextAnchor.triggerTime}
                </Badge>
              </div>
              {nextAnchor.linkedRoutineIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {nextAnchor.linkedRoutineIds.length} routine{nextAnchor.linkedRoutineIds.length !== 1 ? 's' : ''} attached
                </p>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <QuickStat
              icon={Anchor}
              label="Anchors"
              value={activeAnchors.length}
              total={anchorPoints.length}
              onClick={() => setAnchorManagerOpen(true)}
            />
            <QuickStat
              icon={Battery}
              label="Variants"
              value={totalVariants}
              sublabel={`${routinesWithVariants} routines`}
              onClick={() => setVariantEditorOpen(true)}
            />
            <QuickStat
              icon={TrendingUp}
              label="Pattern"
              value={aiPersonality === 'warm' ? '🌸' : aiPersonality === 'direct' ? '📊' : '✨'}
              sublabel={aiPersonality}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchorManagerOpen(true)}
              className="gap-1.5"
            >
              <Anchor className="w-3.5 h-3.5" />
              Manage Anchors
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVariantEditorOpen(true)}
              className="gap-1.5"
            >
              <Battery className="w-3.5 h-3.5" />
              Low-Energy Variants
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOnboardingOpen(true)}
              className="gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Redo Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anchor Manager Dialog */}
      {anchorManagerOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <AnchorPointManager
              playbooks={playbooks}
              className="shadow-xl"
            />
            <div className="flex justify-end mt-4">
              <Button onClick={() => setAnchorManagerOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Editor Dialog */}
      <RoutineVariantEditor
        open={variantEditorOpen}
        onOpenChange={setVariantEditorOpen}
        routines={playbooks}
        onSave={(variant) => {
          // Handle save - useRoutineVariants hook will be used in a real implementation
          console.log('Saving variant:', variant);
        }}
      />

      {/* Onboarding Dialog */}
      <ConversationalOnboarding
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
      />
    </>
  );
}

// Quick stat component
function QuickStat({
  icon: Icon,
  label,
  value,
  total,
  sublabel,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  total?: number;
  sublabel?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'p-3 rounded-lg bg-accent/30 text-left transition-colors',
        onClick && 'hover:bg-accent/50 cursor-pointer'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="font-semibold">
        {value}
        {total !== undefined && (
          <span className="text-muted-foreground font-normal">/{total}</span>
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </button>
  );
}

export default NDDashboardPanel;
