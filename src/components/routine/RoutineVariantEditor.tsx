import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RoutineVariant, Playbook } from '@/types';
import {
  Battery,
  BatteryLow,
  BatteryMedium,
  Zap,
  Clock,
  Sparkles,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoutineVariantEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: Playbook[];
  variant?: RoutineVariant | null;
  onSave: (variant: Omit<RoutineVariant, 'id' | 'createdAt'>) => void;
}

const ENERGY_LEVELS = [
  { id: 'minimal', label: 'Minimal', icon: BatteryLow, color: 'text-red-500', description: 'Bare minimum, survival mode' },
  { id: 'low', label: 'Low', icon: BatteryMedium, color: 'text-orange-500', description: 'Less than usual, but functional' },
  { id: 'medium', label: 'Medium', icon: Battery, color: 'text-yellow-500', description: 'Average energy day' },
  { id: 'high', label: 'High', icon: Zap, color: 'text-green-500', description: 'Good energy, can do more' },
] as const;

const COMMON_SIMPLIFICATIONS = [
  'Skip the detailed version, do quick version',
  'Just do the first and last step',
  'No perfectionism - done is good enough',
  'Use easier/faster alternatives',
  'Ask for help if available',
  'Set a timer and stop when it rings',
  'Do it sitting down if possible',
  'Break into smaller chunks with breaks',
];

export function RoutineVariantEditor({
  open,
  onOpenChange,
  routines,
  variant,
  onSave,
}: RoutineVariantEditorProps) {
  const [parentRoutineId, setParentRoutineId] = useState<string>('');
  const [name, setName] = useState('');
  const [energyLevel, setEnergyLevel] = useState<RoutineVariant['energyLevel']>('low');
  const [simplifiedSteps, setSimplifiedSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [timeMultiplier, setTimeMultiplier] = useState(1);
  const [skipThreshold, setSkipThreshold] = useState(2);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Reset form when variant changes or dialog opens
  useEffect(() => {
    if (variant) {
      setParentRoutineId(variant.parentRoutineId);
      setName(variant.name);
      setEnergyLevel(variant.energyLevel);
      setSimplifiedSteps(variant.simplifiedSteps);
      setTimeMultiplier(variant.timeMultiplier);
      setSkipThreshold(variant.skipThreshold);
      setAiSuggestions(variant.aiSuggestions || []);
    } else {
      // Reset to defaults for new variant
      setParentRoutineId('');
      setName('');
      setEnergyLevel('low');
      setSimplifiedSteps([]);
      setNewStep('');
      setTimeMultiplier(1);
      setSkipThreshold(2);
      setAiSuggestions([]);
    }
  }, [variant, open]);

  // Auto-generate name when parent routine changes
  useEffect(() => {
    if (parentRoutineId && !variant) {
      const routine = routines.find(r => r.id === parentRoutineId);
      if (routine) {
        const energyLabel = ENERGY_LEVELS.find(e => e.id === energyLevel)?.label || 'Low';
        setName(`${routine.title} (${energyLabel} Energy)`);
      }
    }
  }, [parentRoutineId, energyLevel, routines, variant]);

  const handleAddStep = () => {
    if (newStep.trim()) {
      setSimplifiedSteps(prev => [...prev, newStep.trim()]);
      setNewStep('');
    }
  };

  const handleRemoveStep = (index: number) => {
    setSimplifiedSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (!simplifiedSteps.includes(suggestion)) {
      setSimplifiedSteps(prev => [...prev, suggestion]);
    }
  };

  const handleSave = () => {
    if (!parentRoutineId || !name.trim()) return;

    onSave({
      parentRoutineId,
      name: name.trim(),
      energyLevel,
      simplifiedSteps,
      timeMultiplier,
      skipThreshold,
      aiSuggestions,
    });

    onOpenChange(false);
  };

  const isEditing = !!variant;
  const canSave = parentRoutineId && name.trim();
  const selectedRoutine = routines.find(r => r.id === parentRoutineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-primary" />
            {isEditing ? 'Edit Routine Variant' : 'Create Low-Energy Variant'}
          </DialogTitle>
          <DialogDescription>
            Create a simplified version of a routine for when you have less energy.
            It's okay to do less - that's still better than doing nothing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Parent Routine Selection */}
          <div className="space-y-2">
            <Label>Base Routine</Label>
            <Select value={parentRoutineId} onValueChange={setParentRoutineId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a routine to create a variant for" />
              </SelectTrigger>
              <SelectContent>
                {routines.map((routine) => (
                  <SelectItem key={routine.id} value={routine.id}>
                    <div className="flex items-center gap-2">
                      <span>{routine.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {routine.steps?.length || 0} steps
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRoutine && (
              <p className="text-sm text-muted-foreground">
                Original: {selectedRoutine.steps?.length || 0} steps,{' '}
                ~{selectedRoutine.steps?.reduce((sum, s) => sum + (s.estimatedMinutes || 5), 0) || 15} min
              </p>
            )}
          </div>

          {/* Variant Name */}
          <div className="space-y-2">
            <Label htmlFor="variant-name">Variant Name</Label>
            <Input
              id="variant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Quick Morning Routine"
            />
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <Label>Energy Level This Variant Is For</Label>
            <div className="grid grid-cols-2 gap-3">
              {ENERGY_LEVELS.map((level) => {
                const Icon = level.icon;
                const isSelected = energyLevel === level.id;
                return (
                  <Card
                    key={level.id}
                    className={cn(
                      'cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    )}
                    onClick={() => setEnergyLevel(level.id as RoutineVariant['energyLevel'])}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Icon className={cn('w-5 h-5', level.color)} />
                      <div>
                        <div className="font-medium text-sm">{level.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {level.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Simplified Steps */}
          <div className="space-y-3">
            <Label>Simplified Steps</Label>
            <p className="text-sm text-muted-foreground">
              What's the minimum version? What can you skip or simplify?
            </p>

            {/* Existing steps */}
            {simplifiedSteps.length > 0 && (
              <div className="space-y-2">
                {simplifiedSteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg"
                  >
                    <span className="text-sm flex-1">{step}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new step */}
            <div className="flex gap-2">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Add a simplified step..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
              />
              <Button variant="outline" onClick={handleAddStep} disabled={!newStep.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SIMPLIFICATIONS.filter(s => !simplifiedSteps.includes(s))
                  .slice(0, 4)
                  .map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleAddSuggestion(suggestion)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {suggestion}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          {/* Time Multiplier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Adjustment
              </Label>
              <span className="text-sm text-muted-foreground">
                {timeMultiplier < 1
                  ? `${Math.round((1 - timeMultiplier) * 100)}% faster`
                  : timeMultiplier > 1
                    ? `${Math.round((timeMultiplier - 1) * 100)}% more time`
                    : 'Same time'}
              </span>
            </div>
            <Slider
              value={[timeMultiplier]}
              onValueChange={([value]) => setTimeMultiplier(value)}
              min={0.25}
              max={2}
              step={0.25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>25% time</span>
              <span>Same</span>
              <span>2x time</span>
            </div>
          </div>

          {/* Skip Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Skip Threshold</Label>
              <span className="text-sm text-muted-foreground">
                Energy level {skipThreshold}/10 or below
              </span>
            </div>
            <Slider
              value={[skipThreshold]}
              onValueChange={([value]) => setSkipThreshold(value)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              When your energy is at or below this level, this variant will be suggested
              instead of the full routine.
            </p>
          </div>

          {/* Preview comparison */}
          {selectedRoutine && simplifiedSteps.length > 0 && (
            <div className="p-4 bg-accent/30 rounded-lg space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Comparison
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Full version:</p>
                  <p className="font-medium">{selectedRoutine.steps?.length || 0} steps</p>
                  <p className="text-muted-foreground">
                    ~{selectedRoutine.steps?.reduce((sum, s) => sum + (s.estimatedMinutes || 5), 0) || 15} min
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">This variant:</p>
                  <p className="font-medium">{simplifiedSteps.length} steps</p>
                  <p className="text-muted-foreground">
                    ~{Math.round((selectedRoutine.steps?.reduce((sum, s) => sum + (s.estimatedMinutes || 5), 0) || 15) * timeMultiplier)} min
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? 'Save Changes' : 'Create Variant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RoutineVariantEditor;
