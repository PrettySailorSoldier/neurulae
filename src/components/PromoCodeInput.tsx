import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/contexts/PremiumContext";
import { Loader2, Gift } from "lucide-react";

export function PromoCodeInput() {
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  const { checkSubscription } = usePremium();

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Enter a code",
        description: "Please enter a promo code to redeem",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);

    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo", {
        body: { code: code.trim() },
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

      setCode("");
      
      // Refresh premium status
      await checkSubscription();

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Promo Code
        </CardTitle>
        <CardDescription>
          Have a promo code? Enter it here to unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="promo-code">Promo Code</Label>
          <div className="flex gap-2">
            <Input
              id="promo-code"
              placeholder="Enter code (e.g., BETATESTER2025)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              disabled={isRedeeming}
            />
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming || !code.trim()}
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redeeming...
                </>
              ) : (
                "Redeem"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
