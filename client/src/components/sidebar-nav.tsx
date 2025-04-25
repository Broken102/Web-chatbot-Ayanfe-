import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  MessageSquare, Terminal, Key, Settings, LogOut, Activity, 
  MonitorCheck, Shield, User as UserIcon, Award, Medal, ShoppingCart
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface SidebarNavProps {
  currentPath: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  user: User | null; // Added user prop
}

export function SidebarNav({ currentPath, isDarkMode, toggleDarkMode, user }: SidebarNavProps) { // Added user prop
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // Redirect to the dedicated logout page, which will handle the actual logout process
    setLocation("/logout");
  };

  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <div className="hidden md:flex md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg">AYANFE AI</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Your intelligent assistant</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/chat" className={`flex items-center p-3 rounded-lg ${
            isActive("/chat") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <MessageSquare className="mr-3 h-5 w-5" />
            <span>Chat</span>
        </Link>
        <Link href="/api-testing" className={`flex items-center p-3 rounded-lg ${
            isActive("/api-testing") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <Terminal className="mr-3 h-5 w-5" />
            <span>API Testing</span>
        </Link>
        <Link href="/api-access" className={`flex items-center p-3 rounded-lg ${
            isActive("/api-access") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <Key className="mr-3 h-5 w-5" />
            <span>API Access</span>
        </Link>
        <Link href="/api-status" className={`flex items-center p-3 rounded-lg ${
            isActive("/api-status") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <Activity className="mr-3 h-5 w-5" />
            <span>API Status</span>
        </Link>
        <Link href="/api-health" className={`flex items-center p-3 rounded-lg ${
            isActive("/api-health") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <MonitorCheck className="mr-3 h-5 w-5" />
            <span>API Health Check</span>
        </Link>
        <Link href="/api-marketplace" className={`flex items-center p-3 rounded-lg ${
            isActive("/api-marketplace") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <ShoppingCart className="mr-3 h-5 w-5" />
            <span>API Marketplace</span>
        </Link>
        <Link href="/profile" className={`flex items-center p-3 rounded-lg ${
            isActive("/profile") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <UserIcon className="mr-3 h-5 w-5" />
            <span>Profile</span>
        </Link>
        <Link href="/settings" className={`flex items-center p-3 rounded-lg ${
            isActive("/settings") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <Settings className="mr-3 h-5 w-5" />
            <span>Settings</span>
        </Link>
        <Link href="/badges" className={`flex items-center p-3 rounded-lg ${
            isActive("/badges") 
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
            <Award className="mr-3 h-5 w-5" />
            <span>Badges & Achievements</span>
        </Link>
        {user?.isAdmin && ( // Conditional rendering of Admin links
          <>
            <Link href="/admin" className={`flex items-center p-3 rounded-lg ${
                isActive("/admin")
                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}>
              <Shield className="mr-3 h-5 w-5" />
              <span>Admin Panel</span>
            </Link>
            <Link href="/admin-dashboard" className={`flex items-center p-3 rounded-lg ${
                isActive("/admin-dashboard")
                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-3"
              >
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Admin Dashboard</span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Dark Mode</span>
          <Switch 
            checked={isDarkMode}
            onCheckedChange={toggleDarkMode}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name || user.username} className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.username}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}