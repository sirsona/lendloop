import Link from "next/link";
import { HeroActions } from "@/components/hero-actions";
import { PublicToolGrid } from "@/components/public-tool-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UsersIcon,
  WrenchIcon,
} from "@/components/icons";

const STEPS = [
  {
    title: "List what you can lend",
    body: "Name the tool, pick a category and condition, and say what a borrower should know. It takes under two minutes.",
  },
  {
    title: "Request the dates you need",
    body: "See which days are free before you ask. A request holds nothing until the owner approves it.",
  },
  {
    title: "Hand it over, mark it back",
    body: "Both sides can close the loop when the tool returns, so the board always reflects what is really available.",
  },
];

const TRUST = [
  {
    icon: CalendarIcon,
    title: "Dates, not maybes",
    body: "Every loan is a real date range. The tool disappears from the public board while it is out and returns the day after its return-by date.",
  },
  {
    icon: LockIcon,
    title: "Private by default",
    body: "The public page shows only a tool name and category. Owners, descriptions, and dates stay behind sign-in.",
  },
  {
    icon: ShieldCheckIcon,
    title: "A visible audit trail",
    body: "Listings and loan transitions are recorded server-side. Admins can review them; nobody can rewrite them.",
  },
];

function PreviewListing() {
  const booked = new Set([3, 4]);

  return (
    <div className="relative mt-4" aria-hidden="true">
      <div className="absolute -inset-8 rounded-[2.5rem] bg-brand-soft/70 blur-3xl" />
      <div className="relative -rotate-1 rounded-2xl border border-line bg-surface p-5 shadow-pop">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-line bg-paper text-brand">
            <WrenchIcon className="size-5" />
          </span>
          <Badge tone="brand" dot>
            Available
          </Badge>
        </div>
        <h3 className="mt-4 text-base font-semibold text-ink">
          Cordless drill
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          Power tools · Good condition
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <Avatar name="Amina W." />
          <span>Amina W.</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <ShieldCheckIcon className="size-3.5" />
            Trusted
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-paper p-3">
          <p className="text-xs font-semibold text-ink-muted uppercase">
            Next 7 days
          </p>
          <div className="mt-2 grid grid-cols-7 gap-1" aria-hidden="true">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={`grid h-9 place-items-center rounded-lg border text-xs font-semibold ${
                  booked.has(index)
                    ? "border-line bg-line/60 text-ink-muted"
                    : "border-brand-line bg-surface text-brand"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <ClockIcon className="size-3.5" />
            Free from Friday
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          <span>Request dates</span>
          <ArrowRightIcon className="size-4" />
        </div>
      </div>
      <span className="absolute -top-3 -right-2 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold tracking-wide text-ink-muted uppercase shadow-card">
        Example listing
      </span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-brand-soft/70 via-paper to-paper"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-surface/80 px-3 py-1 text-xs font-semibold text-brand">
              <MapPinIcon className="size-3.5" />
              Neighborhood tool library
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold text-balance text-ink sm:text-5xl">
              Borrow what you need.{" "}
              <span className="text-brand">Lend what you don&apos;t.</span>
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-lg text-ink-soft">
              A calm, date-aware board for lending tools to the people next door
              — no group-chat negotiation, no awkward follow-ups.
            </p>
            <div className="mt-8">
              <HeroActions />
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              <li className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-brand" />
                Neighbors only
              </li>
              <li className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-brand" />
                Date-based holds
              </li>
              <li className="flex items-center gap-2">
                <UsersIcon className="size-4 text-brand" />
                No fees, no middlemen
              </li>
            </ul>
          </div>
          <div className="hidden lg:block">
            <PreviewListing />
          </div>
        </div>
      </section>

      <section
        id="available"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6"
      >
        <PublicToolGrid />
      </section>

      <section
        id="how"
        className="scroll-mt-24 border-y border-line bg-surface"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold tracking-[0.16em] text-brand uppercase">
            How it works
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-semibold text-ink sm:text-3xl">
            Three steps, no spreadsheets
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-line bg-paper p-5"
              >
                <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="trust"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6"
      >
        <p className="text-sm font-semibold tracking-[0.16em] text-brand uppercase">
          Trust &amp; privacy
        </p>
        <h2 className="mt-2 max-w-xl text-2xl font-semibold text-ink sm:text-3xl">
          Built for neighbors who do not know each other yet
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TRUST.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-paper text-brand">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-line bg-brand-soft p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-ink">
              Something in your shed could help someone this week.
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Listing is free, and you approve every request yourself.
            </p>
          </div>
          <Link
            href="/board"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Open your board
            <CheckIcon className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
