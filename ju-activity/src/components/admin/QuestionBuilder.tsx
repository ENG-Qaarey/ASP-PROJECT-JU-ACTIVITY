import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, GripVertical, ArrowUp, ArrowDown, HelpCircle, CheckSquare, List, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Question {
  questionText: string;
  questionType: string;
  options: string;
  isRequired: boolean;
  displayOrder: number;
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

const typeMeta: Record<string, { icon: typeof HelpCircle; label: string }> = {
  yesno: { icon: CheckSquare, label: "Yes / No" },
  multiplechoice: { icon: List, label: "Multiple Choice" },
  freetext: { icon: Type, label: "Free Text" },
};

const QuestionBuilder = ({ questions, onChange }: QuestionBuilderProps) => {
  const parseOptions = (raw: string): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  };

  const serializeOptions = (opts: string[]) => JSON.stringify(opts);

  const add = () => {
    onChange([...questions, { questionText: "", questionType: "yesno", options: "", isRequired: true, displayOrder: questions.length }]);
  };

  const update = (i: number, u: Partial<Question>) =>
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...u } : q)));

  const remove = (i: number) =>
    onChange(questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, displayOrder: idx })));

  const move = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= questions.length) return;
    const arr = [...questions];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr.map((q, idx) => ({ ...q, displayOrder: idx })));
  };

  const addOption = (qi: number) => {
    const opts = parseOptions(questions[qi].options);
    opts.push(`Option ${opts.length + 1}`);
    update(qi, { options: serializeOptions(opts) });
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    const opts = parseOptions(questions[qi].options);
    opts[oi] = val;
    update(qi, { options: serializeOptions(opts) });
  };

  const removeOption = (qi: number, oi: number) => {
    const opts = parseOptions(questions[qi].options);
    opts.splice(oi, 1);
    update(qi, { options: serializeOptions(opts) });
  };

  const initOptions = (qi: number) => {
    if (!questions[qi].options || questions[qi].options === "[]") {
      update(qi, { options: serializeOptions(["Option 1", "Option 2"]) });
    }
  };

  const optionLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Application Questions</Label>
        <p className="text-xs text-muted-foreground mt-0.5">Questions students must answer when applying.</p>
      </div>

      <AnimatePresence initial={false}>
        {questions.map((q, i) => {
          const meta = typeMeta[q.questionType] || typeMeta.yesno;
          const Icon = meta.icon;
          return (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="border rounded-lg p-3 space-y-2.5"
            >
              {/* Header row */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <button type="button" onClick={() => move(i, "up")} disabled={i === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => move(i, "down")} disabled={i === questions.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground">Q{i + 1}</span>
                <div className="flex-1" />
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${q.isRequired ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {q.isRequired ? "Required" : "Optional"}
                </span>
                <Switch checked={q.isRequired} onCheckedChange={(v) => update(i, { isRequired: v })} />
                <button type="button" onClick={() => remove(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Question text */}
              <Input value={q.questionText} placeholder="What do you want to ask?"
                onChange={(e) => update(i, { questionText: e.target.value })}
                className="h-8 text-sm border-0 bg-muted/40 focus-visible:bg-muted/60 placeholder:text-muted-foreground/50" />

              {/* Type + options */}
              <div className="space-y-2">
                <Select value={q.questionType} onValueChange={(v) => {
                  const defaults = v === "multiplechoice" ? serializeOptions(["Option 1", "Option 2"]) : "";
                  update(i, { questionType: v, options: defaults });
                  if (v === "multiplechoice") initOptions(i);
                }}>
                  <SelectTrigger className="h-7 w-[140px] text-xs border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesno">Yes / No</SelectItem>
                    <SelectItem value="multiplechoice">Multiple Choice</SelectItem>
                    <SelectItem value="freetext">Free Text</SelectItem>
                  </SelectContent>
                </Select>

                {q.questionType === "multiplechoice" && (
                  <div className="space-y-1.5 pl-1">
                    {parseOptions(q.options).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-1.5 group">
                        <span className="w-5 h-5 rounded-full border border-border/60 flex items-center justify-center text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                          {optionLabels[oi] || oi + 1}
                        </span>
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(i, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="h-7 text-xs border-0 bg-muted/40 focus-visible:bg-muted/60 placeholder:text-muted-foreground/40"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(i, oi)}
                          disabled={parseOptions(q.options).length <= 2}
                          className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 disabled:opacity-20 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(i)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-6"
                    >
                      <Plus className="w-3 h-3" />Add option
                    </button>
                  </div>
                )}

                {q.questionType === "yesno" && (
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">Students select Yes or No</span>
                )}
                {q.questionType === "freetext" && (
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">Students type a free-form answer</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <button type="button" onClick={add}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200"
      ><Plus className="w-3 h-3" />Add Question</button>
    </div>
  );
};

export default QuestionBuilder;
