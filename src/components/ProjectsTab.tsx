import { Plus, ChevronRight, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project } from '@/types';

interface ProjectsTabProps {
  projects: Project[];
  onAddProject: () => void;
}

export function ProjectsTab({ projects, onAddProject }: ProjectsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={onAddProject} className="btn-primary">
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
              <Button onClick={onAddProject} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="card-elevated hover:shadow-elevated transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{project.title}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
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
    </div>
  );
}
