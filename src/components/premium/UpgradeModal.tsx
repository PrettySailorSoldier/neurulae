import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

const premiumFeatures = [
  "Unlimited playbooks and templates",
  "Unlimited advanced widgets",
  "Automatic cloud sync across devices",
  "AI-powered playbook generation",
  "AI task suggestions and predictions",
  "Custom theme builder",
  "Advanced analytics and insights",
  "Priority support"
];

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <DialogTitle>Upgrade to Premium</DialogTitle>
          </div>
          <DialogDescription>
            {feature} is a premium feature. Upgrade to unlock this and many more powerful features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-4">
          {premiumFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
