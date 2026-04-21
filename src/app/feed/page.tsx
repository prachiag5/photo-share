// app/(feed)/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { FeedList } from "@/components/feed/Feedlist";
import { fetchFeedPage } from "@/lib/api/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — PhotoShare",
};

// This function runs on the SERVER on every request
export default async function FeedPage() {
  const queryClient = new QueryClient();

  // Prefetch page 1 on the server — this data is embedded in the HTML
  // so the client sees real posts immediately, not a loading state
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeedPage(null), // null = first page
    initialPageParam: null,
  });

  return (
    // HydrationBoundary ships the server-fetched cache to the client
    // TanStack Query on the client picks it up — no duplicate request
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedList />
    </HydrationBoundary>
  );
}