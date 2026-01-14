import { useState, useEffect } from 'react';
import { Task, Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskEditDialogProps {
  /** The task to edit, or null if closed */
  task: Task | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onClose: () => void;
  /** Called when saving changes */
  onSave: (taskId: string, updates: Partial<Task>) => void;
  /** Available projects for categorization */
  projects: Project[];
}

interface FormData {
  title: string;
  projectId: string | undefined;
  dueDate: string;
  estimatedMinutes: number | undefined;
  taskType: Task['taskType'];
  recurring: Task['recurring'];
  notes: string;
  energyLevel: Task['energyLevel'];
}

export function TaskEditDialog({
  task,
  open,
  onClose,
  onSave,
  projects,
}: TaskEditDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    projectId: undefined,
    dueDate: '',
    estimatedMinutes: undefined,
    taskType: 'other',
    recurring: 'none',
    notes: '',
    energyLevel: undefined,
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        projectId: task.projectId,
        dueDate: task.dueDate || '',
        estimatedMinutes: task.estimatedMinutes,
        taskType: task.taskType || 'other',
        recurring: task.recurring || 'none',
        notes: task.notes || '',
        energyLevel: task.energyLevel,
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const updates: Partial<Task> = {
      title: formData.title.trim(),
      projectId: formData.projectId,
      dueDate: formData.dueDate || undefined,
      estimatedMinutes: formData.estimatedMinutes,
      taskType: formData.taskType,
      recurring: formData.recurring,
      notes: formData.notes.trim() || undefined,
      energyLevel: formData.energyLevel,
    };

    onSave(task.id, updates);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Name</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Category/Project */}
          <div className="space-y-2">
            <Label htmlFor="project">Project / Category</Label>
            <Select
              value={formData.projectId || 'none'}
              onValueChange={(val) => setFormData({ ...formData, projectId: val === 'none' ? undefined : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Two columns for smaller fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="estimatedMinutes">Duration (min)</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                min="1"
                max="480"
                value={formData.estimatedMinutes ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="25"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Task Type */}
            <div className="space-y-2">
              <Label htmlFor="taskType">Type</Label>
              <Select
                value={formData.taskType || 'other'}
                onValueChange={(val) => setFormData({ ...formData, taskType: val as Task['taskType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">📚 School</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="appointment">📅 Appointment</SelectItem>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <Label htmlFor="energyLevel">Energy Required</Label>
              <Select
                value={formData.energyLevel || 'none'}
                onValueChange={(val) => setFormData({ 
                  ...formData, 
                  energyLevel: val === 'none' ? undefined : val as Task['energyLevel'] 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any</SelectItem>
                  <SelectItem value="low">🔋 Low</SelectItem>
                  <SelectItem value="medium">⚡ Medium</SelectItem>
                  <SelectItem value="high">🔥 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurring */}
          <div className="space-y-2">
            <Label htmlFor="recurring">Repeats</Label>
            <Select
              value={formData.recurring || 'none'}
              onValueChange={(val) => setFormData({ ...formData, recurring: val as Task['recurring'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
