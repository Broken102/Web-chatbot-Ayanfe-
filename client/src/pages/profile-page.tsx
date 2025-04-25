import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clipboard, CheckCircle, XCircle, AlertTriangle, Camera, LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

interface ApiKey {
  id: number;
  name: string;
  apiKey: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Fetch API keys
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery<ApiKey[]>({
    queryKey: ["/api/apikeys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/apikeys");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Create a new API key
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/apikeys", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apikeys"] });
      setNewKeyName("");
      toast({
        title: "API Key Created",
        description: "Your new API key has been created successfully. Make sure to copy it now as you won't be able to see the full key again.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create API Key",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete an API key
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/apikeys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apikeys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete API Key",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to copy API key to clipboard
  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 3000);
    });
  };
  
  // Function to handle API key creation
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyName.trim()) {
      createKeyMutation.mutate(newKeyName.trim());
    }
  };
  
  // Clear copied key state when API keys change
  useEffect(() => {
    setCopiedKey(null);
  }, [apiKeys]);
  
  // File input ref for profile picture upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  
  // Update profile picture
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (profilePicture: string) => {
      const res = await apiRequest("PATCH", "/api/user/settings", { 
        type: "profilePicture", 
        profilePicture 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile picture has been updated successfully.",
        variant: "default",
      });
      setProfileImageLoading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Profile",
        description: error.message,
        variant: "destructive",
      });
      setProfileImageLoading(false);
    },
  });
  
  // Handle profile picture upload
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProfileImageLoading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateProfilePictureMutation.mutate(base64String);
    };
    reader.onerror = () => {
      toast({
        title: "Failed to Read File",
        description: "There was an error reading the selected file.",
        variant: "destructive",
      });
      setProfileImageLoading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle logout
  const [, setLocation] = useLocation();
  
  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      // Redirect to dedicated logout page
      setLocation("/logout");
    }
  };
  
  return (
    <MainLayout 
      title="Profile" 
      description="Manage your account and API keys"
    >
      <div className="container mx-auto py-6 space-y-8">
        {/* User Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.profilePicture || ''} />
                  <AvatarFallback className="bg-primary/10">
                    <UserIcon className="h-12 w-12 text-primary/80" />
                  </AvatarFallback>
                </Avatar>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={profileImageLoading}
                >
                  {profileImageLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Change Picture
                </Button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                />
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
              
              {/* User Details */}
              <div className="flex-1 grid gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={user?.username || ""} disabled />
                </div>
                {user?.email && (
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled />
                  </div>
                )}
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={user?.isAdmin ? "Administrator" : "User"} disabled />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Generate and manage API keys for accessing our services programmatically</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="key-name">New API Key Name</Label>
                  <Input 
                    id="key-name" 
                    placeholder="E.g., Production, Development" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    type="submit" 
                    disabled={!newKeyName.trim() || createKeyMutation.isPending}
                  >
                    {createKeyMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Generate Key
                  </Button>
                </div>
              </div>
            </form>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Your Keys</h3>
              
              {isLoadingKeys ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : apiKeys && apiKeys.length > 0 ? (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium mb-1 flex items-center">
                            {key.name}
                            {!key.isActive && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                Revoked
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(key.createdAt).toLocaleString()}
                          </p>
                          {key.lastUsed && (
                            <p className="text-sm text-gray-500">
                              Last used: {new Date(key.lastUsed).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div>
                          {key.isActive ? (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
                                  deleteKeyMutation.mutate(key.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              Revoked
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm flex-1 overflow-x-auto">
                            {key.apiKey.substring(0, 10)}...{key.apiKey.substring(key.apiKey.length - 4)}
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(key.apiKey)}
                            disabled={!key.isActive}
                          >
                            {copiedKey === key.apiKey ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-gray-500">You haven't created any API keys yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    API keys allow you to authenticate and use our API services programmatically
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-4 flex flex-col items-start">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                <strong>Security Note:</strong> API keys give access to your account's API usage limits. 
                Never share your API keys and store them securely.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}