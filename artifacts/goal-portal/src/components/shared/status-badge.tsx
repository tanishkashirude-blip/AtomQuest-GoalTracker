import { Badge } from "@/components/ui/badge";

export type GoalStatus = "draft" | "pending_approval" | "approved" | "rejected" | "locked";

const statusConfig: Record<GoalStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-800 border-gray-200" },
  pending_approval: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  locked: { label: "Locked", className: "bg-blue-100 text-blue-800 border-blue-200" },
};

export function StatusBadge({ status }: { status: GoalStatus | string }) {
  const config = statusConfig[status as GoalStatus] || statusConfig.draft;
  
  return (
    <Badge variant="outline" className={`${config.className} font-medium tracking-wide`}>
      {config.label}
    </Badge>
  );
}
