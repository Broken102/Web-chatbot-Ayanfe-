import React from 'react';
import { 
  Achievement as AchievementType, 
  Badge as BadgeType 
} from '@shared/schema';
import { BadgeDisplay } from './badge-display';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface AchievementNotificationProps {
  achievement: AchievementType;
  badge: BadgeType;
  open: boolean;
  onClose: () => void;
}

export const AchievementNotification = ({
  achievement,
  badge,
  open,
  onClose,
}: AchievementNotificationProps) => {
  React.useEffect(() => {
    if (open) {
      // Trigger confetti when achievement notification opens
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 9999,
        disableForReducedMotion: true
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Use random colors
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
        });
      }, 250);

      return () => {
        clearInterval(interval);
      };
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className={cn(
        "max-w-md text-center",
        "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950",
        "border-2 border-indigo-200 dark:border-indigo-800"
      )}>
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BadgeDisplay 
              badge={badge} 
              size="lg" 
              showTooltip={false}
              className="animate-bounce"
            />
          </div>
          <AlertDialogTitle className="text-xl tracking-wide">
            Achievement Unlocked!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg font-medium mt-2 text-foreground">
            {achievement.name}
            <Badge className="ml-2 bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-none">
              +{badge.points} points
            </Badge>
          </AlertDialogDescription>
          <p className="mt-2 text-muted-foreground">
            {achievement.description}
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col items-center mt-4">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Awesome!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};