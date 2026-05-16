import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/layout/app-layout";
import Login from "@/pages/auth/login";
import EmployeeDashboard from "@/pages/employee/dashboard";
import EmployeeGoals from "@/pages/employee/goals";
import TeamDashboard from "@/pages/manager/team-dashboard";
import TeamGoals from "@/pages/manager/team-goals";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminGoals from "@/pages/admin/all-goals";
import AdminReports from "@/pages/admin/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles: string[] }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login");
    } else if (user && !allowedRoles.includes(user.role)) {
      if (user.role === "employee") setLocation("/goals");
      else if (user.role === "manager") setLocation("/team");
      else if (user.role === "admin") setLocation("/admin");
    }
  }, [user, isLoading, error, setLocation, allowedRoles]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function RootRedirect() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  useEffect(() => {
    if (!isLoading) {
      if (!user) setLocation("/login");
      else if (user.role === "employee") setLocation("/goals");
      else if (user.role === "manager") setLocation("/team");
      else if (user.role === "admin") setLocation("/admin");
    }
  }, [user, isLoading, setLocation]);

  return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

const EmployeeGoalsRoute = () => <ProtectedRoute component={EmployeeGoals} allowedRoles={["employee"]} />;
const EmployeeDashboardRoute = () => <ProtectedRoute component={EmployeeDashboard} allowedRoles={["employee"]} />;
const TeamDashboardRoute = () => <ProtectedRoute component={TeamDashboard} allowedRoles={["manager"]} />;
const TeamGoalsRoute = () => <ProtectedRoute component={TeamGoals} allowedRoles={["manager"]} />;
const AdminDashboardRoute = () => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />;
const AdminUsersRoute = () => <ProtectedRoute component={AdminUsers} allowedRoles={["admin"]} />;
const AdminGoalsRoute = () => <ProtectedRoute component={AdminGoals} allowedRoles={["admin"]} />;
const AdminReportsRoute = () => <ProtectedRoute component={AdminReports} allowedRoles={["admin"]} />;

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/goals" component={EmployeeGoalsRoute} />
      <Route path="/goals/dashboard" component={EmployeeDashboardRoute} />
      <Route path="/team" component={TeamDashboardRoute} />
      <Route path="/team/goals" component={TeamGoalsRoute} />
      <Route path="/admin" component={AdminDashboardRoute} />
      <Route path="/admin/users" component={AdminUsersRoute} />
      <Route path="/admin/goals" component={AdminGoalsRoute} />
      <Route path="/admin/reports" component={AdminReportsRoute} />
      <Route path="/" component={RootRedirect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
