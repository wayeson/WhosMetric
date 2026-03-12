import { DomainPageSkeleton } from "@/components/Skeleton";

// This file is the Suspense fallback for the [slug] route.
// Next.js App Router automatically wraps page.tsx in Suspense
// and shows this loading.tsx during server-side data fetching.
export default function Loading() {
  return <DomainPageSkeleton />;
}
