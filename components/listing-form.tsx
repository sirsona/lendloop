"use client";

import {
  TOOL_CATEGORIES,
  TOOL_CONDITIONS,
  type ToolCategory,
  type ToolCondition,
} from "@/lib/tool-options";
import { useState } from "react";

export type ListingDraft = {
  name: string;
  category: ToolCategory;
  condition: ToolCondition;
  description: string;
};

const EMPTY: ListingDraft = {
  name: "",
  category: "power_tools",
  condition: "good",
  description: "",
};

export function ListingForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: ListingDraft;
  busy: boolean;
  onSubmit: (draft: ListingDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ListingDraft>(initial ?? EMPTY);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save tool.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">
          {initial ? "Edit listing" : "List a tool"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Only signed-in neighbors can see the full listing.
        </p>
      </div>

      <label className="block text-sm font-medium">
        Name
        <input
          required
          minLength={2}
          maxLength={80}
          value={draft.name}
          onChange={(event) =>
            setDraft({ ...draft, name: event.target.value })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Cordless drill"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Category
          <select
            value={draft.category}
            onChange={(event) =>
              setDraft({
                ...draft,
                category: event.target.value as ToolCategory,
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {TOOL_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Condition
          <select
            value={draft.condition}
            onChange={(event) =>
              setDraft({
                ...draft,
                condition: event.target.value as ToolCondition,
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {TOOL_CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium">
        Description
        <textarea
          required
          minLength={10}
          maxLength={600}
          rows={4}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="What should a neighbor know before borrowing?"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Publish listing"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
