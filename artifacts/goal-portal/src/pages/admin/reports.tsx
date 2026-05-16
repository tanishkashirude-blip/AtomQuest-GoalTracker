import { useState } from "react";
import { useExportReport, getExportReportQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileJson, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminReports() {
  const { data: report, isLoading, error } = useExportReport(undefined, { query: { queryKey: getExportReportQueryKey() } });

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goaltrack_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading report data</AlertTitle>
        <AlertDescription>There was a problem fetching the report data.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports & Exports</h1>
          <p className="text-gray-500 mt-2">Generate and download compliance and performance reports.</p>
        </div>
        <Button onClick={handleDownload} disabled={!report || report.goals.length === 0} className="bg-primary">
          <Download className="h-4 w-4 mr-2" /> Export JSON
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Goals Overview</CardTitle>
          <CardDescription>
            Report generated at {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}. 
            Total goals: {report?.totalGoals || 0}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weightage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.goals.slice(0, 50).map(goal => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{goal.id}</TableCell>
                    <TableCell>{goal.userName || goal.userEmail}</TableCell>
                    <TableCell className="max-w-xs truncate">{goal.title}</TableCell>
                    <TableCell className="capitalize">{goal.status.replace('_', ' ')}</TableCell>
                    <TableCell>{goal.weightage}%</TableCell>
                  </TableRow>
                ))}
                {!report?.goals.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No data available to export.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {report && report.goals.length > 50 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Showing first 50 rows. Export to see all {report.totalGoals} records.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
