import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Clock, Save, X, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Routine, RoutineStep, RoutinePreset, RoutineFormData } from '@/types';
import { ROUTINE_CATEGORIES } from '@/data/routinePresets';
import { cn } from '@/lib/utils';

interface RoutineBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | null; // If editing
  preset?: RoutinePreset | null; // If creating from template
  onSave: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'timesCompleted' | 'lastUsedAt'>) => void;
}

const EMOJI_OPTIONS = ['🌅', '☀️', '💼', '🌙', '🏃', '🧘', '📚', '💪', '🎯', '✨', '🚀', '🧹', '🛁', '☕'];

const DEFAULT_STEP: Omit<RoutineStep, 'id'> = {
  name: '',
  estimatedMinutes: 5,
  notes: '',
  isFlexible: false,
  order: 0,
  status: 'pending',
};

export function RoutineBuilder({
  open,
  onOpenChange,
  routine,
  preset,
  onSave,
}: RoutineBuilderProps) {
  const [formData, setFormData] = useState<RoutineFormData>({
    name: '',
    description: '',
    icon: '📋',
    color: '#607D8B',
    anchorType: 'flexible',
    anchorTime: '07:00',
    repeatSchedule: { type: 'none' },
    steps: [],
    autoAdvance: false,
    showNotifications: true,
    allowSkipping: true,
    category: 'custom',
  });

  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      if (routine) {
        // Editing existing routine
        setFormData({
          name: routine.name,
          description: routine.description || '',
          icon: routine.icon || '📋',
          color: routine.color || '#607D8B',
          anchorType: routine.anchorType,
          anchorTime: routine.anchorTime || '07:00',
          repeatSchedule: routine.repeatSchedule || { type: 'none' },
          steps: routine.steps.map(s => ({
            id: s.id,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            notes: s.notes,
            isFlexible: s.isFlexible,
            order: s.order,
          })),
          autoAdvance: routine.autoAdvance,
          showNotifications: routine.showNotifications,
          allowSkipping: routine.allowSkipping,
          category: routine.category || 'custom',
        });
      } else if (preset) {
        // Creating from template
        const category = ROUTINE_CATEGORIES.find(c => c.id === preset.category);
        setFormData({
          name: preset.name,
          description: preset.description,
          icon: category?.icon || '📋',
          color: category?.color || '#607D8B',
          anchorType: 'flexible',
          anchorTime: '07:00',
          repeatSchedule: { type: 'none' },
          steps: preset.steps.map((s, idx) => ({
            id: crypto.randomUUID(),
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            notes: s.notes,
            isFlexible: s.isFlexible,
            order: idx,
          })),
          autoAdvance: false,
          showNotifications: true,
          allowSkipping: true,
          category: preset.category || 'custom',
        });
      } else {
        // New routine
        setFormData({
          name: '',
          description: '',
          icon: '📋',
          color: '#607D8B',
          anchorType: 'flexible',
          anchorTime: '07:00',
          repeatSchedule: { type: 'none' },
          steps: [{ ...DEFAULT_STEP, id: crypto.randomUUID(), order: 0 }],
          autoAdvance: false,
          showNotifications: true,
          allowSkipping: true,
          category: 'custom',
        });
      }
      setExpandedSteps(new Set());
      setErrors({});
    }
  }, [open, routine, preset]);

  // Calculate totals
  const totalMinutes = useMemo(() => {
    return formData.steps.reduce((sum, step) => sum + (step.estimatedMinutes || 0), 0);
  }, [formData.steps]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const calculateEndTime = () => {
    if (formData.anchorType !== 'fixed_start' || !formData.anchorTime) return null;
    const [hours, minutes] = formData.anchorTime.split(':').map(Number);
    const totalMins = hours * 60 + minutes + totalMinutes;
    const endHours = Math.floor(totalMins / 60) % 24;
    const endMins = totalMins % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          ...DEFAULT_STEP,
          id: crypto.randomUUID(),
          order: prev.steps.length,
        },
      ],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    }));
  };

  const handleUpdateStep = (index: number, updates: Partial<RoutineStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.steps.length) return;

    setFormData(prev => {
      const newSteps = [...prev.steps];
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      return {
        ...prev,
        steps: newSteps.map((s, i) => ({ ...s, order: i })),
      };
    });
  };

  const toggleStepExpanded = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Routine name is required';
    }

    formData.steps.forEach((step, idx) => {
      if (!step.name.trim()) {
        newErrors[`step_${idx}`] = 'Step name is required';
      }
    });

    if (formData.steps.length === 0) {
      newErrors.steps = 'Add at least one step';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon,
      color: formData.color,
      totalEstimatedMinutes: totalMinutes,
      anchorType: formData.anchorType,
      anchorTime: formData.anchorType !== 'flexible' ? formData.anchorTime : undefined,
      repeatSchedule: formData.repeatSchedule,
      steps: formData.steps.map((s, idx) => ({
        id: s.id || crypto.randomUUID(),
        name: s.name.trim(),
        estimatedMinutes: s.estimatedMinutes || 5,
        notes: s.notes?.trim() || undefined,
        isFlexible: s.isFlexible || false,
        order: idx,
        status: 'pending' as const,
      })),
      isTemplate: true,
      category: formData.category,
      autoAdvance: formData.autoAdvance,
      showNotifications: formData.showNotifications,
      allowSkipping: formData.allowSkipping,
    });

    onOpenChange(false);
  };

  const endTime = calculateEndTime();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {routine ? 'Edit Routine' : preset ? 'Create from Template' : 'Create New Routine'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex gap-3">
                {/* Icon Picker */}
                <div className="flex-shrink-0">
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select value={formData.icon} onValueChange={(v) => setFormData(prev => ({ ...prev, icon: v }))}>
                    <SelectTrigger className="w-16 h-10">
                      <SelectValue>
                        <span className="text-xl">{formData.icon}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="grid grid-cols-7 gap-1 p-2">
                        {EMOJI_OPTIONS.map(emoji => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-lg"
                            onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div className="flex-1">
                  <Label htmlFor="name">Routine Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Morning Routine"
                    className={cn(errors.name && 'border-destructive')}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this routine for?"
                  className="h-20"
                />
              </div>

              {/* Category */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => {
                      const cat = ROUTINE_CATEGORIES.find(c => c.id === v);
                      setFormData(prev => ({
                        ...prev,
                        category: v as Routine['category'],
                        color: cat?.color || prev.color,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTINE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            {cat.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Anchor Time */}
            <div className="space-y-3 border-t pt-4">
              <Label>Timing</Label>
              <RadioGroup
                value={formData.anchorType}
                onValueChange={(v) => setFormData(prev => ({ ...prev, anchorType: v as Routine['anchorType'] }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="flexible" />
                  <Label htmlFor="flexible" className="font-normal cursor-pointer">
                    Flexible (no set time)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed_start" id="fixed_start" />
                  <Label htmlFor="fixed_start" className="font-normal cursor-pointer">
                    Starts at specific time
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="end_by" id="end_by" />
                  <Label htmlFor="end_by" className="font-normal cursor-pointer">
                    Must finish by time
                  </Label>
                </div>
              </RadioGroup>

              {formData.anchorType !== 'flexible' && (
                <div className="flex items-center gap-2 ml-6">
                  <Input
                    type="time"
                    value={formData.anchorTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, anchorTime: e.target.value }))}
                    className="w-32"
                  />
                  {endTime && formData.anchorType === 'fixed_start' && (
                    <span className="text-sm text-muted-foreground">
                      → Ends at {endTime}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Repeat Schedule */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Repeat this routine</Label>
                <Switch
                  checked={formData.repeatSchedule?.type !== 'none'}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      repeatSchedule: checked ? { type: 'daily' } : { type: 'none' },
                    }))
                  }
                />
              </div>

              {formData.repeatSchedule?.type !== 'none' && (
                <Select
                  value={formData.repeatSchedule?.type || 'daily'}
                  onValueChange={(v) =>
                    setFormData(prev => ({
                      ...prev,
                      repeatSchedule: { type: v as 'daily' | 'weekdays' | 'weekends' | 'specific_days' },
                    }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="weekdays">Weekdays only</SelectItem>
                    <SelectItem value="weekends">Weekends only</SelectItem>
                    <SelectItem value="specific_days">Specific days</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {formData.repeatSchedule?.type === 'specific_days' && (
                <div className="flex flex-wrap gap-2">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
                    <Button
                      key={day}
                      variant={formData.repeatSchedule?.days?.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const currentDays = formData.repeatSchedule?.days || [];
                        const newDays = currentDays.includes(day)
                          ? currentDays.filter(d => d !== day)
                          : [...currentDays, day];
                        setFormData(prev => ({
                          ...prev,
                          repeatSchedule: { ...prev.repeatSchedule!, days: newDays },
                        }));
                      }}
                    >
                      {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDuration(totalMinutes)} total
                </div>
              </div>

              {errors.steps && <p className="text-xs text-destructive">{errors.steps}</p>}

              <div className="space-y-2">
                {formData.steps.map((step, index) => {
                  const isExpanded = expandedSteps.has(index);
                  const hasError = errors[`step_${index}`];

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'border rounded-lg p-3',
                        hasError && 'border-destructive'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {/* Drag handle and reorder buttons */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === formData.steps.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Step number */}
                        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>

                        {/* Step name */}
                        <Input
                          value={step.name}
                          onChange={(e) => handleUpdateStep(index, { name: e.target.value })}
                          placeholder="Step name"
                          className="flex-1"
                        />

                        {/* Duration */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleUpdateStep(index, {
                              estimatedMinutes: Math.max(1, (step.estimatedMinutes || 5) - 5)
                            })}
                          >
                            -
                          </Button>
                          <div className="w-12 text-center text-sm">
                            {step.estimatedMinutes || 5}m
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleUpdateStep(index, {
                              estimatedMinutes: (step.estimatedMinutes || 5) + 5
                            })}
                          >
                            +
                          </Button>
                        </div>

                        {/* Expand notes */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleStepExpanded(index)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveStep(index)}
                          disabled={formData.steps.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-3 pl-10 space-y-3">
                          <div>
                            <Label className="text-xs">Notes / Instructions</Label>
                            <Textarea
                              value={step.notes || ''}
                              onChange={(e) => handleUpdateStep(index, { notes: e.target.value })}
                              placeholder="Add tips, reminders, or instructions for this step..."
                              className="h-16 text-sm"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`flexible_${index}`}
                              checked={step.isFlexible}
                              onCheckedChange={(checked) =>
                                handleUpdateStep(index, { isFlexible: !!checked })
                              }
                            />
                            <Label htmlFor={`flexible_${index}`} className="text-sm font-normal cursor-pointer">
                              Flexible (can be reordered during execution)
                            </Label>
                          </div>

                          {/* Quick duration presets */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Quick set:</span>
                            {[5, 10, 15, 30].map(mins => (
                              <Button
                                key={mins}
                                variant={step.estimatedMinutes === mins ? 'secondary' : 'outline'}
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleUpdateStep(index, { estimatedMinutes: mins })}
                              >
                                {mins}m
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {hasError && (
                        <p className="text-xs text-destructive mt-1 pl-10">{hasError}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={handleAddStep}>
                <Plus className="h-4 w-4" />
                Add Step
              </Button>
            </div>

            {/* Settings */}
            <div className="space-y-4 border-t pt-4">
              <Label>Settings</Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-advance</p>
                    <p className="text-xs text-muted-foreground">Automatically start next step when timer ends</p>
                  </div>
                  <Switch
                    checked={formData.autoAdvance}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAdvance: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-xs text-muted-foreground">Show notifications when steps complete</p>
                  </div>
                  <Switch
                    checked={formData.showNotifications}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Allow skipping</p>
                    <p className="text-xs text-muted-foreground">Allow skipping steps during execution</p>
                  </div>
                  <Switch
                    checked={formData.allowSkipping}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowSkipping: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {routine ? 'Save Changes' : 'Create Routine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
