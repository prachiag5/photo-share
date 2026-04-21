import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30s before background refetch
      gcTime: 5 * 60 * 1000,      // 5 min before garbage collected
      retry: 1,                   // retry failed requests once
      refetchOnWindowFocus: false, // don't refetch on tab switch (annoying for feeds)
    },
  },
});