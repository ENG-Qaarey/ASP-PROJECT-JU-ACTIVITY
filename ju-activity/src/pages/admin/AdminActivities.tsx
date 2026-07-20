import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  SlidersHorizontal,
  Eye,
  ClipboardList,
  Edit,
  Trash2,
  Send,
  X,
  Image as ImageIcon,
  LayoutGrid,
  List,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Activity } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivity } from "@/contexts/ActivityContext";
import { API } from "@/constants/api";
import { ROUTES } from "@/constants/routes";

const API_BASE = API.BASE_URL.replace(/\/api\/?$/, "");

const CATEGORY_DEFAULTS: Record<string, string> = {
  workshop: `${API_BASE}/uploads/activities/workshop.svg`,
  seminar: `${API_BASE}/uploads/activities/seminar.svg`,
  training: `${API_BASE}/uploads/activities/training.svg`,
  extracurricular: `${API_BASE}/uploads/activities/extracurricular.svg`,
  default: `${API_BASE}/uploads/activities/default.svg`,
};

const resolveImageUrl = (url?: string | null, category?: string | null): string => {
  if (url) {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return `${API_BASE}${url}`;
  }
  const key = (category || "").toLowerCase();
  return CATEGORY_DEFAULTS[key] || CATEGORY_DEFAULTS.default;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "training", label: "Training" },
  { value: "extracurricular", label: "Extracurricular" },
];

const SORT_OPTIONS = [
  { value: "date_asc", label: "Date (nearest)" },
  { value: "date_desc", label: "Date (furthest)" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "capacity_desc", label: "Capacity (most)" },
  { value: "enrolled_desc", label: "Enrolled (most)" },
];

const AdminActivities = () => {
  const navigate = useNavigate();
  const { activities, categories, deleteActivity, publishActivity } = useActivity();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [coordinatorFilter, setCoordinatorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_asc");
  const [showFilters, setShowFilters] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const coordinators = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((a) => {
      if (a.coordinatorName) map.set(a.coordinatorId || a.coordinatorName, a.coordinatorName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [activities]);

  const customCategories = useMemo(() => {
    const builtIn = CATEGORY_OPTIONS.map((c) => c.value);
    const extra = categories?.filter((c) => !builtIn.includes(c.name.toLowerCase())) || [];
    return extra.map((c) => ({ value: c.name, label: c.name }));
  }, [categories]);

  const allCategoryOptions = useMemo(() => [...CATEGORY_OPTIONS, ...customCategories], [customCategories]);

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.coordinatorName?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "draft") {
        result = result.filter((a) => a.isDraft);
      } else {
        result = result.filter((a) => a.status === statusFilter && !a.isDraft);
      }
    }

    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (coordinatorFilter !== "all") {
      result = result.filter((a) => (a.coordinatorId || a.coordinatorName) === coordinatorFilter);
    }

    switch (sortBy) {
      case "date_asc":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "date_desc":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "title_asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "capacity_desc":
        result.sort((a, b) => b.capacity - a.capacity);
        break;
      case "enrolled_desc":
        result.sort((a, b) => b.enrolled - a.enrolled);
        break;
    }

    return result;
  }, [activities, searchTerm, statusFilter, categoryFilter, coordinatorFilter, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (coordinatorFilter !== "all") count++;
    return count;
  }, [statusFilter, categoryFilter, coordinatorFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setCoordinatorFilter("all");
    setSortBy("date_asc");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteActivity(pendingDelete.id);
      toast({ title: "Activity deleted", description: "The activity has been removed." });
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : "Unable to delete activity", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  const handlePublish = async (activity: Activity) => {
    try {
      await publishActivity(activity.id);
      toast({ title: "Activity Published", description: `"${activity.title}" is now visible to students.` });
    } catch (error) {
      toast({ title: "Publish failed", description: error instanceof Error ? error.message : "Unable to publish activity", variant: "destructive" });
    }
  };

  const statusColor = (a: Activity) => {
    if (a.isDraft) return "bg-muted text-muted-foreground border-border";
    switch (a.status) {
      case "upcoming": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "ongoing": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "completed": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Monitor Activities</h2>
              <p className="text-sm text-muted-foreground mt-1">Track all events, coordinators, and statuses across JU.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{filteredActivities.length} of {activities.length}</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search + Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, coordinator, location..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 gap-2 ${showFilters ? "border-primary/50 bg-primary/5 text-primary" : ""}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-3 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5 mr-1" />Clear
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="border border-muted/40">
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allCategoryOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Coordinator</label>
                    <Select value={coordinatorFilter} onValueChange={setCoordinatorFilter}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Coordinators</SelectItem>
                        {coordinators.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activities */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No activities match your filters.</p>
            <Button variant="link" onClick={clearFilters} className="mt-2 text-xs">Clear all filters</Button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {filteredActivities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border border-muted/40 overflow-hidden hover:border-primary/20 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Image */}
                      <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 bg-muted/30 relative overflow-hidden">
                        <img src={resolveImageUrl(activity.imageUrl, activity.category)} alt="" className="w-full h-full object-cover" />
                        {activity.isDraft && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">DRAFT</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={`text-[10px] capitalize ${statusColor(activity)}`}>{activity.status}</Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{activity.category}</Badge>
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">by {activity.coordinatorName}</span>
                          </div>
                          <h3 className="text-sm sm:text-base font-semibold truncate">{activity.title}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{activity.enrolled}/{activity.capacity}</span>
                          <div className="flex-1 max-w-[120px]">
                            <Progress value={Math.min(100, Math.round((activity.enrolled / activity.capacity) * 100))} className="h-1" />
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            {activity.isDraft && (
                              <Button variant="default" size="sm" onClick={() => handlePublish(activity)} className="h-7 px-2 text-[10px] gap-1">
                                <Send className="w-3 h-3" />Publish
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedActivity(activity); setDetailsOpen(true); }} className="h-7 px-2 text-[10px] gap-1">
                              <Eye className="w-3 h-3" />View
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/activities/${activity.id}`)} className="h-7 px-2 text-[10px] gap-1">
                              <ClipboardList className="w-3 h-3" />Page
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN.EDIT_ACTIVITY(activity.id))} className="h-7 px-2 text-[10px] gap-1">
                              <Edit className="w-3 h-3" />Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setPendingDelete(activity)} className="h-7 px-2 text-[10px] gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border border-muted/40 overflow-hidden hover:border-primary/20 transition-colors group">
                  <div className="h-40 bg-muted/30 relative overflow-hidden">
                    <img src={resolveImageUrl(activity.imageUrl, activity.category)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {activity.isDraft && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">DRAFT</span>
                    )}
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-foreground/80 text-background px-2 py-0.5 rounded backdrop-blur">
                      {new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`text-[9px] capitalize ${statusColor(activity)}`}>{activity.status}</Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">{activity.category}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-1">{activity.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{activity.enrolled}/{activity.capacity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {activity.isDraft && (
                          <Button variant="default" size="sm" onClick={() => handlePublish(activity)} className="h-6 px-1.5 text-[9px] gap-0.5">
                            <Send className="w-2.5 h-2.5" />Publish
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedActivity(activity); setDetailsOpen(true); }} className="h-6 px-1.5 text-[9px]">
                          <Eye className="w-2.5 h-2.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN.EDIT_ACTIVITY(activity.id))} className="h-6 px-1.5 text-[9px]">
                          <Edit className="w-2.5 h-2.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(activity)} className="h-6 px-1.5 text-[9px] text-destructive hover:text-destructive">
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The activity and its schedule will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick View Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(open) => { setDetailsOpen(open); if (!open) setSelectedActivity(null); }}>
        <DialogContent className="w-[90vw] max-w-2xl overflow-hidden rounded-2xl border border-muted/40 p-0 sm:max-h-[85vh]">
          {selectedActivity && (
            <div className="flex max-h-[85vh] flex-col overflow-hidden">
              <div className="h-48 relative overflow-hidden">
                <img src={resolveImageUrl(selectedActivity.imageUrl, selectedActivity.category)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <div className="border-b border-muted/40 bg-card/70 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-[10px] capitalize ${statusColor(selectedActivity)}`}>{selectedActivity.isDraft ? "Draft" : selectedActivity.status}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{selectedActivity.category}</Badge>
                </div>
                <h3 className="text-xl font-semibold">{selectedActivity.title}</h3>
                <p className="text-sm text-muted-foreground">Coordinated by {selectedActivity.coordinatorName}</p>
                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedActivity.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{selectedActivity.time}</div>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Location</p>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" />{selectedActivity.location}</div>
                  </div>
                  <div className="rounded-xl border border-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Capacity</p>
                    <div className="mt-1 flex items-center justify-between text-sm font-medium">
                      <span>{selectedActivity.enrolled}/{selectedActivity.capacity} attendees</span>
                      <span className="text-xs text-muted-foreground">{Math.max(selectedActivity.capacity - selectedActivity.enrolled, 0)} left</span>
                    </div>
                    <Progress value={Math.min(100, Math.round((selectedActivity.enrolled / selectedActivity.capacity) * 100))} className="mt-3 h-2" />
                  </div>
                </div>
                <div className="rounded-xl border border-muted/40 bg-muted/20 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Overview</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground/90">{selectedActivity.description || "No description provided."}</p>
                </div>
              </div>
              <DialogFooter className="border-t border-muted/40 p-4">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminActivities;
