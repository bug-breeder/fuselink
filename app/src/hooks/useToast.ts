import { useToast as useHeroUIToast } from '@heroui/toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const { toast } = useHeroUIToast();

  const showToast = (options: ToastOptions) => {
    const { title, description, variant = 'default', duration = 5000, action } = options;

    // Map our variant to HeroUI toast types
    const toastVariant = variant === 'destructive' ? 'danger' : 
                        variant === 'success' ? 'success' :
                        variant === 'warning' ? 'warning' : 'default';

    toast({
      title,
      description,
      variant: toastVariant,
      duration,
      action: action ? {
        label: action.label,
        onPress: action.onClick,
      } : undefined,
    });
  };

  const success = (title: string, description?: string) => {
    showToast({ title, description, variant: 'success' });
  };

  const error = (title: string, description?: string) => {
    showToast({ title, description, variant: 'destructive' });
  };

  const warning = (title: string, description?: string) => {
    showToast({ title, description, variant: 'warning' });
  };

  const info = (title: string, description?: string) => {
    showToast({ title, description, variant: 'default' });
  };

  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
  };
}