import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  steps: Array<{ label: string; description?: string }>;
}

const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const n = index + 1;
        const done = n < currentStep;
        const active = n === currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: active ? 1 : 0.85,
                  opacity: done || active ? 1 : 0.4,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300 ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <motion.span
                  key={done ? "check" : "num"}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  {done ? <Check className="w-4 h-4" strokeWidth={2.5} /> : n}
                </motion.span>
              </motion.div>
              <motion.p
                initial={false}
                animate={{ opacity: active ? 1 : 0.5 }}
                className={`text-[11px] font-medium text-center leading-tight ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </motion.p>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 mb-5">
                <div className="h-[1px] bg-border relative overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 bg-primary origin-left"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
