/**
 * DailyReviewHistory Component
 * 
 * Shows past daily reviews with analytics and insights.
 * Accessible via settings or a dedicated button.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  Target,
  MessageSquare,
  ChevronRight,
  Flame,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useDailyReviews, DailyReviewEntry } from '@/hooks/useDailyReviews';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface DailyReviewHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyReviewHistory({
  open,
  onOpenChange,
}: DailyReviewHistoryProps) {
  const { reviews, getRecentReviews, getAnalytics, getCompletionStreak } = useDailyReviews();
  const [selectedReview, setSelectedReview] = useState<DailyReviewEntry | null>(null);
  
  const recentReviews = getRecentReviews(14);
  const analytics = getAnalytics();
  const streak = getCompletionStreak();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <DialogTitle>Daily Review History</DialogTitle>
          </div>
          <DialogDescription>
            View your past reviews and track your progress
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-hidden">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No reviews yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete your first daily review to start tracking your progress
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 h-[400px]">
                <div className="space-y-3 pr-4">
                  {recentReviews.map((review) => (
                    <Card
                      key={review.id}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-accent/50 transition-colors",
                        selectedReview?.id === review.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedReview(
                        selectedReview?.id === review.id ? null : review
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">
                            {format(parseISO(review.date), 'EEEE, MMMM d, yyyy')}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {review.completedTasks} completed
                            </span>
                            <span className="flex items-center gap-1">
                              <Circle className="h-3 w-3" />
                              {review.remainingTasks} remaining
                            </span>
                            {review.tomorrowPriorities.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-primary" />
                                {review.tomorrowPriorities.length} priorities
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          selectedReview?.id === review.id && "rotate-90"
                        )} />
                      </div>

                      {/* Expanded Details */}
                      {selectedReview?.id === review.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {/* Priorities set */}
                          {review.tomorrowPriorities.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Priorities for next day
                              </h5>
                              <div className="space-y-1">
                                {review.tomorrowPriorities.map((priority, idx) => (
                                  <div
                                    key={priority.id}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-md text-sm",
                                      priority.completed
                                        ? "bg-green-500/10"
                                        : "bg-muted/50"
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground w-4">
                                      {idx + 1}.
                                    </span>
                                    {priority.completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className={cn(
                                      priority.completed && "line-through opacity-60"
                                    )}>
                                      {priority.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reflection */}
                          {review.reflection && (
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Reflection
                              </h5>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                                "{review.reflection}"
                              </p>
                            </div>
                          )}

                          {/* Carrying Forward */}
                          {review.carryingForward.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Carried forward
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {review.carryingForward.slice(0, 5).map((task, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {task.length > 25 ? task.substring(0, 25) + '...' : task}
                                  </Badge>
                                ))}
                                {review.carryingForward.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{review.carryingForward.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Streak & Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Flame className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{streak.current}</p>
                      <p className="text-xs text-muted-foreground">Day streak</p>
                    </div>
                  </div>
                  {streak.longest > streak.current && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Best: {streak.longest} days
                    </p>
                  )}
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {Math.round(analytics.priorityCompletionRate)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Priorities done</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* More Stats */}
              <Card className="p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Your Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total reviews</p>
                    <p className="font-semibold">{analytics.totalReviews}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg. completed/day</p>
                    <p className="font-semibold">
                      {analytics.averageCompletedTasks.toFixed(1)} tasks
                    </p>
                  </div>
                </div>
              </Card>

              {/* Common Carry-Forward Items */}
              {analytics.mostCommonCarryForward.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-500" />
                    Most Carried Forward
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Tasks you often carry to the next day - maybe break these down?
                  </p>
                  <div className="space-y-1">
                    {analytics.mostCommonCarryForward.slice(0, 5).map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                      >
                        <span className="truncate">{task}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Review Days */}
              {Object.keys(analytics.reviewsByDayOfWeek).length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Reviews by Day
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics.reviewsByDayOfWeek)
                      .sort((a, b) => b[1] - a[1])
                      .map(([day, count]) => (
                        <Badge
                          key={day}
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          {day}: {count}
                        </Badge>
                      ))}
                  </div>
                </Card>
              )}

              {/* Celebration message */}
              {analytics.totalReviews > 0 && (
                <Card className="p-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 text-center">
                  <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="font-medium">You're doing great!</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.totalReviews} reviews completed. Keep building the habit! 🌟
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
