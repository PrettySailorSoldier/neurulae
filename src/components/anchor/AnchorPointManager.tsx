import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnchorPointCard } from './AnchorPointCard';
import { AnchorPointEditor } from './AnchorPointEditor';
import { useAnchorPoints } from '@/hooks/useAnchorPoints';
import { AnchorPoint, Playbook } from '@/types';
import {
  Anchor,
  Plus,
  Sun,
  Sunset,
  Moon,
  Zap,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AnchorPointManagerProps {
  playbooks?: Playbook[];
  onManageRoutines?: (anchor: AnchorPoint) => void;
  className?: string;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Anchor },
  { id: 'morning', label: 'Morning', icon: Sun },
  { id: 'midday', label: 'Midday', icon: Zap },
  { id: 'evening', label: 'Evening', icon: Sunset },
  { id: 'flex', label: 'Flex', icon: Moon },
] as const;

export function AnchorPointManager({
  playbooks = [],
  onManageRoutines,
  className,
}: AnchorPointManagerProps) {
  const {
    anchorPoints,
    activeAnchors,
    addAnchorPoint,
    updateAnchorPoint,
    deleteAnchorPoint,
    toggleAnchorActive,
    getNextAnchor,
  } = useAnchorPoints();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAnchor, setEditingAnchor] = useState<AnchorPoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Filter anchors by category
  const filteredAnchors = activeCategory === 'all'
    ? anchorPoints
    : anchorPoints.filter(anchor => anchor.category === activeCategory);

  // Get linked routine count for an anchor
  const getLinkedRoutineCount = (anchor: AnchorPoint) => {
    return anchor.linkedRoutineIds.filter(id =>
      playbooks.some(p => p.id === id)
    ).length;
  };

  // Next upcoming anchor
  const nextAnchor = getNextAnchor();

  // Handle save from editor
  const handleSaveAnchor = (anchorData: Omit<AnchorPoint, 'id' | 'createdAt'>) => {
    if (editingAnchor) {
      updateAnchorPoint(editingAnchor.id, anchorData);
    } else {
      addAnchorPoint(anchorData);
    }
    setEditingAnchor(null);
  };

  // Open editor for new anchor
  const handleCreateAnchor = () => {
    setEditingAnchor(null);
    setEditorOpen(true);
  };

  // Open editor for existing anchor
  const handleEditAnchor = (anchor: AnchorPoint) => {
    setEditingAnchor(anchor);
    setEditorOpen(true);
  };

  return (
    <TooltipProvider>
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Anchor className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Anchor Points</CardTitle>
                <CardDescription>
                  Reliable moments your routines attach to
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreateAnchor} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Anchor
            </Button>
          </div>

          {/* Next anchor indicator */}
          {nextAnchor && (
            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Next anchor:</span>
                <span className="font-medium">{nextAnchor.name}</span>
                <Badge variant="outline" className="text-xs">
                  {nextAnchor.triggerTime}
                </Badge>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {anchorPoints.length === 0 ? (
            <EmptyState onCreateAnchor={handleCreateAnchor} />
          ) : (
            <>
              {/* Category tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-4">
                  {CATEGORY_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count = tab.id === 'all'
                      ? anchorPoints.length
                      : anchorPoints.filter(a => a.category === tab.id).length;
                    
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">
                          {count}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value={activeCategory} className="mt-0">
                  <ScrollArea className="max-h-[500px] pr-4">
                    <div className="space-y-3">
                      {filteredAnchors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No anchors in this category</p>
                          <Button
                            variant="link"
                            onClick={handleCreateAnchor}
                            className="mt-2"
                          >
                            Create one
                          </Button>
                        </div>
                      ) : (
                        filteredAnchors.map((anchor) => (
                          <AnchorPointCard
                            key={anchor.id}
                            anchor={anchor}
                            linkedRoutineCount={getLinkedRoutineCount(anchor)}
                            onToggleActive={toggleAnchorActive}
                            onEdit={handleEditAnchor}
                            onDelete={deleteAnchorPoint}
                            onManageRoutines={onManageRoutines}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Summary footer */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{activeAnchors.length} active</span>
                  <span>{anchorPoints.length - activeAnchors.length} inactive</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Anchor points are reliable moments in your day. Attach routines to them
                      instead of strict times for more flexibility. Aim for 1-3 rock-solid anchors.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <AnchorPointEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        anchor={editingAnchor}
        onSave={handleSaveAnchor}
      />
    </TooltipProvider>
  );
}

// Empty state component
function EmptyState({ onCreateAnchor }: { onCreateAnchor: () => void }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Anchor className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-medium text-lg mb-2">No anchor points yet</h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
        Anchor points are reliable moments in your day that routines can attach to.
        Think of things like "morning coffee" or "when kids leave for school."
      </p>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 text-left">
          <Sun className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Morning anchors</span>
            <span className="text-muted-foreground block">
              Coffee, medication, partner leaving
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 text-left">
          <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Midday anchors</span>
            <span className="text-muted-foreground block">
              Lunch break, school pickup, workout
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 text-left">
          <Sunset className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Evening anchors</span>
            <span className="text-muted-foreground block">
              Dinner, kids bedtime, winding down
            </span>
          </div>
        </div>
      </div>

      <Button onClick={onCreateAnchor} className="gap-2">
        <Plus className="w-4 h-4" />
        Create your first anchor
      </Button>
    </div>
  );
}

export default AnchorPointManager;
