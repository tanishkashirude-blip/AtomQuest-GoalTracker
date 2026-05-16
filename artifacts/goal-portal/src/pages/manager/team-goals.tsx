import { useState } from "react";
import { 
  useListTeamGoals, 
  useApproveGoal,
  useListCheckins,
  useAddCheckin,
  getListTeamGoalsQueryKey,
  getListCheckinsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function CheckinSection({ goalId }: { goalId: number }) {
  const { data: checkins = [], isLoading } = useListCheckins(goalId, { query: { queryKey: getListCheckinsQueryKey(goalId) } });
  const [comment, setComment] = useState("");
  const addCheckin = useAddCheckin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = () => {
    if (!comment.trim()) return;
    addCheckin.mutate({ id: goalId, data: { comment } }, {
      onSuccess: () => {
        setComment("");
        queryClient.invalidateQueries({ queryKey: getListCheckinsQueryKey(goalId) });
        toast({ title: "Check-in added" });
      }
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> Check-ins & History
      </h4>
      
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading check-ins...</div>
        ) : checkins.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No check-ins yet.</div>
        ) : (
          checkins.map(c => (
            <div key={c.id} className="bg-gray-50 p-3 rounded-md border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-900">{c.managerName || 'Manager'}</span>
                <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{c.comment}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Textarea 
          placeholder="Add a check-in comment..." 
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="min-h-[40px] h-10 resize-none text-sm"
        />
        <Button onClick={handleAdd} disabled={addCheckin.isPending || !comment.trim()} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TeamGoals() {
  const { data: goals = [], isLoading } = useListTeamGoals({ query: { queryKey: getListTeamGoalsQueryKey() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const approveGoal = useApproveGoal();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionModal, setActionModal] = useState<{ id: number, action: 'approve' | 'reject', open: boolean } | null>(null);
  const [comment, setComment] = useState("");
  const [expandedGoals, setExpandedGoals] = useState<Record<number, boolean>>({});

  const filteredGoals = statusFilter === "all" ? goals : goals.filter(g => g.status === statusFilter);

  const handleAction = () => {
    if (!actionModal) return;
    
    approveGoal.mutate({ 
      id: actionModal.id, 
      data: { 
        action: actionModal.action, 
        ...(actionModal.action === 'approve' ? { comment } : { rejectionReason: comment })
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamGoalsQueryKey() });
        toast({ title: `Goal ${actionModal.action}d successfully` });
        setActionModal(null);
        setComment("");
      }
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Goals</h1>
          <p className="text-gray-500 mt-2">Review and approve goals for your team members.</p>
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredGoals.map(goal => (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-start justify-between bg-gray-50/50 pb-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {goal.userName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-gray-900">{goal.userName}</div>
                  <div className="text-sm text-gray-500">{goal.userEmail}</div>
                </div>
              </div>
              <StatusBadge status={goal.status} />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{goal.title}</h3>
                <span className="text-sm font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded-md">{goal.weightage}%</span>
              </div>
              <p className="text-gray-600 mb-6">{goal.description}</p>

              <div className="grid grid-cols-4 gap-4 mb-4">
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
                  const val = goal[`q${idx + 1}Achievement` as keyof typeof goal] as string;
                  return (
                    <div key={q} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-1">{q} Update</div>
                      <div className="text-sm">{val || <span className="text-gray-400 italic">No update yet</span>}</div>
                    </div>
                  );
                })}
              </div>

              <Collapsible open={expandedGoals[goal.id]} onOpenChange={() => toggleExpand(goal.id)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/5">
                    {expandedGoals[goal.id] ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                    {expandedGoals[goal.id] ? 'Hide Check-ins' : 'Show Check-ins & History'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CheckinSection goalId={goal.id} />
                </CollapsibleContent>
              </Collapsible>

            </CardContent>
            {goal.status === 'pending_approval' && (
              <CardFooter className="bg-amber-50/30 border-t border-amber-100 pt-4 flex justify-end gap-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setActionModal({ id: goal.id, action: 'reject', open: true })}>
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setActionModal({ id: goal.id, action: 'approve', open: true })}>
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
        {filteredGoals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No goals found for this filter.</p>
          </div>
        )}
      </div>

      <Dialog open={actionModal?.open || false} onOpenChange={(open) => !open && setActionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionModal?.action === 'approve' ? 'Approve Goal' : 'Reject Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionModal?.action === 'approve' ? 'Optional Comment' : 'Rejection Reason (Required)'}
              </label>
              <Textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}
                placeholder={actionModal?.action === 'approve' ? 'Add an encouraging note...' : 'Explain why this needs revision...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              disabled={approveGoal.isPending || (actionModal?.action === 'reject' && !comment.trim())}
              className={actionModal?.action === 'reject' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              Confirm {actionModal?.action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
