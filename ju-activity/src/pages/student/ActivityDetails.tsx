import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import { activitiesApi, applicationsApi } from "@/lib/api";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import { ACTIVITY_STATUS } from "@/constants/status";
import { API } from "@/constants/api";

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
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getActivityById, getApplicationsByStudent, refreshData } = useActivity();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);
  const [activity, setActivity] = useState<any | null | undefined>(undefined);

  const formatDate = (value: string) => {
    if (!value) return value;
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  useEffect(() => {
    if (!id) {
      setActivity(null);
      return;
    }

    const fromContext = getActivityById(id);
    if (fromContext) {
      setActivity(fromContext);
      return;
    }

    let cancelled = false;
    setActivity(undefined);
    activitiesApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch(() => {
        if (!cancelled) setActivity(null);
      });

    return () => {
      cancelled = true;
    };
  }, [getActivityById, id]);

  if (activity === undefined) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Loading activity...</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (!activity) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Activity not found</h2>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(ROUTES.STUDENT.ACTIVITIES)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      workshop: "bg-primary/10 text-primary",
      seminar: "bg-secondary text-secondary-foreground",
      training: "bg-success/10 text-success",
      extracurricular: "bg-warning/10 text-warning",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const validateRequirements = (): string | null => {
    if (!activity?.requirements) return null;
    for (const req of activity.requirements) {
      if (!req.isRequired) continue;
      if (req.type === "department") {
        const allowedDepts: string[] = (() => {
          try { return JSON.parse(req.value || "[]"); } catch { return []; }
        })();
        if (allowedDepts.length > 0 && user?.department && !allowedDepts.includes(user.department)) {
          return `This activity requires you to be from: ${allowedDepts.join(", ")}`;
        }
      }
      if (req.type === "yearLevel") {
        // Year level validation would need student year info
      }
      if (req.type === "gpaMin") {
        // GPA validation would need student GPA info
      }
      if (req.type === "customText" && req.value) {
        // Custom text requirements are acknowledged by applying
      }
    }
    return null;
  };

  const handleApply = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to apply.", variant: "destructive" });
      return;
    }
    if (!activity?.id) {
      toast({ title: "Activity not available", description: "Please try again.", variant: "destructive" });
      return;
    }
    if (activity?.status === ACTIVITY_STATUS.COMPLETED) {
      toast({ title: "Activity completed", description: "This activity is completed.", variant: "destructive" });
      return;
    }

    const reqError = validateRequirements();
    if (reqError) {
      toast({ title: "Requirements not met", description: reqError, variant: "destructive" });
      return;
    }

    if (activity?.questions) {
      for (const q of activity.questions) {
        if (q.isRequired && (!answers[q.id] || answers[q.id].trim() === "")) {
          toast({ title: "Question required", description: `Please answer: ${q.questionText}`, variant: "destructive" });
          return;
        }
      }
    }

    setIsApplying(true);
    try {
      const answerPayload = Object.entries(answers)
        .filter(([_, val]) => val && val.trim())
        .map(([questionId, answer]) => ({ activityQuestionId: questionId, answer }));

      await applicationsApi.create({
        activityId: activity.id,
        activityTitle: activity.title,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(answerPayload.length > 0 ? { answers: answerPayload } : {}),
      });

      await refreshData();
      setShowApplyDialog(false);
      setNotes("");
      setAnswers({});

      toast({ title: "Application Submitted!", description: "Your application has been submitted successfully." });
      navigate(ROUTES.STUDENT.APPLICATIONS);
    } catch (error: any) {
      toast({ title: "Application failed", description: error?.message || "Failed to submit", variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  const spotsRemaining = activity.capacity - activity.enrolled;
  const isFull = spotsRemaining <= 0;
  const hasApplied = Boolean(user && activity?.id && getApplicationsByStudent(user.id).some((a) => a.activityId === activity.id));
  const isCompleted = activity?.status === ACTIVITY_STATUS.COMPLETED;
  const requirements = activity?.requirements || [];
  const questions = activity?.questions || [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => {
            if (user?.role === ROLES.ADMIN) navigate(ROUTES.ADMIN.ACTIVITIES);
            else if (user?.role === ROLES.COORDINATOR) navigate(ROUTES.COORDINATOR.ACTIVITIES);
            else navigate(ROUTES.STUDENT.ACTIVITIES);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Activities
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 capitalize ${getCategoryColor(activity.category)}`}>
                    {activity.category}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold">{activity.title}</h1>
                  {activity.coordinatorName && (
                    <p className="text-muted-foreground mt-1">by {activity.coordinatorName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isFull ? (
                    <span className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive font-medium">Fully Booked</span>
                  ) : (
                    <span className="px-4 py-2 rounded-xl bg-success/10 text-success font-medium">{spotsRemaining} spots left</span>
                  )}
                </div>
              </div>

              <img src={resolveImageUrl(activity.imageUrl, activity.category)} alt={activity.title} className="w-full h-64 object-cover rounded-xl mb-6" />

              <p className="text-muted-foreground text-lg mb-8">{activity.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(activity.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-semibold">{activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{activity.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinator</p>
                    <p className="font-semibold">{activity.coordinatorName}</p>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {requirements.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Requirements
                  </h3>
                  <div className="space-y-2">
                    {requirements.map((req: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Badge variant={req.isRequired ? "default" : "secondary"} className="text-xs">
                          {req.isRequired ? "Required" : "Optional"}
                        </Badge>
                        <span className="text-sm">{req.label}</span>
                        {req.type === "gpaMin" && <span className="text-xs text-muted-foreground">(GPA {'≥'} {req.value})</span>}
                        {req.type === "department" && (() => {
                          try {
                            const depts = JSON.parse(req.value || "[]");
                            return depts.length > 0 && <span className="text-xs text-muted-foreground">({depts.join(", ")})</span>;
                          } catch { return null; }
                        })()}
                        {req.type === "yearLevel" && (() => {
                          try {
                            const years = JSON.parse(req.value || "[]");
                            return years.length > 0 && <span className="text-xs text-muted-foreground">({years.join(", ")})</span>;
                          } catch { return null; }
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capacity Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Enrollment Progress
                  </span>
                  <span className="text-sm font-medium">{activity.enrolled}/{activity.capacity}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${(activity.enrolled / activity.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {user?.role === ROLES.STUDENT && (
                <Button
                  size="lg"
                  className="w-full md:w-auto"
                  disabled={isFull || hasApplied || isCompleted}
                  onClick={() => {
                    if (isCompleted) {
                      toast({ title: "Activity completed", description: "This activity is completed.", variant: "destructive" });
                      return;
                    }
                    setShowApplyDialog(true);
                  }}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isCompleted ? "Activity Completed" : hasApplied ? "Already Applied" : "Apply for this Activity"}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Apply Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apply for Activity</DialogTitle>
              <DialogDescription>Submit your application for "{activity.title}"</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="bg-muted/50 border-0">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Your Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {user?.name}</p>
                    <p><span className="text-muted-foreground">Student ID:</span> {user?.studentId}</p>
                    <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
                    {user?.department && <p><span className="text-muted-foreground">Department:</span> {user.department}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements Acknowledgment */}
              {requirements.filter((r: any) => r.isRequired && r.type === "customText" && r.value).length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Requirements to Acknowledge
                  </Label>
                  {requirements
                    .filter((r: any) => r.isRequired && r.type === "customText" && r.value)
                    .map((req: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                        {req.label}: {req.value}
                      </div>
                    ))}
                </div>
              )}

              {/* Questions */}
              {questions.length > 0 && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <HelpCircle className="w-4 h-4" />
                    Application Questions
                  </Label>
                  {questions.map((q: any) => (
                    <div key={q.id} className="space-y-2">
                      <Label className="text-sm">
                        {q.questionText}
                        {q.isRequired && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {q.questionType === "yesno" && (
                        <RadioGroup
                          value={answers[q.id] || ""}
                          onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Yes" id={`${q.id}-yes`} />
                              <Label htmlFor={`${q.id}-yes`}>Yes</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="No" id={`${q.id}-no`} />
                              <Label htmlFor={`${q.id}-no`}>No</Label>
                            </div>
                          </div>
                        </RadioGroup>
                      )}
                      {q.questionType === "multiplechoice" && (() => {
                        const options = (q.options || "").split("\n").filter((o: string) => o.trim());
                        return (
                          <RadioGroup
                            value={answers[q.id] || ""}
                            onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                          >
                            <div className="space-y-2">
                              {options.map((opt: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                  <RadioGroupItem value={opt.trim()} id={`${q.id}-${i}`} />
                                  <Label htmlFor={`${q.id}-${i}`}>{opt.trim()}</Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        );
                      })()}
                      {q.questionType === "freetext" && (
                        <Textarea
                          placeholder="Type your answer..."
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          rows={3}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information you'd like to share..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
              <Button onClick={handleApply} disabled={isApplying || hasApplied || isCompleted}>
                {isApplying ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ActivityDetails;
