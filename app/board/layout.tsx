import type { Metadata } from "next";
import { BoardShell } from "@/components/board-shell";

export const metadata: Metadata = { title: "Your board" };

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BoardShell>{children}</BoardShell>;
}
