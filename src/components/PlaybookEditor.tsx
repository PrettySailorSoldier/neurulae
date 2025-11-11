import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Playbook, PlaybookStep } from '@/types';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlaybookEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook?: Playbook;
  onSave: (playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
}

const CATEGORIES = ['Cleaning', 'Cooking', 'Learning', 'Self-Care', 'Creative', 'Work', 'Health', 'Social', 'Other'];

export function PlaybookEditor({ open, onOpenChange, playbook, onSave, onDelete }: PlaybookEditorProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [title, setTitle] = useState(playbook?.title || '');
  const [description, setDescription] = useState(playbook?.description || '');
  const [category, setCategory] = useState(playbook?.category || 'Other');
  const [steps, setSteps] = useState<PlaybookStep[]>(playbook?.steps || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  
  // AI generation fields
  const [aiGoal, setAiGoal] = useState('');
  const [aiDetails, setAiDetails] = useState('');

  const handleAddStep = () => {
    const newStep: PlaybookStep = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      estimatedMinutes: 15,
      completed: false,
      order: steps.length,
      tips: [],
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (id: string, field: keyof PlaybookStep, value: any) => {
    setSteps(steps.map(step => step.id === id ? { ...step, [field]: value } : step));
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id).map((step, index) => ({ ...step, order: index })));
  };

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStepId || draggedStepId === targetStepId) return;

    const draggedIndex = steps.findIndex(s => s.id === draggedStepId);
    const targetIndex = steps.findIndex(s => s.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    // Update order property
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index,
    }));

    setSteps(reorderedSteps);
    setDraggedStepId(null);
  };

  const handleDragEnd = () => {
    setDraggedStepId(null);
  };

  const handleGenerateWithAI = async () => {
    if (!aiGoal.trim()) {
      toast({
        title: 'Goal required',
        description: 'Please describe what you want to accomplish',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-playbook', {
        body: {
          goal: aiGoal,
          details: aiDetails,
          category,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Generation failed',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setTitle(data.title);
      setSteps(data.steps);
      setMode('manual'); // Switch to manual mode to show and edit generated steps
      
      toast({
        title: 'Playbook generated! ✨',
        description: 'Review and edit the steps as needed',
      });
    } catch (error) {
      console.error('Error generating playbook:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate playbook',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please give your playbook a title',
        variant: 'destructive',
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: 'Steps required',
        description: 'Add at least one step to your playbook',
        variant: 'destructive',
      });
      return;
    }

    onSave({
      title,
      description,
      category,
      steps,
      isTemplate: false,
      linkedTaskIds: playbook?.linkedTaskIds || [],
      resetOnRecurrence: playbook?.resetOnRecurrence || false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{playbook ? 'Edit Playbook' : 'Create Playbook'}</DialogTitle>
        </DialogHeader>

        {!playbook && (
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setMode('manual')}
              variant={mode === 'manual' ? 'default' : 'outline'}
              className="flex-1"
            >
              Write Manually
            </Button>
            <Button
              onClick={() => setMode('ai')}
              variant={mode === 'ai' ? 'default' : 'outline'}
              className="flex-1"
            >
              ✨ Generate with AI
            </Button>
          </div>
        )}

        {mode === 'ai' && !playbook ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="aiGoal">What do you want to accomplish?</Label>
              <Input
                id="aiGoal"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g., Learn to play guitar, Organize my workspace..."
                className="bg-input border-border"
              />
            </div>

            <div>
              <Label htmlFor="aiDetails">Any specific details? (optional)</Label>
              <Textarea
                id="aiDetails"
                value={aiDetails}
                onChange={(e) => setAiDetails(e.target.value)}
                placeholder="Add any context that would help create better steps..."
                className="bg-input border-border"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                '✨ Generate Playbook'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Playbook title"
                className="bg-input border-border"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this playbook..."
                className="bg-input border-border"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button onClick={handleAddStep} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                  No steps yet. Add your first step!
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div 
                      key={step.id} 
                      className={`border border-border rounded-lg p-3 space-y-2 bg-card/50 cursor-move ${
                        draggedStepId === step.id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, step.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, step.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span className="text-sm font-semibold">Step {index + 1}</span>
                        <Button
                          onClick={() => handleDeleteStep(step.id)}
                          variant="ghost"
                          size="icon"
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={step.title}
                        onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                        placeholder="Step title"
                        className="bg-input border-border"
                      />
                      <Textarea
                        value={step.description}
                        onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
                        placeholder="Step description"
                        className="bg-input border-border"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Estimated time:</Label>
                        <Input
                          type="number"
                          value={step.estimatedMinutes}
                          onChange={(e) => handleUpdateStep(step.id, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                          className="w-20 bg-input border-border"
                          min="1"
                        />
                        <span className="text-xs text-muted-foreground">minutes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
                Save Playbook
              </Button>
              {playbook && onDelete && (
                <Button onClick={onDelete} variant="destructive">
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}