import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Save,
  ShieldCheck,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Send,
  Eye,
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
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import { API } from "@/constants/api";

const API_BASE = API.BASE_URL.replace(/\/api\/?$/, "");

import StepIndicator from "@/components/admin/StepIndicator";
import MapPicker from "@/components/admin/MapPicker";
import ImageUploader from "@/components/admin/ImageUploader";
import RequirementsEditor, { Requirement } from "@/components/admin/RequirementsEditor";
import QuestionBuilder, { Question } from "@/components/admin/QuestionBuilder";
import RecurrenceConfig, { Recurrence } from "@/components/admin/RecurrenceConfig";
import ActivityPreview from "@/components/admin/ActivityPreview";

const STEPS = [
  { label: "Basic Info", description: "Title, category, coordinator" },
  { label: "Schedule & Location", description: "Date, time, map, capacity" },
  { label: "Requirements", description: "Prerequisites for students" },
  { label: "Questions", description: "Application questions" },
  { label: "Review & Publish", description: "Preview and submit" },
];

const AdminCreateActivity = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const { activities, createActivity, publishActivity, updateActivity, deleteCategory } = useActivity();
  const { users, refreshUsers } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    coordinatorId: "",
    imageUrl: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recurrence, setRecurrence] = useState<Recurrence>({
    enabled: false,
    pattern: "weekly",
    interval: 1,
    count: 4,
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  useEffect(() => {
    refreshUsers();
    fetchCategories();
  }, [refreshUsers]);

  // Load existing activity data when in edit mode
  useEffect(() => {
    if (!editId) return;
    const activity = activities.find((a) => a.id === editId);
    if (!activity) return;

    setFormData({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: activity.date,
      time: convertTimeToInput(activity.time),
      location: activity.location,
      capacity: activity.capacity.toString(),
      coordinatorId: activity.coordinatorId || "",
      imageUrl: activity.imageUrl || "",
      latitude: activity.latitude ?? null,
      longitude: activity.longitude ?? null,
    });

    if (activity.requirements) {
      setRequirements(activity.requirements.map((r) => ({
        type: r.type,
        label: r.label,
        value: r.value,
        isRequired: r.isRequired,
      })));
    }

    if (activity.questions) {
      setQuestions(activity.questions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        isRequired: q.isRequired,
        displayOrder: q.displayOrder,
      })));
    }

    if (activity.recurrencePattern) {
      try {
        const rp = JSON.parse(activity.recurrencePattern);
        setRecurrence({
          enabled: true,
          pattern: rp.type || "weekly",
          interval: rp.interval || 1,
          count: rp.count || 4,
        });
      } catch {}
    }
  }, [editId, activities]);

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

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch {
      toast({ title: "Error", description: "Failed to load categories.", variant: "destructive" });
    }
  };

  const customCategories = useMemo(
    () => categories.filter((cat) => !["workshop", "seminar", "training", "extracurricular"].includes(cat.name.toLowerCase())),
    [categories]
  );

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setDeletingCategoryId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      if (formData.category === name) {
        setFormData((prev) => ({ ...prev, category: "" }));
      }
      toast({ title: "Category Deleted", description: `"${name}" has been removed.` });
    } catch (error) {
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Could not delete category.", variant: "destructive" });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const coordinators = useMemo(() => {
    return (users ?? []).filter((u) => u.role === ROLES.COORDINATOR && (u.status ?? USER_STATUS.ACTIVE) === USER_STATUS.ACTIVE);
  }, [users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category);
      case 2:
        return !!(formData.date && formData.time && formData.location && formData.capacity);
      case 3:
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const uploadImageForActivity = async (activityId: string, file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/api/activities/${activityId}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      return d.imageUrl as string;
    } catch {
      return null;
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      if (isEditMode && editId) {
        await updateActivity(editId, buildPayload(true));
        if (pendingImageFile) {
          await uploadImageForActivity(editId, pendingImageFile);
          setPendingImageFile(null);
        }
        toast({ title: "Activity Updated", description: "Your changes have been saved." });
      } else {
        const activity = await createActivity(buildPayload(true));
        if (pendingImageFile && activity?.id) {
          await uploadImageForActivity(activity.id, pendingImageFile);
          setPendingImageFile(null);
        }
        toast({ title: "Draft Saved", description: "Your activity has been saved as a draft." });
      }
      navigate(ROUTES.ADMIN.ACTIVITIES);
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (coordinators.length > 0 && !formData.coordinatorId) {
      toast({ title: "Coordinator Required", description: "Please assign a coordinator.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (isEditMode && editId) {
        await updateActivity(editId, buildPayload(false));
        if (pendingImageFile) {
          await uploadImageForActivity(editId, pendingImageFile);
          setPendingImageFile(null);
        }
        toast({ title: "Activity Updated", description: "Your activity is now visible to students." });
      } else {
        const activity = await createActivity(buildPayload(false));
        if (pendingImageFile && activity?.id) {
          await uploadImageForActivity(activity.id, pendingImageFile);
          setPendingImageFile(null);
        }
        toast({ title: "Activity Published", description: "Your activity is now visible to students." });
      }
      navigate(ROUTES.ADMIN.ACTIVITIES);
    } catch (err: any) {
      toast({ title: "Publish Failed", description: err?.message || "Failed to publish", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const buildPayload = (isDraft: boolean) => ({
    title: formData.title.trim(),
    description: formData.description.trim(),
    category: formData.category,
    date: formData.date,
    time: formData.time,
    location: formData.location.trim(),
    capacity: Number(formData.capacity),
    coordinatorId: formData.coordinatorId || undefined,
    latitude: formData.latitude || undefined,
    longitude: formData.longitude || undefined,
    isDraft,
    recurrencePattern: recurrence.enabled
      ? JSON.stringify({
          type: recurrence.pattern,
          interval: recurrence.interval,
          count: recurrence.count,
        })
      : undefined,
    requirements: requirements.length > 0 ? requirements : undefined,
    questions: questions.length > 0 ? questions : undefined,
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. University Innovation Forum"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      .filter((cat) => !["workshop", "seminar", "training", "extracurricular"].includes(cat.name.toLowerCase()))
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.name} className="capitalize">
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => setIsCreatingCategory(true)}
                >
                  + Manage Categories
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Assign Coordinator {coordinators.length > 0 ? "*" : ""}</Label>
                <Select
                  value={formData.coordinatorId}
                  onValueChange={(value) => setFormData({ ...formData, coordinatorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={coordinators.length > 0 ? "Select coordinator" : "No coordinators available"} />
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
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Users className="w-4 h-4" /> Capacity *
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
            <ImageUploader
              activityId={editId}
              currentImageUrl={formData.imageUrl}
              onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
              onFileReady={(file) => setPendingImageFile(file)}
            />
            <RecurrenceConfig recurrence={recurrence} onChange={setRecurrence} />
          </div>
        );
      case 3:
        return <RequirementsEditor requirements={requirements} onChange={setRequirements} />;
      case 4:
        return <QuestionBuilder questions={questions} onChange={setQuestions} />;
      case 5:
        return (
          <ActivityPreview
            title={formData.title}
            description={formData.description}
            category={formData.category}
            date={formData.date}
            time={formData.time}
            location={formData.location}
            imageUrl={formData.imageUrl}
            requirements={requirements}
            questions={questions}
            recurrenceEnabled={recurrence.enabled}
            recurrenceCount={recurrence.count}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              Admin Action
            </div>
            <h1 className="text-2xl font-bold">{isEditMode ? "Edit Activity" : "Publish Strategic Activity"}</h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Update the activity details, requirements, and questions."
                : "Spin up university-wide workshops, seminars, or urgent make-up sessions without waiting on coordinators."}
            </p>
          </div>
        </div>

        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Step {currentStep}: {STEPS[currentStep - 1].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => (currentStep === 1 ? navigate(ROUTES.ADMIN.ACTIVITIES) : setCurrentStep((s) => s - 1))}
            className="transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex gap-3">
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isLoading} className="transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Draft"}
                </Button>
              </motion.div>
            )}
            {currentStep < 5 ? (
              <Button type="button" onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed(currentStep)} className="transition-all hover:scale-[1.02] active:scale-[0.98]">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handlePublish} disabled={isLoading} className="transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? "Publishing..." : "Publish Activity"}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Category Management Dialog */}
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
              <h2 className="text-lg font-semibold mb-4">Manage Categories</h2>
              {customCategories.length > 0 && (
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-muted-foreground mb-2">Existing categories:</p>
                  {customCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-1.5">
                      <span className="text-sm capitalize">{cat.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingCategoryId !== null || isLoading}
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-2">Add new category:</p>
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
                  disabled={!newCategoryName.trim() || isLoading || deletingCategoryId !== null}
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
                      toast({ title: "Failed", description: error instanceof Error ? error.message : "Could not create category.", variant: "destructive" });
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
      </div>
    </DashboardLayout>
  );
};

export default AdminCreateActivity;
