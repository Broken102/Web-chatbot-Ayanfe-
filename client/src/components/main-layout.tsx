import { ReactNode, useState, useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { Sun, Moon, Gift, Copy, Check, LogOut, Menu, Settings, User as UserIcon, Key } from "lucide-react";
import { 
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function MainLayout({ children, title, description }: MainLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "true" ||
      (!("darkMode" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [user, setUser] = useState<User | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  const [copyStates, setCopyStates] = useState({
    account: false,
    bank: false,
    name: false
  });

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  // Copy information to clipboard and show confirmation
  const handleCopy = (text: string, type: 'account' | 'bank' | 'name') => {
    navigator.clipboard.writeText(text).then(() => {
      // Update the copy state to show the check icon
      setCopyStates(prev => ({
        ...prev,
        [type]: true
      }));

      // Show a toast notification
      toast({
        title: "Copied to clipboard",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} information copied!`,
      });

      // Reset the copy state after 2 seconds
      setTimeout(() => {
        setCopyStates(prev => ({
          ...prev,
          [type]: false
        }));
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row">
      <SidebarNav currentPath={location} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} user={user} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-3 md:hidden">
            <button id="menu-toggle" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-bold">{title}</h1>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Menubar className="border-none">
              <MenubarMenu>
                <MenubarTrigger>
                  <Menu className="h-5 w-5" />
                </MenubarTrigger>
                <MenubarContent>
                  {user?.isAdmin && (
                    <>
                      <MenubarItem onClick={() => window.location.href = "/admin-dashboard"} className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 font-bold">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="mr-2"
                        >
                          <rect width="7" height="9" x="3" y="3" rx="1" />
                          <rect width="7" height="5" x="14" y="3" rx="1" />
                          <rect width="7" height="9" x="14" y="12" rx="1" />
                          <rect width="7" height="5" x="3" y="16" rx="1" />
                        </svg>
                        ADMIN DASHBOARD
                      </MenubarItem>
                      <MenubarSeparator />
                    </>
                  )}
                  <MenubarItem onClick={() => window.location.href = "/settings"}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </MenubarItem>
                  <MenubarItem onClick={() => window.location.href = "/api-access"}>
                    <Key className="mr-2 h-4 w-4" />
                    API Access
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => {
                    fetch("/api/logout", { 
                      method: "POST",
                      credentials: "include"
                    }).then(() => {
                      window.location.href = "/auth";
                    });
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Gift the Creator Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1">
                  <Gift className="h-5 w-5 text-amber-500" />
                  <span className="hidden sm:inline text-sm font-medium">Gift Creator</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Support AYANFE's Creator</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-3 text-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Account Number</p>
                      <p className="text-gray-500 dark:text-gray-400">9019185241</p>
                    </div>
                    <button 
                      onClick={() => handleCopy("9019185241", "account")} 
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {copyStates.account ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Bank</p>
                      <p className="text-gray-500 dark:text-gray-400">Opay</p>
                    </div>
                    <button 
                      onClick={() => handleCopy("Opay", "bank")} 
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {copyStates.bank ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Account Name</p>
                      <p className="text-gray-500 dark:text-gray-400">Akewushola Abdulbakri Temitope</p>
                    </div>
                    <button 
                      onClick={() => handleCopy("Akewushola Abdulbakri Temitope", "name")} 
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {copyStates.name ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <p className="text-center pt-2 text-gray-600 dark:text-gray-300">
                    Thank you for supporting this project! ❤️
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {children}

        <MobileNav currentPath={location} />
      </div>
    </div>
  );
}