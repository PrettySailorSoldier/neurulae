import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ParallelUniverseWidget, Decision } from '@/types';
import { GitBranch, Settings, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ParallelUniverseWidgetProps {
  widget: ParallelUniverseWidget;
  onLogDecision: (question: string, chosen: string, alternatives: string[], context?: string) => void;
  onGenerateOutcome: (decisionId: string) => void;
  onEdit: () => void;
}

export function ParallelUniverseWidget({ 
  widget, 
  onLogDecision, 
  onGenerateOutcome,
  onEdit 
}: ParallelUniverseWidgetProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chosen, setChosen] = useState('');
  const [alternative, setAlternative] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [context, setContext] = useState('');

  const handleLogDecision = () => {
    if (question && chosen && alternatives.length > 0) {
      onLogDecision(question, chosen, alternatives, context || undefined);
      setQuestion('');
      setChosen('');
      setAlternatives([]);
      setAlternative('');
      setContext('');
      setDialogOpen(false);
    }
  };

  const addAlternative = () => {
    if (alternative && !alternatives.includes(alternative)) {
      setAlternatives([...alternatives, alternative]);
      setAlternative('');
    }
  };

  const recentDecisions = widget.decisions.slice(-3).reverse();

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              {widget.title}
            </CardTitle>
            <CardDescription>Explore alternate paths</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentDecisions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Log your first decision to see alternate universes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDecisions.map(decision => {
              const outcome = widget.alternateOutcomes.find(o => o.decisionId === decision.id);
              return (
                <div key={decision.id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium text-sm">{decision.question}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      Chose: {decision.chosenOption}
                    </Badge>
                  </div>
                  
                  {outcome ? (
                    <div className="bg-muted/50 rounded p-2 text-xs space-y-1">
                      <div className="font-medium text-primary flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Alternate Universe:
                      </div>
                      <div className="text-muted-foreground">
                        If you chose <strong>{outcome.alternativePath}</strong>:
                      </div>
                      <div>{outcome.aiGeneratedOutcome}</div>
                    </div>
                  ) : widget.aiEnabled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateOutcome(decision.id)}
                      className="w-full"
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Generate Alternate Outcome
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Log Decision
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log a Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What did you decide?</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Which project to prioritize?"
                />
              </div>

              <div className="space-y-2">
                <Label>What you chose</Label>
                <Input
                  value={chosen}
                  onChange={(e) => setChosen(e.target.value)}
                  placeholder="Your actual choice"
                />
              </div>

              <div className="space-y-2">
                <Label>Alternative options (what you didn't choose)</Label>
                <div className="flex gap-2">
                  <Input
                    value={alternative}
                    onChange={(e) => setAlternative(e.target.value)}
                    placeholder="Another option..."
                    onKeyDown={(e) => e.key === 'Enter' && addAlternative()}
                  />
                  <Button onClick={addAlternative} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {alternatives.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {alternatives.map((alt, i) => (
                      <Badge key={i} variant="secondary">{alt}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Context (optional)</Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Why this decision mattered..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleLogDecision} 
                className="w-full"
                disabled={!question || !chosen || alternatives.length === 0}
              >
                Log Decision
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
