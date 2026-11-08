"use client";

import { categoryLabel } from "@/lib/tool-options";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function PublicToolGrid() {
  const tools = useQuery(api.tools.listPublic);

  if (tools === undefined) return <p>Loading tools…</p>;
  if (tools.length === 0) {
    return <p className="text-slate-600">No tools are available right now.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tools.map((tool) => (
        <div
          key={tool._id}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <p className="font-semibold">{tool.name}</p>
          <p className="text-sm text-slate-500">
            {categoryLabel(tool.category)}
          </p>
        </div>
      ))}
    </div>
  );
}
