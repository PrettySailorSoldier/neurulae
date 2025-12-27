import { useState } from 'react';
import { Save, FolderOpen, Trash2, Check, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DayTemplate, TimeBlock, ScheduledRoutine } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ROUTINE_STORAGE_KEYS } from '@/types';

interface DayTemplateManagerProps {
  mode: 'save' | 'load';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTimeBlocks?: TimeBlock[];
  currentScheduledRoutines?: ScheduledRoutine[];
  onLoadTemplate?: (template: DayTemplate, mode: 'replace' | 'merge') => void;
}

export function DayTemplateManager({
  mode,
  open,
  onOpenChange,
  currentTimeBlocks = [],
  currentScheduledRoutines = [],
  onLoadTemplate,
}: DayTemplateManagerProps) {
  const [templates, setTemplates] = useLocalStorage<DayTemplate[]>(ROUTINE_STORAGE_KEYS.DAY_TEMPLATES, []);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DayTemplate | null>(null);
  const [loadMode, setLoadMode] = useState<'replace' | 'merge'>('replace');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate: DayTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      timeBlocks: [
        ...currentTimeBlocks.map(block => ({
          startTime: block.startTime,
          endTime: block.endTime,
          type: 'time_block' as const,
          blockName: block.title,
          color: block.color,
        })),
        ...currentScheduledRoutines.map(routine => ({
          startTime: routine.scheduledStartTime,
          endTime: calculateEndTime(routine.scheduledStartTime, routine.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0)),
          type: 'routine' as const,
          routineId: routine.routineId,
        })),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timesUsed: 0,
    };

    setTemplates([...templates, newTemplate]);
    setTemplateName('');
    setTemplateDescription('');
    onOpenChange(false);
  };

  const handleLoadTemplate = () => {
    if (selectedTemplate && onLoadTemplate) {
      onLoadTemplate(selectedTemplate, loadMode);

      // Update usage count
      setTemplates(templates.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, timesUsed: t.timesUsed + 1 }
          : t
      ));

      onOpenChange(false);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    setDeleteConfirmId(null);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === 'save' ? (
                <>
                  <Save className="h-5 w-5" />
                  Save Day as Template
                </>
              ) : (
                <>
                  <FolderOpen className="h-5 w-5" />
                  Load Day Template
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {mode === 'save'
                ? 'Save your current schedule as a reusable template'
                : 'Apply a saved template to your schedule'
              }
            </DialogDescription>
          </DialogHeader>

          {mode === 'save' ? (
            // Save mode
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Ideal Work Day, Lazy Sunday"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description (optional)</Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="When do you use this template?"
                  className="h-20"
                />
              </div>

              {/* Preview of what will be saved */}
              <div className="space-y-2">
                <Label>Will include:</Label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{currentTimeBlocks.length} time blocks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{currentScheduledRoutines.length} scheduled routines</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Load mode
            <div className="space-y-4 py-4">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">No templates saved</p>
                  <p className="text-sm text-muted-foreground">
                    Save your current schedule as a template first
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-4">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className={`w-full p-3 border rounded-lg text-left transition-colors ${
                            selectedTemplate?.id === template.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{template.name}</h4>
                              {template.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {template.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{template.timeBlocks.length} items</span>
                                <span>Used {template.timesUsed}x</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(template.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>

                  {selectedTemplate && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label>How to apply:</Label>
                      <RadioGroup
                        value={loadMode}
                        onValueChange={(v) => setLoadMode(v as 'replace' | 'merge')}
                        className="space-y-2"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="replace" id="replace" />
                          <div>
                            <Label htmlFor="replace" className="cursor-pointer">Replace current schedule</Label>
                            <p className="text-xs text-muted-foreground">
                              Clears today's schedule and loads the template
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="merge" id="merge" />
                          <div>
                            <Label htmlFor="merge" className="cursor-pointer">Add to current schedule</Label>
                            <p className="text-xs text-muted-foreground">
                              Merges template with existing items (may have conflicts)
                            </p>
                          </div>
                        </div>
                      </RadioGroup>

                      {loadMode === 'merge' && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded text-xs">
                          <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-yellow-600">
                            If items overlap, you'll need to resolve conflicts manually
                          </span>
                        </div>
                      )}

                      {/* Template preview */}
                      <div className="space-y-1">
                        <Label className="text-xs">Template contents:</Label>
                        <div className="space-y-1 max-h-24 overflow-y-auto text-xs">
                          {selectedTemplate.timeBlocks.map((block, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                              <span>{formatTime(block.startTime)}</span>
                              <span>-</span>
                              <span>{formatTime(block.endTime)}</span>
                              <span className="flex-1 truncate">
                                {block.type === 'routine' ? 'Routine' : block.blockName}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {block.type === 'routine' ? 'Routine' : 'Block'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {mode === 'save' ? (
              <Button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Template
              </Button>
            ) : (
              <Button
                onClick={handleLoadTemplate}
                disabled={!selectedTemplate}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Load Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteTemplate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, mins] = startTime.split(':').map(Number);
  const totalMins = hours * 60 + mins + durationMinutes;
  const endHours = Math.floor(totalMins / 60) % 24;
  const endMins = totalMins % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}
