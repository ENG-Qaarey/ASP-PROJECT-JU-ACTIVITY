import { useEffect, useMemo, useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError, addApiErrorHandler, authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Info = {
  title: string;
  description: string;
  canRetry: boolean;
};

function toInfo(error: ApiError): Info | null {
  if (error.status === 0) {
    return {
      title: "Network Error",
      description:
        "Unable to connect to the server. We're trying to reconnect...",
      canRetry: true,
    };
  }

  return null;
}

export default function ConnectionError() {
  const [open, setOpen] = useState(false);
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const [retrying, setRetrying] = useState(false);
  const { backendIsDown } = useAuth();

  const info = useMemo(() => {
    if (!lastError) return null;
    return toInfo(lastError);
  }, [lastError]);

  // Close the dialog automatically when backend is back up
  useEffect(() => {
    if (!backendIsDown && open) {
      setOpen(false);
      setLastError(null);
    }
  }, [backendIsDown, open]);

  useEffect(() => {
    const removeHandler = addApiErrorHandler((error) => {
      const mapped = toInfo(error);
      if (!mapped) return;
      setLastError(error);
      setOpen(true);
    });

    return () => removeHandler();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await authApi.me();
    } catch {
      // Still down — dialog stays open
    } finally {
      setRetrying(false);
    }
  };

  if (!info) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {info.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="flex items-center gap-2">
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {info.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {info.canRetry ? (
            <AlertDialogAction onClick={handleRetry} disabled={retrying}>
              {retrying ? "Retrying..." : "Retry Now"}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
