import React from 'react';
import { Badge as BadgeType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface BadgeDisplayProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  isEarned?: boolean;
  progress?: number;
  className?: string;
}

export const BadgeDisplay = ({
  badge,
  size = 'md',
  showTooltip = true,
  isEarned = true,
  progress = 0,
  className,
}: BadgeDisplayProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  const levelColors = {
    1: 'bg-zinc-500 dark:bg-zinc-800', // Bronze
    2: 'bg-yellow-200 dark:bg-yellow-800', // Gold
    3: 'bg-blue-300 dark:bg-blue-900', // Diamond
  };

  const badgeContent = (
    <div 
      className={cn(
        'rounded-full flex items-center justify-center relative',
        sizeClasses[size],
        isEarned 
          ? levelColors[badge.level as keyof typeof levelColors] || levelColors[1]
          : 'bg-gray-200 dark:bg-gray-900 opacity-50',
        badge.category === 'loyalty' && 'border-2 border-purple-500',
        badge.category === 'expertise' && 'border-2 border-blue-500',
        className
      )}
    >
      {badge.icon}
      
      {!isEarned && progress > 0 && progress < 100 && (
        <div className="absolute bottom-0 w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-center">
              <p className="font-bold">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {!isEarned && (
                <Badge variant="outline" className="mt-1">
                  {progress > 0 ? `${progress}% complete` : 'Locked'}
                </Badge>
              )}
              {isEarned && (
                <Badge variant="outline" className="mt-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                  Earned • {badge.points} points
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badgeContent;
};