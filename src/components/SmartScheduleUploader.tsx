import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Calendar, Sparkles, Loader2, CheckCircle } from 'lucide-react';

export function SmartScheduleUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/heic'];
    const ext = file.name?.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf','png','jpg','jpeg','webp','heic'];
    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or image of your schedule',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file', file);

      const invokeOptions: any = { body: formData };
      if (session?.access_token) {
        invokeOptions.headers = { Authorization: `Bearer ${session.access_token}` };
      }

      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-schedule', invokeOptions);

      if (parseError) throw parseError;

      if (parseResult?.entries && parseResult.entries.length > 0) {
        // Determine source based on category
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

        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert(scheduleEntries);

        if (insertError) throw insertError;

        const workCount = scheduleEntries.filter((e: any) => e.source === 'work').length;
        const classCount = scheduleEntries.filter((e: any) => e.source === 'class').length;
        const homeworkCount = scheduleEntries.filter((e: any) => e.source === 'homework').length;

        let summary = `Imported ${scheduleEntries.length} entries`;
        const parts = [];
        if (workCount > 0) parts.push(`${workCount} work shifts`);
        if (classCount > 0) parts.push(`${classCount} classes`);
        if (homeworkCount > 0) parts.push(`${homeworkCount} homework items`);
        if (parts.length > 0) summary += `: ${parts.join(', ')}`;

        toast({
          title: 'Schedule Uploaded! 🎉',
          description: summary,
        });
        
        setUploadSuccess(true);
      } else {
        toast({
          title: parseResult?.error ? 'Parsing Issue' : 'No Schedule Found',
          description: parseResult?.error || 'Could not extract schedule from the file',
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
        title: 'Study Plan Generated! ✨',
        description: data?.message || 'Your AI study plan is ready',
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
          Smart Study Scheduler
        </CardTitle>
        <CardDescription>
          Upload your work/class schedule and let AI plan your homework
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
            <div className="flex-1">
              <p className="font-medium">Upload Your Schedule</p>
              <p className="text-sm text-muted-foreground">Screenshot of work shifts or class times</p>
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => document.getElementById('smart-schedule-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : uploadSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Schedule Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Schedule Image
                  </>
                )}
              </Button>
              <input
                id="smart-schedule-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
            <div className="flex-1">
              <p className="font-medium">Add Your Tasks</p>
              <p className="text-sm text-muted-foreground">Add homework/assignments below (estimates optional)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
            <div className="flex-1">
              <p className="font-medium">Generate Smart Plan</p>
              <p className="text-sm text-muted-foreground">AI finds your free time and schedules everything</p>
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
                    Generate My Study Plan
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
