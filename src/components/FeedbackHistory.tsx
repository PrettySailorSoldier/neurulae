import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MessageSquare, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Feedback {
  id: string;
  feedback_type: string;
  title: string | null;
  message: string;
  rating: number | null;
  status: string;
  created_at: string;
}

export function FeedbackHistory() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', label: string }> = {
      new: { variant: 'secondary', label: 'New' },
      reviewing: { variant: 'default', label: 'Reviewing' },
      acknowledged: { variant: 'outline', label: 'Acknowledged' },
      implemented: { variant: 'default', label: 'Implemented ✓' },
      closed: { variant: 'destructive', label: 'Closed' },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      review: '⭐ Review',
      idea: '💡 Idea',
      bug: '🐛 Bug',
      feature_request: '✨ Feature Request',
      general: '💬 General',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading your feedback...
        </CardContent>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No feedback submitted yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your feedback helps us improve!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <Collapsible key={feedback.id}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline">{getTypeBadge(feedback.feedback_type)}</Badge>
                    {getStatusBadge(feedback.status)}
                    {feedback.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span>{feedback.rating}/5</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base">
                    {feedback.title || 'Feedback'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {format(new Date(feedback.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform data-[state=open]:rotate-180" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
