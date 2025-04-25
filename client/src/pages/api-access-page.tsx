import { useState, useEffect } from "react";
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Key, Copy, AlertTriangle, Check, Trash2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeBlock from "../components/code-block";

interface ApiKey {
  id: number;
  name: string;
  apiKey?: string; // Only present for newly created keys
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

interface ApiUsageStats {
  totalRequests: number;
  todayRequests: number;
  successRate: number;
}

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats>({
    totalRequests: 0,
    todayRequests: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await apiRequest("GET", "/api/apikeys");
        const data = await response.json();
        setApiKeys(data);
      } catch (error) {
        console.error("Error fetching API keys:", error);
        toast({
          title: "Error",
          description: "Failed to fetch API keys. Please try again later.",
          variant: "destructive"
        });
      }
    };
    
    const fetchUsageStats = async () => {
      try {
        const response = await apiRequest("GET", "/api/usage");
        const data = await response.json();
        setUsageStats(data);
      } catch (error) {
        console.error("Error fetching API usage statistics:", error);
      }
    };
    
    Promise.all([fetchApiKeys(), fetchUsageStats()])
      .finally(() => setLoading(false));
  }, [toast]);
  
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await apiRequest("POST", "/api/apikeys", { name: newKeyName });
      const newKey = await response.json();
      
      // Store the newly created key to display to the user
      setNewlyCreatedKey(newKey.apiKey);
      
      // Add the new key to the list
      setApiKeys([...apiKeys, newKey]);
      
      // Reset the form
      setNewKeyName("");
      setShowNewKeyDialog(false);
    } catch (error) {
      console.error("Error creating API key:", error);
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again later.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteApiKey = async (keyId: number) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/apikeys/${keyId}`);
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
      toast({
        title: "Success",
        description: "API key has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCopyApiKey = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast({
            title: "Copied!",
            description: "API key copied to clipboard."
          });
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
          toast({
            title: "Error",
            description: "Failed to copy API key to clipboard.",
            variant: "destructive"
          });
        });
    }
  };
  
  const javascriptExample = `
// Example using fetch API
const fetchData = async () => {
  const response = await fetch('https://api.ayanfe.ai/api/chat/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      question: 'What is artificial intelligence?'
    })
  });
  
  const data = await response.json();
  console.log(data);
};

fetchData();
  `.trim();
  
  const pythonExample = `
import requests

# API endpoint
url = "https://api.ayanfe.ai/api/chat/ask"

# Your API key
api_key = "YOUR_API_KEY"

# Headers
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

# Request data
data = {
    "question": "What is artificial intelligence?"
}

# Make the request
response = requests.post(url, json=data, headers=headers)

# Print the response
print(response.json())
  `.trim();
  
  const phpExample = `
<?php
// API endpoint
$url = "https://api.ayanfe.ai/api/chat/ask";

// Your API key
$apiKey = "YOUR_API_KEY";

// Request data
$data = array(
    "question" => "What is artificial intelligence?"
);

// Initialize cURL session
$ch = curl_init($url);

// Set request options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "Authorization: Bearer " . $apiKey
));

// Execute the request
$response = curl_exec($ch);

// Close cURL session
curl_close($ch);

// Print the response
echo $response;
?>
  `.trim();
  
  return (
    <MainLayout
      title="API Access"
      description="Manage your API keys and explore usage examples"
    >
      <div className="container py-6 space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* API Keys Management */}
          <div className="lg:w-2/3 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your API Keys</h2>
              <Button onClick={() => setShowNewKeyDialog(true)}>
                <Key className="mr-2 h-4 w-4" />
                New API Key
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">Loading your API keys...</TableCell>
                      </TableRow>
                    ) : apiKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Key className="h-8 w-8 text-muted-foreground" />
                            <p>You don't have any API keys yet.</p>
                            <Button variant="outline" size="sm" onClick={() => setShowNewKeyDialog(true)}>
                              Create your first API key
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.isActive ? "default" : "secondary"}>
                              {key.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive" 
                              onClick={() => handleDeleteApiKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* Usage Statistics */}
          <div className="lg:w-1/3 space-y-6">
            <h2 className="text-2xl font-bold">API Usage</h2>
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{usageStats.totalRequests}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Today's Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{usageStats.todayRequests}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{usageStats.successRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* API Usage Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">API Usage Examples</h2>
          <Alert>
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Keep your API keys secure. Do not share them publicly or expose them in client-side code.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Select your preferred programming language to view implementation examples.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>
                
                <TabsContent value="javascript" className="mt-4">
                  <CodeBlock language="javascript" code={javascriptExample} />
                </TabsContent>
                
                <TabsContent value="python" className="mt-4">
                  <CodeBlock language="python" code={pythonExample} />
                </TabsContent>
                
                <TabsContent value="php" className="mt-4">
                  <CodeBlock language="php" code={phpExample} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* New API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Enter a name for your API key to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key Name</label>
              <Input 
                value={newKeyName} 
                onChange={(e) => setNewKeyName(e.target.value)} 
                placeholder="e.g., Development, Production, Testing"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateApiKey}>Create API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Display New API Key Dialog */}
      <Dialog open={!!newlyCreatedKey} onOpenChange={() => setNewlyCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Copy your API key now. For security reasons, it will not be displayed again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your New API Key</label>
              <div className="flex items-center">
                <Input 
                  value={newlyCreatedKey || ""} 
                  readOnly 
                  className="font-mono pr-10"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-12" 
                  onClick={handleCopyApiKey}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription className="text-sm">
                This is the only time your API key will be displayed. Make sure to copy it now.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}