import { useState } from 'react';
import { Plus, Wand2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoutineStep } from '@/types';

interface QuickAddStepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSteps: (steps: Omit<RoutineStep, 'id' | 'status' | 'actualMinutes'>[]) => void;
  routineName?: string;
}

const PLACEHOLDER_TEXT = `Type steps, one per line:
Brush teeth
Get dressed
Make coffee
Check emails`;

export function QuickAddStep({
  open,
  onOpenChange,
  onAddSteps,
  routineName,
}: QuickAddStepProps) {
  const [bulkText, setBulkText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bulk' | 'ai'>('bulk');

  const parseBulkText = (text: string): Omit<RoutineStep, 'id' | 'status' | 'actualMinutes'>[] => {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines.map((line, idx) => {
      // Check if line includes duration like "Step name (10m)" or "Step name - 15 min"
      const durationMatch = line.match(/\((\d+)\s*m(?:in)?\)|[-–]\s*(\d+)\s*m(?:in)?$/i);
      let name = line;
      let estimatedMinutes = 5; // default

      if (durationMatch) {
        const duration = parseInt(durationMatch[1] || durationMatch[2], 10);
        if (!isNaN(duration) && duration > 0) {
          estimatedMinutes = duration;
        }
        // Remove duration from name
        name = line.replace(durationMatch[0], '').trim();
      }

      return {
        name,
        estimatedMinutes,
        notes: undefined,
        isFlexible: false,
        order: idx,
      };
    });
  };

  const handleBulkAdd = () => {
    const steps = parseBulkText(bulkText);
    if (steps.length > 0) {
      onAddSteps(steps);
      setBulkText('');
      onOpenChange(false);
    }
  };

  const handleAISuggest = async () => {
    if (!routineName) return;

    setAiLoading(true);
    try {
      // Placeholder: In a real implementation, this would call an AI endpoint
      // For now, we'll simulate some suggestions based on common routine patterns
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

      const suggestions = getAISuggestions(routineName);
      if (suggestions.length > 0) {
        onAddSteps(suggestions);
        onOpenChange(false);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const previewSteps = parseBulkText(bulkText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Add Steps</DialogTitle>
          <DialogDescription>
            Quickly add multiple steps to your routine
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'bulk' | 'ai')}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
            <TabsTrigger value="ai" disabled={!routineName}>
              AI Suggest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={PLACEHOLDER_TEXT}
                className="h-40 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Add duration with parentheses like "Shower (15m)" or dash "Shower - 15 min"
              </p>
            </div>

            {/* Preview */}
            {previewSteps.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/50">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Preview ({previewSteps.length} steps):</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {previewSteps.slice(0, 10).map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">{idx + 1}.</span>
                        <span className="truncate max-w-[200px]">{step.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{step.estimatedMinutes}m</span>
                    </div>
                  ))}
                  {previewSteps.length > 10 && (
                    <p className="text-xs text-muted-foreground">+{previewSteps.length - 10} more...</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="text-center py-8">
              <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">AI Step Suggestions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {routineName
                  ? `Get AI-suggested steps for "${routineName}"`
                  : 'Name your routine first to get AI suggestions'
                }
              </p>
              <Button
                onClick={handleAISuggest}
                disabled={!routineName || aiLoading}
                className="gap-2"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Suggest Steps
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'bulk' && (
            <Button
              onClick={handleBulkAdd}
              disabled={previewSteps.length === 0}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add {previewSteps.length} Step{previewSteps.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder AI suggestions based on routine name patterns
function getAISuggestions(routineName: string): Omit<RoutineStep, 'id' | 'status' | 'actualMinutes'>[] {
  const lowerName = routineName.toLowerCase();

  if (lowerName.includes('morning')) {
    return [
      { name: 'Wake up & stretch', estimatedMinutes: 5, isFlexible: false, order: 0 },
      { name: 'Use bathroom', estimatedMinutes: 5, isFlexible: false, order: 1 },
      { name: 'Brush teeth & wash face', estimatedMinutes: 5, isFlexible: false, order: 2 },
      { name: 'Get dressed', estimatedMinutes: 5, isFlexible: false, order: 3 },
      { name: 'Breakfast', estimatedMinutes: 15, isFlexible: false, order: 4 },
      { name: 'Check calendar & tasks', estimatedMinutes: 5, isFlexible: true, order: 5 },
    ];
  }

  if (lowerName.includes('evening') || lowerName.includes('night') || lowerName.includes('bedtime')) {
    return [
      { name: 'Prepare tomorrow\'s clothes', estimatedMinutes: 5, isFlexible: true, order: 0 },
      { name: 'Review tomorrow\'s schedule', estimatedMinutes: 5, isFlexible: true, order: 1 },
      { name: 'Evening hygiene', estimatedMinutes: 10, isFlexible: false, order: 2 },
      { name: 'Dim lights', estimatedMinutes: 2, isFlexible: false, order: 3 },
      { name: 'Wind down activity', estimatedMinutes: 15, isFlexible: false, order: 4 },
      { name: 'Get into bed', estimatedMinutes: 3, isFlexible: false, order: 5 },
    ];
  }

  if (lowerName.includes('work') || lowerName.includes('focus')) {
    return [
      { name: 'Clear workspace', estimatedMinutes: 3, isFlexible: true, order: 0 },
      { name: 'Review task list', estimatedMinutes: 5, isFlexible: false, order: 1 },
      { name: 'Set today\'s intention', estimatedMinutes: 2, isFlexible: false, order: 2 },
      { name: 'Close distracting tabs', estimatedMinutes: 2, isFlexible: false, order: 3 },
      { name: 'Begin first task', estimatedMinutes: 3, isFlexible: false, order: 4 },
    ];
  }

  if (lowerName.includes('exercise') || lowerName.includes('workout')) {
    return [
      { name: 'Put on workout clothes', estimatedMinutes: 3, isFlexible: false, order: 0 },
      { name: 'Warm up', estimatedMinutes: 5, isFlexible: false, order: 1 },
      { name: 'Main workout', estimatedMinutes: 30, isFlexible: false, order: 2 },
      { name: 'Cool down stretches', estimatedMinutes: 5, isFlexible: false, order: 3 },
      { name: 'Shower', estimatedMinutes: 10, isFlexible: false, order: 4 },
    ];
  }

  // Default generic steps
  return [
    { name: 'Prepare', estimatedMinutes: 5, isFlexible: false, order: 0 },
    { name: 'Main activity', estimatedMinutes: 15, isFlexible: false, order: 1 },
    { name: 'Wrap up', estimatedMinutes: 5, isFlexible: false, order: 2 },
  ];
}
