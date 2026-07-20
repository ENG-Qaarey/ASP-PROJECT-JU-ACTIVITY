import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Tag, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ActivityPreviewProps {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  imageUrl?: string | null;
  requirements?: any[];
  questions?: any[];
  recurrenceEnabled?: boolean;
  recurrenceCount?: number;
}

const ActivityPreview = ({
  title, description, category, date, time,
  location, imageUrl, requirements = [], questions = [], recurrenceEnabled, recurrenceCount,
}: ActivityPreviewProps) => {
  const cats = ["Workshop", "Seminar", "Community Service", "Social Event", "Academic"];
  const catColors: Record<string, string> = {
    Workshop: "bg-blue-100 text-blue-800", Seminar: "bg-purple-100 text-purple-800",
    "Community Service": "bg-green-100 text-green-800", "Social Event": "bg-pink-100 text-pink-800",
    Academic: "bg-amber-100 text-amber-800",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden border border-border/60 shadow-sm">
        {imageUrl && (
          <div className="h-48 overflow-hidden bg-muted">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-lg font-bold line-clamp-2">{title || "Activity Title"}</CardTitle>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {category && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${catColors[category] || "bg-gray-100 text-gray-800"}`}>
                {category}
              </span>
            )}
            {recurrenceEnabled && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Recurring ×{recurrenceCount}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5">
          {description && <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>}

          <div className="space-y-1.5">
            {date && <p className="text-xs flex items-center gap-2 text-muted-foreground"><Calendar className="w-3.5 h-3.5" />{date}</p>}
            {time && <p className="text-xs flex items-center gap-2 text-muted-foreground"><Clock className="w-3.5 h-3.5" />{time}</p>}
            {location && <p className="text-xs flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{location}</p>}
          </div>

          {requirements.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />Requirements ({requirements.length})
              </p>
              <div className="space-y-1">
                {requirements.map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                    <span className="font-medium">{r.label}</span>
                    <span className="mx-1.5 text-border">·</span>
                    <span>{r.type === "department" ? "Specific departments" : r.type === "yearLevel" ? "Specific years" : r.type === "gpaMin" ? `Min GPA: ${r.value}` : r.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3" />Application Questions ({questions.length})
              </p>
              <div className="space-y-1">
                {questions.map((q, i) => {
                  let optDisplay = "";
                  if (q.questionType === "multiplechoice" && q.options) {
                    try {
                      const parsed = JSON.parse(q.options);
                      if (Array.isArray(parsed)) optDisplay = ` (${parsed.join(", ")})`;
                    } catch {
                      optDisplay = ` (${q.options.replace(/\n/g, ", ")})`;
                    }
                  }
                  return (
                    <div key={i} className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                      <span className="font-medium">Q{i + 1}:</span> {q.questionText || "—"}
                      <span className="text-border mx-1.5">·</span>
                      <span className="capitalize">{q.questionType === "yesno" ? "Yes/No" : q.questionType === "multiplechoice" ? "Multiple Choice" : "Free Text"}</span>
                      {optDisplay && <span className="text-muted-foreground/70">{optDisplay}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActivityPreview;
