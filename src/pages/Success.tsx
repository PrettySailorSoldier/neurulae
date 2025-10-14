import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { usePremium } from "@/contexts/PremiumContext";

export default function Success() {
  const navigate = useNavigate();
  const { checkSubscription } = usePremium();

  useEffect(() => {
    // Refresh subscription status after successful payment
    checkSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for upgrading to premium. Your account has been activated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              You now have access to all premium features including unlimited playbooks, 
              widgets, cloud sync, and AI-powered capabilities.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/')} className="w-full">
                Start Using Premium Features
              </Button>
              <Button 
                onClick={() => navigate('/settings')} 
                variant="outline" 
                className="w-full"
              >
                View Account Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
