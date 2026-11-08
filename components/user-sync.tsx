"use client";

import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";

export function UserSync() {
  const { isSignedIn } = useAuth();
  const sync = useMutation(api.users.sync);

  useEffect(() => {
    if (!isSignedIn) return;

    void sync().catch((error) => {
      console.error("Failed to sync user", error);
    });
  }, [isSignedIn, sync]);

  return null;
}
