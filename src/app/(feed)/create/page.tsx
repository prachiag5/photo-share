// app/(feed)/create/page.tsx
//
// Route: /create
//
// This page sits inside the (feed) route group so it shares:
//   - the sidebar layout (feed.module.css .shell + .main)
//   - the error boundary (error.tsx)
//   - the providers (QueryClient, etc.)
//
// FILE LOCATION: src/app/(feed)/create/page.tsx

import type { Metadata } from "next";
import { CreatePostPage } from "@/components/post/CreatePostPage";

export const metadata: Metadata = {
  title: "New post — PhotoShare",
};

export default function Create() {
  return <CreatePostPage />;
}