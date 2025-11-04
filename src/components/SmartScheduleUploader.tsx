import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Calendar, Sparkles, Loader2, CheckCircle } from 'lucide-react';

type FileStatus = {
  name: string;
  status: 'pending' | 'success' | 'error';
  count?: number;
};

export function SmartScheduleUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    setUploading(true);
    setUploadSuccess(false);
    setProgress({ current: 0, total: files.length });
    setFileStatuses(files.map(f => ({ name: f.name, status: 'pending' })));

    let totalEntries = 0;
    let totalWork = 0, totalClass = 0, totalHomework = 0;
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
            totalWork += scheduleEntries.filter((e: any) => e.source === 'work').length;
            totalClass += scheduleEntries.filter((e: any) => e.source === 'class').length;
            totalHomework += scheduleEntries.filter((e: any) => e.source === 'homework').length;

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

      // Insert all entries at once
      if (allEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert(allEntries);

        if (insertError) throw insertError;

        let summary = `Imported ${totalEntries} entries from ${files.length} file${files.length > 1 ? 's' : ''}`;
        const parts = [];
        if (totalWork > 0) parts.push(`${totalWork} work shifts`);
        if (totalClass > 0) parts.push(`${totalClass} classes`);
        if (totalHomework > 0) parts.push(`${totalHomework} homework items`);
        if (parts.length > 0) summary += `: ${parts.join(', ')}`;

        toast({
          title: 'Schedule Uploaded! 🎉',
          description: summary,
        });
        
        setUploadSuccess(true);
      } else {
        toast({
          title: 'No Entries Found',
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

  const handleGeneratePlan = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('generate-smart-plan', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Planning Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Life Plan Generated! ✨',
        description: data?.message || 'Your AI-optimized schedule is ready',
      });
    } catch (error: any) {
      console.error('Error generating plan:', error);
      const status = error?.status || error?.cause?.status;
      let description = 'Failed to generate plan';
      if (status === 429) description = 'Rate limit exceeded. Please wait.';
      else if (status === 402) description = 'AI credits exhausted. Please add credits.';
      else if (error?.message) description = error.message;
      
      toast({ 
        title: 'Generation Failed', 
        description, 
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Life Scheduler
        </CardTitle>
        <CardDescription>
          Upload your work/class schedule and let AI plan everything you need to do
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
            <div className="flex-1">
              <p className="font-medium">Upload Your Schedule</p>
              <p className="text-sm text-muted-foreground">Work shifts, class times, appointments - anything recurring</p>
              <Button
                variant="outline"
                className="mt-2 w-full"
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
                    Schedule Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Schedule Images
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
                <div className="mt-2 space-y-1">
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

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
            <div className="flex-1">
              <p className="font-medium">Add All Your Tasks</p>
              <p className="text-sm text-muted-foreground">Homework, cleaning, errands, appointments - add everything below</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
            <div className="flex-1">
              <p className="font-medium">Let AI Plan Your Life</p>
              <p className="text-sm text-muted-foreground">AI considers all your commitments and creates an optimal schedule</p>
              <Button
                className="mt-2 w-full"
                onClick={handleGeneratePlan}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Generate My Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
