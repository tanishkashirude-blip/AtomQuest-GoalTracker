import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Target, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (user) => {
        queryClient.setQueryData(getGetMeQueryKey(), user);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        
        if (user.role === 'employee') setLocation("/goals");
        else if (user.role === 'manager') setLocation("/team");
        else if (user.role === 'admin') setLocation("/admin");
      },
      onError: () => {
        toast({ 
          title: "Login Failed", 
          description: "Invalid email or password", 
          variant: "destructive" 
        });
      }
    });
  };

  const autofill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Test@123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">GoalTrack Portal</h2>
          <p className="mt-2 text-gray-600">Sign in to manage your performance goals</p>
        </div>

        <Card className="shadow-lg border-0">
          <form onSubmit={handleLogin}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              
              <div className="w-full border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs text-center text-gray-500 mb-3 font-medium uppercase tracking-wider">Test Credentials</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => autofill("employee@test.com")} className="text-xs">
                    Employee
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => autofill("manager@test.com")} className="text-xs">
                    Manager
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => autofill("admin@test.com")} className="text-xs">
                    Admin
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
