import { useState } from 'react';
import { X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { 
  ReminderWidget, 
  EnergyTaskWidget, 
  FutureSelfMessengerWidget,
  MoodGardenWidget,
  ParallelUniverseWidget,
  SoundSignatureWidget 
} from '@/types';
import { ReminderWidgetDisplay } from './ReminderWidgetDisplay';
import { EnergyTaskWidget as EnergyTaskWidgetDisplay } from './EnergyTaskWidget';
import { FutureSelfMessengerWidget as FutureSelfMessengerWidgetDisplay } from './FutureSelfMessengerWidget';
import { MoodGardenWidget as MoodGardenWidgetDisplay } from './MoodGardenWidget';
import { ParallelUniverseWidget as ParallelUniverseWidgetDisplay } from './ParallelUniverseWidget';
import { SoundSignatureWidget as SoundSignatureWidgetDisplay } from './SoundSignatureWidget';

interface WidgetPanelProps {
  reminderWidgets: ReminderWidget[];
  energyWidgets: EnergyTaskWidget[];
  messengerWidgets: FutureSelfMessengerWidget[];
  moodGardenWidgets: MoodGardenWidget[];
  parallelUniverseWidgets: ParallelUniverseWidget[];
  soundSignatureWidgets: SoundSignatureWidget[];
  onAddWidget: () => void;
  onEditWidget: (id: string) => void;
  onToggleWidgetItem: (widgetId: string, itemId: string) => void;
  onResetWidget: (widgetId: string) => void;
  onAddEnergyWidget: () => void;
  onEditEnergyWidget: (id: string) => void;
  onLogEnergy: (widgetId: string, category: string, level: number) => void;
  onAddMessengerWidget: () => void;
  onEditMessengerWidget: (id: string) => void;
  onCreateMessage: (widgetId: string) => void;
  onViewMessage: (widgetId: string, messageId: string) => void;
  onAddMoodGardenWidget: () => void;
  onEditMoodGardenWidget: (id: string) => void;
  onLogMood: (widgetId: string, emotion: string, intensity: number, note?: string) => void;
  onAddParallelUniverseWidget: () => void;
  onEditParallelUniverseWidget: (id: string) => void;
  onLogDecision: (widgetId: string, question: string, chosen: string, alternatives: string[], context?: string) => void;
  onGenerateOutcome: (widgetId: string, decisionId: string) => void;
  onAddSoundSignatureWidget: () => void;
  onEditSoundSignatureWidget: (id: string) => void;
  onLogSoundSession: (widgetId: string, soundType: string, duration: number, productivity: number, mood: string, activity: string) => void;
}

export function WidgetPanel({
  reminderWidgets,
  energyWidgets,
  messengerWidgets,
  moodGardenWidgets,
  parallelUniverseWidgets,
  soundSignatureWidgets,
  onAddWidget,
  onEditWidget,
  onToggleWidgetItem,
  onResetWidget,
  onAddEnergyWidget,
  onEditEnergyWidget,
  onLogEnergy,
  onAddMessengerWidget,
  onEditMessengerWidget,
  onCreateMessage,
  onViewMessage,
  onAddMoodGardenWidget,
  onEditMoodGardenWidget,
  onLogMood,
  onAddParallelUniverseWidget,
  onEditParallelUniverseWidget,
  onLogDecision,
  onGenerateOutcome,
  onAddSoundSignatureWidget,
  onEditSoundSignatureWidget,
  onLogSoundSession,
}: WidgetPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const hasWidgets = 
    reminderWidgets.length > 0 || 
    energyWidgets.length > 0 || 
    messengerWidgets.length > 0 ||
    moodGardenWidgets.length > 0 ||
    parallelUniverseWidgets.length > 0 ||
    soundSignatureWidgets.length > 0;

  return (
    <>
      {/* Backdrop Overlay (Mobile Only) */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/50 z-20 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 rounded-l-lg rounded-r-none transition-all duration-300 hover:scale-105"
        size="sm"
        data-tutorial="widgets"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] ${
          isMobile ? 'w-full' : 'w-96'
        } bg-card border-l border-border z-30 transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between sticky top-0 bg-card pb-2 border-b border-border">
            <h2 className="text-xl font-semibold">Widgets</h2>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Productivity Widgets</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onAddEnergyWidget}>
                    ⚡ Energy-Task Harmony
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddMessengerWidget}>
                    ✉️ Future Self Messenger
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddMoodGardenWidget}>
                    🌱 Mood Garden
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddParallelUniverseWidget}>
                    🌌 Parallel Universe
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddSoundSignatureWidget}>
                    🎵 Sound Signature
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Custom</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onAddWidget}>
                    ➕ Custom Reminder Widget
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!hasWidgets ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Create widgets to track productivity, moods, and custom reminders
              </p>
              <Button onClick={onAddWidget} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Widget
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {energyWidgets.map((widget, index) => (
                <div key={widget.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <EnergyTaskWidgetDisplay
                    widget={widget}
                    onLogEnergy={(category, level) => onLogEnergy(widget.id, category, level)}
                    onEdit={() => onEditEnergyWidget(widget.id)}
                  />
                </div>
              ))}
              {messengerWidgets.map((widget, index) => (
                <div key={widget.id} className="animate-fade-in" style={{ animationDelay: `${(energyWidgets.length + index) * 50}ms` }}>
                  <FutureSelfMessengerWidgetDisplay
                    widget={widget}
                    onCreateMessage={() => onCreateMessage(widget.id)}
                    onViewMessage={(msgId) => onViewMessage(widget.id, msgId)}
                    onEdit={() => onEditMessengerWidget(widget.id)}
                  />
                </div>
              ))}
              {moodGardenWidgets.map((widget, index) => (
                <div key={widget.id} className="animate-fade-in" style={{ animationDelay: `${(energyWidgets.length + messengerWidgets.length + index) * 50}ms` }}>
                  <MoodGardenWidgetDisplay
                    widget={widget}
                    onLogMood={(emotion, intensity, note) => onLogMood(widget.id, emotion, intensity, note)}
                    onEdit={() => onEditMoodGardenWidget(widget.id)}
                  />
                </div>
              ))}
              {parallelUniverseWidgets.map((widget, index) => (
                <div key={widget.id} className="animate-fade-in" style={{ animationDelay: `${(energyWidgets.length + messengerWidgets.length + moodGardenWidgets.length + index) * 50}ms` }}>
                  <ParallelUniverseWidgetDisplay
                    widget={widget}
                    onLogDecision={(q, c, a, ctx) => onLogDecision(widget.id, q, c, a, ctx)}
                    onGenerateOutcome={(decId) => onGenerateOutcome(widget.id, decId)}
                    onEdit={() => onEditParallelUniverseWidget(widget.id)}
                  />
                </div>
              ))}
              {soundSignatureWidgets.map((widget, index) => (
                <div key={widget.id} className="animate-fade-in" style={{ animationDelay: `${(energyWidgets.length + messengerWidgets.length + moodGardenWidgets.length + parallelUniverseWidgets.length + index) * 50}ms` }}>
                  <SoundSignatureWidgetDisplay
                    widget={widget}
                    onLogSession={(s, d, p, m, a) => onLogSoundSession(widget.id, s, d, p, m, a)}
                    onEdit={() => onEditSoundSignatureWidget(widget.id)}
                  />
                </div>
              ))}
              {reminderWidgets.map((widget, index) => (
                <div key={widget.id} className="animate-fade-in" style={{ animationDelay: `${(energyWidgets.length + messengerWidgets.length + moodGardenWidgets.length + parallelUniverseWidgets.length + soundSignatureWidgets.length + index) * 50}ms` }}>
                  <ReminderWidgetDisplay
                    widget={widget}
                    onToggleItem={onToggleWidgetItem}
                    onEdit={onEditWidget}
                    onReset={onResetWidget}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
