import React, { useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { BadgeGallery } from '@/components/badges/badge-gallery';
import { AchievementsGrid } from '@/components/badges/achievements-grid';
import { useBadges } from '@/hooks/use-badges';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Award, Medal, Trophy } from 'lucide-react';
import { AchievementNotification } from '@/components/badges/achievement-notification';

export default function BadgesPage() {
  const { user } = useAuth();
  const { 
    badges, 
    achievements, 
    userBadges,
    userAchievements,
    isLoading,
    completeAchievement
  } = useBadges();
  
  const [selectedTab, setSelectedTab] = useState('badges');
  const [showNotification, setShowNotification] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  
  // Convert userBadges to the format needed by BadgeGallery
  const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
  const badgeProgress = userBadges.reduce((acc, ub) => {
    acc[ub.badgeId] = ub.progress || 0;
    return acc;
  }, {} as Record<number, number>);
  
  // Convert userAchievements to the format needed by AchievementsGrid
  const achievementProgress = userAchievements.reduce((acc, ua) => {
    acc[ua.achievementId] = {
      progress: ua.progress || 0,
      isCompleted: ua.completed || false
    };
    return acc;
  }, {} as Record<number, { progress: number, isCompleted: boolean }>);
  
  // Demo function to simulate completing an achievement
  const demoCompleteAchievement = (achievementId: number) => {
    completeAchievement(achievementId);
  };
  
  // Function to display achievement notification
  const showAchievementNotification = (achievementId: number) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const badge = badges.find(b => b.id === achievement.badgeId);
    if (!badge) return;
    
    setSelectedAchievement({ achievement, badge });
    setShowNotification(true);
  };
  
  if (isLoading) {
    return (
      <MainLayout title="Badges & Achievements" description="Track your AYANFE AI progress">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Badges & Achievements" description="Track your AYANFE AI progress">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Badges & Achievements</h1>
          <p className="text-muted-foreground">
            Collect badges and complete achievements to show off your mastery of Ayanfe AI!
          </p>
        </header>
        
        <Tabs defaultValue="badges" value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Medal className="w-4 h-4" />
              <span>Badges</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="badges" className="mt-6">
            <BadgeGallery 
              badges={badges}
              earnedBadgeIds={earnedBadgeIds}
              badgeProgress={badgeProgress}
              title="Your Badge Collection"
            />
            
            {user?.isAdmin && (
              <div className="mt-8 p-4 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-2">Admin Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Testing tools for badge functionality.
                </p>
                <div className="flex flex-wrap gap-2">
                  {achievements.slice(0, 3).map(achievement => (
                    <Button
                      key={achievement.id}
                      variant="outline"
                      size="sm"
                      onClick={() => demoCompleteAchievement(achievement.id)}
                    >
                      Complete "{achievement.name}"
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showAchievementNotification(achievements[0]?.id)}
                  >
                    Show notification
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            <AchievementsGrid 
              achievements={achievements}
              badges={badges}
              userProgress={achievementProgress}
              title="Your Achievements Progress"
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Achievement notification */}
      {selectedAchievement && (
        <AchievementNotification
          achievement={selectedAchievement.achievement}
          badge={selectedAchievement.badge}
          open={showNotification}
          onClose={() => setShowNotification(false)}
        />
      )}
    </MainLayout>
  );
}