// app/(feed)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./feed.module.css";

export default function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      {/* Left sidebar — server rendered, no JS cost */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          PhotoShare
        </Link>

        <nav className={styles.nav}>
          <Link href="/"          className={styles.navItem}>Home</Link>
          <Link href="/create"    className={styles.navItem}>Create post</Link>
          <Link href="/profile"   className={styles.navItem}>Profile</Link>
        </nav>
      </aside>

      {/* Main feed column */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}