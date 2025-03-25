import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  roles?: UserRole[];
}

export function ProtectedRoute({ path, component: Component, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!isAuthenticated) {
          return <Redirect to="/login" />;
        }

        // Check if user has required role
        if (roles && role && !roles.includes(role as UserRole)) {
          return <Redirect to="/" />;
        }

        return <Component />;
      }}
    </Route>
  );
}
