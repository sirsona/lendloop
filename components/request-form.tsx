"use client";

import { useState } from "react";

export type RequestDraft = {
  startDate: string;
  returnBy: string;
  message: string;
};

export function RequestForm({
  toolName,
  busy,
  onSubmit,
  onCancel,
}: {
  toolName: string;
  busy: boolean;
  onSubmit: (draft: RequestDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RequestDraft>({
    startDate: "",
    returnBy: "",
    message: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request tool.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Request {toolName}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Return by is inclusive. The tool becomes available again the next day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Borrow from
          <input
            type="date"
            required
            value={draft.startDate}
            onChange={(event) =>
              setDraft({ ...draft, startDate: event.target.value })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium">
          Return by
          <input
            type="date"
            required
            value={draft.returnBy}
            onChange={(event) =>
              setDraft({ ...draft, returnBy: event.target.value })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Message <span className="text-slate-400">(optional)</span>
        <textarea
          maxLength={300}
          rows={3}
          value={draft.message}
          onChange={(event) =>
            setDraft({ ...draft, message: event.target.value })
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="How will you use it?"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send request"}
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
