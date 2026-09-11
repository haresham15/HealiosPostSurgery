'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Check, ListChecks } from 'lucide-react';
import { RecoveryStore, RecoveryMilestone } from '@/lib/recovery-store';

export const DailyChecklist = () => {
  const [milestones, setMilestones] = useState<RecoveryMilestone[]>([]);

  const loadData = () => {
    setMilestones(RecoveryStore.getMilestones());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  const handleToggle = (id: string) => {
    RecoveryStore.toggleMilestone(id);
  };

  const completedCount = milestones.filter((m) => m.completed).length;
  const percentage = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl overflow-hidden shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Today's Clinical Care Protocol
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Essential ERAS tasks to optimize tissue recovery and prevent complications
          </CardDescription>
        </div>

        <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30 bg-primary/10">
          {percentage}% Complete
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {milestones.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                item.completed
                  ? 'border-primary/30 bg-primary/5 text-muted-foreground'
                  : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded flex items-center justify-center transition-colors border ${
                    item.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/40 bg-card'
                  }`}
                >
                  {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>

                <div>
                  <span className={`text-xs font-medium block ${item.completed ? 'line-through opacity-75' : ''}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.category}
                  </span>
                </div>
              </div>

              {item.dueTime && (
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-primary/70" />
                  {item.dueTime}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
