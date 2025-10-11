import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { FutureSelfMessengerWidget, FutureSelfMessage } from "@/types";

interface FutureSelfMessengerEditorProps {
  open: boolean;
  onClose: () => void;
  widget?: FutureSelfMessengerWidget;
  mode: 'settings' | 'message';
  onSave: (widget: Omit<FutureSelfMessengerWidget, 'id'> & { id?: string }) => void;
  onSaveMessage?: (message: Omit<FutureSelfMessage, 'id'>) => void;
}

export const FutureSelfMessengerEditor = ({ 
  open, 
  onClose, 
  widget,
  mode,
  onSave,
  onSaveMessage 
}: FutureSelfMessengerEditorProps) => {
  const [title, setTitle] = useState("Future Self Messenger");
  const [aiDeliveryEnabled, setAiDeliveryEnabled] = useState(true);
  
  // Message creation state
  const [messageContent, setMessageContent] = useState("");
  const [deliveryTrigger, setDeliveryTrigger] = useState<'date' | 'achievement' | 'condition'>('date');
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryCondition, setDeliveryCondition] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (widget && mode === 'settings') {
      setTitle(widget.title);
      setAiDeliveryEnabled(widget.aiDeliveryEnabled);
    } else if (mode === 'message') {
      // Reset message form
      setMessageContent("");
      setDeliveryTrigger('date');
      setDeliveryDate("");
      setDeliveryCondition("");
      setTags([]);
      setTagInput("");
    }
  }, [widget, open, mode]);

  const handleSaveSettings = () => {
    onSave({
      ...(widget?.id && { id: widget.id }),
      type: 'future-self-messenger',
      title,
      messages: widget?.messages || [],
      aiDeliveryEnabled,
    });
    onClose();
  };

  const handleSaveMessage = () => {
    if (!onSaveMessage) return;
    
    onSaveMessage({
      content: messageContent,
      type: 'text',
      createdAt: new Date().toISOString(),
      deliveryTrigger,
      ...(deliveryTrigger === 'date' && { deliveryDate }),
      ...(deliveryTrigger !== 'date' && { deliveryCondition }),
      delivered: false,
      tags,
    });
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (mode === 'settings') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Future Self Messenger Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Widget Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Time Capsule"
              />
            </div>

            <div className="text-xs text-muted-foreground p-3 rounded bg-accent/50">
              💡 Messages are stored locally and will appear when delivery conditions are met
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={!title.trim()}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Write to Your Future Self</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Your Message</Label>
            <Textarea
              id="content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Dear future me,&#10;&#10;I hope you're proud of how far you've come..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger">When should this be delivered?</Label>
            <Select value={deliveryTrigger} onValueChange={(v: any) => setDeliveryTrigger(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">On a specific date</SelectItem>
                <SelectItem value="achievement">When I achieve something</SelectItem>
                <SelectItem value="condition">Based on a condition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deliveryTrigger === 'date' && (
            <div className="space-y-2">
              <Label htmlFor="date">Delivery Date</Label>
              <Input
                id="date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {deliveryTrigger !== 'date' && (
            <div className="space-y-2">
              <Label htmlFor="condition">Delivery Condition</Label>
              <Input
                id="condition"
                value={deliveryCondition}
                onChange={(e) => setDeliveryCondition(e.target.value)}
                placeholder="e.g., 'When I feel stressed' or 'After completing my first project'"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="encouragement, milestone, reflection"
              />
              <Button type="button" onClick={addTag} variant="secondary">Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSaveMessage}
            disabled={
              !messageContent.trim() || 
              (deliveryTrigger === 'date' && !deliveryDate) ||
              (deliveryTrigger !== 'date' && !deliveryCondition.trim())
            }
          >
            Schedule Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
