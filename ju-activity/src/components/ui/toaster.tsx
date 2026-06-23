import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-0.5">
              {title && <ToastTitle className="text-xs font-semibold">{title}</ToastTitle>}
              {description && <ToastDescription className="text-[11px] opacity-80">{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose className="absolute right-1.5 top-1.5 p-0.5 opacity-60 hover:opacity-100" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
