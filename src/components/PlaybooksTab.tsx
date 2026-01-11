import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Playbook } from '@/types';
import { PlaybookEditor } from './PlaybookEditor';
import { PlaybookViewer } from './PlaybookViewer';
import { PlaybookFilters } from './PlaybookFilters';
import { Plus, BookOpen, Play, Sparkles, GripVertical, Star } from 'lucide-react';
import { playbookTemplates } from '@/data/playbookTemplates';
import { 
  type PrimaryFilter, 
  TEMPLATE_SECTIONS,
  getDurationCategory 
} from '@/data/playbookFilterOptions';

interface PlaybooksTabProps {
  playbooks: Playbook[];
  onAddPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onUpdatePlaybook: (id: string, playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onDeletePlaybook: (id: string) => void;
  onReorderPlaybooks: (reorderedPlaybooks: Playbook[]) => void;
  onStartTimer?: (stepTitle: string, minutes: number) => void;
}

export function PlaybooksTab({ playbooks, onAddPlaybook, onUpdatePlaybook, onDeletePlaybook, onReorderPlaybooks, onStartTimer }: PlaybooksTabProps) {
  // New filter state
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>('all');
  const [secondaryFilter, setSecondaryFilter] = useState<string | null>(null);
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | undefined>();
  const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | undefined>();
  const [draggedPlaybookId, setDraggedPlaybookId] = useState<string | null>(null);

  // Sort playbooks by order (user playbooks only)
  const sortedPlaybooks = [...playbooks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Combine user playbooks with templates
  const allPlaybooks: Playbook[] = useMemo(() => [
    ...sortedPlaybooks,
    ...playbookTemplates.map(template => ({
      ...template,
      id: `template-${template.title}`,
      createdAt: new Date().toISOString(),
      linkedTaskIds: [],
    }))
  ], [sortedPlaybooks]);

  // Calculate total time for a playbook
  const getTotalTime = (playbook: Playbook) => 
    playbook.steps.reduce((sum, step) => sum + (step.estimatedMinutes || 0), 0);

  // Filter playbooks based on primary and secondary filters
  const filteredPlaybooks = useMemo(() => {
    let filtered = allPlaybooks;

    switch (primaryFilter) {
      case 'templates':
        filtered = filtered.filter(p => p.isTemplate);
        break;
      
      case 'by-room':
        if (secondaryFilter) {
          filtered = filtered.filter(p => 
            p.tags?.rooms?.includes(secondaryFilter as any) ||
            // Fallback: match category for templates without tags yet
            p.category.toLowerCase().replace(/\s+/g, '-').includes(secondaryFilter)
          );
        }
        break;
      
      case 'by-activity':
        if (secondaryFilter) {
          filtered = filtered.filter(p => 
            p.tags?.activityType?.includes(secondaryFilter as any) ||
            // Fallback category matching
            (secondaryFilter === 'deep-clean' && p.title.toLowerCase().includes('deep clean')) ||
            (secondaryFilter === 'quick-clean' && (p.title.toLowerCase().includes('quick') || p.title.toLowerCase().includes('express'))) ||
            (secondaryFilter === 'declutter' && p.title.toLowerCase().includes('declutter')) ||
            (secondaryFilter === 'maintenance' && p.title.toLowerCase().includes('maintenance')) ||
            (secondaryFilter === 'seasonal' && (p.title.toLowerCase().includes('spring') || p.title.toLowerCase().includes('fall'))) ||
            (secondaryFilter === 'self-care' && p.category === 'Self-Care') ||
            (secondaryFilter === 'cooking' && p.category === 'Cooking') ||
            (secondaryFilter === 'daily-routine' && (p.title.toLowerCase().includes('morning') || p.title.toLowerCase().includes('evening')))
          );
        }
        break;
      
      case 'by-time':
        if (secondaryFilter) {
          filtered = filtered.filter(p => {
            const totalTime = getTotalTime(p);
            const duration = getDurationCategory(totalTime);
            return duration === secondaryFilter;
          });
        }
        break;
      
      case 'all':
      default:
        // Show all playbooks
        break;
    }

    return filtered;
  }, [allPlaybooks, primaryFilter, secondaryFilter]);

  // Group playbooks by tier for template view
  const playbooksByTier = useMemo(() => {
    if (primaryFilter !== 'templates') return null;
    
    const grouped: Record<number, Playbook[]> = { 1: [], 2: [], 3: [], 4: [] };
    
    filteredPlaybooks.forEach(p => {
      const tier = p.tier || 3; // Default to tier 3 if not specified
      if (grouped[tier]) {
        grouped[tier].push(p);
      }
    });
    
    return grouped;
  }, [filteredPlaybooks, primaryFilter]);

  const handleCreateNew = () => {
    setEditingPlaybook(undefined);
    setEditorOpen(true);
  };

  const handleEditPlaybook = (playbook: Playbook) => {
    if (playbook.isTemplate) {
      // Use template as starting point for new playbook
      const newPlaybook = {
        ...playbook,
        isTemplate: false,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      onAddPlaybook(newPlaybook);
    } else {
      setEditingPlaybook(playbook);
      setEditorOpen(true);
    }
  };

  const handleViewPlaybook = (playbook: Playbook) => {
    setViewingPlaybook(playbook);
    setViewerOpen(true);
  };

  const handleSavePlaybook = (playbookData: Omit<Playbook, 'id' | 'createdAt'>) => {
    if (editingPlaybook) {
      onUpdatePlaybook(editingPlaybook.id, playbookData);
    } else {
      onAddPlaybook(playbookData);
    }
  };

  const handleDeletePlaybook = () => {
    if (editingPlaybook) {
      onDeletePlaybook(editingPlaybook.id);
      setEditorOpen(false);
    }
  };

  const handleUpdateViewingPlaybook = (updatedPlaybook: Playbook) => {
    if (!updatedPlaybook.isTemplate) {
      onUpdatePlaybook(updatedPlaybook.id, updatedPlaybook);
    }
    setViewingPlaybook(updatedPlaybook);
  };

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return 'text-primary';
    if (percentage >= 50) return 'text-accent';
    return 'text-muted-foreground';
  };

  const handleDragStart = (e: React.DragEvent, playbookId: string) => {
    if (playbookTemplates.some(t => `template-${t.title}` === playbookId)) {
      e.preventDefault();
      return;
    }
    setDraggedPlaybookId(playbookId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetPlaybookId: string) => {
    e.preventDefault();
    if (!draggedPlaybookId || draggedPlaybookId === targetPlaybookId) return;
    if (playbookTemplates.some(t => `template-${t.title}` === targetPlaybookId)) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPlaybookId: string) => {
    e.preventDefault();
    if (!draggedPlaybookId || draggedPlaybookId === targetPlaybookId) return;
    if (playbookTemplates.some(t => `template-${t.title}` === targetPlaybookId)) return;

    const draggedIndex = sortedPlaybooks.findIndex(p => p.id === draggedPlaybookId);
    const targetIndex = sortedPlaybooks.findIndex(p => p.id === targetPlaybookId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPlaybooks = [...sortedPlaybooks];
    const [draggedPlaybook] = newPlaybooks.splice(draggedIndex, 1);
    newPlaybooks.splice(targetIndex, 0, draggedPlaybook);

    const reorderedPlaybooks = newPlaybooks.map((playbook, index) => ({
      ...playbook,
      order: index,
    }));

    onReorderPlaybooks(reorderedPlaybooks);
    setDraggedPlaybookId(null);
  };

  const handleDragEnd = () => {
    setDraggedPlaybookId(null);
  };

  // Render a playbook card
  const renderPlaybookCard = (playbook: Playbook, featured = false) => {
    const completedSteps = playbook.steps.filter(s => s.completed).length;
    const totalSteps = playbook.steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    const isTemplate = playbook.isTemplate || playbook.id.startsWith('template-');
    const isDraggable = !isTemplate;
    const totalTime = getTotalTime(playbook);

    return (
      <Card 
        key={playbook.id} 
        className={`card-elevated hover:shadow-lg transition-shadow ${
          isDraggable ? 'cursor-move' : 'cursor-pointer'
        } ${draggedPlaybookId === playbook.id ? 'opacity-50' : ''} ${
          featured ? 'border-primary/50 bg-primary/5' : ''
        }`}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, playbook.id)}
        onDragOver={(e) => handleDragOver(e, playbook.id)}
        onDrop={(e) => handleDrop(e, playbook.id)}
        onDragEnd={handleDragEnd}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isDraggable && (
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {featured && (
                <Star className="h-4 w-4 text-primary shrink-0 fill-primary" />
              )}
              <CardTitle className="text-lg line-clamp-2 flex-1">{playbook.title}</CardTitle>
            </div>
            {isTemplate && (
              <Badge variant="secondary" className="shrink-0 bg-primary/20 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Template
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="w-fit text-xs">
              {playbook.category}
            </Badge>
            {totalTime > 0 && (
              <Badge variant="outline" className="w-fit text-xs">
                {totalTime >= 60 ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}m` : `${totalTime}m`}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {playbook.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {playbook.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className={getProgressColor(completedSteps, totalSteps)}>
              {completedSteps} / {totalSteps} steps
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleViewPlaybook(playbook)}
              className="flex-1"
              size="sm"
            >
              <Play className="h-3 w-3 mr-1" />
              {progress > 0 && progress < 100 ? 'Continue' : progress === 100 ? 'Review' : 'Start'}
            </Button>
            {!playbook.isTemplate && (
              <Button
                onClick={() => handleEditPlaybook(playbook)}
                variant="outline"
                size="sm"
              >
                Edit
              </Button>
            )}
            {playbook.isTemplate && (
              <Button
                onClick={() => handleEditPlaybook(playbook)}
                variant="outline"
                size="sm"
              >
                Use
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Playbooks</h2>
          <p className="text-sm text-muted-foreground">Step-by-step guides for your goals</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Playbook
        </Button>
      </div>

      {/* New Two-Tier Filter System */}
      <PlaybookFilters
        primaryFilter={primaryFilter}
        secondaryFilter={secondaryFilter}
        onPrimaryChange={setPrimaryFilter}
        onSecondaryChange={setSecondaryFilter}
      />

      {/* Playbooks Display */}
      {filteredPlaybooks.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No playbooks found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {primaryFilter === 'all'
                ? 'Create your first playbook or browse templates'
                : `No playbooks match the current filters`}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleCreateNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Playbook
              </Button>
              {primaryFilter !== 'templates' && (
                <Button onClick={() => setPrimaryFilter('templates')} variant="secondary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : primaryFilter === 'templates' && playbooksByTier ? (
        /* Tiered Template Display */
        <div className="space-y-8">
          {TEMPLATE_SECTIONS.map(section => {
            const tierPlaybooks = playbooksByTier[section.tier] || [];
            if (tierPlaybooks.length === 0) return null;
            
            return (
              <div key={section.tier} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <div className={`grid gap-4 ${
                  section.tier === 1 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {tierPlaybooks.map(playbook => renderPlaybookCard(playbook, section.tier === 1))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Regular Grid Display */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaybooks.map(playbook => renderPlaybookCard(playbook))}
        </div>
      )}

      <PlaybookEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        playbook={editingPlaybook}
        onSave={handleSavePlaybook}
        onDelete={editingPlaybook && !editingPlaybook.isTemplate ? handleDeletePlaybook : undefined}
      />

      {viewingPlaybook && (
        <PlaybookViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          playbook={viewingPlaybook}
          onUpdatePlaybook={handleUpdateViewingPlaybook}
          onStartTimer={onStartTimer}
        />
      )}
    </div>
  );
}