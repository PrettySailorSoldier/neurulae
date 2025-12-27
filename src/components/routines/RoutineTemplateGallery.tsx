import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Wand2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTINE_PRESETS, ROUTINE_CATEGORIES } from '@/data/routinePresets';
import { RoutinePreset } from '@/types';

interface RoutineTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (preset: RoutinePreset) => void;
  onUseAsIs: (preset: RoutinePreset) => void;
}

export function RoutineTemplateGallery({
  open,
  onOpenChange,
  onUseTemplate,
  onUseAsIs,
}: RoutineTemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  const filteredPresets = selectedCategory === 'all'
    ? ROUTINE_PRESETS
    : ROUTINE_PRESETS.filter(p => p.category === selectedCategory);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCategoryInfo = (categoryId: string | undefined) => {
    return ROUTINE_CATEGORIES.find(c => c.id === categoryId) || ROUTINE_CATEGORIES[5]; // custom as fallback
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Routine Templates
          </DialogTitle>
          <DialogDescription>
            Start with a pre-built routine template and customize it to fit your needs.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 min-h-0">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {ROUTINE_CATEGORIES.filter(c => c.id !== 'custom').map(category => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs gap-1">
                <span>{category.icon}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-4 pr-4">
            <div className="space-y-3">
              {filteredPresets.map(preset => {
                const category = getCategoryInfo(preset.category);
                const isExpanded = expandedPreset === preset.id;

                return (
                  <div
                    key={preset.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">{category.icon}</span>
                          <h3 className="font-medium">{preset.name}</h3>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color
                            }}
                          >
                            {category.label}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mt-1">
                          {preset.description}
                        </p>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(preset.estimatedMinutes)}
                          </span>
                          <span>{preset.steps.length} steps</span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {preset.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Expanded steps view */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-1">
                            {preset.steps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <span className="w-5 text-right text-muted-foreground flex-shrink-0">
                                  {idx + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span>{step.name}</span>
                                  {step.notes && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {step.notes}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {step.estimatedMinutes}m
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => setExpandedPreset(isExpanded ? null : preset.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => {
                          onUseTemplate(preset);
                          onOpenChange(false);
                        }}
                        className="gap-1"
                      >
                        <Wand2 className="h-3 w-3" />
                        Use This Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onUseAsIs(preset);
                          onOpenChange(false);
                        }}
                        className="gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Use As-Is
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredPresets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No templates in this category yet.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
