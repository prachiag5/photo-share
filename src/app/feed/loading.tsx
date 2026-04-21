// app/(feed)/loading.tsx
import { PostSkeleton } from "@/components/feed/PostSkeleton";

export default function FeedLoading() {
  // Show 4 skeleton cards while the server fetches the first page
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}