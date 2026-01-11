import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  PRIMARY_FILTERS, 
  getSecondaryOptions, 
  type PrimaryFilter 
} from '@/data/playbookFilterOptions';
import { Home, Activity, Clock, Sparkles, LayoutGrid } from 'lucide-react';

interface PlaybookFiltersProps {
  primaryFilter: PrimaryFilter;
  secondaryFilter: string | null;
  onPrimaryChange: (filter: PrimaryFilter) => void;
  onSecondaryChange: (filter: string | null) => void;
}

const PRIMARY_ICONS: Record<PrimaryFilter, React.ReactNode> = {
  'all': <LayoutGrid className="h-3.5 w-3.5" />,
  'by-room': <Home className="h-3.5 w-3.5" />,
  'by-activity': <Activity className="h-3.5 w-3.5" />,
  'by-time': <Clock className="h-3.5 w-3.5" />,
  'templates': <Sparkles className="h-3.5 w-3.5" />,
};

export function PlaybookFilters({
  primaryFilter,
  secondaryFilter,
  onPrimaryChange,
  onSecondaryChange,
}: PlaybookFiltersProps) {
  const secondaryOptions = getSecondaryOptions(primaryFilter);

  return (
    <div className="space-y-3">
      {/* Primary Filter */}
      <Tabs value={primaryFilter} onValueChange={(v) => {
        onPrimaryChange(v as PrimaryFilter);
        onSecondaryChange(null); // Reset secondary when primary changes
      }}>
        <TabsList className="grid grid-cols-5 h-auto p-1">
          {PRIMARY_FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="flex items-center gap-1.5 text-xs py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {PRIMARY_ICONS[filter.value]}
              <span className="hidden sm:inline">{filter.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Secondary Filter (shown when primary requires it) */}
      {secondaryOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={secondaryFilter === null ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => onSecondaryChange(null)}
          >
            All
          </Badge>
          {secondaryOptions.map((option) => (
            <Badge
              key={option.value}
              variant={secondaryFilter === option.value ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => onSecondaryChange(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
