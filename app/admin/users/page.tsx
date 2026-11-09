"use client";

import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { SearchIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import {
  TableCard,
  tdClassName,
  thClassName,
  trClassName,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type AdminUser = FunctionReturnType<typeof api.admin.listUsers>[number];

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listUsers, {});
  const me = useQuery(api.users.me);
  const setTrusted = useMutation(api.admin.setTrustedLender);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return (users ?? []).filter((user) => {
      if (!needle) return true;
      return [user.name, user.email].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [users, query]);

  async function toggleTrusted(user: AdminUser) {
    setPendingId(user._id);
    try {
      await setTrusted({ userId: user._id, trusted: !user.trustedLender });
      toast({
        tone: "success",
        title: user.trustedLender ? "Trusted badge removed" : "Marked trusted",
        description: `${user.name} keeps the same permissions either way.`,
      });
    } catch (cause) {
      toast({
        tone: "error",
        title: "Could not update",
        description:
          cause instanceof Error ? cause.message : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Users</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Name and email exist here so you can identify a lender. The trusted
          badge is cosmetic; it grants no extra permissions.
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-surface p-3 shadow-card">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="w-full rounded-xl border border-line-strong bg-paper py-2.5 pr-3 pl-10 text-sm text-ink placeholder:text-ink-muted/80 focus:border-brand"
          />
        </div>
      </div>

      {users === undefined ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <TableCard caption="Neighborhood users">
            <thead>
              <tr>
                <th scope="col" className={thClassName}>
                  Person
                </th>
                <th scope="col" className={thClassName}>
                  Role
                </th>
                <th scope="col" className={thClassName}>
                  Trusted lender
                </th>
                <th scope="col" className={thClassName}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user._id} className={trClassName}>
                  <td className={tdClassName}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} />
                      <div>
                        <p className="font-medium text-ink">
                          {user.name}
                          {me?._id === user._id ? (
                            <span className="ml-1.5 text-xs font-normal text-ink-muted">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-ink-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClassName}>
                    <Badge tone={user.role === "admin" ? "brand" : "neutral"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className={tdClassName}>
                    {user.trustedLender ? (
                      <Badge tone="brand" dot>
                        Trusted
                      </Badge>
                    ) : (
                      <span className="text-xs text-ink-muted">Not trusted</span>
                    )}
                  </td>
                  <td className={tdClassName}>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={pendingId === user._id}
                      onClick={() => toggleTrusted(user)}
                    >
                      {user.trustedLender ? "Remove badge" : "Mark trusted"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-ink-muted" colSpan={4}>
                    No users match that search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </TableCard>
          {users.length >= 200 ? (
            <p className="text-xs text-ink-muted">
              Showing the latest 200 users. Pagination is not built yet.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
