import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-ink-muted">
          LendLoop · Tools move better when they move together.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
          <Link
            href="/#how"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            How it works
          </Link>
          <Link
            href="/#trust"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Trust &amp; privacy
          </Link>
          <Link
            href="/board"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Your board
          </Link>
        </nav>
      </div>
    </footer>
  );
}
