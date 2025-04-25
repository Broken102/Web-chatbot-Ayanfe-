import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Home, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Key, 
  Store, 
  BarChart, 
  LogOut, 
  Menu, 
  Bell 
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function MainLayout({ children, title, description }: MainLayoutProps) {
  const [location, navigate] = useLocation();
  
  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user').then(res => res.json()),
  });
  
  // Define the navigation item type
  interface NavItem {
    path: string;
    icon: React.ReactNode;
    label: string;
    action?: () => void;
  }
  
  // Navigation items
  const navigationItems: NavItem[] = [
    { path: '/', icon: <Home className="h-5 w-5" />, label: 'Home' },
    { path: '/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat' },
    { path: '/api-marketplace', icon: <Store className="h-5 w-5" />, label: 'API Marketplace' },
    { path: '/api-access', icon: <Key className="h-5 w-5" />, label: 'API Access' },
  ];
  
  // Admin-only navigation items
  const adminItems: NavItem[] = [
    { path: '/admin-dashboard', icon: <BarChart className="h-5 w-5" />, label: 'Admin Dashboard' },
  ];
  
  // Account items
  const accountItems: NavItem[] = [
    { path: '/settings', icon: <SettingsIcon className="h-5 w-5" />, label: 'Settings' },
    { path: '/logout', icon: <LogOut className="h-5 w-5" />, label: 'Logout', action: () => {
      // Logout logic
      fetch('/api/logout', { method: 'POST' })
        .then(() => {
          navigate('/login');
        })
        .catch(error => {
          console.error('Logout error:', error);
        });
    }}
  ];
  
  // Check if current route is active
  const isActive = (path: string) => location === path;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                <Link href="/" className="flex items-center gap-2 px-2">
                  <span className="text-xl font-bold">AYANFE AI</span>
                </Link>
                <nav className="flex flex-col gap-2">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => item.action ? item.action() : navigate(item.path)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  ))}
                  
                  {user?.isAdmin && (
                    <>
                      <div className="my-2 px-2 text-xs font-semibold text-muted-foreground">
                        Admin
                      </div>
                      {adminItems.map((item) => (
                        <Button
                          key={item.path}
                          variant={isActive(item.path) ? "default" : "ghost"}
                          className="justify-start"
                          onClick={() => item.action ? item.action() : navigate(item.path)}
                        >
                          {item.icon}
                          <span className="ml-2">{item.label}</span>
                        </Button>
                      ))}
                    </>
                  )}
                  
                  <div className="my-2 px-2 text-xs font-semibold text-muted-foreground">
                    Account
                  </div>
                  {accountItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => item.action ? item.action() : navigate(item.path)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Desktop logo */}
          <Link href="/" className="hidden md:flex items-center gap-2">
            <span className="text-xl font-bold">AYANFE AI</span>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => item.action ? item.action() : navigate(item.path)}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            ))}
            
            {user?.isAdmin && adminItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => item.action ? item.action() : navigate(item.path)}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            ))}
          </nav>
          
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            {/* Profile */}
            <div className="ml-auto flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2">
                  {/* User menu */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt={user.name || user.username} />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                      <div className="flex flex-col py-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt={user.name || user.username} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name || user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        <nav className="flex flex-col gap-2">
                          {accountItems.map((item) => (
                            <Button
                              key={item.path}
                              variant={isActive(item.path) ? "default" : "ghost"}
                              className="justify-start"
                              onClick={() => item.action ? item.action() : navigate(item.path)}
                            >
                              {item.icon}
                              <span className="ml-2">{item.label}</span>
                            </Button>
                          ))}
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              ) : (
                <Button onClick={() => navigate('/login')}>Log In</Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container py-6 px-4">
        {(title || description) && (
          <div className="mb-6">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}