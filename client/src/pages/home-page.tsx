import { useEffect } from "react";
import { Redirect } from "wouter";

export default function HomePage() {
  // Home page immediately redirects to chat page
  // This is for future expansion if needed
  useEffect(() => {}, []);

  return <Redirect to="/chat" />;
}
