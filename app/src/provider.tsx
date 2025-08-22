import type { NavigateOptions } from "react-router-dom";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  // Create a stable QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            retry: (failureCount, error) => {
              // Don't retry for 4xx errors
              if (error && typeof error === "object" && "status" in error) {
                const status = error.status as number;

                if (status >= 400 && status < 500) return false;
              }

              return failureCount < 3;
            },
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        {children}
        <ToastProvider />
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
