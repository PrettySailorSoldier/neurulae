import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, Settings as SettingsIcon, LogOut, CreditCard } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { plan, isPremium, isAdmin, loading } = usePremium();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getPlanDisplay = () => {
    if (loading) return "Loading...";
    if (isAdmin) return "Admin";
    if (plan === 'lifetime') return "Lifetime";
    if (plan === 'premium') return "Premium";
    return "Free";
  };

  const getPlanBadgeVariant = () => {
    if (isAdmin) return "default";
    if (isPremium) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Account Settings</h1>
        </div>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and current plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-lg">{user?.email}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Current Plan</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getPlanBadgeVariant()} className="text-lg py-1">
                  {isPremium && <Crown className="h-4 w-4 mr-1" />}
                  {getPlanDisplay()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        {!isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPremium ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You're currently on the free plan. Upgrade to unlock premium features.
                  </p>
                  <Button onClick={() => navigate('/pricing')} className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    View Premium Plans
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Manage your subscription, update payment method, or view billing history.
                  </p>
                  <Button 
                    onClick={handleManageSubscription} 
                    variant="outline" 
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              Back to App
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
