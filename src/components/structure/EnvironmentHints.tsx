import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Volume2, MapPin, Clock } from 'lucide-react';
import { EnvironmentHints as EnvironmentHintsType } from '@/lib/temporalContext';

interface EnvironmentHintsProps {
  environmentHints: EnvironmentHintsType;
}

export function EnvironmentHints({ environmentHints }: EnvironmentHintsProps) {
  // Only show if at least one hint exists
  const hasHints = Object.values(environmentHints).some(hint => hint !== null);
  if (!hasHints) return null;
  
  return (
    <Card className="border-l-4 border-l-blue-500 bg-card/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2 font-medium">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          Environment Hints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm px-4 pb-3">
        {environmentHints.lighting && (
          <div className="flex gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{environmentHints.lighting}</p>
          </div>
        )}
        
        {environmentHints.sound && (
          <div className="flex gap-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{environmentHints.sound}</p>
          </div>
        )}
        
        {environmentHints.timing && (
          <div className="flex gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{environmentHints.timing}</p>
          </div>
        )}
        
        {environmentHints.space && (
          <div className="flex gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{environmentHints.space}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
