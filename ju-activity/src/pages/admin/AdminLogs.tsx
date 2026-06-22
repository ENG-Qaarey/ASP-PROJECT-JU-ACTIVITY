import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Download,
  Terminal,
  Filter,
  Eye,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { auditLogsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 20;

const AdminLogs = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [filters, setFilters] = useState<{
    action?: string;
    status?: string;
    actorId: string;
    from: string;
    to: string;
  }>({
    action: undefined,
    status: undefined,
    actorId: "",
    from: "",
    to: "",
  });

  const fetchLogs = async (currentPage = 0) => {
    setIsLoading(true);
    try {
      const response = await auditLogsApi.getAll({
        q: searchTerm || undefined,
        action: filters.action || undefined,
        status: filters.status || undefined,
        actorId: filters.actorId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        skip: currentPage * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      setLogs(response && Array.isArray(response.data) ? response.data : []);
      setTotal(response?.total || 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load audit logs";
      toast({
        title: "Unable to load audit logs",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(page), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExportCsv = async () => {
    try {
      await auditLogsApi.exportCsv({
        q: searchTerm || undefined,
        action: filters.action || undefined,
        status: filters.status || undefined,
        actorId: filters.actorId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      toast({ title: "CSV export started" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleExportJson = async () => {
    try {
      await auditLogsApi.exportJson({
        q: searchTerm || undefined,
        action: filters.action || undefined,
        status: filters.status || undefined,
        actorId: filters.actorId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      toast({ title: "JSON export started" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toTitle = (value: string) =>
    value
      .toLowerCase()
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "failure":
      case "failed":
      case "error":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">System Audit Logs</h1>
          <p className="text-muted-foreground">
            Track security events and administrative actions
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Audit Trail
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJson}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select
                value={filters.action || "all"}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, action: v === "all" ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                  <SelectItem value="LOGIN_FAILURE">Login Failure</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                  <SelectItem value="PERMISSION_CHANGE">Permission Change</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || "all"}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v === "all" ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9"
                  value={filters.from}
                  onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9"
                  value={filters.to}
                  onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading && (
              <div className="text-sm text-muted-foreground pb-3">Loading audit logs...</div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-28" /></div></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-md" /></TableCell>
                        <TableCell><div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-20" /></div></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                      </TableRow>
                    ))
                  )}

                  {!isLoading && logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{toTitle(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.actorName || "System"}</span>
                          {log.actorEmail && (
                            <span className="text-xs text-muted-foreground">{log.actorEmail}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.actorRole ? (
                          <Badge variant="outline">{toTitle(log.actorRole)}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {log.entity ? `${toTitle(log.entity)}` : "—"}
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground block">
                            {log.entityId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {toTitle(log.status || "Success")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[450px] sm:w-[540px] overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle>Audit Log Details</SheetTitle>
                              <SheetDescription>
                                Complete record of the audit event
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Event Info</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-sm text-muted-foreground">ID</span>
                                    <p className="font-mono text-xs">{log.id}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Timestamp</span>
                                    <p className="text-sm">{formatDate(log.createdAt)}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Action</span>
                                    <p className="text-sm font-medium">{toTitle(log.action)}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge className={getStatusColor(log.status)}>
                                      {toTitle(log.status || "Success")}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Actor</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-sm text-muted-foreground">Name</span>
                                    <p className="text-sm">{log.actorName || "System"}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <p className="text-sm">{log.actorEmail || "—"}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">Role</span>
                                    <p className="text-sm">{log.actorRole ? toTitle(log.actorRole) : "—"}</p>
                                  </div>
                                </div>
                              </div>

                              {(log.entity || log.entityId) && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Entity</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-sm text-muted-foreground">Type</span>
                                      <p className="text-sm">{log.entity ? toTitle(log.entity) : "—"}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">ID</span>
                                      <p className="font-mono text-xs">{log.entityId || "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {log.message && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold">Message</h4>
                                  <p className="text-sm text-muted-foreground">{log.message}</p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Client Info</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-sm text-muted-foreground">IP Address</span>
                                    <p className="font-mono text-xs">{log.ipAddress || "—"}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-muted-foreground">User Agent</span>
                                    <p className="text-xs text-muted-foreground break-all">
                                      {log.userAgent || "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {(log.beforeData || log.afterData) && (
                                <Tabs defaultValue="after">
                                  <TabsList>
                                    {log.beforeData && <TabsTrigger value="before">Before</TabsTrigger>}
                                    {log.afterData && <TabsTrigger value="after">After</TabsTrigger>}
                                  </TabsList>
                                  {log.beforeData && (
                                    <TabsContent value="before" className="mt-4">
                                      <div className="rounded-lg border p-3 bg-muted/20">
                                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                          {log.beforeData}
                                        </pre>
                                      </div>
                                    </TabsContent>
                                  )}
                                  {log.afterData && (
                                    <TabsContent value="after" className="mt-4">
                                      <div className="rounded-lg border p-3 bg-muted/20">
                                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                          {log.afterData}
                                        </pre>
                                      </div>
                                    </TabsContent>
                                  )}
                                </Tabs>
                              )}

                              {log.errorDetails && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-red-500">Error Details</h4>
                                  <div className="rounded-lg border border-red-200 dark:border-red-800 p-3 bg-red-50 dark:bg-red-950/20">
                                    <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                                      {log.errorDetails}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!isLoading && logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminLogs;
