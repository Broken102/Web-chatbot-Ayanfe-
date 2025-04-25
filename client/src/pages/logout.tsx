import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const { logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logoutMutation.mutateAsync();
        // Redirect to login page after logout
        setLocation("/auth");
      } catch (error) {
        console.error("Logout failed:", error);
        // If logout fails, redirect to home page
        setLocation("/");
      }
    };

    performLogout();
  }, [logoutMutation, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h1 className="mt-4 text-xl font-semibold">Logging out...</h1>
      <p className="mt-2 text-gray-500">Please wait while we log you out.</p>
    </div>
  );
}