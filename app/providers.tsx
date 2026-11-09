"use client";

import { ToastProvider } from "@/components/ui/toast";
import { UserSync } from "@/components/user-sync";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ConfigurationNotice() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-20">
      <p className="text-sm font-semibold tracking-[0.18em] text-brand uppercase">
        Configuration needed
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
        LendLoop is not connected yet
      </h1>
      <p className="mt-3 text-ink-soft">
        Add{" "}
        <code className="rounded bg-line/70 px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_CONVEX_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-line/70 px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        </code>{" "}
        to{" "}
        <code className="rounded bg-line/70 px-1.5 py-0.5 text-sm">
          .env.local
        </code>
        , then reload. The README has the full setup steps.
      </p>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  if (!convex || !publishableKey) return <ConfigurationNotice />;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ToastProvider>
          <UserSync />
          {children}
        </ToastProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
