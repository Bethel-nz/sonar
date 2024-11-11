export const stateColors = {
  info: {
    text: "text-blue-600 dark:text-blue-300",
    bg: "bg-blue-50/50 dark:bg-blue-950/50",
    border: "border-blue-100 dark:border-blue-900",
    hover: "hover:bg-blue-100/50 dark:hover:bg-blue-900/50",
  },
  warn: {
    text: "text-amber-600 dark:text-amber-300",
    bg: "bg-amber-50/50 dark:bg-amber-950/50",
    border: "border-amber-100 dark:border-amber-900",
    hover: "hover:bg-amber-100/50 dark:hover:bg-amber-900/50",
  },
  error: {
    text: "text-rose-600 dark:text-rose-300",
    bg: "bg-rose-50/50 dark:bg-rose-950/50",
    border: "border-rose-100 dark:border-rose-900",
    hover: "hover:bg-rose-100/50 dark:hover:bg-rose-900/50",
  },
  critical: {
    text: "text-purple-600 dark:text-purple-300",
    bg: "bg-purple-50/50 dark:bg-purple-950/50",
    border: "border-purple-100 dark:border-purple-900",
    hover: "hover:bg-purple-100/50 dark:hover:bg-purple-900/50",
  },
  success: {
    text: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/50",
    border: "border-emerald-100 dark:border-emerald-900",
    hover: "hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50",
  },
  default: {
    text: "text-gray-600 dark:text-gray-300",
    bg: "bg-gray-50/50 dark:bg-gray-950/50",
    border: "border-gray-100 dark:border-gray-900",
    hover: "hover:bg-gray-100/50 dark:hover:bg-gray-900/50",
  },
} as const;

export type StateColor = keyof typeof stateColors; 