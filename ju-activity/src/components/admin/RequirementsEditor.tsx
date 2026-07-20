import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CheckCircle2, Building2, GraduationCap, BookOpen, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { API } from "@/constants/api";

const API_BASE = API.BASE_URL.replace(/\/api\/?$/, "");

export interface Requirement {
  type: string;
  label: string;
  value: string;
  isRequired: boolean;
}

interface RequirementsEditorProps {
  requirements: Requirement[];
  onChange: (requirements: Requirement[]) => void;
}

const DEPARTMENTS = [
  "Computer Science", "Engineering", "Business Administration", "Medicine",
  "Law", "Education", "Arts and Sciences", "Architecture", "Pharmacy", "Nursing",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+"];

const icons: Record<string, typeof Building2> = {
  department: Building2,
  yearLevel: GraduationCap,
  gpaMin: BookOpen,
  customText: FileText,
};

const RequirementsEditor = ({ requirements, onChange }: RequirementsEditorProps) => {
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => d.length && setDepartments(d.map((x: any) => x.name)))
      .catch(() => {});
  }, []);

  const add = (type: string) => {
    const defaults: Record<string, { label: string; value: string }> = {
      department: { label: "Department Filter", value: "[]" },
      yearLevel: { label: "Year Level", value: "[]" },
      gpaMin: { label: "Minimum GPA", value: "2.0" },
      customText: { label: "Custom Requirement", value: "" },
    };
    const d = defaults[type];
    onChange([...requirements, { type, label: d.label, value: d.value, isRequired: true }]);
  };

  const update = (i: number, u: Partial<Requirement>) =>
    onChange(requirements.map((r, idx) => (idx === i ? { ...r, ...u } : r)));

  const remove = (i: number) => onChange(requirements.filter((_, idx) => idx !== i));

  const renderEditor = (req: Requirement, i: number) => {
    if (req.type === "department") {
      const sel: string[] = (() => { try { return JSON.parse(req.value || "[]"); } catch { return []; } })();
      return (
        <div className="flex flex-wrap gap-1.5">
          {departments.map((d) => (
            <button key={d} type="button" onClick={() => {
              const next = sel.includes(d) ? sel.filter((x) => x !== d) : [...sel, d];
              update(i, { value: JSON.stringify(next) });
            }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-200 ${
                sel.includes(d)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >{d}</button>
          ))}
        </div>
      );
    }
    if (req.type === "yearLevel") {
      const sel: string[] = (() => { try { return JSON.parse(req.value || "[]"); } catch { return []; } })();
      return (
        <div className="flex flex-wrap gap-1.5">
          {YEAR_LEVELS.map((y) => (
            <button key={y} type="button" onClick={() => {
              const next = sel.includes(y) ? sel.filter((x) => x !== y) : [...sel, y];
              update(i, { value: JSON.stringify(next) });
            }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-200 ${
                sel.includes(y)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >{y}</button>
          ))}
        </div>
      );
    }
    if (req.type === "gpaMin") {
      return (
        <div className="flex items-center gap-2">
          <Input type="number" min="0" max="4" step="0.1" value={req.value}
            onChange={(e) => update(i, { value: e.target.value })}
            className="w-24 h-8 text-sm" placeholder="2.0" />
          <span className="text-xs text-muted-foreground">out of 4.0</span>
        </div>
      );
    }
    return (
      <Textarea value={req.value} rows={2} className="text-sm resize-none"
        onChange={(e) => update(i, { value: e.target.value })}
        placeholder="Describe the requirement..." />
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Requirements & Prerequisites</Label>
        <p className="text-xs text-muted-foreground mt-0.5">Restrict who can apply to this activity.</p>
      </div>

      <AnimatePresence initial={false}>
        {requirements.map((req, i) => {
          const Icon = icons[req.type] || CheckCircle2;
          return (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="border rounded-lg p-3 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Select value={req.type} onValueChange={(v) => {
                  const labels: Record<string, string> = { department: "Department Filter", yearLevel: "Year Level", gpaMin: "Minimum GPA", customText: "Custom Requirement" };
                  const vals: Record<string, string> = { department: "[]", yearLevel: "[]", gpaMin: "2.0", customText: "" };
                  update(i, { type: v, label: labels[v], value: vals[v] });
                }}>
                  <SelectTrigger className="h-7 w-[160px] text-xs border-0 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="yearLevel">Year Level</SelectItem>
                    <SelectItem value="gpaMin">Min GPA</SelectItem>
                    <SelectItem value="customText">Custom Text</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${req.isRequired ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {req.isRequired ? "Required" : "Optional"}
                </span>
                <Switch checked={req.isRequired} onCheckedChange={(v) => update(i, { isRequired: v })} />
                <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {renderEditor(req, i)}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="flex flex-wrap gap-1.5">
        {[
          { type: "department", icon: Building2, label: "Department" },
          { type: "yearLevel", icon: GraduationCap, label: "Year Level" },
          { type: "gpaMin", icon: BookOpen, label: "GPA" },
          { type: "customText", icon: FileText, label: "Custom" },
        ].map(({ type, icon: I, label }) => (
          <button key={type} type="button" onClick={() => add(type)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200"
          ><Plus className="w-3 h-3" />{label}</button>
        ))}
      </div>
    </div>
  );
};

export default RequirementsEditor;
