import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ReminderWidget } from '@/types';
import { Settings, RotateCcw } from 'lucide-react';

interface ReminderWidgetDisplayProps {
  widget: ReminderWidget;
  onToggleItem: (widgetId: string, itemId: string) => void;
  onEdit: (widgetId: string) => void;
  onReset: (widgetId: string) => void;
}

export const ReminderWidgetDisplay = ({
  widget,
  onToggleItem,
  onEdit,
  onReset,
}: ReminderWidgetDisplayProps) => {
  const completedCount = widget.items.filter(item => item.completed).length;
  const totalCount = widget.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{widget.title}</CardTitle>
            {widget.description && (
              <p className="text-sm text-muted-foreground mt-1">{widget.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReset(widget.id)}
              className="h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(widget.id)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedCount} of {totalCount} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {widget.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No items yet. Click the settings icon to add some.
            </p>
          ) : (
            widget.items
              .sort((a, b) => a.order - b.order)
              .map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => onToggleItem(widget.id, item.id)}
                    id={`item-${item.id}`}
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className={`flex-1 text-sm cursor-pointer ${
                      item.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.text}
                  </label>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
