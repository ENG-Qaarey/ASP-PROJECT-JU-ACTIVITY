import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Repeat, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface Recurrence {
  enabled: boolean;
  pattern: string;
  interval: number;
  count: number;
}

interface RecurrenceConfigProps {
  recurrence: Recurrence;
  onChange: (r: Recurrence) => void;
}

const RecurrenceConfig = ({ recurrence, onChange }: RecurrenceConfigProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Repeat className="w-4 h-4 text-muted-foreground" />
        Recurring Activity
      </Label>
      <Switch checked={recurrence.enabled} onCheckedChange={(v) => onChange({ ...recurrence, enabled: v })} />
    </div>

    {recurrence.enabled && (
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pattern</span>
          <Select value={recurrence.pattern} onValueChange={(v) => onChange({ ...recurrence, pattern: v })}>
            <SelectTrigger className="h-8 text-xs border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Every</span>
          <div className="flex items-center gap-1">
            <Input type="number" min="1" max="52" value={recurrence.interval}
              onChange={(e) => onChange({ ...recurrence, interval: parseInt(e.target.value) || 1 })}
              className="h-8 text-sm" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">× {recurrence.pattern === "weekly" ? "wk" : recurrence.pattern === "biweekly" ? "2wk" : "mo"}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Sessions</span>
          <Input type="number" min="2" max="52" value={recurrence.count}
            onChange={(e) => onChange({ ...recurrence, count: parseInt(e.target.value) || 2 })}
            className="h-8 text-sm" />
        </div>
      </div>
    )}

    {recurrence.enabled && (
      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
        <CalendarDays className="w-3 h-3" />
        This will create {recurrence.count} activity instances
        ({recurrence.pattern}, {recurrence.interval > 1 ? `every ${recurrence.interval} ` : ""}{recurrence.pattern.replace("bi", "bi-")})
      </p>
    )}
  </div>
);

export default RecurrenceConfig;
