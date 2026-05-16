import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Target, Users, FileText, CheckSquare, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      }
    });
  };

  if (isLoading || !user) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  let navItems: NavItem[] = [];
  if (user.role === 'employee') {
    navItems = [
      { label: "My Goals", href: "/goals", icon: Target },
      { label: "Dashboard", href: "/goals/dashboard", icon: LayoutDashboard },
    ];
  } else if (user.role === 'manager') {
    navItems = [
      { label: "Team Dashboard", href: "/team", icon: LayoutDashboard },
      { label: "Team Goals", href: "/team/goals", icon: Users },
    ];
  } else if (user.role === 'admin') {
    navItems = [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "All Goals", href: "/admin/goals", icon: Target },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Reports", href: "/admin/reports", icon: FileText },
    ];
  }

  const roleColorMap: Record<string, string> = {
    employee: "bg-blue-100 text-blue-800",
    manager: "bg-purple-100 text-purple-800",
    admin: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">GoalTrack</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-sidebar-border">
              <AvatarFallback className="bg-primary-foreground/10 text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user.name}</span>
              <span className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/50"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
