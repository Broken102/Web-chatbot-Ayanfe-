import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleThemeToggle } from '@/components/ui/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Activity, Users, Key, AlertTriangle, BarChart, Settings, Shield, Database, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import MainLayout from '../layouts/main-layout';
import { PieChart, Pie, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Type definitions
interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface ApiKey {
  id: number;
  userId: number;
  key: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface ApiUsage {
  id: number;
  endpoint: string;
  method: string;
  count: number;
  userId?: number;
  username?: string;
  date: string;
}

interface EndpointStatus {
  endpoint: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  errorRate: number;
  avgResponseTime: number;
}

// Admin dashboard component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('GET', '/api/admin/users').then(res => res.json()),
  });
  
  // Fetch API keys
  const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/apikeys'],
    queryFn: () => apiRequest('GET', '/api/apikeys').then(res => res.json()),
  });
  
  // Fetch API usage
  const { data: apiUsage = [], isLoading: apiUsageLoading } = useQuery({
    queryKey: ['/api/usage'],
    queryFn: () => apiRequest('GET', '/api/usage').then(res => res.json()),
  });
  
  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message || "An error occurred while deleting the user",
        variant: "destructive",
      });
    }
  });
  
  const updateEndpointMutation = useMutation({
    mutationFn: ({ endpoint, url }: { endpoint: string, url: string }) => 
      apiRequest('PATCH', '/api/admin/endpoints', { endpoint, url }),
    onSuccess: () => {
      toast({
        title: "Endpoint updated",
        description: "API endpoint has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating endpoint",
        description: error.message || "Failed to update API endpoint",
        variant: "destructive",
      });
    }
  });
  
  // Delete user handler
  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  // Toggle admin status handler
  const toggleAdminStatus = (userId: number, isAdmin: boolean) => {
    // Update user's admin status
    apiRequest('PATCH', `/api/admin/users/${userId}`, { isAdmin: !isAdmin })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        toast({
          title: `Admin status ${!isAdmin ? 'granted' : 'revoked'}`,
          description: `User is now ${!isAdmin ? 'an admin' : 'a regular user'}`,
        });
      })
      .catch(error => {
        toast({
          title: "Error updating admin status",
          description: error.message || "Failed to update admin status",
          variant: "destructive",
        });
      });
  };
  
  // Dashboard overview data
  const overviewData = {
    totalUsers: users.length,
    activeUsers: users.filter((user: User) => user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    totalApiKeys: apiKeys.length,
    activeApiKeys: apiKeys.filter((key: ApiKey) => key.isActive).length,
    totalApiCalls: apiUsage.reduce((sum: number, item: ApiUsage) => sum + item.count, 0),
  };
  
  // Charts data
  const usersByMonthData = [
    { name: 'Jan', users: 12 },
    { name: 'Feb', users: 19 },
    { name: 'Mar', users: 23 },
    { name: 'Apr', users: 31 },
    { name: 'May', users: 45 },
    { name: 'Jun', users: 52 },
  ];
  
  const apiUsageByEndpoint = apiUsage.reduce((acc: any, item: ApiUsage) => {
    if (!acc[item.endpoint]) {
      acc[item.endpoint] = 0;
    }
    acc[item.endpoint] += item.count;
    return acc;
  }, {});
  
  const apiUsageChartData = Object.keys(apiUsageByEndpoint).map(endpoint => ({
    name: endpoint.replace('/api/', ''),
    value: apiUsageByEndpoint[endpoint],
  }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Placeholder for endpoint status (would normally come from an API)
  const endpointStatus: EndpointStatus[] = [
    {
      endpoint: 'Chat API',
      url: 'https://apis.davidcyriltech.my.id/chat',
      status: 'active',
      errorRate: 0.2,
      avgResponseTime: 245,
    },
    {
      endpoint: 'Music API',
      url: 'https://apis.davidcyriltech.my.id/play',
      status: 'active',
      errorRate: 0.8,
      avgResponseTime: 520,
    },
    {
      endpoint: 'Lyrics API',
      url: 'https://apis.davidcyriltech.my.id/lyrics',
      status: 'active',
      errorRate: 1.5,
      avgResponseTime: 350,
    },
    {
      endpoint: 'Hentai Video API',
      url: 'https://apis.davidcyriltech.my.id/henataivid',
      status: 'active',
      errorRate: 3.2,
      avgResponseTime: 780,
    }
  ];

  // Handle endpoint URL update
  const [editingEndpoint, setEditingEndpoint] = useState<string | null>(null);
  const [newEndpointUrl, setNewEndpointUrl] = useState('');
  
  const handleUpdateEndpoint = (endpoint: EndpointStatus) => {
    if (editingEndpoint === endpoint.endpoint) {
      // Save the changes
      updateEndpointMutation.mutate({
        endpoint: endpoint.endpoint,
        url: newEndpointUrl
      });
      setEditingEndpoint(null);
    } else {
      // Enter edit mode
      setEditingEndpoint(endpoint.endpoint);
      setNewEndpointUrl(endpoint.url);
    }
  };
  
  return (
    <MainLayout 
      title="Admin Dashboard" 
      description="Manage users, monitor API usage, and control system settings"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <SimpleThemeToggle />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-auto w-full">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="api-usage">
            <BarChart className="h-4 w-4 mr-2" />
            API Usage
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewData.activeUsers} active in the last 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalApiKeys}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewData.activeApiKeys} currently active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalApiCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all endpoints
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Monthly user registration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={usersByMonthData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Usage Distribution</CardTitle>
                <CardDescription>Calls by endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={apiUsageChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {apiUsageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <Key className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium">New API key generated</p>
                    <p className="text-sm text-muted-foreground">User: akewusholaabdulbakri101 • 2 hours ago</p>
                  </div>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <Users className="h-4 w-4 text-green-700 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="font-medium">New user registered</p>
                    <p className="text-sm text-muted-foreground">Username: john_doe • 5 hours ago</p>
                  </div>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-300" />
                  </div>
                  <div>
                    <p className="font-medium">API rate limit exceeded</p>
                    <p className="text-sm text-muted-foreground">User: testuser123 • 1 day ago</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <Table>
                  <TableCaption>Total {users.length} users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{user.name || user.username}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "default" : "secondary"}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString() 
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                          >
                            {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage user API keys</CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeysLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <Table>
                  <TableCaption>Total {apiKeys.length} API keys</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key: ApiKey) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>User #{key.userId}</TableCell>
                        <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {key.lastUsed 
                            ? new Date(key.lastUsed).toLocaleDateString() 
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.isActive ? "default" : "secondary"}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              // Delete API key
                              if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
                                apiRequest('DELETE', `/api/apikeys/${key.id}`)
                                  .then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['/api/apikeys'] });
                                    toast({
                                      title: "API key revoked",
                                      description: "The API key has been successfully revoked",
                                    });
                                  })
                                  .catch(error => {
                                    toast({
                                      title: "Error revoking API key",
                                      description: error.message || "Failed to revoke API key",
                                      variant: "destructive",
                                    });
                                  });
                              }
                            }}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Usage Tab */}
        <TabsContent value="api-usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Usage by Endpoint</CardTitle>
                <CardDescription>Number of calls per endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                {apiUsageLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={apiUsageChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={60} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Calls" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top API Users</CardTitle>
                <CardDescription>Users with most API calls</CardDescription>
              </CardHeader>
              <CardContent>
                {apiUsageLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">API Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Group by userId and calculate total calls */}
                      {Object.entries(
                        apiUsage.reduce((acc: any, item: ApiUsage) => {
                          const userId = item.userId || 0;
                          if (!acc[userId]) {
                            acc[userId] = { 
                              userId, 
                              username: item.username || `User #${userId}`,
                              totalCalls: 0 
                            };
                          }
                          acc[userId].totalCalls += item.count;
                          return acc;
                        }, {})
                      )
                        .map(([_, data]: [string, any]) => data)
                        .sort((a, b) => b.totalCalls - a.totalCalls)
                        .slice(0, 5)
                        .map((data) => (
                          <TableRow key={data.userId}>
                            <TableCell>{data.username}</TableCell>
                            <TableCell className="text-right font-medium">
                              {data.totalCalls.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>API Usage Log</CardTitle>
              <CardDescription>Recent API activity</CardDescription>
            </CardHeader>
            <CardContent>
              {apiUsageLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiUsage
                      .sort((a: ApiUsage, b: ApiUsage) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((usage: ApiUsage) => (
                        <TableRow key={usage.id}>
                          <TableCell>{new Date(usage.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <code className="px-1 py-0.5 bg-muted rounded text-xs">
                              {usage.endpoint}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {usage.method}
                            </Badge>
                          </TableCell>
                          <TableCell>{usage.username || `User #${usage.userId || 'Unknown'}`}</TableCell>
                          <TableCell className="text-right font-medium">{usage.count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Configure external API service URLs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error Rate</TableHead>
                    <TableHead>Avg. Response</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpointStatus.map((endpoint) => (
                    <TableRow key={endpoint.endpoint}>
                      <TableCell className="font-medium">{endpoint.endpoint}</TableCell>
                      <TableCell>
                        {editingEndpoint === endpoint.endpoint ? (
                          <input
                            className="w-full p-2 border rounded-md"
                            value={newEndpointUrl}
                            onChange={(e) => setNewEndpointUrl(e.target.value)}
                          />
                        ) : (
                          <code className="text-xs">{endpoint.url}</code>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          endpoint.status === 'active' 
                            ? 'default' 
                            : endpoint.status === 'inactive' 
                              ? 'secondary' 
                              : 'destructive'
                        }>
                          {endpoint.status.charAt(0).toUpperCase() + endpoint.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={
                          endpoint.errorRate < 1 
                            ? 'text-green-600 dark:text-green-400' 
                            : endpoint.errorRate < 3 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-red-600 dark:text-red-400'
                        }>
                          {endpoint.errorRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{endpoint.avgResponseTime}ms</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={editingEndpoint === endpoint.endpoint ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleUpdateEndpoint(endpoint)}
                        >
                          {editingEndpoint === endpoint.endpoint ? 'Save' : 'Edit URL'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Security</CardTitle>
                <CardDescription>Security settings and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Rate Limiting</h3>
                    <p className="text-sm text-muted-foreground">Limit API requests per user</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-20 p-2 border rounded-md"
                      value="100"
                      min="1"
                    />
                    <span className="text-sm text-muted-foreground">req/min</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">API Key Expiration</h3>
                    <p className="text-sm text-muted-foreground">Set key validity period</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-20 p-2 border rounded-md"
                      value="30"
                      min="1"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Suspicious Activity Detection</h3>
                    <p className="text-sm text-muted-foreground">Automatically block suspicious API usage</p>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
                
                <Button className="w-full mt-4">
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Manage database operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Database Status</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-800 flex items-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Connected and healthy</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Maintenance Operations</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      Run Database Backup
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Activity className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                    <Button variant="destructive" className="w-full" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear API Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}