// src/lib/mock/posts.ts
//
// Seed data used by the mock API route handlers.
// Every field matches the Post type in src/types/index.ts exactly.
// Replace with real DB queries when your backend is ready.

import type { Post } from "@/types";

export const MOCK_POSTS: Post[] = [
  {
    id: "post_001",
    imageUrl: "https://picsum.photos/seed/photo001/800/1000",
    width: 800,
    height: 1000,
    caption: "Golden hour hits different when you're 2,400m above sea level. No filter needed.",
    author: {
      id: "user_001",
      username: "anika.sharma",
      avatarUrl: "https://picsum.photos/seed/avatar001/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    likesCount: 284,
  },
  {
    id: "post_002",
    imageUrl: "https://picsum.photos/seed/photo002/800/600",
    width: 800,
    height: 600,
    caption: "Weekend farmers market haul. The heirloom tomatoes alone made the trip worth it.",
    author: {
      id: "user_002",
      username: "marcos.v",
      avatarUrl: "https://picsum.photos/seed/avatar002/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    likesCount: 97,
  },
  {
    id: "post_003",
    imageUrl: "https://picsum.photos/seed/photo003/800/800",
    width: 800,
    height: 800,
    caption: "Studio session #12. Starting to finally sound like the record in my head.",
    author: {
      id: "user_003",
      username: "jess.chen",
      avatarUrl: "https://picsum.photos/seed/avatar003/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5h ago
    likesCount: 512,
  },
  {
    id: "post_004",
    imageUrl: "https://picsum.photos/seed/photo004/800/1067",
    width: 800,
    height: 1067,
    caption: "New piece finally framed. Three months of evenings. Acrylic on canvas, 60×80cm.",
    author: {
      id: "user_004",
      username: "oluwafemi.a",
      avatarUrl: "https://picsum.photos/seed/avatar004/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
    likesCount: 1203,
  },
  {
    id: "post_005",
    imageUrl: "https://picsum.photos/seed/photo005/800/533",
    width: 800,
    height: 533,
    caption: "Tokyo at 5am belongs to the delivery riders and stray cats.",
    author: {
      id: "user_005",
      username: "yuki.tanaka",
      avatarUrl: "https://picsum.photos/seed/avatar005/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    likesCount: 741,
  },
  {
    id: "post_006",
    imageUrl: "https://picsum.photos/seed/photo006/800/600",
    width: 800,
    height: 600,
    caption: "Homemade sourdough attempt #7. The ear finally opened properly. Crumb shot tomorrow.",
    author: {
      id: "user_006",
      username: "priya.nair",
      avatarUrl: "https://picsum.photos/seed/avatar006/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h ago
    likesCount: 388,
  },
  {
    id: "post_007",
    imageUrl: "https://picsum.photos/seed/photo007/800/1000",
    width: 800,
    height: 1000,
    caption: "Velvia 50, F2.8, 1/500. Some rolls just come out perfect.",
    author: {
      id: "user_007",
      username: "daniel.k",
      avatarUrl: "https://picsum.photos/seed/avatar007/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12h ago
    likesCount: 629,
  },
  {
    id: "post_008",
    imageUrl: "https://picsum.photos/seed/photo008/800/800",
    width: 800,
    height: 800,
    caption: "Desert rain. Waited four hours for this light and it was worth every minute.",
    author: {
      id: "user_001",
      username: "anika.sharma",
      avatarUrl: "https://picsum.photos/seed/avatar001/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18h ago
    likesCount: 1847,
  },
  {
    id: "post_009",
    imageUrl: "https://picsum.photos/seed/photo009/800/600",
    width: 800,
    height: 600,
    caption: "Before the city wakes up. My favourite 4km loop along the canal.",
    author: {
      id: "user_008",
      username: "lena.b",
      avatarUrl: "https://picsum.photos/seed/avatar008/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // 22h ago
    likesCount: 156,
  },
  {
    id: "post_010",
    imageUrl: "https://picsum.photos/seed/photo010/800/1000",
    width: 800,
    height: 1000,
    caption: "The bookshop at the end of the alley. Been coming here every Saturday for six years.",
    author: {
      id: "user_009",
      username: "sam.o",
      avatarUrl: "https://picsum.photos/seed/avatar009/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 26h ago
    likesCount: 432,
  },
  {
    id: "post_011",
    imageUrl: "https://picsum.photos/seed/photo011/800/533",
    width: 800,
    height: 533,
    caption: "Negroni season officially begins. Equal parts, stirred, never shaken.",
    author: {
      id: "user_002",
      username: "marcos.v",
      avatarUrl: "https://picsum.photos/seed/avatar002/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    likesCount: 219,
  },
  {
    id: "post_012",
    imageUrl: "https://picsum.photos/seed/photo012/800/800",
    width: 800,
    height: 800,
    caption: "Ceramic wheel classes, week 3. Bowls are still lopsided but I've made my peace with it.",
    author: {
      id: "user_010",
      username: "fatima.z",
      avatarUrl: "https://picsum.photos/seed/avatar010/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    likesCount: 874,
  },
  // Page 2 posts (returned when cursor = "cursor_page_2")
  {
    id: "post_013",
    imageUrl: "https://picsum.photos/seed/photo013/800/1000",
    width: 800,
    height: 1000,
    caption: "Monsoon season in Kerala. The smell of rain on red earth is something else entirely.",
    author: {
      id: "user_005",
      username: "yuki.tanaka",
      avatarUrl: "https://picsum.photos/seed/avatar005/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    likesCount: 1102,
  },
  {
    id: "post_014",
    imageUrl: "https://picsum.photos/seed/photo014/800/600",
    width: 800,
    height: 600,
    caption: "Spent the afternoon converting the garage. Half gym, half darkroom. Peak adult.",
    author: {
      id: "user_007",
      username: "daniel.k",
      avatarUrl: "https://picsum.photos/seed/avatar007/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    likesCount: 67,
  },
  {
    id: "post_015",
    imageUrl: "https://picsum.photos/seed/photo015/800/800",
    width: 800,
    height: 800,
    caption: "First surf session of the year. Water was 14°C. Would do it again immediately.",
    author: {
      id: "user_008",
      username: "lena.b",
      avatarUrl: "https://picsum.photos/seed/avatar008/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 56).toISOString(),
    likesCount: 493,
  },
  {
    id: "post_016",
    imageUrl: "https://picsum.photos/seed/photo016/800/533",
    width: 800,
    height: 533,
    caption: "New mural going up on Hackney Road. The scale of it when you're standing underneath.",
    author: {
      id: "user_004",
      username: "oluwafemi.a",
      avatarUrl: "https://picsum.photos/seed/avatar004/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    likesCount: 2341,
  },
  // Page 3 posts (returned when cursor = "cursor_page_3")
  {
    id: "post_017",
    imageUrl: "https://picsum.photos/seed/photo017/800/1000",
    width: 800,
    height: 1000,
    caption: "Autumn finally showed up. Three weeks late but worth the wait.",
    author: {
      id: "user_009",
      username: "sam.o",
      avatarUrl: "https://picsum.photos/seed/avatar009/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    likesCount: 318,
  },
  {
    id: "post_018",
    imageUrl: "https://picsum.photos/seed/photo018/800/600",
    width: 800,
    height: 600,
    caption: "Rooftop view from the new office. Not a bad trade-off for the commute.",
    author: {
      id: "user_003",
      username: "jess.chen",
      avatarUrl: "https://picsum.photos/seed/avatar003/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 78).toISOString(),
    likesCount: 145,
  },
  {
    id: "post_019",
    imageUrl: "https://picsum.photos/seed/photo019/800/800",
    width: 800,
    height: 800,
    caption: "Batch cooked for the whole week. Sunday evenings feel different when you plan ahead.",
    author: {
      id: "user_006",
      username: "priya.nair",
      avatarUrl: "https://picsum.photos/seed/avatar006/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 84).toISOString(),
    likesCount: 267,
  },
  {
    id: "post_020",
    imageUrl: "https://picsum.photos/seed/photo020/800/1067",
    width: 800,
    height: 1067,
    caption: "End of the line. Sometimes you just drive until the road runs out.",
    author: {
      id: "user_010",
      username: "fatima.z",
      avatarUrl: "https://picsum.photos/seed/avatar010/64/64",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
    likesCount: 956,
  },
];

// Pagination config
export const PAGE_SIZE = 6;

// Cursor → page index map
// In a real app this would be a DB offset/keyset cursor
export const CURSOR_MAP: Record<string, number> = {
  cursor_page_2: 6,
  cursor_page_3: 12,
  cursor_page_4: 18,
};