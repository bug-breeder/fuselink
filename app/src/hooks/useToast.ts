import { addToast } from "@heroui/toast";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
}

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const {
      title,
      description,
      variant = "default",
      duration = 5000,
    } = options;

    // Map our variant to HeroUI toast types
    const toastVariant =
      variant === "destructive"
        ? "danger"
        : variant === "success"
          ? "success"
          : variant === "warning"
            ? "warning"
            : "default";

    addToast({
      title,
      description,
      color: toastVariant,
      timeout: duration,
    });
  };

  const success = (title: string, description?: string) => {
    showToast({ title, description, variant: "success" });
  };

  const error = (title: string, description?: string) => {
    showToast({ title, description, variant: "destructive" });
  };

  const warning = (title: string, description?: string) => {
    showToast({ title, description, variant: "warning" });
  };

  const info = (title: string, description?: string) => {
    showToast({ title, description, variant: "default" });
  };

  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
  };
}
