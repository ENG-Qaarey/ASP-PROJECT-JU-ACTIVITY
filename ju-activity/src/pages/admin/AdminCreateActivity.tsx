import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Save,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { categoriesApi } from "@/lib/api";

const AdminCreateActivity = () => {
  const navigate = useNavigate();
  const { createActivity } = useActivity();
  const { users, refreshUsers } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    coordinatorId: "",
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    refreshUsers();
    fetchCategories();
  }, [refreshUsers]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch {
      toast({ title: "Error", description: "Failed to load categories. Using defaults.", variant: "destructive" });
    }
  };

  const coordinators = useMemo(() => {
    return (users ?? []).filter((u) => u.role === "coordinator" && (u.status ?? "active") === "active");
  }, [users]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.date ||
      !formData.time ||
      !formData.location ||
      !formData.capacity
    ) {
      toast({
        title: "Missing Details",
        description: "Please complete every required field before publishing.",
        variant: "destructive",
      });
      return;
    }

    // If coordinators exist, require admin to assign one so the coordinator can manage attendance.
    if (coordinators.length > 0 && !formData.coordinatorId) {
      toast({
        title: "Coordinator Required",
        description: "Please assign a coordinator for this activity.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createActivity({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
        time: formData.time,
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
        coordinatorId: formData.coordinatorId || undefined,
      });

      toast({
        title: "Activity Published",
        description: "Your activity is now visible to students and coordinators.",
      });

      navigate("/admin/activities");
    } catch (err: any) {
      toast({
        title: "Publish Failed",
        description: err?.message || "Failed to publish activity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">
               <ShieldCheck className="w-4 h-4" />
               Admin Action
            </div>
            <h1 className="text-2xl font-bold">Publish Strategic Activity</h1>
            <p className="text-muted-foreground">
               Spin up university-wide workshops, seminars, or urgent make-up sessions without waiting on coordinators.
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsCreatingCategory(true)}
            className="shrink-0"
          >
            + New Category
          </Button>
        </div>

        {/* New Category Dialog */}
        {isCreatingCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setIsCreatingCategory(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">Create New Category</h2>
              <Input
                placeholder="Enter category name (e.g. Hackathon)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  className="flex-1"
                  disabled={!newCategoryName.trim() || isLoading}
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    setIsLoading(true);
                    try {
                      await categoriesApi.create(newCategoryName.trim());
                      await fetchCategories();
                      toast({ title: "Category Created", description: `"${newCategoryName.trim()}" has been added.` });
                      setNewCategoryName("");
                      setIsCreatingCategory(false);
                    } catch (error) {
                      toast({ title: "Failed", description: "Could not create category.", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  {isLoading ? "Creating..." : "Create"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Activity Blueprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="title">Activity Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. University Innovation Forum"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                     id="description"
                     name="description"
                     placeholder="Outline the purpose, speakers, and outcomes for this activity..."
                     value={formData.description}
                     onChange={handleChange}
                     rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="extracurricular">Extracurricular</SelectItem>
                      {categories
                        .filter(cat => !["workshop", "seminar", "training", "extracurricular"].includes(cat.name.toLowerCase()))
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.name} className="capitalize">{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign Coordinator {coordinators.length > 0 ? "*" : ""}</Label>
                  <Select
                    value={formData.coordinatorId}
                    onValueChange={(value) => setFormData({ ...formData, coordinatorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          coordinators.length > 0 ? "Select coordinator" : "No coordinators available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinators.map((coord) => (
                        <SelectItem key={coord.id} value={coord.id}>
                          {coord.name} ({coord.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date *
                  </Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time *
                  </Label>
                  <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Main Auditorium, Virtual Link, etc"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Capacity *
                  </Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Target attendees"
                    value={formData.capacity}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 lg:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:flex-1"
                    onClick={() => navigate("/admin/activities")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="sm:flex-1" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Publishing..." : "Publish Activity"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCreateActivity;
