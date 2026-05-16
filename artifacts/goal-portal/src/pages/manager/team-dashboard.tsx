import { useGetTeamDashboard, getGetTeamDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, CheckCircle2, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function TeamDashboard() {
  const { data: dashboard, isLoading } = useGetTeamDashboard({ query: { queryKey: getGetTeamDashboardQueryKey() } });

  if (isLoading || !dashboard) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Dashboard</h1>
        <p className="text-gray-500 mt-2">Overview of your team's goal progress and status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Goals</CardTitle>
            <Target className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{dashboard.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboard.approvedGoals}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goals Set</TableHead>
                <TableHead>Total Weightage</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.employeeStats.map(stat => (
                <TableRow key={stat.userId}>
                  <TableCell className="font-medium">{stat.userName}</TableCell>
                  <TableCell>{stat.totalGoals}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={stat.totalWeightage === 100 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {stat.totalWeightage}%
                      </span>
                      <Progress value={stat.totalWeightage} className="w-16 h-1" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {stat.approvedGoals > 0 ? <span className="text-green-600 font-medium">{stat.approvedGoals}</span> : "0"}
                  </TableCell>
                  <TableCell>
                    {stat.pendingGoals > 0 ? <span className="text-amber-600 font-medium">{stat.pendingGoals}</span> : "0"}
                  </TableCell>
                </TableRow>
              ))}
              {dashboard.employeeStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 h-24">No team members found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
