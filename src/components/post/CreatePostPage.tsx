// components/post/CreatePostPage.tsx
//
// Why a separate client wrapper?
//
// app/(feed)/create/page.tsx is a Server Component — it can't use
// useRouter(). This thin client wrapper owns the navigation callbacks
// and passes them down to CreatePostForm (which also can't import
// useRouter directly since it's a shared component, not a page).
"use client";

import { useRouter } from "next/navigation";
import { CreatePostForm } from "./CreatePostForm";

export function CreatePostPage() {
  const router = useRouter();

  return (
    <div style={{
      padding: "24px 0",
      // Scroll independently within the .main column
      overflowY: "auto",
      height: "100%",
    }}>
      <CreatePostForm
        onSuccess={() => router.push("/")}
        onCancel={() => router.push("/")}
      />
    </div>
  );
}