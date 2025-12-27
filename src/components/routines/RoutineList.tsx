import { useState, useMemo } from 'react';
import { Plus, Search, Wand2, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Routine, RoutinePreset } from '@/types';
import { RoutineCard } from './RoutineCard';
import { RoutineBuilder } from './RoutineBuilder';
import { RoutineTemplateGallery } from './RoutineTemplateGallery';
import { ROUTINE_CATEGORIES } from '@/data/routinePresets';

interface RoutineListProps {
  routines: Routine[];
  onAddRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'timesCompleted' | 'lastUsedAt'>) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartRoutine: (routine: Routine) => void;
  onScheduleRoutine: (routine: Routine) => void;
}

export function RoutineList({
  routines,
  onAddRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onStartRoutine,
  onScheduleRoutine,
}: RoutineListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<RoutinePreset | null>(null);

  const filteredRoutines = useMemo(() => {
    return routines.filter(routine => {
      const matchesSearch = routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        routine.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || routine.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [routines, searchQuery, selectedCategory]);

  const handleCreateNew = () => {
    setEditingRoutine(null);
    setSelectedPreset(null);
    setBuilderOpen(true);
  };

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setSelectedPreset(null);
    setBuilderOpen(true);
  };

  const handleUseTemplate = (preset: RoutinePreset) => {
    setEditingRoutine(null);
    setSelectedPreset(preset);
    setBuilderOpen(true);
  };

  const handleUseAsIs = (preset: RoutinePreset) => {
    const category = ROUTINE_CATEGORIES.find(c => c.id === preset.category);
    onAddRoutine({
      name: preset.name,
      description: preset.description,
      icon: category?.icon || '📋',
      color: category?.color || '#607D8B',
      totalEstimatedMinutes: preset.estimatedMinutes,
      anchorType: 'flexible',
      steps: preset.steps.map((s, idx) => ({
        id: crypto.randomUUID(),
        name: s.name,
        estimatedMinutes: s.estimatedMinutes,
        notes: s.notes,
        isFlexible: s.isFlexible,
        order: idx,
        status: 'pending' as const,
      })),
      isTemplate: true,
      category: preset.category,
      autoAdvance: false,
      showNotifications: true,
      allowSkipping: true,
    });
  };

  const handleSave = (routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'timesCompleted' | 'lastUsedAt'>) => {
    if (editingRoutine) {
      onUpdateRoutine({
        ...editingRoutine,
        ...routineData,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddRoutine(routineData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Routines
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTemplateGalleryOpen(true)} className="gap-2">
              <Wand2 className="h-4 w-4" />
              Browse Templates
            </Button>
            <Button size="sm" onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {ROUTINE_CATEGORIES.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs gap-1">
                <span>{category.icon}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Routine list */}
        <ScrollArea className="h-[400px] pr-4">
          {filteredRoutines.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
              {filteredRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onStart={onStartRoutine}
                  onEdit={handleEdit}
                  onSchedule={onScheduleRoutine}
                  onDelete={onDeleteRoutine}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {routines.length === 0 ? (
                <>
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="font-medium mb-1">No routines yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first routine or start from a template
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setTemplateGalleryOpen(true)} className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      Browse Templates
                    </Button>
                    <Button onClick={handleCreateNew} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="font-medium mb-1">No routines found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter
                  </p>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Dialogs */}
      <RoutineBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        routine={editingRoutine}
        preset={selectedPreset}
        onSave={handleSave}
      />

      <RoutineTemplateGallery
        open={templateGalleryOpen}
        onOpenChange={setTemplateGalleryOpen}
        onUseTemplate={handleUseTemplate}
        onUseAsIs={handleUseAsIs}
      />
    </Card>
  );
}
