import { useState, useEffect } from "react";
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, Check, X, AlertTriangle, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiStatus {
  endpoint: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'checking';
  responseTime?: number;
  lastChecked: Date;
  category: string;
  description: string;
  method: 'GET' | 'POST';
  url: string;
}

export default function ApiHealthCheckPage() {
  const [apiEndpoints, setApiEndpoints] = useState<ApiStatus[]>([
    // Core APIs
    {
      endpoint: "/api/health",
      name: "Health Check API",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Application health check API",
      method: 'GET',
      url: "/api/health"
    },
    {
      endpoint: "/api/api-health",
      name: "API Health Check",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "API health status endpoint",
      method: 'GET',
      url: "/api/api-health"
    },
    {
      endpoint: "/api/messages",
      name: "Messages API (GET)",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Get user messages",
      method: 'GET',
      url: "/api/messages"
    },
    {
      endpoint: "/api/messages",
      name: "Messages API (POST)",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Create new message",
      method: 'POST',
      url: "/api/messages"
    },
    {
      endpoint: "/api/messages/:messageId/reactions",
      name: "Message Reactions (GET)",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Get reactions for a message",
      method: 'GET',
      url: "/api/messages/1/reactions"
    },
    {
      endpoint: "/api/messages/:messageId/reactions",
      name: "Message Reactions (POST)",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Add reaction to a message",
      method: 'POST',
      url: "/api/messages/1/reactions"
    },
    {
      endpoint: "/api/reactions/:reactionId",
      name: "Delete Reaction API",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Delete a reaction",
      method: 'GET',
      url: "/api/reactions/1"
    },
    {
      endpoint: "/api/chat/ask",
      name: "Chat API",
      status: 'checking',
      lastChecked: new Date(),
      category: "core",
      description: "Main chatbot conversation API",
      method: 'POST',
      url: "/api/chat/ask"
    },
    
    // Authentication APIs
    {
      endpoint: "/api/register",
      name: "Registration API",
      status: 'checking',
      lastChecked: new Date(),
      category: "auth",
      description: "User registration",
      method: 'POST',
      url: "/api/register"
    },
    {
      endpoint: "/api/login",
      name: "Login API",
      status: 'checking',
      lastChecked: new Date(),
      category: "auth",
      description: "User login",
      method: 'POST',
      url: "/api/login"
    },
    {
      endpoint: "/api/logout",
      name: "Logout API",
      status: 'checking',
      lastChecked: new Date(),
      category: "auth",
      description: "User logout",
      method: 'POST',
      url: "/api/logout"
    },
    {
      endpoint: "/api/user",
      name: "Current User API",
      status: 'checking',
      lastChecked: new Date(),
      category: "auth",
      description: "Get current user information",
      method: 'GET',
      url: "/api/user"
    },
    
    // Content APIs
    {
      endpoint: "/api/quotes/motivational",
      name: "Quotes API (Motivational)",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Inspirational quotes API",
      method: 'GET',
      url: "/api/quotes/motivational"
    },
    {
      endpoint: "/api/quotes/funny",
      name: "Quotes API (Funny)",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Humorous quotes API",
      method: 'GET',
      url: "/api/quotes/funny"
    },
    {
      endpoint: "/api/quotes/love",
      name: "Quotes API (Love)",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Romantic quotes API",
      method: 'GET',
      url: "/api/quotes/love"
    },
    {
      endpoint: "/api/music-lyrics",
      name: "Lyrics API",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Song lyrics search API",
      method: 'GET',
      url: "/api/music-lyrics?title=Hello"
    },
    {
      endpoint: "/api/images/search",
      name: "Image Search API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Image search API",
      method: 'GET',
      url: "/api/images/search?query=nature"
    },
    {
      endpoint: "/api/images/generate",
      name: "Image Generation API",
      status: 'checking',
      lastChecked: new Date(), 
      category: "media",
      description: "AI image generation API",
      method: 'GET',
      url: "/api/images/generate?prompt=sunset"
    },
    {
      endpoint: "/api/movie",
      name: "Movie API",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Movie information search API",
      method: 'GET',
      url: "/api/movie?q=avatar"
    },
    {
      endpoint: "/api/music",
      name: "Music API",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Music information search API",
      method: 'GET',
      url: "/api/music?q=coldplay"
    },
    {
      endpoint: "/api/roast/general",
      name: "Roast API (General)",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "General roast messages API",
      method: 'GET',
      url: "/api/roast/general"
    },
    {
      endpoint: "/api/roast/personalized/:name",
      name: "Roast API (Personalized)",
      status: 'checking',
      lastChecked: new Date(),
      category: "content",
      description: "Personalized roast messages API",
      method: 'GET',
      url: "/api/roast/personalized/user"
    },
    
    // User settings and data
    {
      endpoint: "/api/user/settings",
      name: "User Settings (GET)",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Get user settings",
      method: 'GET',
      url: "/api/user/settings"
    },
    {
      endpoint: "/api/user/settings",
      name: "User Settings (PATCH)",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Update user settings",
      method: 'PATCH',
      url: "/api/user/settings"
    },
    {
      endpoint: "/api/user/badges",
      name: "User Badges API",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Get user badges",
      method: 'GET',
      url: "/api/user/badges"
    },
    {
      endpoint: "/api/user/badges/:id",
      name: "Update User Badge API",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Update user badge",
      method: 'PATCH',
      url: "/api/user/badges/1"
    },
    {
      endpoint: "/api/user/achievements",
      name: "User Achievements API",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Get user achievements",
      method: 'GET',
      url: "/api/user/achievements"
    },
    {
      endpoint: "/api/user/achievements/:id/complete",
      name: "Complete Achievement API",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Mark achievement as complete",
      method: 'POST',
      url: "/api/user/achievements/1/complete"
    },
    {
      endpoint: "/api/user/achievements/:id",
      name: "Update Achievement Progress API",
      status: 'checking',
      lastChecked: new Date(),
      category: "user",
      description: "Update achievement progress",
      method: 'PATCH',
      url: "/api/user/achievements/1"
    },
    
    // Media APIs
    {
      endpoint: "/api/waifu/:category",
      name: "Waifu API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Anime character images API",
      method: 'GET',
      url: "/api/waifu/waifu"
    },
    {
      endpoint: "/api/neko",
      name: "Neko API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Anime cat character images API",
      method: 'GET',
      url: "/api/neko"
    },
    {
      endpoint: "/api/dog",
      name: "Dog API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Random dog images API",
      method: 'GET',
      url: "/api/dog"
    },
    {
      endpoint: "/api/cat",
      name: "Cat API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Random cat images API",
      method: 'GET',
      url: "/api/cat"
    },
    {
      endpoint: "/api/anime",
      name: "Anime API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Anime information search API",
      method: 'GET',
      url: "/api/anime?query=naruto"
    },
    {
      endpoint: "/api/pexels",
      name: "Pexels API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Pexels stock photos API",
      method: 'GET',
      url: "/api/pexels?q=nature"
    },
    {
      endpoint: "/api/play",
      name: "Music Player API",
      status: 'checking',
      lastChecked: new Date(),
      category: "media",
      description: "Music player API",
      method: 'GET',
      url: "/api/play?q=hello"
    },
    {
      endpoint: "/api/henataivid",
      name: "Adult Video API",
      status: 'checking',
      lastChecked: new Date(),
      category: "adult",
      description: "Adult video content API",
      method: 'GET',
      url: "/api/henataivid"
    },
    {
      endpoint: "/api/download",
      name: "Download API",
      status: 'checking',
      lastChecked: new Date(),
      category: "utility",
      description: "Video download API",
      method: 'GET', 
      url: "/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    
    // Utility APIs
    {
      endpoint: "/api/translate",
      name: "Translator API",
      status: 'checking',
      lastChecked: new Date(),
      category: "utility",
      description: "Text translation API",
      method: 'POST',
      url: "/api/translate"
    },
    {
      endpoint: "/api/datetime",
      name: "DateTime API",
      status: 'checking',
      lastChecked: new Date(),
      category: "utility",
      description: "Date and time information API",
      method: 'GET',
      url: "/api/datetime"
    },
    {
      endpoint: "/api/mood",
      name: "Mood API",
      status: 'checking',
      lastChecked: new Date(),
      category: "utility",
      description: "Mood analysis API",
      method: 'POST',
      url: "/api/mood"
    },
    
    // Badge and Achievement APIs
    {
      endpoint: "/api/badges",
      name: "All Badges API",
      status: 'checking',
      lastChecked: new Date(),
      category: "badges",
      description: "Get all badges",
      method: 'GET',
      url: "/api/badges"
    },
    {
      endpoint: "/api/badges/category/:category",
      name: "Badges by Category API",
      status: 'checking',
      lastChecked: new Date(),
      category: "badges",
      description: "Get badges by category",
      method: 'GET',
      url: "/api/badges/category/onboarding"
    },
    {
      endpoint: "/api/badges/:id",
      name: "Badge by ID API",
      status: 'checking',
      lastChecked: new Date(),
      category: "badges",
      description: "Get badge by ID",
      method: 'GET',
      url: "/api/badges/1"
    },
    {
      endpoint: "/api/achievements",
      name: "All Achievements API",
      status: 'checking',
      lastChecked: new Date(),
      category: "badges",
      description: "Get all achievements",
      method: 'GET',
      url: "/api/achievements"
    },
    {
      endpoint: "/api/achievements/:id",
      name: "Achievement by ID API",
      status: 'checking',
      lastChecked: new Date(),
      category: "badges",
      description: "Get achievement by ID",
      method: 'GET',
      url: "/api/achievements/1"
    },
    
    // Admin APIs
    {
      endpoint: "/api/admin/users",
      name: "Admin Users API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Get all users (admin only)",
      method: 'GET',
      url: "/api/admin/users"
    },
    {
      endpoint: "/api/admin/users/:id",
      name: "Admin Delete User API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Delete user (admin only)",
      method: 'DELETE',
      url: "/api/admin/users/1"
    },
    {
      endpoint: "/api/admin/users/:id",
      name: "Admin Update User API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Update user (admin only)",
      method: 'PATCH',
      url: "/api/admin/users/1"
    },
    {
      endpoint: "/api/admin/endpoints",
      name: "Admin Update Endpoints API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Update API endpoints (admin only)",
      method: 'PATCH',
      url: "/api/admin/endpoints"
    },
    {
      endpoint: "/api/notifications",
      name: "Admin Notifications API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Get all notifications (admin only)",
      method: 'GET',
      url: "/api/notifications"
    },
    {
      endpoint: "/api/notifications",
      name: "Admin Clear Notifications API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Clear all notifications (admin only)",
      method: 'DELETE',
      url: "/api/notifications"
    },
    {
      endpoint: "/api/notifications/subscribe",
      name: "Notifications Subscribe API",
      status: 'checking',
      lastChecked: new Date(),
      category: "admin",
      description: "Subscribe to notifications",
      method: 'POST',
      url: "/api/notifications/subscribe"
    },
    
    // API Key Management
    {
      endpoint: "/api/apikeys",
      name: "API Keys (GET)",
      status: 'checking',
      lastChecked: new Date(),
      category: "apikeys",
      description: "Get user API keys",
      method: 'GET',
      url: "/api/apikeys"
    },
    {
      endpoint: "/api/apikeys",
      name: "API Keys (POST)",
      status: 'checking',
      lastChecked: new Date(),
      category: "apikeys",
      description: "Create new API key",
      method: 'POST',
      url: "/api/apikeys"
    },
    {
      endpoint: "/api/apikeys/:id",
      name: "Delete API Key",
      status: 'checking',
      lastChecked: new Date(),
      category: "apikeys",
      description: "Delete/revoke API key",
      method: 'DELETE',
      url: "/api/apikeys/1"
    },
    {
      endpoint: "/api/usage",
      name: "API Usage Statistics",
      status: 'checking',
      lastChecked: new Date(),
      category: "apikeys",
      description: "Get API usage statistics",
      method: 'GET',
      url: "/api/usage"
    }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { toast } = useToast();
  
  useEffect(() => {
    // Check API status on load
    checkAllApiStatus();
  }, []);
  
  const checkApiStatus = async (endpoint: ApiStatus): Promise<ApiStatus> => {
    const startTime = performance.now();
    try {
      if (endpoint.method === 'GET') {
        const response = await fetch(endpoint.url);
        const endTime = performance.now();
        
        if (response.ok) {
          return {
            ...endpoint,
            status: 'online',
            responseTime: Math.round(endTime - startTime),
            lastChecked: new Date()
          };
        } else {
          return {
            ...endpoint,
            status: 'error',
            responseTime: Math.round(endTime - startTime),
            lastChecked: new Date()
          };
        }
      } else {
        // For POST endpoints, just check if the endpoint is reachable
        // Actually sending POST data could modify the database
        const response = await fetch(endpoint.url, { method: 'HEAD' });
        const endTime = performance.now();
        
        return {
          ...endpoint,
          status: response.ok ? 'online' : 'error',
          responseTime: Math.round(endTime - startTime),
          lastChecked: new Date()
        };
      }
    } catch (error) {
      const endTime = performance.now();
      console.error(`Error checking API status for ${endpoint.name}:`, error);
      return {
        ...endpoint,
        status: 'offline',
        responseTime: Math.round(endTime - startTime),
        lastChecked: new Date()
      };
    }
  };
  
  const checkAllApiStatus = async () => {
    setIsChecking(true);
    
    try {
      // Mark all endpoints as checking
      setApiEndpoints(prev => prev.map(endpoint => ({
        ...endpoint,
        status: 'checking'
      })));
      
      // Check each API endpoint one by one
      const statusPromises = apiEndpoints.map(endpoint => checkApiStatus(endpoint));
      const statuses = await Promise.all(statusPromises);
      
      setApiEndpoints(statuses);
      setLastCheckedTime(new Date().toLocaleTimeString());
      
      // Count online/offline APIs
      const onlineCount = statuses.filter(s => s.status === 'online').length;
      const totalCount = statuses.length;
      
      toast({
        title: "API Health Check Complete",
        description: `${onlineCount} of ${totalCount} APIs are online.`,
        variant: onlineCount === totalCount ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Error checking API status:", error);
      toast({
        title: "Error",
        description: "Failed to check API status.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'error':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'checking':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };
  
  const allCategories = apiEndpoints.map(endpoint => endpoint.category);
  const uniqueCategories = allCategories.filter((category, index) => 
    allCategories.indexOf(category) === index
  );
  const categories = ["all", ...uniqueCategories];
  
  const filteredEndpoints = activeCategory === "all" 
    ? apiEndpoints 
    : apiEndpoints.filter(endpoint => endpoint.category === activeCategory);
    
  const statusCounts = {
    total: apiEndpoints.length,
    online: apiEndpoints.filter(e => e.status === 'online').length,
    offline: apiEndpoints.filter(e => e.status === 'offline').length,
    error: apiEndpoints.filter(e => e.status === 'error').length,
    checking: apiEndpoints.filter(e => e.status === 'checking').length,
  };
  
  return (
    <MainLayout title="API Health Check" description="Monitor the status of all API endpoints">
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">API Health Status</h1>
          <div className="flex items-center gap-2">
            {lastCheckedTime && (
              <span className="text-sm text-muted-foreground">
                Last checked: {lastCheckedTime}
              </span>
            )}
            <Button onClick={checkAllApiStatus} disabled={isChecking}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Check All'}
            </Button>
          </div>
        </div>
        
        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{statusCounts.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Online</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <p className="text-4xl font-bold text-green-600">{statusCounts.online}</p>
              <Check className="ml-2 h-6 w-6 text-green-500" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Offline</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <p className="text-4xl font-bold text-red-600">{statusCounts.offline}</p>
              <X className="ml-2 h-6 w-6 text-red-500" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Errors</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <p className="text-4xl font-bold text-amber-600">{statusCounts.error}</p>
              <AlertTriangle className="ml-2 h-6 w-6 text-amber-500" />
            </CardContent>
          </Card>
        </div>
        
        {/* Status Alert */}
        {statusCounts.offline > 0 || statusCounts.error > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>API Issues Detected</AlertTitle>
            <AlertDescription>
              {statusCounts.offline > 0 && `${statusCounts.offline} APIs are offline. `}
              {statusCounts.error > 0 && `${statusCounts.error} APIs are returning errors. `}
              Please check the status table below for details.
            </AlertDescription>
          </Alert>
        ) : statusCounts.online === statusCounts.total && statusCounts.checking === 0 ? (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4" />
            <AlertTitle>All Systems Operational</AlertTitle>
            <AlertDescription>
              All {statusCounts.total} APIs are online and functioning normally.
            </AlertDescription>
          </Alert>
        ) : null}
        
        {/* API Status Table with Categories */}
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Last Checked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEndpoints.map(endpoint => (
                      <TableRow key={endpoint.endpoint}>
                        <TableCell className="font-medium">
                          {endpoint.name}
                          <div className="text-xs text-muted-foreground">{endpoint.endpoint}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(endpoint.status)}>
                            {endpoint.status === 'checking' ? 'Checking...' : endpoint.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {endpoint.responseTime !== undefined 
                            ? `${endpoint.responseTime}ms` 
                            : '-'}
                        </TableCell>
                        <TableCell className="capitalize">{endpoint.category}</TableCell>
                        <TableCell>{endpoint.description}</TableCell>
                        <TableCell>
                          {endpoint.lastChecked.toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}