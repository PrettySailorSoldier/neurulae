import { useState } from 'react';
import { Plus, ChevronRight, FolderOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Project } from '@/types';

interface ProjectsTabProps {
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject?: (projectId: string) => void;
  onSelectProject?: (project: Project) => void;
}

export function ProjectsTab({ 
  projects, 
  onAddProject, 
  onUpdateProject, 
  onDeleteProject,
  onSelectProject 
}: ProjectsTabProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setProjectTitle('');
    setProjectDescription('');
    setIsEditorOpen(true);
  };

  const handleOpenEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description || '');
    setIsEditorOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectTitle.trim()) return;

    if (editingProject) {
      // Update existing project
      onUpdateProject?.(editingProject.id, {
        title: projectTitle.trim(),
        description: projectDescription.trim() || undefined,
      });
    } else {
      // Create new project
      onAddProject({
        title: projectTitle.trim(),
        description: projectDescription.trim() || undefined,
        tasks: [],
      });
    }
    
    setIsEditorOpen(false);
    setEditingProject(null);
    setProjectTitle('');
    setProjectDescription('');
  };

  const handleConfirmDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteProject = () => {
    if (projectToDelete) {
      onDeleteProject?.(projectToDelete.id);
      setProjectToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={handleOpenNewProject} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No projects yet</p>
              <p className="text-sm mb-4">Create a project to organize your tasks</p>
              <Button onClick={handleOpenNewProject} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer group"
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{project.title}</span>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleOpenEditProject(project, e as any)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleConfirmDelete(project, e as any)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{project.tasks.length} tasks</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">
                    {project.tasks.filter(t => t.completed).length} completed
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
            <DialogDescription>
              {editingProject 
                ? 'Update your project details below.' 
                : 'Create a new project to organize your tasks.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Name</Label>
              <Input
                id="project-title"
                placeholder="Enter project name..."
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                placeholder="What's this project about?"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={!projectTitle.trim()}>
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{projectToDelete?.title}" and all its tasks. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
