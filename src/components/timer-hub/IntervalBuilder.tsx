import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IntervalStep, HierarchicalInterval, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  GripVertical,
  Trash2,
  Play,
  Edit2,
  Clock,
  Layers,
  BookTemplate,
  X,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  IntervalTemplate,
  DEFAULT_INTERVAL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateDuration,
  formatTemplateDuration,
  CUSTOM_TEMPLATES_KEY,
} from '@/data/intervalTemplates';
import { toast } from 'sonner';

// Color palette for steps
const STEP_COLORS = [
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

interface IntervalBuilderProps {
  tasks?: Task[];
  prefilledTask?: Task | null; // Task to pre-fill the builder with
  onStartInterval: (interval: Omit<HierarchicalInterval, 'currentStepIndex' | 'elapsedDuration'>) => void;
  onLinkTemplateToTask?: (taskId: string, templateId: string) => void; // Save template link to task
}

interface StepEditorState {
  isOpen: boolean;
  editingStep: IntervalStep | null;
  editingIndex: number | null;
}

export function IntervalBuilder({ tasks = [], prefilledTask, onStartInterval, onLinkTemplateToTask }: IntervalBuilderProps) {
  // Parent interval state
  const [intervalName, setIntervalName] = useState('');
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(undefined);
  const [steps, setSteps] = useState<IntervalStep[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Custom templates from localStorage
  const [customTemplates, setCustomTemplates] = useLocalStorage<IntervalTemplate[]>(
    CUSTOM_TEMPLATES_KEY,
    []
  );

  // Template selector dialog state
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Save as template dialog state
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('📋');

  // Step editor dialog state
  const [stepEditor, setStepEditor] = useState<StepEditorState>({
    isOpen: false,
    editingStep: null,
    editingIndex: null,
  });

  // Step editor form state
  const [stepName, setStepName] = useState('');
  const [stepMinutes, setStepMinutes] = useState(5);
  const [stepSeconds, setStepSeconds] = useState(0);
  const [stepColor, setStepColor] = useState<string | undefined>(undefined);

  // Initialize from prefilled task
  useEffect(() => {
    if (prefilledTask && !hasInitialized) {
      setHasInitialized(true);
      setIntervalName(prefilledTask.title);
      setLinkedTaskId(prefilledTask.id);

      // If task has a linked template, load it
      if (prefilledTask.linkedIntervalTemplateId) {
        const template = [...DEFAULT_INTERVAL_TEMPLATES, ...customTemplates].find(
          t => t.id === prefilledTask.linkedIntervalTemplateId
        );
        if (template) {
          setSteps(
            template.steps.map(step => ({
              id: crypto.randomUUID(),
              name: step.name,
              duration: step.duration,
              color: step.color,
              isComplete: false,
            }))
          );
          toast.success(`Loaded saved timer plan`, {
            description: `"${template.name}" is ready to run`,
          });
          return;
        }
      }

      // If task has subtasks, convert them to steps
      if (prefilledTask.subtasks && prefilledTask.subtasks.length > 0) {
        const subtaskSteps: IntervalStep[] = prefilledTask.subtasks.map((subtask, index) => ({
          id: crypto.randomUUID(),
          name: subtask.title,
          duration: (subtask.estimatedMinutes || 10) * 60, // default 10 min per subtask
          color: STEP_COLORS[index % STEP_COLORS.length].value,
          isComplete: false,
        }));
        setSteps(subtaskSteps);
        toast.success(`Created steps from subtasks`, {
          description: `${subtaskSteps.length} subtasks converted to timer steps`,
        });
      }
      // If task has an estimate but no subtasks, suggest a breakdown
      else if (prefilledTask.estimatedMinutes && prefilledTask.estimatedMinutes > 0) {
        const suggestedSteps = generateSuggestedSteps(prefilledTask.estimatedMinutes);
        setSteps(suggestedSteps);
        toast.success(`Generated suggested breakdown`, {
          description: `Based on ${prefilledTask.estimatedMinutes}m estimate. Feel free to adjust!`,
        });
      }
    }
  }, [prefilledTask, hasInitialized, customTemplates]);

  // Generate suggested step breakdown based on estimated minutes
  const generateSuggestedSteps = (estimatedMinutes: number): IntervalStep[] => {
    const colors = STEP_COLORS.map(c => c.value);

    if (estimatedMinutes <= 15) {
      // Short task: just one focus block
      return [{
        id: crypto.randomUUID(),
        name: 'Focus',
        duration: estimatedMinutes * 60,
        color: colors[5], // Blue
        isComplete: false,
      }];
    } else if (estimatedMinutes <= 30) {
      // Medium-short: 2-3 blocks
      const blockSize = Math.floor(estimatedMinutes / 3);
      return [
        { id: crypto.randomUUID(), name: 'Getting started', duration: blockSize * 60, color: colors[4], isComplete: false },
        { id: crypto.randomUUID(), name: 'Main work', duration: (estimatedMinutes - blockSize * 2) * 60, color: colors[5], isComplete: false },
        { id: crypto.randomUUID(), name: 'Wrap up', duration: blockSize * 60, color: colors[3], isComplete: false },
      ];
    } else if (estimatedMinutes <= 60) {
      // Medium: work blocks with short break
      return [
        { id: crypto.randomUUID(), name: 'Focus Block 1', duration: 25 * 60, color: colors[5], isComplete: false },
        { id: crypto.randomUUID(), name: 'Quick break', duration: 5 * 60, color: colors[3], isComplete: false },
        { id: crypto.randomUUID(), name: 'Focus Block 2', duration: (estimatedMinutes - 30) * 60, color: colors[6], isComplete: false },
      ];
    } else {
      // Long task: Pomodoro-style with multiple blocks
      const numBlocks = Math.ceil(estimatedMinutes / 30);
      const stepList: IntervalStep[] = [];
      let remainingMins = estimatedMinutes;

      for (let i = 0; i < numBlocks && remainingMins > 0; i++) {
        const workMins = Math.min(25, remainingMins);
        stepList.push({
          id: crypto.randomUUID(),
          name: `Focus Block ${i + 1}`,
          duration: workMins * 60,
          color: colors[(i * 2) % colors.length],
          isComplete: false,
        });
        remainingMins -= workMins;

        // Add break between blocks (but not after last block)
        if (remainingMins > 0 && i < numBlocks - 1) {
          stepList.push({
            id: crypto.randomUUID(),
            name: 'Break',
            duration: 5 * 60,
            color: colors[3], // Green
            isComplete: false,
          });
        }
      }

      return stepList;
    }
  };

  // Combine default and custom templates
  const allTemplates = useMemo(() => {
    return [...DEFAULT_INTERVAL_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) return allTemplates;
    return allTemplates.filter(t => t.category === selectedCategory);
  }, [allTemplates, selectedCategory]);

  // Calculate totals
  const totalDuration = useMemo(() => {
    return steps.reduce((sum, step) => sum + step.duration, 0);
  }, [steps]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  const formatStepDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  // Open step editor for new step
  const handleAddStep = () => {
    setStepName('');
    setStepMinutes(5);
    setStepSeconds(0);
    setStepColor(undefined);
    setStepEditor({
      isOpen: true,
      editingStep: null,
      editingIndex: null,
    });
  };

  // Open step editor for existing step
  const handleEditStep = (step: IntervalStep, index: number) => {
    const mins = Math.floor(step.duration / 60);
    const secs = step.duration % 60;
    setStepName(step.name);
    setStepMinutes(mins);
    setStepSeconds(secs);
    setStepColor(step.color);
    setStepEditor({
      isOpen: true,
      editingStep: step,
      editingIndex: index,
    });
  };

  // Save step from editor
  const handleSaveStep = () => {
    const duration = stepMinutes * 60 + stepSeconds;
    if (!stepName.trim() || duration <= 0) return;

    if (stepEditor.editingIndex !== null) {
      // Editing existing step
      setSteps(prev =>
        prev.map((s, i) =>
          i === stepEditor.editingIndex
            ? { ...s, name: stepName.trim(), duration, color: stepColor }
            : s
        )
      );
    } else {
      // Adding new step
      const newStep: IntervalStep = {
        id: crypto.randomUUID(),
        name: stepName.trim(),
        duration,
        color: stepColor,
        isComplete: false,
      };
      setSteps(prev => [...prev, newStep]);
    }

    setStepEditor({ isOpen: false, editingStep: null, editingIndex: null });
  };

  // Delete step
  const handleDeleteStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag-and-drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setSteps(items);
  };

  // Start the timer
  const handleStartTimer = () => {
    if (steps.length === 0) return;

    const interval: Omit<HierarchicalInterval, 'currentStepIndex' | 'elapsedDuration'> = {
      id: crypto.randomUUID(),
      name: intervalName.trim() || 'Untitled Interval',
      steps: steps.map(s => ({ ...s, isComplete: false })),
      taskId: linkedTaskId,
      totalDuration,
    };

    onStartInterval(interval);
  };

  // Reset the builder
  const handleReset = () => {
    setIntervalName('');
    setLinkedTaskId(undefined);
    setSteps([]);
  };

  // Load a template into the builder
  const handleLoadTemplate = (template: IntervalTemplate) => {
    setIntervalName(template.name);
    setSteps(
      template.steps.map(step => ({
        id: crypto.randomUUID(),
        name: step.name,
        duration: step.duration,
        color: step.color,
        isComplete: false,
      }))
    );
    setTemplateSelectorOpen(false);
    toast.success(`Loaded "${template.name}" template`, {
      description: 'You can edit the steps before starting',
    });
  };

  // Delete a custom template
  const handleDeleteCustomTemplate = (templateId: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted');
  };

  // Save current steps as a new template
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim() || steps.length === 0) return;

    const newTemplate: IntervalTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || `${steps.length} steps`,
      icon: newTemplateIcon,
      category: 'custom',
      isDefault: false,
      steps: steps.map(s => ({
        name: s.name,
        duration: s.duration,
        color: s.color,
      })),
    };

    setCustomTemplates(prev => [...prev, newTemplate]);
    setSaveTemplateOpen(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateIcon('📋');
    toast.success(`Template "${newTemplate.name}" saved!`, {
      description: 'Find it in "My Templates"',
    });
  };

  return (
    <div className="space-y-6">
      {/* Template Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setTemplateSelectorOpen(true)}
          variant="outline"
          className="flex-1 h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        >
          <BookTemplate className="h-5 w-5 mr-2" />
          Start from Template
        </Button>
        {steps.length > 0 && (
          <Button
            onClick={() => setSaveTemplateOpen(true)}
            variant="outline"
            className="h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
        )}
      </div>

      {/* Parent Interval Name */}
      <div className="space-y-2">
        <Label htmlFor="interval-name" className="text-sm font-medium">
          Interval Name
        </Label>
        <Input
          id="interval-name"
          value={intervalName}
          onChange={(e) => setIntervalName(e.target.value)}
          placeholder="e.g., Clean Kitchen, Morning Routine..."
          className="bg-input border-border"
        />
      </div>

      {/* Link to Task (Optional) */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Link to Task (Optional)</Label>
          <Select value={linkedTaskId || 'none'} onValueChange={(v) => setLinkedTaskId(v === 'none' ? undefined : v)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select a task..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No linked task</SelectItem>
              {tasks.filter(t => !t.completed).map(task => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Steps
          </h4>
          <Button onClick={handleAddStep} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="mb-2">No steps yet</p>
            <p className="text-sm">Add steps to build your interval sequence</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'space-y-2 transition-colors rounded-lg',
                    snapshot.isDraggingOver && 'bg-primary/5 p-2'
                  )}
                >
                  {steps.map((step, index) => (
                    <Draggable key={step.id} draggableId={step.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-lg border bg-card border-border',
                            'hover:border-primary/50 transition-all cursor-pointer',
                            snapshot.isDragging && 'shadow-lg rotate-1 scale-105'
                          )}
                          onClick={() => handleEditStep(step, index)}
                        >
                          <div {...provided.dragHandleProps} onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          </div>

                          {/* Color dot */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: step.color || 'hsl(var(--primary))' }}
                          />

                          {/* Step info */}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{step.name}</span>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            <span>{formatStepDuration(step.duration)}</span>
                          </div>

                          {/* Edit button */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStep(step, index);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/20"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {/* Delete button */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStep(index);
                            }}
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive/20 hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Summary Section */}
      {steps.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground">Steps:</span>{' '}
                <span className="font-semibold">{steps.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-semibold text-primary">{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Timer Button */}
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={handleStartTimer}
          size="lg"
          className="bg-primary hover:bg-primary/90"
          disabled={steps.length === 0}
        >
          <Play className="h-5 w-5 mr-2" />
          Start Timer
        </Button>
        {steps.length > 0 && (
          <Button onClick={handleReset} variant="outline" size="lg">
            Reset
          </Button>
        )}
      </div>

      {/* Step Editor Dialog */}
      <Dialog open={stepEditor.isOpen} onOpenChange={(open) => {
        if (!open) {
          setStepEditor({ isOpen: false, editingStep: null, editingIndex: null });
        }
      }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {stepEditor.editingIndex !== null ? 'Edit Step' : 'Add Step'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step Name */}
            <div className="space-y-2">
              <Label htmlFor="step-name">Step Name</Label>
              <Input
                id="step-name"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="e.g., Dishes, Warm-up..."
                className="bg-input border-border"
                autoFocus
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={stepMinutes}
                    onChange={(e) => setStepMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center bg-input border-border"
                    min="0"
                    max="120"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={stepSeconds}
                    onChange={(e) => setStepSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-16 text-center bg-input border-border"
                    min="0"
                    max="59"
                  />
                  <span className="text-sm text-muted-foreground">sec</span>
                </div>
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-2">
              <Label>Color (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {/* Default/no color option */}
                <button
                  onClick={() => setStepColor(undefined)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    'bg-gradient-to-br from-primary to-primary/60',
                    stepColor === undefined
                      ? 'border-foreground ring-2 ring-primary/50 scale-110'
                      : 'border-border hover:scale-105'
                  )}
                  title="Default"
                />
                {STEP_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setStepColor(color.value)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      stepColor === color.value
                        ? 'border-foreground ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color.value, borderColor: stepColor === color.value ? color.value : undefined }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStepEditor({ isOpen: false, editingStep: null, editingIndex: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStep}
              disabled={!stepName.trim() || (stepMinutes === 0 && stepSeconds === 0)}
            >
              {stepEditor.editingIndex !== null ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selector Dialog */}
      <Dialog open={templateSelectorOpen} onOpenChange={setTemplateSelectorOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookTemplate className="h-5 w-5" />
              Choose a Template
            </DialogTitle>
          </DialogHeader>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
            <Button
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className="h-8"
            >
              All
            </Button>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedCategory === key ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(key)}
                className="h-8"
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Template Grid */}
          <ScrollArea className="h-[400px] pr-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No templates in this category yet</p>
                <p className="text-sm mt-1">Create one by saving your interval steps!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map(template => {
                  const duration = getTemplateDuration(template);
                  const categoryInfo = TEMPLATE_CATEGORIES[template.category];
                  const isCustom = !template.isDefault;

                  return (
                    <div
                      key={template.id}
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-pointer transition-all',
                        'bg-card hover:bg-primary/5 hover:border-primary',
                        'border-border hover:shadow-md'
                      )}
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{template.icon || categoryInfo?.icon}</span>
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        {isCustom && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomTemplate(template.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          <span>{template.steps.length} steps</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTemplateDuration(duration)}</span>
                        </div>
                        {isCustom && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] uppercase font-medium"
                            style={{ backgroundColor: categoryInfo?.color + '20', color: categoryInfo?.color }}
                          >
                            Custom
                          </span>
                        )}
                      </div>

                      {/* Step Preview */}
                      <div className="mt-3 flex items-center gap-1 overflow-hidden">
                        {template.steps.slice(0, 4).map((step, idx) => (
                          <div
                            key={idx}
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: step.color || 'hsl(var(--primary))' }}
                            title={step.name}
                          />
                        ))}
                        {template.steps.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{template.steps.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save as Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., My Morning Routine"
                className="bg-input border-border"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Input
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Brief description..."
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {['📋', '🧹', '🍳', '🚿', '💼', '✍️', '🌅', '🌙', '🧘', '💪', '🏃', '📚', '🎯', '⭐'].map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewTemplateIcon(icon)}
                    className={cn(
                      'w-10 h-10 rounded-lg border-2 text-xl transition-all',
                      'flex items-center justify-center',
                      newTemplateIcon === icon
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-border hover:border-primary/50 hover:scale-105'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Preview:</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{newTemplateIcon}</span>
                <div>
                  <div className="font-semibold">
                    {newTemplateName || 'Template Name'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {steps.length} steps • {formatDuration(totalDuration)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!newTemplateName.trim() || steps.length === 0}
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
