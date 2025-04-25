import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
// For Opay icon, we'll use a custom SVG since SiOpay isn't available
import { SiPaypal } from 'react-icons/si';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Pricing Plans
const PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 2,
    features: ['5,000 API requests per month', 'Basic support', 'Access to standard APIs']
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 3,
    features: ['20,000 API requests per month', 'Priority support', 'Access to all APIs', 'No rate limits']
  }
];

// Stripe Checkout Form Component
const CheckoutForm = ({ selectedPlan }: { selectedPlan: typeof PLANS[0] }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed...",
        });
        // This won't execute if the redirect happens, but just in case:
        setLocation('/payment-success');
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : `Pay $${selectedPlan.price.toFixed(2)}`}
      </Button>
    </form>
  );
};

// Bank Transfer Details Component
const BankTransferDetails = () => {
  return (
    <div className="space-y-4">
      <div className="p-6 border rounded-lg bg-muted/50">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <SiPaypal className="h-5 w-5 text-blue-500" />
          Opay Transfer Details
        </h3>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="grid grid-cols-2">
            <span className="text-muted-foreground">Account Number:</span>
            <span className="font-medium">9019185241</span>
          </div>
          <div className="grid grid-cols-2">
            <span className="text-muted-foreground">Bank:</span>
            <span className="font-medium">Opay</span>
          </div>
          <div className="grid grid-cols-2">
            <span className="text-muted-foreground">Account Name:</span>
            <span className="font-medium">Akewushola Abdulbakri Temitope</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-medium">After Payment</h3>
        <p className="text-muted-foreground mt-2">
          After completing your bank transfer, please fill out this form to get your API key:
        </p>
        
        <div className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="transaction-id">Transaction Reference/ID</Label>
            <Input id="transaction-id" placeholder="Enter transaction reference" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="plan-selected">Plan Selected</Label>
            <RadioGroup defaultValue="basic">
              {PLANS.map(plan => (
                <div key={plan.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={plan.id} id={plan.id} />
                  <Label htmlFor={plan.id}>{plan.name} (${plan.price})</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <Button className="w-full">Submit Payment Verification</Button>
        </div>
      </div>
    </div>
  );
};

// Main Checkout Page Component
export default function Checkout() {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    // Create PaymentIntent when the plan is selected
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: selectedPlan.price,
          plan: selectedPlan.id
        });
        
        if (!response.ok) {
          throw new Error("Failed to create payment intent");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Payment Setup Failed",
          description: error.message || "Could not set up payment. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    createPaymentIntent();
  }, [selectedPlan, toast]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Upgrade Your API Access</h1>
      
      <div className="grid gap-8 mb-8">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`p-6 cursor-pointer transition-all ${selectedPlan.id === plan.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
            onClick={() => setSelectedPlan(plan)}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <div className="text-2xl font-bold">${plan.price.toFixed(2)}/month</div>
            </div>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      
      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="card">Pay with Card</TabsTrigger>
          <TabsTrigger value="bank">Pay with Bank Transfer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="card">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm selectedPlan={selectedPlan} />
            </Elements>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bank">
          <BankTransferDetails />
        </TabsContent>
      </Tabs>
    </div>
  );
}