"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Button, buttonStyles } from "@/components/ui/button";

export function HeroActions() {
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/board" className={buttonStyles({ size: "lg" })}>
          Open your board
          <ArrowRightIcon className="size-4" />
        </Link>
        <Link
          href="/board/listings"
          className={buttonStyles({ size: "lg", variant: "secondary" })}
        >
          List a tool
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" onClick={() => openSignIn({})}>
        Sign in to lend or borrow
        <ArrowRightIcon className="size-4" />
      </Button>
      <a
        href="#available"
        className={buttonStyles({ size: "lg", variant: "secondary" })}
      >
        Browse available tools
      </a>
    </div>
  );
}
