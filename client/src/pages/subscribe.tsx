import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Scale, Check, Lock } from "lucide-react";
import Navigation from "@/components/navigation";

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/`,
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
        title: "Payment Successful",
        description: "You are now subscribed to ArnieAI Pro!",
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Scale className="h-8 w-8 text-primary mr-3" />
                <span className="text-2xl font-bold text-primary">ArnieAI</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Choose Your Plan</CardTitle>
              <p className="text-gray-600">Simple, transparent pricing</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Free Trial */}
                <Card className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Free Trial</h3>
                      <div className="text-3xl font-bold text-gray-900">$0</div>
                      <div className="text-sm text-gray-500">14 days free</div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-6">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        1 active case
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Basic document processing
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Email support
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="border-primary bg-primary/5 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Recommended
                  </div>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Pro Plan</h3>
                      <div className="text-3xl font-bold text-gray-900">$49</div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-6">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Unlimited cases
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Advanced AI processing
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Priority support
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Document templates
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Form */}
              {clientSecret && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                  <SubscribeForm />
                </div>
              )}

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Secure payment processing by Stripe
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
