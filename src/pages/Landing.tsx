import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, Calendar, Zap, Target, Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Neurulae</span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Your Intelligent Task Hub
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Plan smarter, focus better, and achieve more with AI-powered task management,
          time blocking, and personalized productivity insights.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
            View Pricing
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent time blocking and calendar integration to optimize your day.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Focus Timers</h3>
              <p className="text-sm text-muted-foreground">
                Multiple timer modes including Pomodoro and Flowtime to maintain peak focus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Target className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Task Prioritization</h3>
              <p className="text-sm text-muted-foreground">
                Eisenhower Matrix and AI-powered organization to focus on what matters.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized insights and automatically organize your tasks.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Neurulae. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
