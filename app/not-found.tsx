import Link from "next/link";
import { LoopMark } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
        <LoopMark className="size-6" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-[0.16em] text-brand uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">
        That page is not on the board
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The link may be old, or the tool may have been removed. The available
        tools are on the main board.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonStyles()}>
          Back to the board
        </Link>
        <Link
          href="/board"
          className={buttonStyles({ variant: "secondary" })}
        >
          Your board
        </Link>
      </div>
    </main>
  );
}
