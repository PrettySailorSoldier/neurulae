import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Playbook } from '@/types';
import { PlaybookEditor } from './PlaybookEditor';
import { PlaybookViewer } from './PlaybookViewer';
import { Plus, BookOpen, Play, Sparkles } from 'lucide-react';
import { playbookTemplates } from '@/data/playbookTemplates';

interface PlaybooksTabProps {
  playbooks: Playbook[];
  onAddPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onUpdatePlaybook: (id: string, playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onDeletePlaybook: (id: string) => void;
  onStartTimer?: (stepTitle: string, minutes: number) => void;
}

const CATEGORIES = ['All', 'Cleaning', 'Cooking', 'Learning', 'Self-Care', 'Creative', 'Work', 'Health', 'Social', 'Other'];

export function PlaybooksTab({ playbooks, onAddPlaybook, onUpdatePlaybook, onDeletePlaybook, onStartTimer }: PlaybooksTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | undefined>();
  const [viewingPlaybook, setViewingPlaybook] = useState<Playbook | undefined>();

  // Combine user playbooks with templates
  const allPlaybooks = [
    ...playbooks,
    ...playbookTemplates.map(template => ({
      ...template,
      id: `template-${template.title}`,
      createdAt: new Date().toISOString(),
      linkedTaskIds: [],
    }))
  ];

  const filteredPlaybooks = selectedCategory === 'All'
    ? allPlaybooks
    : allPlaybooks.filter(p => p.category === selectedCategory);

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

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto">
          {CATEGORIES.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Playbooks Grid */}
      {filteredPlaybooks.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No playbooks yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {selectedCategory === 'All'
                ? 'Create your first playbook or use a template below'
                : `No playbooks in the ${selectedCategory} category`}
            </p>
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playbook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaybooks.map((playbook) => {
            const completedSteps = playbook.steps.filter(s => s.completed).length;
            const totalSteps = playbook.steps.length;
            const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

            return (
              <Card key={playbook.id} className="card-elevated hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{playbook.title}</CardTitle>
                    {playbook.isTemplate && (
                      <Badge variant="secondary" className="shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Template
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {playbook.category}
                  </Badge>
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
          })}
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