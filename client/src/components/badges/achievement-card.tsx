import React from 'react';
import { Achievement as AchievementType, Badge as BadgeType } from '@shared/schema';
import { BadgeDisplay } from './badge-display';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: AchievementType;
  badge: BadgeType;
  isCompleted?: boolean;
  progress?: number;
  className?: string;
  showProgress?: boolean;
}

export const AchievementCard = ({
  achievement,
  badge,
  isCompleted = false,
  progress = 0,
  className,
  showProgress = true,
}: AchievementCardProps) => {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-md",
        isCompleted && "border-green-500 dark:border-green-600",
        achievement.isSecret && !isCompleted && "border-dashed border-yellow-500 dark:border-yellow-600",
        className
      )}
    >
      {achievement.isSecret && !isCompleted && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-xs text-white px-2 py-0.5 rounded-full">
          Secret
        </div>
      )}
      
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-green-500 text-xs text-white px-2 py-0.5 rounded-full">
          Completed
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <BadgeDisplay badge={badge} isEarned={isCompleted} showTooltip={false} />
        <div>
          <h3 className="font-semibold">{achievement.name}</h3>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
        </div>
      </CardHeader>
      
      {showProgress && (
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {achievement.type === 'message_count' && achievement.requiredCount && (
              <p className="text-xs text-muted-foreground">
                Messages: {Math.round((progress / 100) * achievement.requiredCount)}/{achievement.requiredCount}
              </p>
            )}
            
            {achievement.type === 'unique_commands' && achievement.requiredCount && (
              <p className="text-xs text-muted-foreground">
                Commands: {Math.round((progress / 100) * achievement.requiredCount)}/{achievement.requiredCount}
              </p>
            )}
            
            {achievement.type === 'login_streak' && achievement.requiredCount && (
              <p className="text-xs text-muted-foreground">
                Days streak: {Math.round((progress / 100) * achievement.requiredCount)}/{achievement.requiredCount}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};