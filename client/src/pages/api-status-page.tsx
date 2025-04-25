import { useState, useEffect } from "react";
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Define types for API endpoints
interface ApiEndpoint {
  name: string;
  url: string;
  method: "GET" | "POST";
  requestData?: any;
  description: string;
  category: "chat" | "utils" | "media" | "misc";
}

// Define types for endpoint status
interface EndpointStatus {
  status: "healthy" | "degraded" | "down" | "unknown";
  latency: number | null;
  lastChecked: Date;
  error?: string;
}

export default function ApiStatusPage() {
  const { toast } = useToast();
  const [endpointStatuses, setEndpointStatuses] = useState<Record<string, EndpointStatus>>({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Define all API endpoints to monitor
  const endpoints: ApiEndpoint[] = [
    {
      name: "Chat",
      url: "/api/chat/ask",
      method: "POST",
      requestData: { uid: "status_checker", question: "Hello" },
      description: "Main chat interface with AYANFE AI",
      category: "chat"
    },
    {
      name: "Quotes - Motivational",
      url: "/api/quotes/motivational",
      method: "GET",
      description: "Motivational quotes service",
      category: "misc"
    },
    {
      name: "Quotes - Success",
      url: "/api/quotes/success",
      method: "GET",
      description: "Success quotes service",
      category: "misc"
    },
    {
      name: "Quotes - Wisdom",
      url: "/api/quotes/wisdom",
      method: "GET",
      description: "Wisdom quotes service",
      category: "misc"
    },
    {
      name: "Quotes - Flower",
      url: "/api/quotes/flower",
      method: "GET",
      description: "Flower quotes service",
      category: "misc"
    },
    {
      name: "Lyrics",
      url: "/api/music-lyrics",
      method: "GET",
      requestData: { artist: "Ed Sheeran", title: "Shape of You" },
      description: "Music lyrics search",
      category: "media"
    },
    {
      name: "Image Search",
      url: "/api/images/search",
      method: "GET",
      requestData: { query: "nature" },
      description: "Image search functionality",
      category: "media"
    },
    {
      name: "Mood",
      url: "/api/mood",
      method: "POST",
      requestData: { mood: "happy", limit: 5 },
      description: "Mood-based music recommendations",
      category: "utils"
    },
    {
      name: "DateTime",
      url: "/api/datetime",
      method: "GET",
      description: "Date and time information",
      category: "utils"
    },
    {
      name: "Roast",
      url: "/api/roast/general",
      method: "GET",
      description: "Roast generator",
      category: "misc"
    }
  ];

  // Check status of a single endpoint
  const checkEndpointStatus = async (endpoint: ApiEndpoint) => {
    const startTime = Date.now();
    let status: EndpointStatus = {
      status: "unknown",
      latency: null,
      lastChecked: new Date(),
    };

    try {
      let response;
      if (endpoint.method === "GET") {
        response = await axios.get(endpoint.url, {
          params: endpoint.requestData
        });
      } else {
        response = await axios.post(endpoint.url, endpoint.requestData);
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Determine status based on latency and status code
      if (response.status === 200) {
        status = {
          status: latency < 500 ? "healthy" : "degraded",
          latency,
          lastChecked: new Date()
        };
      } else {
        status = {
          status: "degraded",
          latency,
          lastChecked: new Date(),
          error: `Unexpected status code: ${response.status}`
        };
      }
    } catch (error) {
      const endTime = Date.now();
      status = {
        status: "down",
        latency: endTime - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Update the status for this endpoint
    setEndpointStatuses(prev => ({
      ...prev,
      [endpoint.name]: status
    }));

    return status;
  };

  // Check all endpoints
  const checkAllEndpoints = async () => {
    setIsCheckingAll(true);
    
    try {
      // Check all endpoints in parallel
      await Promise.all(endpoints.map(endpoint => checkEndpointStatus(endpoint)));
      
      toast({
        title: "Status Check Complete",
        description: "All API endpoints have been checked.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check all endpoints.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingAll(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        checkAllEndpoints();
      }, 60000); // Check every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Initial check on component mount
  useEffect(() => {
    checkAllEndpoints();
  }, []);

  const getStatusColor = (status: EndpointStatus["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "degraded":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "down":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: EndpointStatus["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "down":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-600 dark:text-gray-400 animate-spin" />;
    }
  };

  // Group endpoints by category
  const groupedEndpoints = endpoints.reduce<Record<string, ApiEndpoint[]>>((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {});

  return (
    <MainLayout
      title="API Status Dashboard"
      description="Monitor the health and performance of all API endpoints"
    >
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              API Health Status
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Check the current status of all API endpoints
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "border-primary text-primary" : ""}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              onClick={checkAllEndpoints}
              disabled={isCheckingAll}
            >
              {isCheckingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh All
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Render endpoints by category */}
          {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="bg-gray-100 dark:bg-gray-800">
                <CardTitle className="capitalize">{category} APIs</CardTitle>
                <CardDescription>
                  {category === "chat" && "Chat and conversation endpoints"}
                  {category === "utils" && "Utility services endpoints"}
                  {category === "media" && "Media and content endpoints"}
                  {category === "misc" && "Miscellaneous API endpoints"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryEndpoints.map((endpoint) => {
                    const status = endpointStatuses[endpoint.name] || {
                      status: "unknown",
                      latency: null,
                      lastChecked: new Date()
                    };

                    return (
                      <div 
                        key={endpoint.name} 
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status.status)}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {endpoint.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {endpoint.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(status.status)}>
                            {status.status}
                          </Badge>
                          {status.latency && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {status.latency}ms
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => checkEndpointStatus(endpoint)}
                            className="h-8 px-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Status Summary</CardTitle>
            <CardDescription>
              Overall health of the API system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Calculate stats */}
              {(() => {
                const statuses = Object.values(endpointStatuses);
                const total = statuses.length;
                const healthy = statuses.filter(s => s.status === "healthy").length;
                const degraded = statuses.filter(s => s.status === "degraded").length;
                const down = statuses.filter(s => s.status === "down").length;
                
                // Calculate average latency of available endpoints
                const avgLatency = statuses
                  .filter(s => s.latency !== null)
                  .reduce((sum, s) => sum + (s.latency || 0), 0) / 
                  statuses.filter(s => s.latency !== null).length || 0;
                
                return (
                  <>
                    <StatCard title="Total Endpoints" value={endpoints.length} />
                    <StatCard 
                      title="Healthy" 
                      value={healthy} 
                      percentage={total ? (healthy / total) * 100 : 0}
                      color="text-green-600"
                    />
                    <StatCard 
                      title="Degraded" 
                      value={degraded} 
                      percentage={total ? (degraded / total) * 100 : 0}
                      color="text-yellow-600"
                    />
                    <StatCard 
                      title="Down" 
                      value={down} 
                      percentage={total ? (down / total) * 100 : 0}
                      color="text-red-600"
                    />
                    <StatCard 
                      title="Avg. Latency" 
                      value={`${avgLatency.toFixed(0)}ms`}
                      className="col-span-2 md:col-span-4"
                    />
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Helper component for stats
function StatCard({ 
  title, 
  value, 
  percentage, 
  color = "text-gray-900 dark:text-gray-100",
  className = ""
}: { 
  title: string; 
  value: number | string; 
  percentage?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {percentage !== undefined && (
        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              percentage > 80 ? "bg-green-500" : 
              percentage > 50 ? "bg-yellow-500" : 
              "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}