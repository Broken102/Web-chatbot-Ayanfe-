import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleThemeToggle } from '@/components/ui/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Settings as SettingsIcon, User, Bell, Lock, Shield, Globe, Moon, Sun, AlertTriangle } from 'lucide-react';
import MainLayout from '../layouts/main-layout';

interface UserSettings {
  id: number;
  userId: number;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    app: boolean;
    marketing: boolean;
  };
  privacy: {
    showEmail: boolean;
    showActivity: boolean;
  };
  apiSettings: {
    rateLimitPerMinute: number;
    defaultFormat: 'json' | 'xml';
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    reducedMotion: boolean;
    highContrast: boolean;
  };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default settings - would normally come from API
  const defaultSettings: UserSettings = {
    id: 1,
    userId: 1,
    theme: 'system',
    notifications: {
      email: true,
      app: true,
      marketing: false,
    },
    privacy: {
      showEmail: false,
      showActivity: true,
    },
    apiSettings: {
      rateLimitPerMinute: 60,
      defaultFormat: 'json',
    },
    accessibility: {
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,
    },
  };
  
  // Fetch user settings
  const { data: settings = defaultSettings, isLoading, isError } = useQuery({
    queryKey: ['/api/user/settings'],
    queryFn: () => apiRequest('GET', '/api/user/settings')
      .then(res => res.json())
      .catch(() => {
        // Fallback to default settings if API fails
        return defaultSettings;
      })
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedSettings: Partial<UserSettings>) => 
      apiRequest('PATCH', '/api/user/settings', updatedSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "An error occurred while saving your settings",
        variant: "destructive",
      });
    }
  });
  
  // Helper function to update settings
  const updateSettings = (path: string, value: any) => {
    try {
      // Create a deep copy of the settings
      const updatedSettings = JSON.parse(JSON.stringify(settings || defaultSettings));
      
      // Parse the path to navigate through the settings object
      const pathSegments = path.split('.');
      let current = updatedSettings;
      
      // Navigate to the nested property, creating missing objects
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const segment = pathSegments[i];
        if (!current[segment]) {
          // Create the missing object based on our default structure
          if (segment === 'notifications') {
            current[segment] = { email: false, app: false, marketing: false };
          } else if (segment === 'privacy') {
            current[segment] = { showEmail: false, showActivity: false };
          } else if (segment === 'apiSettings') {
            current[segment] = { rateLimitPerMinute: 60, defaultFormat: 'json' };
          } else if (segment === 'accessibility') {
            current[segment] = { fontSize: 'medium', reducedMotion: false, highContrast: false };
          } else {
            current[segment] = {};
          }
        }
        current = current[segment];
      }
      
      // Update the value
      current[pathSegments[pathSegments.length - 1]] = value;
      
      // Send the update to the server
      updateSettingsMutation.mutate(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Failed to update settings",
        description: "An error occurred while saving your settings",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout title="Settings" description="Loading your settings...">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" description="Manage your account and app preferences">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <SimpleThemeToggle />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 md:w-auto w-full">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="api">
            <Globe className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="accessibility">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Accessibility
          </TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="akewusholaabdulbakri101" />
                <p className="text-xs text-muted-foreground">
                  Your username is visible to other users and cannot be changed frequently.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="akewusholaabdulbakri101@gmail.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="Akewushola Abdulbakri Temitope" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Manage your account status and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control when and how you're notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                </div>
                <Switch 
                  checked={settings?.notifications?.email || false} 
                  onCheckedChange={(checked) => updateSettings('notifications.email', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">App Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                </div>
                <Switch 
                  checked={settings?.notifications?.app || false} 
                  onCheckedChange={(checked) => updateSettings('notifications.app', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Marketing Emails</h3>
                  <p className="text-sm text-muted-foreground">Receive emails about new features and offers</p>
                </div>
                <Switch 
                  checked={settings?.notifications?.marketing || false} 
                  onCheckedChange={(checked) => updateSettings('notifications.marketing', checked)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control what information is visible to others</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Email Address</h3>
                  <p className="text-sm text-muted-foreground">Make your email visible to other users</p>
                </div>
                <Switch 
                  checked={settings?.privacy?.showEmail || false} 
                  onCheckedChange={(checked) => updateSettings('privacy.showEmail', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Activity Status</h3>
                  <p className="text-sm text-muted-foreground">Let others see when you're active on the platform</p>
                </div>
                <Switch 
                  checked={settings?.privacy?.showActivity || false} 
                  onCheckedChange={(checked) => updateSettings('privacy.showActivity', checked)} 
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Data Usage</h3>
                <p className="text-sm text-muted-foreground mb-4">Manage how your data is used and stored</p>
                
                <Button variant="outline" className="mr-2">Download My Data</Button>
                <Button variant="destructive">Delete All Activity Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Configure your API usage preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">API Rate Limit</h3>
                  <span className="text-sm">{settings?.apiSettings?.rateLimitPerMinute || 10} requests/minute</span>
                </div>
                <Slider 
                  value={[settings?.apiSettings?.rateLimitPerMinute || 10]} 
                  min={10} 
                  max={100} 
                  step={10}
                  onValueChange={(value) => updateSettings('apiSettings.rateLimitPerMinute', value[0])}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Control how many API requests you can make per minute.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium mb-2">Default Response Format</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={settings?.apiSettings?.defaultFormat === 'json' ? 'default' : 'outline'}
                    onClick={() => updateSettings('apiSettings.defaultFormat', 'json')}
                  >
                    JSON
                  </Button>
                  <Button 
                    variant={settings?.apiSettings?.defaultFormat === 'xml' ? 'default' : 'outline'}
                    onClick={() => updateSettings('apiSettings.defaultFormat', 'xml')}
                  >
                    XML
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                <h3 className="font-medium mb-2">API Keys</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage and generate API keys for accessing AYANFE API services.
                </p>
                <Button>
                  View API Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Settings</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium mb-2">Theme</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={settings?.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => updateSettings('theme', 'light')}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button 
                    variant={settings?.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => updateSettings('theme', 'dark')}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button 
                    variant={settings?.theme === 'system' ? 'default' : 'outline'}
                    onClick={() => updateSettings('theme', 'system')}
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium mb-2">Font Size</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={settings?.accessibility?.fontSize === 'small' ? 'default' : 'outline'}
                    onClick={() => updateSettings('accessibility.fontSize', 'small')}
                  >
                    Small
                  </Button>
                  <Button 
                    variant={settings?.accessibility?.fontSize === 'medium' ? 'default' : 'outline'}
                    onClick={() => updateSettings('accessibility.fontSize', 'medium')}
                  >
                    Medium
                  </Button>
                  <Button 
                    variant={settings?.accessibility?.fontSize === 'large' ? 'default' : 'outline'}
                    onClick={() => updateSettings('accessibility.fontSize', 'large')}
                  >
                    Large
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Reduced Motion</h3>
                  <p className="text-sm text-muted-foreground">Minimize animations throughout the UI</p>
                </div>
                <Switch 
                  checked={settings?.accessibility?.reducedMotion || false} 
                  onCheckedChange={(checked) => updateSettings('accessibility.reducedMotion', checked)} 
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">High Contrast</h3>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch 
                  checked={settings?.accessibility?.highContrast || false} 
                  onCheckedChange={(checked) => updateSettings('accessibility.highContrast', checked)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}