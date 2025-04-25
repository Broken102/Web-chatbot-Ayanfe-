import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ChatPage from "@/pages/chat-page";
import ApiTestingPage from "@/pages/api-testing-page";
import ApiAccessPage from "./pages/api-access";
import ApiStatusPage from "@/pages/api-status-page";
import ApiHealthCheckPage from "@/pages/api-health-check";
import ApiMarketplacePage from "./pages/api-marketplace";
import CheckoutPage from "./pages/checkout";
import PaymentSuccessPage from "./pages/payment-success";
import UserSettingsPage from "./pages/settings";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import AdminDashboard from "./pages/admin-dashboard";
import BadgesPage from "@/pages/badges-page";
import LogoutPage from "./pages/logout";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { BadgesProvider } from "@/hooks/use-badges";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/api-testing" component={ApiTestingPage} />
      <Route path="/api-access" component={ApiAccessPage} />
      <Route path="/api-status" component={ApiStatusPage} />
      <Route path="/api-health" component={ApiHealthCheckPage} />
      <Route path="/api-marketplace" component={ApiMarketplacePage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/settings" component={UserSettingsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/logout" component={LogoutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <BadgesProvider>
            <Toaster />
            <Router />
          </BadgesProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
