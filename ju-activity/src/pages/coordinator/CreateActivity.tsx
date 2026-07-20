import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Save,
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

const CreateActivity = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const { activities, createActivity, updateActivity } = useActivity();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
  });

  // Load existing activity when editing
  useEffect(() => {
    if (!editId) return;
    const activity = activities.find((a) => a.id === editId);
    if (!activity) return;

    const timeMatch = activity.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let timeValue = activity.time;
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2];
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      timeValue = `${hours.toString().padStart(2, "0")}:${minutes}`;
    }

    setFormData({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: activity.date.includes("T") ? activity.date.split("T")[0] : activity.date,
      time: timeValue,
      location: activity.location,
      capacity: activity.capacity.toString(),
    });
  }, [editId, activities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category || !formData.date || !formData.time || !formData.location || !formData.capacity) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as any,
        date: formData.date,
        time: convertTimeToDisplay(formData.time),
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
      };

      if (isEditMode && editId) {
        await updateActivity(editId, payload);
        toast({ title: "Activity Updated!", description: "Your changes have been saved." });
      } else {
        await createActivity(payload);
        toast({ title: "Activity Created!", description: "Your activity has been published successfully." });
      }

      navigate(ROUTES.COORDINATOR.ACTIVITIES);
    } catch (err: any) {
      toast({ title: isEditMode ? "Update Failed" : "Create Failed", description: err?.message || "Failed to save activity", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? "Edit Activity" : "Create New Activity"}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Update the activity details below." : "Fill in the details to create a new activity for students"}
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {isEditMode ? "Edit Details" : "Activity Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Activity Title *</Label>
                  <Input id="title" name="title" placeholder="Enter activity title" value={formData.title} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" name="description" placeholder="Describe the activity in detail..." value={formData.description} onChange={handleChange} rows={4} />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="training">Training Program</SelectItem>
                      <SelectItem value="extracurricular">Extracurricular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Date *
                    </Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Time *
                    </Label>
                    <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location *
                  </Label>
                  <Input id="location" name="location" placeholder="Enter venue or room" value={formData.location} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Maximum Capacity *
                  </Label>
                  <Input id="capacity" name="capacity" type="number" min="1" placeholder="Enter maximum number of participants" value={formData.capacity} onChange={handleChange} />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(ROUTES.COORDINATOR.ACTIVITIES)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Activity")}
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

export default CreateActivity;
