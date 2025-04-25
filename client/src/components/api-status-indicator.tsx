import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import axios from 'axios';

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axios.get('/api/health');
        setStatus('online');
        setDetails(response.data);
        setLastChecked(new Date());
      } catch (error) {
        console.error('API health check failed:', error);
        setStatus('offline');
        setLastChecked(new Date());
      }
    };

    checkApiStatus();
    
    // Recheck every 2 minutes
    const interval = setInterval(checkApiStatus, 120000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (status === 'loading') {
    return (
      <Badge variant="outline" className="px-2 py-1">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Checking API...</span>
        </div>
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`px-2 py-1 cursor-pointer ${status === 'online' ? 'hover:bg-emerald-50 dark:hover:bg-emerald-950' : 'hover:bg-red-50 dark:hover:bg-red-950'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-xs">{status === 'online' ? 'API Online' : 'API Offline'}</span>
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs p-1">
            <div>API Status: <span className="font-semibold">{status === 'online' ? 'Online' : 'Offline'}</span></div>
            {lastChecked && (
              <div>Last checked: {lastChecked.toLocaleTimeString()}</div>
            )}
            {details && details.timestamp && (
              <div>Server time: {new Date(details.timestamp).toLocaleTimeString()}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}