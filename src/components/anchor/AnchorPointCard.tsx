import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AnchorPoint } from '@/types';
import {
  Anchor,
  Clock,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Link,
  Unlink,
  Sun,
  Sunset,
  Moon,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnchorPointCardProps {
  anchor: AnchorPoint;
  linkedRoutineCount?: number;
  onToggleActive: (id: string) => void;
  onEdit: (anchor: AnchorPoint) => void;
  onDelete: (id: string) => void;
  onManageRoutines?: (anchor: AnchorPoint) => void;
}

const CATEGORY_ICONS = {
  morning: Sun,
  midday: Zap,
  evening: Sunset,
  flex: Moon,
};

const CATEGORY_COLORS = {
  morning: 'bg-amber-500/10 text-amber-600 border-amber-200',
  midday: 'bg-blue-500/10 text-blue-600 border-blue-200',
  evening: 'bg-purple-500/10 text-purple-600 border-purple-200',
  flex: 'bg-slate-500/10 text-slate-600 border-slate-200',
};

const RELIABILITY_LABELS = {
  'rock-solid': { label: 'Rock solid', color: 'bg-green-500/10 text-green-600' },
  'usually': { label: 'Usually', color: 'bg-yellow-500/10 text-yellow-600' },
  'sometimes': { label: 'Sometimes', color: 'bg-orange-500/10 text-orange-600' },
};

export function AnchorPointCard({
  anchor,
  linkedRoutineCount = 0,
  onToggleActive,
  onEdit,
  onDelete,
  onManageRoutines,
}: AnchorPointCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const CategoryIcon = CATEGORY_ICONS[anchor.category];
  const reliabilityInfo = RELIABILITY_LABELS[anchor.reliability];

  const handleDelete = () => {
    onDelete(anchor.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card
        className={cn(
          'transition-all duration-200',
          anchor.isActive
            ? 'border-primary/30 bg-card'
            : 'border-muted bg-muted/30 opacity-60'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left side: Icon and main content */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  CATEGORY_COLORS[anchor.category]
                )}
              >
                <Anchor className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{anchor.name}</h3>
                  <Badge variant="outline" className={cn('text-xs', reliabilityInfo.color)}>
                    {reliabilityInfo.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {anchor.triggerType === 'time' ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>At {anchor.triggerTime}</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{anchor.triggerEvent}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {anchor.category.charAt(0).toUpperCase() + anchor.category.slice(1)}
                  </Badge>

                  {linkedRoutineCount > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      <Link className="w-3 h-3 mr-1" />
                      {linkedRoutineCount} routine{linkedRoutineCount !== 1 ? 's' : ''} attached
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      <Unlink className="w-3 h-3 mr-1" />
                      No routines
                    </Badge>
                  )}

                  <Badge variant="outline" className="text-xs">
                    {anchor.attachmentPosition === 'before' ? 'Before' : 'After'} trigger
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right side: Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={anchor.isActive}
                onCheckedChange={() => onToggleActive(anchor.id)}
                aria-label={anchor.isActive ? 'Deactivate anchor' : 'Activate anchor'}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(anchor)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit anchor
                  </DropdownMenuItem>
                  {onManageRoutines && (
                    <DropdownMenuItem onClick={() => onManageRoutines(anchor)}>
                      <Link className="w-4 h-4 mr-2" />
                      Manage routines
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete anchor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete anchor point?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{anchor.name}" as an anchor point.
              {linkedRoutineCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  {linkedRoutineCount} routine{linkedRoutineCount !== 1 ? 's are' : ' is'} attached
                  to this anchor. They won't be deleted but will need a new anchor.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
