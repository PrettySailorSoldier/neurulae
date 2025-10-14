import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 ${className}`}
    >
      <Crown className="h-3 w-3" />
      Premium
    </Badge>
  );
}
