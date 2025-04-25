import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Achievement as AchievementType,
  Badge as BadgeType,
  UserBadge as UserBadgeType,
  UserAchievementProgress as UserAchievementProgressType
} from '@shared/schema';

interface BadgesContextType {
  badges: BadgeType[];
  achievements: AchievementType[];
  userBadges: (UserBadgeType & { badge: BadgeType })[];
  userAchievements: (UserAchievementProgressType & { achievement: AchievementType })[];
  isLoading: boolean;
  error: Error | null;
  getBadgeById: (id: number) => BadgeType | undefined;
  getAchievementById: (id: number) => AchievementType | undefined;
  getUserBadgeProgress: (badgeId: number) => number;
  getUserAchievementProgress: (achievementId: number) => {
    progress: number;
    isCompleted: boolean;
  };
  updateDisplayBadge: (userBadgeId: number, displayed: boolean) => void;
  updateAchievementProgress: (achievementId: number, progress: number) => void;
  completeAchievement: (achievementId: number) => void;
  refreshUserData: () => void;
}

const BadgesContext = createContext<BadgesContextType | null>(null);

export function BadgesProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newlyCompletedAchievement, setNewlyCompletedAchievement] = useState<{
    achievement: AchievementType;
    badge: BadgeType;
  } | null>(null);

  // Get all badges
  const {
    data: badges = [],
    error: badgesError,
    isLoading: badgesLoading
  } = useQuery<BadgeType[], Error>({
    queryKey: ['/api/badges'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: true, // Always fetch badges, even when not logged in
  });

  // Get all achievements (excluding secret ones for non-admins)
  const {
    data: achievements = [],
    error: achievementsError,
    isLoading: achievementsLoading
  } = useQuery<AchievementType[], Error>({
    queryKey: ['/api/achievements'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: true, // Always fetch achievements, even when not logged in
  });

  // Get user badges (only when logged in)
  const {
    data: userBadges = [],
    error: userBadgesError,
    isLoading: userBadgesLoading,
    refetch: refetchUserBadges
  } = useQuery<(UserBadgeType & { badge: BadgeType })[], Error>({
    queryKey: ['/api/user/badges'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Get user achievement progress (only when logged in)
  const {
    data: userAchievements = [],
    error: userAchievementsError,
    isLoading: userAchievementsLoading,
    refetch: refetchUserAchievements
  } = useQuery<(UserAchievementProgressType & { achievement: AchievementType })[], Error>({
    queryKey: ['/api/user/achievements'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Mutation to update user badge display preference
  const updateBadgeMutation = useMutation({
    mutationFn: async ({ userBadgeId, displayed }: { userBadgeId: number, displayed: boolean }) => {
      const res = await apiRequest('PATCH', `/api/user/badges/${userBadgeId}`, { displayed });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/badges'] });
      toast({
        title: "Badge updated",
        description: "Your badge display preference has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update achievement progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ achievementId, progress, currentCount }: { 
      achievementId: number, 
      progress: number,
      currentCount?: number 
    }) => {
      const res = await apiRequest('PATCH', `/api/user/achievements/${achievementId}`, { 
        progress, 
        currentCount 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/achievements'] });
      
      if (data.completed && data.badge) {
        // Find the achievement
        const achievement = achievements.find(a => a.id === data.progress.achievementId);
        if (achievement) {
          setNewlyCompletedAchievement({
            achievement,
            badge: data.badge
          });
          
          toast({
            title: "Achievement unlocked!",
            description: `You have completed the "${achievement.name}" achievement.`,
            variant: "default",
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to complete an achievement (for testing/admin)
  const completeAchievementMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      const res = await apiRequest(
        'POST', 
        `/api/user/achievements/${achievementId}/complete${process.env.NODE_ENV === 'development' ? '?test=true' : ''}`, 
        {}
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/badges'] });
      
      // Find the achievement
      const achievement = achievements.find(a => a.id === data.progress.achievementId);
      if (achievement && data.badge) {
        setNewlyCompletedAchievement({
          achievement,
          badge: data.badge
        });
        
        toast({
          title: "Achievement completed!",
          description: `You have completed the "${achievement.name}" achievement.`,
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getBadgeById = (id: number) => badges.find(badge => badge.id === id);
  
  const getAchievementById = (id: number) => achievements.find(achievement => achievement.id === id);
  
  const getUserBadgeProgress = (badgeId: number) => {
    const userBadge = userBadges.find(ub => ub.badgeId === badgeId);
    return userBadge ? userBadge.progress || 0 : 0;
  };
  
  const getUserAchievementProgress = (achievementId: number) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    return {
      progress: userAchievement ? userAchievement.progress || 0 : 0,
      isCompleted: userAchievement ? userAchievement.completed : false
    };
  };

  const updateDisplayBadge = (userBadgeId: number, displayed: boolean) => {
    updateBadgeMutation.mutate({ userBadgeId, displayed });
  };

  const updateAchievementProgress = (achievementId: number, progress: number) => {
    updateProgressMutation.mutate({ achievementId, progress });
  };

  const completeAchievement = (achievementId: number) => {
    completeAchievementMutation.mutate(achievementId);
  };

  const refreshUserData = () => {
    if (user) {
      refetchUserBadges();
      refetchUserAchievements();
    }
  };

  return (
    <BadgesContext.Provider
      value={{
        badges,
        achievements,
        userBadges,
        userAchievements,
        isLoading: badgesLoading || achievementsLoading || userBadgesLoading || userAchievementsLoading,
        error: badgesError || achievementsError || userBadgesError || userAchievementsError,
        getBadgeById,
        getAchievementById,
        getUserBadgeProgress,
        getUserAchievementProgress,
        updateDisplayBadge,
        updateAchievementProgress,
        completeAchievement,
        refreshUserData
      }}
    >
      {children}
    </BadgesContext.Provider>
  );
}

export function useBadges() {
  const context = useContext(BadgesContext);
  if (!context) {
    throw new Error("useBadges must be used within a BadgesProvider");
  }
  return context;
}