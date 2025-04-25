import { Link } from "wouter";
import { MessageSquare, Terminal, Key, Settings, Activity, Award, ShoppingCart } from "lucide-react";

interface MobileNavProps {
  currentPath: string;
}

export function MobileNav({ currentPath }: MobileNavProps) {
  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      <div className="flex justify-around py-2">
        <Link href="/chat" className={`flex flex-col items-center py-3 ${isActive("/chat") ? "text-primary-600" : "text-gray-500 dark:text-gray-400"}`}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Chat</span>
        </Link>
        <Link href="/api-testing" className={`flex flex-col items-center py-3 ${isActive("/api-testing") ? "text-primary-600" : "text-gray-500 dark:text-gray-400"}`}>
            <Terminal className="h-5 w-5" />
            <span className="text-xs mt-1">API Test</span>
        </Link>
        <Link href="/badges" className={`flex flex-col items-center py-3 ${isActive("/badges") ? "text-primary-600" : "text-gray-500 dark:text-gray-400"}`}>
            <Award className="h-5 w-5" />
            <span className="text-xs mt-1">Badges</span>
        </Link>
        <Link href="/api-status" className={`flex flex-col items-center py-3 ${isActive("/api-status") ? "text-primary-600" : "text-gray-500 dark:text-gray-400"}`}>
            <Activity className="h-5 w-5" />
            <span className="text-xs mt-1">Status</span>
        </Link>
        <Link href="/api-marketplace" className={`flex flex-col items-center py-3 ${isActive("/api-marketplace") ? "text-primary-600" : "text-gray-500 dark:text-gray-400"}`}>
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs mt-1">Shop</span>
        </Link>
        <Link href="/settings" className={`flex flex-col items-center py-3 ${isActive("/settings") ? "text-primary-600" : "text-gray-500 dark:text-gray-400"}`}>
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </div>
  );
}
