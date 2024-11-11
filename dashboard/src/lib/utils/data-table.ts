import { type Table } from "@tanstack/react-table"

export function getCommonPinningStyles({ column }: { column: any }) {
  if (column.getIsPinned() === "left") {
    return {
      left: `${column.getStart()}px`,
      position: "sticky",
      backgroundColor: "var(--background)",
    }
  }

  if (column.getIsPinned() === "right") {
    return {
      right: `${column.getAfter()}px`,
      position: "sticky",
      backgroundColor: "var(--background)",
    }
  }

  return {}
} 