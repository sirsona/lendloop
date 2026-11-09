import {
  BoxIcon,
  LeafIcon,
  PotIcon,
  TentIcon,
  WrenchIcon,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  power_tools: WrenchIcon,
  garden: LeafIcon,
  kitchen: PotIcon,
  camping: TentIcon,
  other: BoxIcon,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = ICONS[category] ?? BoxIcon;
  return <Icon className={className} />;
}
