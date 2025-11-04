import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task } from '@/types';

type FileStatus = {
  name: string;
  status: 'pending' | 'success' | 'error';
  count?: number;
};

interface SmartSchedulerProps {
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onScheduleGenerated?: () => void;
  tasks: Task[];
}

export function SmartScheduler({ onAddTask, onScheduleGenerated, tasks }: SmartSchedulerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [uploadedEntriesCount, setUploadedEntriesCount] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    setUploading(true);
    setUploadSuccess(false);
    setProgress({ current: 0, total: files.length });
    setFileStatuses(files.map(f => ({ name: f.name, status: 'pending' })));

    let totalEntries = 0;
    const allEntries: any[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        const allowedTypes = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/heic'];
        const ext = file.name?.split('.').pop()?.toLowerCase() || '';
        const allowedExts = ['pdf','png','jpg','jpeg','webp','heic'];
        if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
          setFileStatuses(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error' as const } : f
          ));
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);

          const invokeOptions: any = { body: formData };
          if (session?.access_token) {
            invokeOptions.headers = { Authorization: `Bearer ${session.access_token}` };
          }

          const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-schedule', invokeOptions);

          if (parseError) throw parseError;

          if (parseResult?.entries && parseResult.entries.length > 0) {
            const scheduleEntries = parseResult.entries.map((entry: any) => {
              let source = 'manual';
              if (entry.category === 'work') source = 'work';
              else if (entry.category === 'class') source = 'class';
              else if (entry.category === 'homework') source = 'homework';
              
              return {
                user_id: user.id,
                title: entry.title,
                description: entry.description,
                start_time: entry.startTime,
                end_time: entry.endTime,
                category: entry.category || 'other',
                location: entry.location,
                source: source,
              };
            });

            allEntries.push(...scheduleEntries);
            totalEntries += scheduleEntries.length;

            setFileStatuses(prev => prev.map((f, idx) => 
              idx === i ? { ...f, status: 'success' as const, count: scheduleEntries.length } : f
            ));
          } else {
            setFileStatuses(prev => prev.map((f, idx) => 
              idx === i ? { ...f, status: 'error' as const } : f
            ));
          }
        } catch (fileError: any) {
          console.error(`Error processing file ${file.name}:`, fileError);
          setFileStatuses(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error' as const } : f
          ));
        }
      }

      if (allEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert(allEntries);

        if (insertError) throw insertError;

        toast({
          title: '✓ Busy times imported',
          description: `Added ${totalEntries} entries from ${files.length} file${files.length > 1 ? 's' : ''}`,
        });
        
        setUploadSuccess(true);
        setUploadedEntriesCount(totalEntries);
      } else {
        toast({
          title: 'No entries found',
          description: 'Could not extract schedule from any of the files',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error uploading schedule:', error);
      const status = error?.status || error?.cause?.status;
      let description = 'Failed to parse schedule';
      if (status === 429) description = 'Rate limit exceeded. Please wait a minute.';
      else if (status === 402) description = 'AI usage limit reached. Please add credits.';
      else if (error?.message) description = error.message;
      
      toast({ 
        title: 'Upload Failed', 
        description, 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
      e.target.value = '';
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !onAddTask) return;

    onAddTask({
      title: newTaskTitle.trim(),
      eisenhowerQuadrant: 'not-urgent-important',
      focusTimeMinutes: null,
      completed: false,
      notes: '',
      subtasks: [],
    });

    setNewTaskTitle('');
    toast({
      title: 'Task added',
      description: 'Add more tasks or click "Schedule It For Me"',
    });
  };

  const handleScheduleIt = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-smart-plan', {
        body: {},
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (functionError) throw functionError;

      toast({
        title: '✓ Schedule created!',
        description: 'Check your timeline below to see your optimized plan',
      });

      if (onScheduleGenerated) {
        onScheduleGenerated();
      }

      // Collapse after successful generation
      setIsExpanded(false);
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      const status = error?.status || error?.cause?.status;
      let description = 'Failed to generate schedule';
      if (status === 429) description = 'Rate limit exceeded. Please wait a minute.';
      else if (status === 402) description = 'AI usage limit reached. Please add credits.';
      else if (error?.message) description = error.message;
      
      toast({
        title: 'Generation Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const canSchedule = tasks.length > 0 || uploadSuccess;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Scheduler
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Step 1: Import Busy Times */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-sm">Import Busy Times (optional)</p>
                    <p className="text-xs text-muted-foreground">Upload work shifts, class schedule, appointments</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.getElementById('smart-schedule-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing {progress.current} of {progress.total}...
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {uploadedEntriesCount} entries imported
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Schedule
                      </>
                    )}
                  </Button>
                  <input
                    id="smart-schedule-upload"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                  {fileStatuses.length > 0 && (
                    <div className="space-y-1">
                      {fileStatuses.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {file.status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {file.status === 'error' && <span className="h-3 w-3 text-destructive">✗</span>}
                          {file.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
                          <span className="truncate text-muted-foreground">
                            {file.name} {file.count ? `(${file.count} entries)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Add Tasks */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-sm">What do you need to do?</p>
                    <p className="text-xs text-muted-foreground">Add homework, errands, cleaning, appointments</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Study for exam"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTask();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tasks.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ✓ {tasks.length} task{tasks.length > 1 ? 's' : ''} added
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Button */}
            <div className="pt-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleScheduleIt}
                disabled={!canSchedule || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating your schedule...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Schedule It For Me
                  </>
                )}
              </Button>
              {!canSchedule && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Add tasks or import busy times to continue
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}