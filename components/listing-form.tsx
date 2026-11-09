"use client";

import { useState } from "react";
import { AlertIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SelectField, TextField, TextareaField } from "@/components/ui/field";
import {
  TOOL_CATEGORIES,
  TOOL_CONDITIONS,
  type ToolCategory,
  type ToolCondition,
} from "@/lib/tool-options";

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
  onSubmit,
  onCancel,
}: {
  initial?: ListingDraft;
  onSubmit: (draft: ListingDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ListingDraft>(initial ?? EMPTY);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await onSubmit({
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the listing.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Tool name"
        required
        minLength={2}
        maxLength={80}
        value={draft.name}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        placeholder="Cordless drill"
        hint="2–80 characters."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Category"
          value={draft.category}
          onChange={(event) =>
            setDraft({
              ...draft,
              category: event.target.value as ToolCategory,
            })
          }
        >
          {TOOL_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Condition"
          value={draft.condition}
          onChange={(event) =>
            setDraft({
              ...draft,
              condition: event.target.value as ToolCondition,
            })
          }
        >
          {TOOL_CONDITIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div>
        <TextareaField
          label="Description"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
          placeholder="What should a neighbor know before borrowing?"
          hint="10–600 characters. Only signed-in neighbors can read this."
        />
        <p className="mt-1 text-right text-xs text-ink-muted tnum">
          {draft.description.length}/600
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger-line bg-danger-soft p-3 text-sm text-danger"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {initial ? "Save changes" : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}
