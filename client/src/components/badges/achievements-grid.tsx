import React from 'react';
import { Achievement as AchievementType, Badge as BadgeType } from '@shared/schema';
import { AchievementCard } from './achievement-card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AchievementsGridProps {
  achievements: AchievementType[];
  badges: BadgeType[];
  userProgress?: Record<number, { 
    progress: number, 
    isCompleted: boolean 
  }>;
  title?: string;
  showCompleted?: boolean;
  showFilters?: boolean;
  className?: string;
}

export const AchievementsGrid = ({
  achievements,
  badges,
  userProgress = {},
  title = "Achievements",
  showCompleted = true,
  showFilters = true,
  className,
}: AchievementsGridProps) => {
  const [achievementType, setAchievementType] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [hideCompleted, setHideCompleted] = React.useState<boolean>(false);
  
  const achievementTypes = React.useMemo(() => {
    const uniqueTypes = [...new Set(achievements.map(achievement => achievement.type))];
    return ['all', ...uniqueTypes];
  }, [achievements]);
  
  const badgeMap = React.useMemo(() => {
    return badges.reduce((acc, badge) => {
      acc[badge.id] = badge;
      return acc;
    }, {} as Record<number, BadgeType>);
  }, [badges]);
  
  const filteredAchievements = React.useMemo(() => {
    return achievements.filter(achievement => {
      // Don't show secret achievements unless completed
      if (achievement.isSecret && 
          (!userProgress[achievement.id] || !userProgress[achievement.id].isCompleted)) {
        return false;
      }
      
      // Type filter
      if (achievementType !== 'all' && achievement.type !== achievementType) {
        return false;
      }
      
      // Hide completed filter
      if (hideCompleted && 
          userProgress[achievement.id] && 
          userProgress[achievement.id].isCompleted) {
        return false;
      }
      
      // Search filter
      if (searchTerm && 
          !achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !achievement.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [achievements, achievementType, hideCompleted, searchTerm, userProgress]);
  
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-2xl font-bold">{title}</h2>
      
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-48">
            <Select value={achievementType} onValueChange={setAchievementType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {achievementTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Input
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          
          {showCompleted && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="hide-completed" 
                checked={hideCompleted} 
                onCheckedChange={setHideCompleted} 
              />
              <Label htmlFor="hide-completed">Hide completed</Label>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => {
          const userAchievement = userProgress[achievement.id] || { progress: 0, isCompleted: false };
          const badge = badgeMap[achievement.badgeId];
          
          if (!badge) return null;
          
          return (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              badge={badge}
              isCompleted={userAchievement.isCompleted}
              progress={userAchievement.progress}
            />
          );
        })}
        
        {filteredAchievements.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No achievements found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};