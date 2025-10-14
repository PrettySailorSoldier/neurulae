import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { syncService } from '@/services/syncService';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: 'Error signing in',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        // Download cloud data after successful sign in
        const cloudData = await syncService.downloadAll();
        
        // Merge with local data if exists
        Object.entries(cloudData).forEach(([key, value]) => {
          const localKey = `neurulae-${key}`;
          const localData = localStorage.getItem(localKey);
          
          if (!localData || localData === 'null' || localData === '[]') {
            // No local data, use cloud data
            localStorage.setItem(localKey, JSON.stringify(value));
          }
          // If local data exists, keep it (local-first approach)
        });

        toast({
          title: 'Welcome back!',
          description: 'Signed in successfully'
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        toast({
          title: 'Error signing up',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        // Upload all local data to cloud
        const localData: Record<string, any> = {};
        const keys = ['tasks', 'projects', 'priorities', 'timeblocks', 'scheduledTasks',
                      'playbooks', 'reminderWidgets', 'energyWidgets', 'messengerWidgets',
                      'moodGardenWidgets', 'parallelUniverseWidgets', 'soundSignatureWidgets',
                      'theme', 'customTheme', 'customTabs', 'timerSessions'];
        
        keys.forEach(key => {
          const item = localStorage.getItem(`neurulae-${key}`);
          if (item) {
            try {
              localData[key] = JSON.parse(item);
            } catch (e) {
              console.error(`Failed to parse ${key}:`, e);
            }
          }
        });

        await syncService.initialSync(localData);

        toast({
          title: 'Account created!',
          description: 'Your local data has been backed up to the cloud'
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Neurulae</CardTitle>
          <CardDescription>
            Sign in to sync your data across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

