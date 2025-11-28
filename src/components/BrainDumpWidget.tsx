import { useState } from 'react';
import { BrainDumpWidget as BrainDumpWidgetType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface BrainDumpWidgetProps {
  widget: BrainDumpWidgetType;
  onEdit: () => void;
  onDelete: () => void;
  onAddThought: (content: string) => void;
}

export function BrainDumpWidget({ widget, onEdit, onDelete, onAddThought }: BrainDumpWidgetProps) {
  const [thought, setThought] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const handleVoidClick = () => {
    if (!thought.trim()) return;
    
    setIsAnimating(true);
    
    // Wait for animation to complete before clearing
    setTimeout(() => {
      onAddThought(thought);
      setThought('');
      setIsAnimating(false);
    }, 600);
  };

  return (
    <Card className="bg-gradient-to-b from-slate-900 via-indigo-950 to-black border-indigo-900/50 rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold text-purple-200">
          {widget.title}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-purple-300 hover:text-purple-100 hover:bg-purple-950/50"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-purple-300 hover:text-red-400 hover:bg-red-950/50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="relative">
          <Textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Type the thought that is distracting you..."
            className={cn(
              "min-h-[100px] bg-slate-950/50 border-purple-900/50 text-purple-100 placeholder:text-purple-400/50 resize-none rounded-xl transition-all",
              isAnimating && "animate-spiral-void"
            )}
            disabled={isAnimating}
          />
        </div>

        {/* To the Void Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleVoidClick}
            disabled={!thought.trim() || isAnimating}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-900 hover:from-purple-500 hover:to-indigo-800 shadow-lg shadow-purple-900/50 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xs text-center leading-tight">
              To the<br />Void
            </span>
          </Button>
        </div>

        {/* Archive Section */}
        <Collapsible open={showArchive} onOpenChange={setShowArchive}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-purple-300 hover:text-purple-100 hover:bg-purple-950/30"
            >
              <span className="text-sm">Archive ({widget.thoughts.length})</span>
              {showArchive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2 animate-accordion-down">
            {widget.thoughts.length === 0 ? (
              <p className="text-center text-purple-400/50 text-sm py-4">
                No thoughts in the void yet...
              </p>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {[...widget.thoughts].reverse().map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-900/50 border border-purple-900/30 rounded-lg"
                  >
                    <p className="text-sm text-purple-200 line-clamp-2">{t.content}</p>
                    <p className="text-xs text-purple-400/50 mt-1">
                      {new Date(t.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
