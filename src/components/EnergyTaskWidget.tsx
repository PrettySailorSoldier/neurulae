import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, Plus, TrendingUp, Zap, Trash2 } from "lucide-react";
import { EnergyTaskWidget as EnergyTaskWidgetType } from "@/types";

interface EnergyTaskWidgetProps {
  widget: EnergyTaskWidgetType;
  onLogEnergy: (category: string, level: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const EnergyTaskWidget = ({ widget, onLogEnergy, onEdit, onDelete }: EnergyTaskWidgetProps) => {
  const currentEnergy = widget.energyLogs.length > 0 
    ? widget.energyLogs[widget.energyLogs.length - 1] 
    : null;

  const getAverageEnergy = (category: string) => {
    const logs = widget.energyLogs.filter(log => log.category === category);
    if (logs.length === 0) return 0;
    return Math.round(logs.reduce((sum, log) => sum + log.level, 0) / logs.length);
  };

  const getSuggestedTasks = () => {
    if (!currentEnergy || !widget.taskSuggestionsEnabled) return [];
    return widget.linkedTasks
      .filter(task => 
        task.preferredCategory === currentEnergy.category &&
        Math.abs(task.optimalEnergy - currentEnergy.level) <= 2
      )
      .slice(0, 3);
  };

  const suggestedTasks = getSuggestedTasks();

  const energyLevelColor = (level: number) => {
    if (level <= 3) return "text-destructive";
    if (level <= 6) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {widget.title}
            </CardTitle>
            <CardDescription>Track energy & get optimal task suggestions</CardDescription>
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
        {/* Current Energy Status */}
        {currentEnergy && (
          <div className="p-4 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Energy</span>
              <Badge variant="outline" className={energyLevelColor(currentEnergy.level)}>
                {currentEnergy.level}/10
              </Badge>
            </div>
            <Progress value={currentEnergy.level * 10} className="h-2" />
            <div className="mt-2 text-xs text-muted-foreground capitalize">
              {currentEnergy.category} • {new Date(currentEnergy.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Quick Energy Log */}
        <div>
          <p className="text-sm font-medium mb-2">Log Energy Level</p>
          <div className="grid grid-cols-2 gap-2">
            {widget.trackedCategories.map(category => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => {
                  const level = prompt(`Rate your ${category} energy (1-10):`);
                  if (level && !isNaN(Number(level))) {
                    onLogEnergy(category, Math.min(10, Math.max(1, Number(level))));
                  }
                }}
                className="capitalize"
              >
                <Plus className="h-3 w-3 mr-1" />
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Energy Averages */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4" />
            <p className="text-sm font-medium">Average Energy Levels</p>
          </div>
          <div className="space-y-2">
            {widget.trackedCategories.map(category => {
              const avg = getAverageEnergy(category);
              return (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{category}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={avg * 10} className="h-1 w-20" />
                    <span className="text-xs text-muted-foreground w-8">{avg}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Suggestions */}
        {widget.taskSuggestionsEnabled && suggestedTasks.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">🎯 Optimal Tasks Right Now</p>
            <div className="space-y-2">
              {suggestedTasks.map(task => (
                <div key={task.taskId} className="flex items-center gap-2 text-sm p-2 rounded bg-primary/5">
                  <Zap className="h-3 w-3 text-primary" />
                  <span>{task.taskTitle}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {widget.energyLogs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Start logging your energy levels to get personalized task recommendations
          </div>
        )}
      </CardContent>
    </Card>
  );
};
