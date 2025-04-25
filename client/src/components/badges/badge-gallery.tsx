import React from 'react';
import { Badge as BadgeType } from '@shared/schema';
import { BadgeDisplay } from './badge-display';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BadgeGalleryProps {
  badges: BadgeType[];
  earnedBadgeIds?: number[];
  badgeProgress?: Record<number, number>;
  title?: string;
  showFilters?: boolean;
  className?: string;
}

export const BadgeGallery = ({
  badges,
  earnedBadgeIds = [],
  badgeProgress = {},
  title = "Badges",
  showFilters = true,
  className,
}: BadgeGalleryProps) => {
  const [category, setCategory] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(badges.map(badge => badge.category))];
    return ['all', ...uniqueCategories];
  }, [badges]);
  
  const filteredBadges = React.useMemo(() => {
    return badges.filter(badge => {
      // Category filter
      if (category !== 'all' && badge.category !== category) {
        return false;
      }
      
      // Search filter
      if (searchTerm && 
          !badge.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !badge.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [badges, category, searchTerm]);
  
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-2xl font-bold">{title}</h2>
      
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Input
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      )}
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
        {filteredBadges.map(badge => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          const progress = badgeProgress[badge.id] || 0;
          
          return (
            <div key={badge.id} className="flex flex-col items-center">
              <BadgeDisplay 
                badge={badge} 
                isEarned={isEarned}
                progress={progress}
              />
            </div>
          );
        })}
        
        {filteredBadges.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No badges found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};