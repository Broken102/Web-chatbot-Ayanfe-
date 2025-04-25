import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
// We'll implement confetti later if needed

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Success animation could be added here in the future
  useEffect(() => {
    // Placeholder for potential future animation
    console.log('Payment success page loaded');
  }, []);

  // Get payment info from URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentIntentId = queryParams.get('payment_intent');
    const paymentIntentClientSecret = queryParams.get('payment_intent_client_secret');
    const redirectStatus = queryParams.get('redirect_status');
    
    if (!paymentIntentId || !paymentIntentClientSecret || redirectStatus !== 'succeeded') {
      setError('Invalid payment information. Please contact support.');
      setIsLoading(false);
      return;
    }
    
    const generateApiKey = async () => {
      try {
        const response = await apiRequest("POST", "/api/generate-api-key", { 
          paymentIntentId,
          name: "Purchased API Key" 
        });
        
        if (!response.ok) {
          throw new Error("Failed to generate API key");
        }
        
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (error: any) {
        setError(error.message || "Failed to generate API key. Please contact support.");
        toast({
          title: "API Key Generation Failed",
          description: "There was an issue generating your API key. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    generateApiKey();
  }, [toast]);
  
  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-16 flex flex-col items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Processing Your Payment...</CardTitle>
            <CardDescription>
              Please wait while we generate your API key.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl py-16">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Payment Error</CardTitle>
            <CardDescription>
              We encountered an issue with your payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/checkout')}>
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-16">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your API key has been generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Your API Key:</p>
            <div className="relative">
              <div className="p-3 bg-background border rounded-md overflow-x-auto whitespace-nowrap font-mono">
                {apiKey}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={copyToClipboard}
              >
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
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900/30">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Please save this API key in a secure location. 
              You won't be able to see it again!
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">What's Next?</h3>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Use your API key to authenticate requests to our API</li>
              <li>Check the documentation for implementation details</li>
              <li>Contact support if you have any questions</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Return to Home
          </Button>
          <Button onClick={() => setLocation('/profile-page')}>
            Go to Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}