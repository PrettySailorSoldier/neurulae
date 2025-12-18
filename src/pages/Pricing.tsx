import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Crown, Sparkles, Zap, Gift, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/contexts/PremiumContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = {
  monthly: {
    name: "Premium Monthly",
    price: "$4.99",
    interval: "/month",
    priceId: "price_1SIHVAE3pslXVHIsxroVZBpp",
    icon: Sparkles,
  },
  yearly: {
    name: "Premium Yearly",
    price: "$39.99",
    interval: "/year",
    priceId: "price_1SIHWaE3pslXVHIsWldfG5KF",
    savings: "Save $20/year",
    icon: Crown,
  },
  lifetime: {
    name: "Lifetime Access",
    price: "$199",
    interval: "one-time",
    priceId: "price_1SIHX5E3pslXVHIsXY4o1L8d",
    icon: Zap,
  }
};

const features = [
  "Unlimited playbooks & templates",
  "Unlimited advanced widgets",
  "Automatic cloud sync",
  "AI-powered features",
  "Custom theme builder",
  "Advanced analytics",
  "Priority support"
];

export default function Pricing() {
  const navigate = useNavigate();
  const { plan, isPremium, loading, checkSubscription } = usePremium();
  const { user } = useAuth();
  const { toast } = useToast();
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive"
      });
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    if (!user) {
      navigate('/auth');
      return;
    }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade anytime for advanced features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className={plan === 'free' && !loading ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Free</span>
                {plan === 'free' && !loading && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm">Unlimited tasks & projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm">All timer features</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm">Up to 3 playbooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm">1 custom widget</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm">Local storage only</span>
                </li>
              </ul>
              {!user && (
                <Button onClick={() => navigate('/auth')} className="w-full">
                  Get Started
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plans */}
          {Object.entries(PLANS).map(([key, planDetails]) => {
            const Icon = planDetails.icon;
            const isCurrentPlan = 
              (key === 'monthly' && plan === 'premium') ||
              (key === 'lifetime' && plan === 'lifetime');

            return (
              <Card key={key} className={isCurrentPlan ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span>{planDetails.name}</span>
                    {isCurrentPlan && !loading && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">{planDetails.price}</span>
                    <span className="text-muted-foreground">{planDetails.interval}</span>
                    {'savings' in planDetails && planDetails.savings && (
                      <div className="text-primary text-sm font-semibold mt-1">
                        {planDetails.savings}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!isPremium && (
                    <Button 
                      onClick={() => handleCheckout(planDetails.priceId)}
                      className="w-full"
                    >
                      Upgrade Now
                    </Button>
                  )}
                  {isCurrentPlan && (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Promo Code Section */}
        {!isPremium && (
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="h-5 w-5" />
                Have a Promo Code?
              </CardTitle>
              <CardDescription>
                Enter your code below to unlock premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
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
                >
                  {isRedeeming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Redeem"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-12">
          <Button variant="ghost" onClick={() => navigate('/app')}>
            Back to App
          </Button>
        </div>
      </div>
    </div>
  );
}
