import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SimpleThemeToggle } from '@/components/ui/mode-toggle';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, FileCog, History, Trash, AlertTriangle, ShieldAlert, Gauge, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import MainLayout from '../layouts/main-layout';

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
  date: string;
}

export default function ApiAccess() {
  const [activeTab, setActiveTab] = useState('keys');
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch API keys
  const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/apikeys'],
    queryFn: () => apiRequest('GET', '/api/apikeys').then(res => res.json()),
  });
  
  // Fetch API usage
  const { data: apiUsage = [], isLoading: apiUsageLoading } = useQuery({
    queryKey: ['/api/user/usage'],
    queryFn: () => apiRequest('GET', '/api/user/usage').then(res => res.json()),
  });
  
  // Generate API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: (name: string) => apiRequest('POST', '/api/apikeys', { name }),
    onSuccess: (response) => {
      response.json().then(data => {
        setGeneratedKey(data.key);
        queryClient.invalidateQueries({ queryKey: ['/api/apikeys'] });
        toast({
          title: "API Key Generated",
          description: "Your new API key has been created successfully",
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generating API Key",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    }
  });
  
  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: number) => apiRequest('DELETE', `/api/apikeys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/apikeys'] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been revoked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting API Key",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    }
  });
  
  // Handle generate API key
  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your API key",
        variant: "destructive",
      });
      return;
    }
    
    generateKeyMutation.mutate(newKeyName);
  };
  
  // Handle copy API key to clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied to Clipboard",
      description: "API key has been copied to clipboard",
    });
  };
  
  // Handle delete API key
  const handleDeleteKey = (keyId: number) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      deleteKeyMutation.mutate(keyId);
    }
  };
  
  return (
    <MainLayout title="API Access" description="Manage your API keys and monitor usage">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Access</h1>
        <SimpleThemeToggle />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage">
            <History className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <FileCog className="h-4 w-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>
        
        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
              <CardDescription>Create a new API key to access AYANFE AI services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="key-name">API Key Name</Label>
                <Input 
                  id="key-name" 
                  placeholder="e.g. Development, Production, etc." 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Give your API key a descriptive name to identify its purpose or usage
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                disabled={generateKeyMutation.isPending} 
                onClick={handleGenerateKey}
              >
                {generateKeyMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Generated Key Display */}
          {generatedKey && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-primary">New API Key Generated</CardTitle>
                <CardDescription>Copy your API key now. For security reasons, it won't be shown again.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md flex items-center justify-between overflow-x-auto">
                  <code className="text-xs md:text-sm font-mono">{generatedKey}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyKey(generatedKey)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy API key</span>
                  </Button>
                </div>
                <div className="mt-4 flex items-start space-x-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Important Security Notice</p>
                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                      This API key will only be displayed once. Make sure to copy it and store it in a secure location.
                      If you lose this key, you'll need to generate a new one.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setGeneratedKey(null)}
                  className="w-full"
                >
                  I've Copied My API Key
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Existing API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>Manage your existing API keys</CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeysLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-6">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No API Keys Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate your first API key to access AYANFE AI services
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>You have {apiKeys.length} active API keys</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key: ApiKey) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span>{key.name}</span>
                          </div>
                        </TableCell>
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
                            onClick={() => handleDeleteKey(key.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete API key</span>
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
        
        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">60</div>
                  <div className="text-sm text-muted-foreground ml-1">req/min</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Standard tier limit
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {apiUsageLoading 
                      ? '-' 
                      : apiUsage.reduce((sum: number, item: ApiUsage) => sum + item.count, 0).toLocaleString()
                    }
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total API calls this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quota Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-green-500" />
                  <div className="text-2xl font-bold text-green-500">Good</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  34% of monthly quota used
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>API Usage History</CardTitle>
              <CardDescription>View your recent API usage</CardDescription>
            </CardHeader>
            <CardContent>
              {apiUsageLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : apiUsage.length === 0 ? (
                <div className="text-center py-6">
                  <History className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No API Usage Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start using the API to see your usage history
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your recent API usage</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...apiUsage]
                      .sort((a: ApiUsage, b: ApiUsage) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((usage: ApiUsage) => (
                        <TableRow key={usage.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(usage.date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-1 py-0.5 bg-muted rounded text-xs">
                              {usage.endpoint}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{usage.method}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{usage.count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Learn how to use AYANFE AI API services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All API requests require an API key for authentication. Include your API key in the request headers.
                </p>
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-xs md:text-sm font-mono">
                    <pre>{`// Example header
{
  "X-API-Key": "your_api_key_here"
}
`}</pre>
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Base URL</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All API endpoints are relative to the base URL.
                </p>
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-xs md:text-sm font-mono">
                    https://api.ayanfe.ai/v1
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">API Endpoints</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Chat API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get AI-powered chat responses.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-blue-500">POST</span> /chat/ask
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Music API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Search and play music from our database.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-green-500">GET</span> /play
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Lyrics API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get lyrics for songs.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-green-500">GET</span> /music-lyrics
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Hentai Video API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get adult anime content.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-green-500">GET</span> /henataivid
                      </code>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Rate Limits</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  API calls are subject to rate limiting based on your plan. The default limit is 60 requests per minute.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-800 flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Rate Limit Exceeded</p>
                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                      If you exceed your rate limit, you'll receive a 429 Too Many Requests response.
                      Consider upgrading your plan if you need higher limits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">View Example Code</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Example API Request</DialogTitle>
                    <DialogDescription>
                      Code example for making an API request to AYANFE AI
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-muted p-4 rounded-md">
                    <code className="text-xs md:text-sm font-mono">
                      <pre>{`// Example using fetch in JavaScript
const apiKey = 'your_api_key_here';

fetch('https://api.ayanfe.ai/v1/chat/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    message: 'Hello, how are you today?'
  })
})
.then(response => response.json())
.then(data => {
  console.log(data);
})
.catch(error => {
  console.error('Error:', error);
});
`}</pre>
                    </code>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`// Example using fetch in JavaScript
const apiKey = 'your_api_key_here';

fetch('https://api.ayanfe.ai/v1/chat/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    message: 'Hello, how are you today?'
  })
})
.then(response => response.json())
.then(data => {
  console.log(data);
})
.catch(error => {
  console.error('Error:', error);
});`);
                        toast({
                          title: "Copied to Clipboard",
                          description: "Example code has been copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button>
                View Full Documentation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}