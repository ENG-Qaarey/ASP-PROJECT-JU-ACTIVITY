import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        className:
          "!rounded-xl !shadow-lg !p-3 !text-xs !backdrop-blur-xl !border-l-4 \
          !bg-gradient-to-br !from-white !to-sky-50 dark:!from-gray-900 dark:!to-sky-950/30 \
          !text-foreground !border !border-white/30 dark:!border-white/10",
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
