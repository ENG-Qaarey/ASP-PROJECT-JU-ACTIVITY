import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ShieldCheck,
  Settings,
  UserCog,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

interface RolePermission {
  id: string;
  label: string;
  category: string;
  granted: boolean;
  builtIn: boolean;
}

interface RoleData {
  id: string;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  color: string;
  bg: string;
  badgeClass: string;
  permissions: RolePermission[];
}

const STORAGE_KEY = "ju-roles-permissions";

const defaultPermissions: RolePermission[] = [
  { id: "users_view", label: "View user profiles", category: "users", granted: true, builtIn: true },
  { id: "users_manage", label: "Create, edit, and deactivate users", category: "users", granted: true, builtIn: true },
  { id: "users_roles", label: "Assign and revoke roles", category: "users", granted: true, builtIn: true },
  { id: "activities_browse", label: "Browse available activities", category: "activities", granted: true, builtIn: true },
  { id: "activities_create", label: "Create new activities", category: "activities", granted: true, builtIn: true },
  { id: "activities_edit_own", label: "Edit own activities", category: "activities", granted: true, builtIn: true },
  { id: "activities_edit_all", label: "Edit any activity", category: "activities", granted: true, builtIn: true },
  { id: "activities_delete", label: "Delete activities", category: "activities", granted: true, builtIn: true },
  { id: "applications_submit", label: "Submit applications", category: "applications", granted: true, builtIn: true },
  { id: "applications_review", label: "Review applications", category: "applications", granted: true, builtIn: true },
  { id: "applications_manage_all", label: "Manage all applications", category: "applications", granted: true, builtIn: true },
  { id: "attendance_view", label: "View attendance records", category: "attendance", granted: true, builtIn: true },
  { id: "attendance_manage", label: "Take and manage attendance", category: "attendance", granted: true, builtIn: true },
  { id: "chat_participate", label: "Chat in enrolled rooms", category: "chat", granted: true, builtIn: true },
  { id: "chat_manage", label: "Access all chat rooms", category: "chat", granted: true, builtIn: true },
  { id: "notifications_receive", label: "Receive notifications", category: "notifications", granted: true, builtIn: true },
  { id: "notifications_send", label: "Send notifications", category: "notifications", granted: true, builtIn: true },
  { id: "reports_view_own", label: "View own reports", category: "reports", granted: true, builtIn: true },
  { id: "reports_view_all", label: "View all reports", category: "reports", granted: true, builtIn: true },
  { id: "profile_manage", label: "Manage own profile", category: "profile", granted: true, builtIn: true },
  { id: "calendar_view", label: "View activity calendar", category: "activities", granted: true, builtIn: true },
  { id: "system_logs", label: "View system audit logs", category: "system", granted: true, builtIn: true },
  { id: "system_config", label: "Configure system settings", category: "system", granted: true, builtIn: true },
];

const defaultGranted: Record<string, string[]> = {
  admin: defaultPermissions.map((p) => p.id),
  coordinator: [
    "users_view",
    "activities_browse",
    "activities_create",
    "activities_edit_own",
    "applications_review",
    "attendance_view",
    "attendance_manage",
    "chat_participate",
    "chat_manage",
    "notifications_receive",
    "notifications_send",
    "reports_view_own",
    "profile_manage",
    "calendar_view",
  ],
  student: [
    "activities_browse",
    "applications_submit",
    "attendance_view",
    "chat_participate",
    "notifications_receive",
    "profile_manage",
    "calendar_view",
  ],
};

function buildRoles(perms: RolePermission[]): RoleData[] {
  return [
    {
      id: "admin",
      title: "Administrator",
      description: "Full system access. Manage users, activities, reports, and system configuration.",
      icon: Settings,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400",
      permissions: perms.map((p) => ({ ...p, granted: true })),
    },
    {
      id: "coordinator",
      title: "Coordinator",
      description: "Manage assigned activities, review applications, and take attendance.",
      icon: UserCog,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      permissions: perms.map((p) => ({ ...p, granted: defaultGranted.coordinator.includes(p.id) })),
    },
    {
      id: "student",
      title: "Student",
      description: "Browse activities, apply, track applications, and manage their profile.",
      icon: GraduationCap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      permissions: perms.map((p) => ({ ...p, granted: defaultGranted.student.includes(p.id) })),
    },
  ];
}

function loadSaved(): RoleData[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RoleData[];
  } catch {
    return null;
  }
}

function saveRoles(roles: RoleData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}

const categoryColors: Record<string, string> = {
  users: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  activities: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  applications: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  attendance: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  chat: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  notifications: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  reports: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  profile: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  system: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const roleIcons: Record<string, typeof ShieldCheck> = {
  admin: Settings,
  coordinator: UserCog,
  student: GraduationCap,
};

const allCategories = [
  "all",
  ...new Set(defaultPermissions.map((p) => p.category)),
];

const roleInfo = [
  { id: "admin", title: "Admin" },
  { id: "coordinator", title: "Coordinator" },
  { id: "student", title: "Student" },
];

let nextCustomId = Date.now();

const ManageRoles = () => {
  const [roles, setRoles] = useState<RoleData[]>(() => loadSaved() ?? buildRoles(defaultPermissions));
  const [filterCategory, setFilterCategory] = useState("all");
  const [editRole, setEditRole] = useState<RoleData | null>(null);
  const [editPermissions, setEditPermissions] = useState<RolePermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>(["admin", "coordinator", "student"]);

  useEffect(() => {
    saveRoles(roles);
  }, [roles]);

  const openEdit = (role: RoleData) => {
    setEditRole(role);
    setEditPermissions(role.permissions.map((p) => ({ ...p })));
  };

  const closeEdit = () => {
    setEditRole(null);
    setEditPermissions([]);
  };

  const togglePermission = (permId: string) => {
    setEditPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, granted: !p.granted } : p))
    );
  };

  const savePermissions = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setRoles((prev) =>
      prev.map((r) =>
        r.id === editRole?.id ? { ...r, permissions: editPermissions.map((p) => ({ ...p })) } : r
      )
    );
    setSaving(false);
    closeEdit();
    toast({ title: "Permissions updated", description: `${editRole?.title} permissions saved.` });
  };

  const deletePermission = (permId: string) => {
    setRoles((prev) =>
      prev.map((r) => ({
        ...r,
        permissions: r.permissions.filter((p) => p.id !== permId),
      }))
    );
    toast({ title: "Permission deleted", description: "The permission has been removed from all roles." });
  };

  const createPermission = () => {
    const label = newLabel.trim();
    if (!label) {
      toast({ title: "Missing label", description: "Enter a name for the permission.", variant: "destructive" });
      return;
    }
    if (!newCategory) {
      toast({ title: "Missing category", description: "Select a category.", variant: "destructive" });
      return;
    }
    if (newRoles.length === 0) {
      toast({ title: "No roles selected", description: "Assign at least one role.", variant: "destructive" });
      return;
    }

    const id = `custom_${nextCustomId++}_${label.toLowerCase().replace(/\s+/g, "_")}`;
    const perm: RolePermission = { id, label, category: newCategory, granted: true, builtIn: false };

    setRoles((prev) =>
      prev.map((r) => ({
        ...r,
        permissions: [
          ...r.permissions,
          { ...perm, granted: newRoles.includes(r.id) },
        ],
      }))
    );

    setNewLabel("");
    setNewCategory("");
    setNewRoles(["admin", "coordinator", "student"]);
    setCreateOpen(false);
    toast({ title: "Permission created", description: `"${label}" added and assigned to selected roles.` });
  };

  const toggleGranted = (roleId: string, permId: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? {
              ...r,
              permissions: r.permissions.map((p) =>
                p.id === permId ? { ...p, granted: !p.granted } : p
              ),
            }
          : r
      )
    );
  };

  const toggleNewRole = (roleId: string) => {
    setNewRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const groups = editPermissions.reduce<Record<string, RolePermission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const allPerms = roles[0]?.permissions || [];
  const totalGranted = roles.reduce((sum, r) => sum + r.permissions.filter((p) => p.granted).length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-[20px] border border-primary/10"
        >
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Manage Roles & Permissions
            </h2>
            <p className="text-muted-foreground mt-1">
              Define responsibilities for each portal role and keep permissions aligned with JU governance.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="hidden sm:flex rounded-xl bg-background/50 backdrop-blur-sm" onClick={() => setAuditOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Audit
            </Button>
            <Button variant="outline" className="hidden sm:flex rounded-xl bg-background/50 backdrop-blur-sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create permission
            </Button>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filterCategory === cat ? "default" : "outline"}
              onClick={() => setFilterCategory(cat)}
              className="rounded-[20px] capitalize"
            >
              {cat === "all" ? "All Permissions" : cat}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role, index) => {
            const Icon = roleIcons[role.id];
            const filteredPerms =
              filterCategory === "all"
                ? role.permissions
                : role.permissions.filter((p) => p.category === filterCategory);
            const grantedCount = role.permissions.filter((p) => p.granted).length;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-[20px] border border-muted/40 h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-12 h-12 rounded-[20px] ${role.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${role.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {grantedCount} / {role.permissions.length} granted
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                  </CardHeader>

                  <Separator />

                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="space-y-0 flex-1">
                      {filteredPerms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center gap-3 py-1.5 -mx-1 px-1 rounded-[10px] hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleGranted(role.id, perm.id)}
                        >
                          <Checkbox
                            id={`${role.id}-${perm.id}`}
                            checked={perm.granted}
                            onCheckedChange={() => toggleGranted(role.id, perm.id)}
                            className="flex-shrink-0"
                          />
                          <label
                            htmlFor={`${role.id}-${perm.id}`}
                            className={`text-sm cursor-pointer flex-1 leading-tight ${perm.granted ? "" : "text-muted-foreground line-through"}`}
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>

                    {filteredPerms.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-6">
                        No permissions in this category
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Card className="rounded-[20px] border border-muted/40 flex-1">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total granted permissions</p>
                  <p className="text-2xl font-bold">{totalGranted}</p>
                </div>
                {roles.map((role) => {
                  const Icon = roleIcons[role.id];
                  const count = role.permissions.filter((p) => p.granted).length;
                  return (
                    <div key={role.id} className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-[10px] ${role.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${role.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{role.title}</p>
                        <p className="text-xs text-muted-foreground">{count} / {role.permissions.length}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => {
            setRoles(buildRoles(defaultPermissions));
            toast({ title: "Defaults restored", description: "All permissions reset to factory defaults." });
          }} className="flex-shrink-0 gap-2 rounded-[20px]">
            <RefreshCw className="w-4 h-4" />
            Reset defaults
          </Button>
        </div>
      </div>

      {/* Edit permissions dialog */}
      <Dialog open={editRole !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Edit permissions — {editRole?.title}
            </DialogTitle>
            <DialogDescription>
              Toggle permissions on or off for this role. Custom permissions can be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {Object.entries(groups).map(([category, perms]) => {
              const grantedInGroup = perms.filter((p) => p.granted).length;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`capitalize ${categoryColors[category] || ""}`}>
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{grantedInGroup}/{perms.length}</span>
                  </div>
                  <div className="space-y-1">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between rounded-[10px] px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer flex-1">
                          {perm.label}
                          {!perm.builtIn && (
                            <span className="ml-2 text-xs text-muted-foreground italic">(custom)</span>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          {!perm.builtIn && (
                            <button
                              type="button"
                              onClick={() => {
                                closeEdit();
                                deletePermission(perm.id);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <Switch
                            id={`perm-${perm.id}`}
                            checked={perm.granted}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? <>Saving…</> : <><Save className="w-4 h-4 mr-2" />Save changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create permission dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-primary" />
              Create permission
            </DialogTitle>
            <DialogDescription>
              Add a new permission and assign it to roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="perm-label">Permission name</Label>
              <Input
                id="perm-label"
                placeholder="e.g. Export attendance reports"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.filter((c) => c !== "all").map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign to roles</Label>
              <div className="flex flex-col gap-2 mt-1">
                {roleInfo.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 cursor-pointer text-sm">
                    <Checkbox
                      checked={newRoles.includes(r.id)}
                      onCheckedChange={() => toggleNewRole(r.id)}
                    />
                    {r.title}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createPermission}>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit dialog */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-primary" />
              Permission audit
            </DialogTitle>
            <DialogDescription>
              Compare permissions across all roles side by side.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted/40">
                  <th className="text-left py-3 pr-4 font-medium">Permission</th>
                  {roles.map((role) => {
                    const Icon = roleIcons[role.id];
                    return (
                      <th key={role.id} className="text-center py-3 px-3 font-medium">
                        <div className="flex items-center justify-center gap-1.5">
                          <Icon className={`w-4 h-4 ${role.color}`} />
                          <span className="text-xs">{role.title}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allPerms.map((perm) => (
                  <tr key={perm.id} className="border-b border-muted/20">
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {perm.label}
                      {!perm.builtIn && <span className="ml-2 text-xs italic text-muted-foreground">(custom)</span>}
                    </td>
                    {roles.map((role) => {
                      const granted = role.permissions.find((p) => p.id === perm.id)?.granted;
                      return (
                        <td key={role.id} className="text-center py-2.5 px-3">
                          {granted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageRoles;
