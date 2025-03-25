import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login-page";
import DashboardPage from "@/pages/dashboard-page";
import ProductsPage from "@/pages/products-page";
import StoresPage from "@/pages/stores-page";
import UsersPage from "@/pages/users-page";
import StockPage from "@/pages/stock-page";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/products" component={ProductsPage} roles={["admin", "promoter"]} />
      <ProtectedRoute path="/stores" component={StoresPage} roles={["admin"]} />
      <ProtectedRoute path="/users" component={UsersPage} roles={["leader"]} />
      <ProtectedRoute path="/stock" component={StockPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
