import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Package,
  Store,
  Users,
  Layers,
  X,
} from "lucide-react";

interface SidebarNavProps {
  items: {
    href: string;
    label: string;
    icon: string;
  }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children?: ReactNode;
}

export default function SidebarNav({
  items,
  open = true,
  onOpenChange,
  className,
  children,
}: SidebarNavProps) {
  const [location] = useLocation();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar-nav');
      if (sidebar && !sidebar.contains(event.target as Node) && open && window.innerWidth < 768) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, onOpenChange]);

  // Get appropriate icon component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'package':
        return <Package className="h-5 w-5" />;
      case 'store':
        return <Store className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'layers':
        return <Layers className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => onOpenChange?.(false)}
        />
      )}
      
      <div
        id="sidebar-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <div className="flex items-center">
              <Store className="mr-2 h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold truncate">Inventory System</h1>
            </div>
            {/* Close button (mobile only) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => onOpenChange?.(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-2 py-2 text-sm font-medium",
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="mr-3">{getIcon(item.icon)}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </ScrollArea>

          {/* Optional content at the bottom (e.g., user info) */}
          {children}
        </div>
      </div>
    </>
  );
}
