import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Mail, MailOpen, Calendar, Target, Trash2 } from "lucide-react";
import { FutureSelfMessengerWidget as FutureSelfMessengerWidgetType } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface FutureSelfMessengerWidgetProps {
  widget: FutureSelfMessengerWidgetType;
  onCreateMessage: () => void;
  onViewMessage: (messageId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const FutureSelfMessengerWidget = ({ 
  widget, 
  onCreateMessage, 
  onViewMessage,
  onEdit,
  onDelete
}: FutureSelfMessengerWidgetProps) => {
  const [viewingMessage, setViewingMessage] = useState<string | null>(null);

  const pendingMessages = widget.messages.filter(m => !m.delivered);
  const deliveredMessages = widget.messages.filter(m => m.delivered);

  const getDeliveryIcon = (trigger: string) => {
    switch (trigger) {
      case 'date': return <Calendar className="h-3 w-3" />;
      case 'achievement': return <Target className="h-3 w-3" />;
      default: return <Mail className="h-3 w-3" />;
    }
  };

  const checkDeliveryConditions = () => {
    const now = new Date();
    return pendingMessages.filter(msg => {
      if (msg.deliveryTrigger === 'date' && msg.deliveryDate) {
        return new Date(msg.deliveryDate) <= now;
      }
      return false;
    });
  };

  const readyMessages = checkDeliveryConditions();
  const currentMessage = viewingMessage 
    ? widget.messages.find(m => m.id === viewingMessage)
    : null;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {widget.title}
              </CardTitle>
              <CardDescription>Messages from your past self</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ready to Read Messages */}
          {readyMessages.length > 0 && (
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <MailOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {readyMessages.length} {readyMessages.length === 1 ? 'message' : 'messages'} ready!
                </span>
              </div>
              {readyMessages.map(msg => (
                <Button
                  key={msg.id}
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setViewingMessage(msg.id);
                    onViewMessage(msg.id);
                  }}
                >
                  Open Message from {new Date(msg.createdAt).toLocaleDateString()}
                </Button>
              ))}
            </div>
          )}

          {/* Pending Messages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Scheduled Messages</p>
              <Badge variant="secondary">{pendingMessages.length}</Badge>
            </div>
            
            {pendingMessages.length > 0 ? (
              <div className="space-y-2">
                {pendingMessages.slice(0, 3).map(msg => (
                  <div key={msg.id} className="flex items-center gap-2 p-2 rounded bg-accent/50 text-sm">
                    {getDeliveryIcon(msg.deliveryTrigger)}
                    <span className="flex-1 truncate">
                      {msg.deliveryTrigger === 'date' && msg.deliveryDate
                        ? `Delivers ${new Date(msg.deliveryDate).toLocaleDateString()}`
                        : `When: ${msg.deliveryCondition}`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {msg.tags[0] || 'note'}
                    </Badge>
                  </div>
                ))}
                {pendingMessages.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pendingMessages.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                No scheduled messages yet
              </div>
            )}
          </div>

          {/* Create New Message */}
          <Button onClick={onCreateMessage} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Write to Future Self
          </Button>

          {/* Past Messages */}
          {deliveredMessages.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Message History</p>
              <div className="text-xs text-muted-foreground">
                {deliveredMessages.length} {deliveredMessages.length === 1 ? 'message' : 'messages'} delivered
              </div>
            </div>
          )}

          {widget.messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Write your first message to your future self
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Viewer Dialog */}
      <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message from Your Past Self</DialogTitle>
          </DialogHeader>
          {currentMessage && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Written on {new Date(currentMessage.createdAt).toLocaleDateString()}
              </div>
              <div className="p-4 rounded-lg bg-accent/50 whitespace-pre-wrap">
                {currentMessage.content}
              </div>
              {currentMessage.tags.length > 0 && (
                <div className="flex gap-2">
                  {currentMessage.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
