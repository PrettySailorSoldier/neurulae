import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Copy, 
  Trash2, 
  Check, 
  Plus,
  Briefcase,
  Coffee
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TimeBlock, DayTemplate } from '@/types';

interface DayTemplateManagerProps {
  currentBlocks: TimeBlock[];
  currentDayType: 'weekday' | 'weekend';
  onApplyTemplate: (template: DayTemplate) => void;
  onSaveAsTemplate: (name: string, suggestedFor: 'weekday' | 'weekend' | 'any') => void;
}

export function DayTemplateManager({
  currentBlocks,
  currentDayType,
  onApplyTemplate,
  onSaveAsTemplate
}: DayTemplateManagerProps) {
  const [templates, setTemplates] = useLocalStorage<DayTemplate[]>('neurulae-day-templates', []);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDayType, setNewTemplateDayType] = useState<'weekday' | 'weekend' | 'any'>('any');

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.suggestedFor === 'any' || t.suggestedFor === currentDayType
    );
  }, [templates, currentDayType]);

  const handleSave = () => {
    if (!newTemplateName.trim()) return;
    
    const newTemplate: DayTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName,
      description: `${currentBlocks.length} time blocks`,
      timeBlocks: currentBlocks.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'time_block',
        blockName: b.title,
        color: b.color
      })),
      suggestedFor: newTemplateDayType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timesUsed: 0
    };
    
    setTemplates([...templates, newTemplate]);
    onSaveAsTemplate(newTemplateName, newTemplateDayType);
    setNewTemplateName('');
    setIsSaveMode(false);
  };

  const handleDelete = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleApply = (template: DayTemplate) => {
    // Update usage count
    setTemplates(templates.map(t => 
      t.id === template.id 
        ? { ...t, timesUsed: t.timesUsed + 1, updatedAt: new Date().toISOString() }
        : t
    ));
    onApplyTemplate(template);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Day Templates</DialogTitle>
          <DialogDescription>
            Save your current schedule as a template or apply a saved template
          </DialogDescription>
        </DialogHeader>

        {isSaveMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Productive Weekday, Relaxed Sunday"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Best for</Label>
              <RadioGroup
                value={newTemplateDayType}
                onValueChange={(v) => setNewTemplateDayType(v as 'weekday' | 'weekend' | 'any')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekday" id="weekday" />
                  <Label htmlFor="weekday" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Weekdays
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekend" id="weekend" />
                  <Label htmlFor="weekend" className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    Weekends
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="any" />
                  <Label htmlFor="any">Any day</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                This will save your current {currentBlocks.length} time blocks as a reusable template.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSaveMode(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!newTemplateName.trim()} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Save current as template */}
            {currentBlocks.length > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsSaveMode(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Save current schedule as template
              </Button>
            )}

            {/* Template list */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates yet</p>
                    <p className="text-xs">Save your current schedule to create one</p>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <Card key={template.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {template.timeBlocks.length} blocks · Used {template.timesUsed} times
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {template.suggestedFor !== 'any' && (
                              <Badge variant="outline" className="text-xs">
                                {template.suggestedFor}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-4 border-t flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApply(template)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
