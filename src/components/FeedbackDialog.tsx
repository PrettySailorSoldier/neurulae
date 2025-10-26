import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [feedbackType, setFeedbackType] = useState<'review' | 'idea' | 'bug' | 'feature_request' | 'general'>('general');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isMobile } = useDeviceInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || message.trim().length < 10) {
      toast({
        title: 'Message Required',
        description: 'Please provide at least 10 characters of feedback.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('user_feedback').insert({
        user_id: user.id,
        feedback_type: feedbackType,
        title: title.trim() || null,
        message: message.trim(),
        rating: feedbackType === 'review' ? rating : null,
      });

      if (error) throw error;

      toast({
        title: 'Thank You! 🎉',
        description: 'Your feedback has been submitted successfully.',
      });

      // Reset form
      setFeedbackType('general');
      setTitle('');
      setMessage('');
      setRating(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "flex flex-col",
        isMobile 
          ? "w-full max-w-full h-[100dvh] rounded-none p-6 pb-[calc(24px+env(safe-area-inset-bottom))]" 
          : "max-w-md h-auto"
      )}>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts, ideas, or report issues
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as typeof feedbackType)}>
              <SelectTrigger id="feedback-type" className={cn(isMobile && "min-h-[48px] text-base")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="idea">Idea / Suggestion</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {feedbackType === 'review' && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={cn(
                      "transition-colors",
                      isMobile ? "w-12 h-12" : "w-10 h-10"
                    )}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        "w-full h-full",
                        rating && rating >= star 
                          ? "fill-primary text-primary" 
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary"
              maxLength={200}
              className={cn(isMobile && "min-h-[48px] text-base text-[16px]")}
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              required
              minLength={10}
              maxLength={2000}
              className={cn(
                "resize-none flex-1",
                isMobile 
                  ? "text-base min-h-[150px] text-[16px]" 
                  : "text-sm min-h-[120px]"
              )}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={cn(
              "w-full",
              isMobile && "min-h-[48px] text-base"
            )}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
