import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Gift, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/contexts/PremiumContext";

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
  const { toast } = useToast();
  const { checkSubscription } = usePremium();
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;

    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo", {
        body: { code: promoCode.trim() },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Invalid code",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success! 🎉",
        description: data.message || "Promo code redeemed successfully!",
      });

      setPromoCode("");
      await checkSubscription();
      onOpenChange(false);
    } catch (error) {
      console.error("Error redeeming promo code:", error);
      toast({
        title: "Error",
        description: "Failed to redeem promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
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

        {/* Promo Code Section */}
        <div className="border-t pt-4 mt-2">
          <button
            onClick={() => setShowPromo(!showPromo)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Gift className="h-4 w-4" />
            Have a promo code?
          </button>
          
          {showPromo && (
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleRedeemPromo()}
                disabled={isRedeeming}
                className="flex-1"
              />
              <Button 
                onClick={handleRedeemPromo} 
                disabled={isRedeeming || !promoCode.trim()}
                size="sm"
              >
                {isRedeeming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Redeem"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
