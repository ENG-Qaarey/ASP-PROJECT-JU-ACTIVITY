import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Filter,
  Eye,
  ClipboardList,
  Edit,
  Trash2,
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

const AdminActivities = () => {
  const navigate = useNavigate();
  const { activities, categories, deleteActivity, updateActivity, getApplicationsByActivity } = useActivity();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    status: "" as Activity["status"] | "",
  });

  const filteredActivities = activities
    .filter(
      (activity) =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.coordinatorName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const openDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailsOpen(true);
  };

  const closeDetails = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setSelectedActivity(null);
    }
  };

  const convertTimeToInput = (time: string) => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return time;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  const convertTimeToDisplay = (time: string) => {
    if (!time.includes(":")) return time;
    const [rawHours, minutes] = time.split(":");
    let hours = parseInt(rawHours, 10);
    if (Number.isNaN(hours)) return time;
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes ?? "00"} ${period}`;
  };

  const openEditDialog = (activity: Activity) => {
    setEditActivity(activity);
    setEditForm({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: activity.date,
      time: convertTimeToInput(activity.time),
      location: activity.location,
      capacity: activity.capacity.toString(),
      status: activity.status,
    });
  };

  const handleEditInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editActivity) return;

    if (
      !editForm.title.trim() ||
      !editForm.description.trim() ||
      !editForm.category ||
      !editForm.date ||
      !editForm.time ||
      !editForm.location.trim() ||
      !editForm.capacity ||
      !editForm.status
    ) {
      toast({ title: "Missing information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const capacityValue = Number(editForm.capacity);
    if (Number.isNaN(capacityValue) || capacityValue < 1) {
      toast({ title: "Invalid capacity", description: "Capacity must be at least 1", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updateActivity(editActivity.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        date: editForm.date,
        time: convertTimeToDisplay(editForm.time),
        location: editForm.location.trim(),
        capacity: capacityValue,
        status: editForm.status,
      });
      toast({ title: "Activity updated", description: "Changes have been saved." });
      setEditActivity(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update activity",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);
    try {
      await deleteActivity(pendingDelete.id);
      toast({ title: "Activity deleted", description: "The activity has been removed." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to delete activity",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Monitor Activities</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Oversee all scheduled events across the university
          </p>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border border-muted/40 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30">
           <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or coordinator..."
                className="pl-9 h-12 rounded-2xl border-muted/40 focus-visible:border-primary/50 focus-visible:ring-primary/30 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto justify-center gap-2 h-12 rounded-2xl border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 active:scale-95">
               <Filter className="w-4 h-4" />
               Filters
            </Button>
           </CardContent>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <Card className="rounded-3xl shadow-lg border border-muted/40 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/30 group">
                <CardContent className="p-4 md:p-6">
                  {/* Mobile & Small Tablet Layout (xs-md) */}
                  <div className="flex flex-col gap-4 lg:hidden">
                    <div className="flex gap-4 items-start">
                      <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/20 flex-shrink-0 shadow-sm transition-all duration-300 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-md">
                        <span className="text-xs md:text-sm font-semibold text-primary uppercase">
                          {new Date(activity.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-2xl md:text-3xl font-bold text-foreground transition-all duration-300 group-hover:text-primary">
                          {new Date(activity.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="capitalize bg-primary/10 text-primary border-primary/20 transition-all duration-300 group-hover:bg-primary/20">{activity.category}</Badge>
                          <span className="text-xs text-muted-foreground">• Created by {activity.coordinatorName}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold mb-2 truncate transition-all duration-300 group-hover:text-primary">{activity.title}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {activity.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {activity.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {activity.enrolled}/{activity.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-muted/30 pt-4 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(activity)} className="w-full justify-center gap-2 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 active:scale-95">
                        <Eye className="w-4 h-4" />
                        Quick View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/activities/${activity.id}`)}
                        className="w-full justify-center gap-2 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        View Page
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(activity)} className="w-full justify-center gap-2 border-primary/30 text-primary hover:bg-transparent hover:text-black hover:border-primary/30 transition-all duration-300 hover:scale-105 active:scale-95">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                        onClick={() => setPendingDelete(activity)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Large Tablet & Desktop Layout (lg+) */}
                  <div className="hidden lg:flex items-center gap-6">
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/20 flex-shrink-0 shadow-sm transition-all duration-300 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-md">
                      <span className="text-sm font-semibold text-primary uppercase">
                        {new Date(activity.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-3xl font-bold text-foreground transition-all duration-300 group-hover:text-primary">
                        {new Date(activity.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="capitalize bg-primary/10 text-primary border-primary/20 transition-all duration-300 group-hover:bg-primary/20">{activity.category}</Badge>
                        <span className="text-xs text-muted-foreground">• Created by {activity.coordinatorName}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 transition-all duration-300 group-hover:text-primary">{activity.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {activity.time}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {activity.location}
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {activity.enrolled}/{activity.capacity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-l border-muted/30 pl-6">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(activity)} className="gap-2 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 active:scale-95">
                        <Eye className="w-4 h-4" />
                        Quick View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/activities/${activity.id}`)}
                        className="gap-2 bg-muted/20 hover:bg-muted/40 transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        View Page
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(activity)} className="gap-2 border-primary/30 text-primary hover:bg-transparent hover:text-black hover:border-primary/30 transition-all duration-300 hover:scale-105 active:scale-95">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                        onClick={() => setPendingDelete(activity)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The activity and its schedule will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsOpen} onOpenChange={closeDetails}>
        <DialogContent className="w-[90vw] max-w-2xl overflow-hidden rounded-3xl border border-muted/40 p-0 sm:max-h-[85vh]">
          {selectedActivity ? (
            <div className="flex max-h-[85vh] flex-col overflow-hidden">
              <div className="border-b border-muted/40 bg-card/70 p-5">
                <Badge className="capitalize">{selectedActivity.category}</Badge>
                <h3 className="mt-3 text-xl font-semibold text-foreground">{selectedActivity.title}</h3>
                <p className="text-sm text-muted-foreground">Coordinated by {selectedActivity.coordinatorName}</p>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedActivity.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedActivity.time}
                  </div>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Location</p>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedActivity.location}
                    </div>
                  </div>
                  <div className="rounded-xl border border-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Capacity</p>
                    <div className="mt-1 flex items-center justify-between text-sm font-medium text-foreground">
                      <span>
                        {selectedActivity.enrolled}/{selectedActivity.capacity} attendees
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.max(selectedActivity.capacity - selectedActivity.enrolled, 0)} seats left
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        Math.round((selectedActivity.enrolled / selectedActivity.capacity) * 100),
                      )}
                      className="mt-3 h-2"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-muted/40 bg-muted/20 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Overview</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground/90">
                    {selectedActivity.description || "No description provided."}
                  </p>
                </div>

                <div className="rounded-xl border border-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Quick facts</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Lead: {selectedActivity.coordinatorName}
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedActivity.location}
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {selectedActivity.enrolled} participants confirmed
                    </li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="border-t border-muted/40 p-4">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => closeDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              <p className="text-lg font-semibold">Activity details</p>
              <p className="text-sm text-muted-foreground">Select an activity to see more context.</p>
              <DialogFooter className="p-0">
                <Button variant="outline" onClick={() => closeDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editActivity !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditActivity(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit activity
            </DialogTitle>
            <DialogDescription>
              Update the activity information and save your changes.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                name="title"
                value={editForm.title}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                name="description"
                rows={4}
                value={editForm.description}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="extracurricular">Extracurricular</SelectItem>
                    {categories
                      ?.filter(cat => !["workshop", "seminar", "training", "extracurricular"].includes(cat.name.toLowerCase()))
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.name} className="capitalize">
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value as Activity["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  value={editForm.date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time *</Label>
                <Input
                  id="edit-time"
                  name="time"
                  type="time"
                  value={editForm.time}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity *</Label>
                <Input
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  value={editForm.capacity}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditActivity(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminActivities;
