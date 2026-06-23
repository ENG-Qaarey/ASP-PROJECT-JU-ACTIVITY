import { useEffect, useState } from "react";
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
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ConnectionError() {
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { backendIsDown } = useAuth();

  // Open the dialog when the backend goes down
  useEffect(() => {
    if (backendIsDown) {
      setOpen(true);
    }
  }, [backendIsDown]);

  // Close the dialog when the backend is back up
  useEffect(() => {
    if (!backendIsDown && open) {
      setOpen(false);
    }
  }, [backendIsDown, open]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await authApi.me();
    } catch {
      // Still down -- the dialog stays open
    } finally {
      setRetrying(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Network Error
          </AlertDialogTitle>
          <AlertDialogDescription className="flex items-center gap-2">
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Unable to connect to the server. We're trying to reconnect...
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={handleRetry} disabled={retrying}>
            {retrying ? "Retrying..." : "Retry Now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
