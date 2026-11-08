export const TOOL_CATEGORIES = [
  { value: "power_tools", label: "Power tools" },
  { value: "garden", label: "Garden" },
  { value: "kitchen", label: "Kitchen" },
  { value: "camping", label: "Camping" },
  { value: "other", label: "Other" },
] as const;

export const TOOL_CONDITIONS = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]["value"];
export type ToolCondition = (typeof TOOL_CONDITIONS)[number]["value"];

export function categoryLabel(value: string) {
  return TOOL_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export function conditionLabel(value: string) {
  return TOOL_CONDITIONS.find((item) => item.value === value)?.label ?? value;
}
