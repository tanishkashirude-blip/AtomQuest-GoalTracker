import { useState } from "react";
import { 
  useListAllGoals, 
  useUnlockGoal,
  getListAllGoalsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Unlock, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGoals() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: goals = [], isLoading } = useListAllGoals(
    statusFilter !== "all" ? { status: statusFilter } : {}, 
    { query: { queryKey: getListAllGoalsQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}) } }
  );
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const unlockGoal = useUnlockGoal();

  const handleUnlock = (id: number) => {
    if (confirm("Are you sure you want to unlock this goal? This will revert it to pending_approval status.")) {
      unlockGoal.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllGoalsQueryKey() });
          toast({ title: "Goal unlocked successfully" });
        }
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Goals</h1>
          <p className="text-gray-500 mt-2">Organization-wide goal oversight and administration.</p>
        </div>
        <div className="w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="locked">Locked (Finalized)</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending_approval">Pending</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goal Title</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Admin Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map(goal => (
                <TableRow key={goal.id}>
                  <TableCell>
                    <div className="font-medium">{goal.userName}</div>
                    <div className="text-xs text-gray-500">{goal.userEmail}</div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="font-medium truncate" title={goal.title}>{goal.title}</div>
                  </TableCell>
                  <TableCell>{goal.weightage}%</TableCell>
                  <TableCell>
                    <StatusBadge status={goal.status} />
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(goal.updatedAt || goal.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {goal.status === 'locked' || goal.status === 'approved' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUnlock(goal.id)}
                        disabled={unlockGoal.isPending}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Unlock className="h-3 w-3 mr-2" /> Unlock
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {goals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No goals found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
