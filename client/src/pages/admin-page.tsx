import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserX, ShieldAlert, Key, RefreshCw, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
}

interface ApiKey {
  id: number;
  userId: number;
  name: string;
  apiKey: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

interface ApiUsage {
  id: number;
  userId: number;
  endpoint: string;
  method: string;
  status: number;
  timestamp: string;
  responseTime: number | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  
  // Redirect if not admin
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }
  
  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
    enabled: user?.isAdmin,
  });
  
  // Fetch all API keys
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/apikeys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/apikeys");
      return await res.json();
    },
    enabled: user?.isAdmin,
  });
  
  // Fetch API usage
  const { data: apiUsage, isLoading: isLoadingUsage } = useQuery<ApiUsage[]>({
    queryKey: ["/api/admin/usage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/usage");
      return await res.json();
    },
    enabled: user?.isAdmin,
  });
  
  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async ({ id, isActive = false }: { id: number, isActive?: boolean }) => {
      await apiRequest("PATCH", `/api/admin/apikeys/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apikeys"] });
      toast({
        title: "API Key Updated",
        description: "The API key status has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update API Key",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apikeys"] });
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete User",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set admin status mutation
  const setAdminStatusMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number, isAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User admin status has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update User",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Group API keys by user
  const apiKeysByUser = apiKeys?.reduce((acc, key) => {
    if (!acc[key.userId]) {
      acc[key.userId] = [];
    }
    acc[key.userId].push(key);
    return acc;
  }, {} as Record<number, ApiKey[]>) || {};
  
  return (
    <MainLayout 
      title="Admin Dashboard" 
      description="Manage users, API keys, and system settings"
    >
      <div className="container mx-auto py-6">
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="usage">API Usage</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>API Keys</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={user.isAdmin ? "default" : "outline"}>
                              {user.isAdmin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {apiKeysByUser[user.id]?.length || 0} keys
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdminStatusMutation.mutate({
                                  id: user.id,
                                  isAdmin: !user.isAdmin
                                })}
                                disabled={setAdminStatusMutation.isPending}
                              >
                                {setAdminStatusMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <ShieldAlert className="h-4 w-4 mr-1" />
                                )}
                                {user.isAdmin ? "Remove Admin" : "Make Admin"}
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending || user.id === (user as User).id}
                              >
                                {deleteUserMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <UserX className="h-4 w-4 mr-1" />
                                )}
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>
                  View and manage all API keys across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApiKeys || isLoadingUsers ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Key (Preview)</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys && apiKeys.map((key) => {
                        const keyUser = users?.find(u => u.id === key.userId);
                        return (
                          <TableRow key={key.id}>
                            <TableCell>{key.id}</TableCell>
                            <TableCell className="font-medium">
                              {keyUser ? keyUser.username : `User #${key.userId}`}
                            </TableCell>
                            <TableCell>{key.name}</TableCell>
                            <TableCell>
                              <code className="text-xs">
                                {key.apiKey.substring(0, 8)}...{key.apiKey.substring(key.apiKey.length - 4)}
                              </code>
                            </TableCell>
                            <TableCell>{new Date(key.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : "Never"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={key.isActive ? "default" : "destructive"}>
                                {key.isActive ? "Active" : "Revoked"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={key.isActive ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const action = key.isActive ? "revoke" : "reactivate";
                                  if (confirm(`Are you sure you want to ${action} this API key?`)) {
                                    revokeKeyMutation.mutate({
                                      id: key.id,
                                      isActive: !key.isActive
                                    });
                                  }
                                }}
                                disabled={revokeKeyMutation.isPending}
                              >
                                {revokeKeyMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : key.isActive ? (
                                  <Key className="h-4 w-4 mr-1" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                )}
                                {key.isActive ? "Revoke" : "Reactivate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Usage Tab */}
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>API Usage Statistics</CardTitle>
                <CardDescription>
                  Monitor API usage across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsage || isLoadingUsers ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiUsage && apiUsage.map((entry) => {
                        const usageUser = users?.find(u => u.id === entry.userId);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.id}</TableCell>
                            <TableCell className="font-medium">
                              {usageUser ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {usageUser.username}
                                </div>
                              ) : (
                                `User #${entry.userId}`
                              )}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs">{entry.endpoint}</code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {entry.method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                entry.status >= 200 && entry.status < 300 ? "success" : 
                                entry.status >= 400 && entry.status < 500 ? "warning" : 
                                entry.status >= 500 ? "destructive" : "outline"
                              }>
                                {entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {entry.responseTime ? `${entry.responseTime}ms` : "N/A"}
                            </TableCell>
                            <TableCell>
                              {new Date(entry.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}