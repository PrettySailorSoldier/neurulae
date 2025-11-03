import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Upload, Plus, X, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleEntry {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: string;
  location?: string;
  source: string;
}

export function ScheduleManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    category: 'work',
    location: '',
  });

  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowed = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp'];
    if (!allowed.includes(file.type)) {
      toast({
        title: 'Unsupported file',
        description: 'Upload a PDF or image (PNG/JPG/WEBP).',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload PDF to parse
      const formData = new FormData();
      formData.append('file', file);

      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-schedule', {
        body: formData,
      });

      if (parseError) throw parseError;

      if (parseResult?.entries && parseResult.entries.length > 0) {
        const scheduleEntries = parseResult.entries.map((entry: any) => ({
          user_id: user.id,
          title: entry.title,
          description: entry.description,
          start_time: entry.startTime,
          end_time: entry.endTime,
          category: entry.category || 'other',
          location: entry.location,
          source: 'pdf',
        }));

        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert(scheduleEntries);

        if (insertError) throw insertError;

        toast({
          title: 'Schedule Imported',
          description: `Successfully imported ${scheduleEntries.length} schedule entries`,
        });
        
        loadEntries();
      } else {
        toast({
          title: 'No Schedule Found',
          description: 'Could not extract schedule information from the file',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error uploading schedule:', error);
      const status = error?.status || error?.cause?.status;
      let description = 'Failed to parse schedule.';
      if (status === 429) description = 'Rate limit hit. Please wait a minute and try again.';
      else if (status === 402) description = 'AI usage limit reached. Please add credits and retry.';
      else if (error?.message) description = String(error.message);
      toast({ title: 'Upload Failed', description, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddEntry = async () => {
    if (!user || !newEntry.title || !newEntry.startDate || !newEntry.startTime || !newEntry.endDate || !newEntry.endTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const startTime = new Date(`${newEntry.startDate}T${newEntry.startTime}`).toISOString();
      const endTime = new Date(`${newEntry.endDate}T${newEntry.endTime}`).toISOString();

      const { error } = await supabase
        .from('schedule_entries')
        .insert({
          user_id: user.id,
          title: newEntry.title,
          description: newEntry.description || null,
          start_time: startTime,
          end_time: endTime,
          category: newEntry.category,
          location: newEntry.location || null,
          source: 'manual',
        });

      if (error) throw error;

      toast({
        title: 'Entry Added',
        description: 'Schedule entry has been added',
      });

      setNewEntry({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        category: 'work',
        location: '',
      });
      setShowAddForm(false);
      loadEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to add schedule entry',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedule_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Entry Deleted',
        description: 'Schedule entry has been removed',
      });
      
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Work & Homework Schedule
        </CardTitle>
        <CardDescription>
          Upload your schedule PDF or add entries manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => document.getElementById('schedule-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing PDF...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF Schedule
              </>
            )}
          </Button>
          <input
            id="schedule-upload"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Manually
          </Button>
        </div>

        {showAddForm && (
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title *</Label>
                <Input
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="e.g., Math Class, Work Shift"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={newEntry.startDate}
                  onChange={(e) => setNewEntry({ ...newEntry, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={newEntry.startTime}
                  onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                />
              </div>

              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={newEntry.endDate}
                  onChange={(e) => setNewEntry({ ...newEntry, endDate: e.target.value })}
                />
              </div>

              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={newEntry.endTime}
                  onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={newEntry.location}
                  onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddEntry} disabled={loading}>
                Add Entry
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Upcoming Schedule ({entries.length})</Label>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No schedule entries yet. Upload a PDF or add manually.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {entry.source === 'pdf' ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{entry.title}</span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        {entry.category}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(entry.start_time), 'MMM d, yyyy h:mm a')} - {format(new Date(entry.end_time), 'h:mm a')}
                    </div>
                    {entry.location && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {entry.location}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
