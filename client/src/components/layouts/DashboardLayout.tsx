import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SidebarNav from "@/components/ui/sidebar-nav";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import useMobile from "@/hooks/use-mobile";
import { Footer } from "@/components/Footer";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { username, role, logout } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Close sidebar on mobile when changing routes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Handle resize to show/hide sidebar appropriately
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Navigation items based on user role (Traduzido para Português)
  const navItems = [
    { href: "/", label: "Painel", icon: "home" },
    ...(role === "admin" || role === "promoter"
      ? [{ href: "/products", label: "Produtos", icon: "package" }]
      : []),
    ...(role === "admin"
      ? [{ href: "/stores", label: "Gerenciar Lojas", icon: "store" }]
      : []),
    ...(role === "leader"
      ? [{ href: "/users", label: "Gerenciar Usuários", icon: "users" }]
      : []),
    { href: "/stock", label: "Controle de Estoque", icon: "layers" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <span className="font-semibold">ValidaPro</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNav 
          items={navItems} 
          open={isSidebarOpen} 
          onOpenChange={setIsSidebarOpen} 
          className="border-r"
        >
          {/* Sidebar Footer */}
          <div className="border-t p-4 mt-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{username}</p>
                <p className="text-xs capitalize text-muted-foreground">{role}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarNav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Desktop Header */}
          <header className="hidden md:flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">
              ValidaPro - Controle profissional de validades
            </h1>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{username}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
