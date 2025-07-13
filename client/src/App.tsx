import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DocumentUpload from "@/pages/document-upload";
import CaseDashboard from "@/pages/case-dashboard";
import DraftAnswer from "@/pages/draft-answer";
import AffirmativeDefenses from "@/pages/affirmative-defenses";
import DocumentPreview from "@/pages/document-preview";
import FilingInstructions from "@/pages/filing-instructions";
import Subscribe from "@/pages/subscribe";
import NotFound from "@/pages/not-found";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/document-upload" component={DocumentUpload} />
          <Route path="/case/:id" component={CaseDashboard} />
          <Route path="/case/:id/draft-answer" component={DraftAnswer} />
          <Route path="/case/:id/affirmative-defenses" component={AffirmativeDefenses} />
          <Route path="/case/:id/document-preview" component={DocumentPreview} />
          <Route path="/case/:id/filing-instructions" component={FilingInstructions} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Elements stripe={stripePromise}>
          <Toaster />
          <Router />
        </Elements>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
