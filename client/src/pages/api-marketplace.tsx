import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleThemeToggle } from '@/components/ui/mode-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import MainLayout from '../layouts/main-layout';
import { 
  Check, 
  CreditCard, 
  Gauge, 
  Headphones, 
  ShieldCheck, 
  Sparkles,
  BarChart, 
  Infinity, 
  Lock, 
  Rocket,
  Globe,
  MessageSquare,
  Music, 
  Image,
  Video
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export default function ApiMarketplace() {
  const [activeTab, setActiveTab] = useState('plans');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch plans
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
    queryFn: () => apiRequest('GET', '/api/plans').then(res => res.json()),
  });
  
  // Handle purchase click
  const handleSubscribe = (plan: Plan) => {
    navigate(`/checkout?planId=${plan.id}&name=${encodeURIComponent(plan.name)}&amount=${plan.price}`);
  };
  
  // Feature icons mapping
  const getFeatureIcon = (feature: string) => {
    if (feature.includes('Chat API')) return <MessageSquare className="h-4 w-4" />;
    if (feature.includes('Media APIs')) return <Image className="h-4 w-4" />;
    if (feature.includes('Adult content')) return <Lock className="h-4 w-4" />;
    if (feature.includes('Unlimited')) return <Infinity className="h-4 w-4" />;
    if (feature.includes('rate limits')) return <Gauge className="h-4 w-4" />;
    if (feature.includes('support')) return <Headphones className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };
  
  return (
    <MainLayout title="API Marketplace" description="Subscribe to API access plans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Marketplace</h1>
        <SimpleThemeToggle />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="plans">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Globe className="h-4 w-4 mr-2" />
            Available APIs
          </TabsTrigger>
        </TabsList>
        
        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="flex flex-col h-full opacity-60 animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-7 bg-muted rounded-md mb-2"></div>
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                    </CardHeader>
                    <CardContent className="space-y-2 flex-grow">
                      <div className="h-6 bg-muted rounded-md w-1/3 mb-6"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-4 bg-muted rounded-md"></div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="h-10 bg-muted rounded-md w-full"></div>
                    </CardFooter>
                  </Card>
                ))}
              </>
            ) : (
              <>
                {plans.map((plan) => (
                  <Card key={plan.id} className="flex flex-col h-full">
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>API access subscription</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground ml-1 text-sm">/month</span>
                      </div>
                      
                      <div className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="bg-primary/10 p-1 rounded-full mr-2 text-primary">
                              {getFeatureIcon(feature)}
                            </div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handleSubscribe(plan)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </>
            )}
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground space-y-4">
            <div>
              <p>You can also make direct bank transfer to:</p>
              <p className="font-medium mt-1">Account Number: 9019185241</p>
              <p className="font-medium">Bank: Opay</p>
              <p className="font-medium">Account Name: Akewushola Abdulbakri Temitope</p>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-800 max-w-xl mx-auto">
              <p className="text-amber-800 dark:text-amber-300 font-medium">Please Note</p>
              <p className="text-amber-700 dark:text-amber-400">
                After transferring, please contact us with your payment proof to have your API access activated.
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* APIs Tab */}
        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available APIs</CardTitle>
              <CardDescription>Explore our comprehensive API services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-medium">Chat API</h3>
                      <p className="text-sm text-muted-foreground">AI-powered conversational interface</p>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                      Basic Plan
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                      Pro Plan
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                      All Access
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
                      <Music className="h-6 w-6 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-medium">Music API</h3>
                      <p className="text-sm text-muted-foreground">Stream and search music content</p>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                      Pro Plan
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                      All Access
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
                      <Image className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-medium">Image API</h3>
                      <p className="text-sm text-muted-foreground">Image search, processing and generation</p>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                      Pro Plan
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                      All Access
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="bg-pink-100 dark:bg-pink-900/50 p-3 rounded-lg">
                      <Video className="h-6 w-6 text-pink-700 dark:text-pink-300" />
                    </div>
                    <div>
                      <h3 className="font-medium">Hentai Video API</h3>
                      <p className="text-sm text-muted-foreground">Adult anime content streaming</p>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                      All Access Only
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-lg">
                      <BarChart className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                    </div>
                    <div>
                      <h3 className="font-medium">Analytics API</h3>
                      <p className="text-sm text-muted-foreground">Usage statistics and insights</p>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                      Pro Plan
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                      All Access
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg text-center">
                  <Rocket className="h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="text-sm font-medium">Getting Started</h3>
                  <p className="text-xs text-muted-foreground mt-1">Quick integration guides</p>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg text-center">
                  <Sparkles className="h-8 w-8 text-purple-500 mb-2" />
                  <h3 className="text-sm font-medium">Use Cases</h3>
                  <p className="text-xs text-muted-foreground mt-1">Implementation examples</p>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg text-center">
                  <ShieldCheck className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="text-sm font-medium">API Security</h3>
                  <p className="text-xs text-muted-foreground mt-1">Best practices guide</p>
                </div>
              </div>
              
              <Button className="mt-4 w-full" onClick={() => setActiveTab('plans')}>
                Compare Subscription Plans
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}