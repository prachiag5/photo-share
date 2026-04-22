import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { FeedList } from "@/components/feed/Feedlist";
import { fetchFeedPage } from "@/lib/api/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — PhotoShare",
};

export default async function FeedPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      fetchFeedPage(pageParam),
    initialPageParam: null as string | null,  // ← the fix
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedList />
    </HydrationBoundary>
  );
}