import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~ui/table"
import { Input } from "~ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~ui/select"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { Button } from "~ui/button"
import { cx } from "~utils"

export interface DataTableProps<TData> {
  columns: {
    id: string
    header: string
    cell: (row: TData) => React.ReactNode
    sortable?: boolean
  }[]
  data: TData[]
  filterFields?: {
    id: string
    label: string
    type: "text" | "select"
    options?: { label: string; value: string }[]
  }[]
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<TData extends { [key: string]: any }>({
  columns,
  data,
  filterFields = [],
}: DataTableProps<TData>) {
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: SortDirection;
  }>({ key: "", direction: null });

  const requestSort = (key: string) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnId: string) => {
    if (sortConfig.key !== columnId) return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/70" />;
    if (sortConfig.direction === "asc") return <ChevronUp className="h-4 w-4" />;
    if (sortConfig.direction === "desc") return <ChevronDown className="h-4 w-4" />;
    return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/70" />;
  };

  const sortedAndFilteredData = React.useMemo(() => {
    let processedData = [...data];

    // Apply filters
    processedData = processedData.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === '_all') return true;
        const field = key.split('.');
        let fieldValue = row;
        for (const f of field) {
          fieldValue = fieldValue[f];
        }
        return String(fieldValue).toLowerCase().includes(value.toLowerCase());
      });
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      processedData.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue === bValue) return 0;

        const comparison = compareValues(aValue, bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return processedData;
  }, [data, filters, sortConfig]);

  return (
    <div className="space-y-4">
      {filterFields.length > 0 && (
        <div className="flex gap-4 mb-4">
          {filterFields.map((field) => (
            <div key={field.id} className="flex-1">
              {field.type === "text" ? (
                <Input
                  placeholder={`Filter by ${field.label.toLowerCase()}...`}
                  value={filters[field.id] || ""}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, [field.id]: e.target.value }))
                  }
                />
              ) : field.type === "select" && field.options ? (
                <Select
                  value={filters[field.id] || ""}
                  onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, [field.id]: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Filter by ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All</SelectItem>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => requestSort(column.id)}
                      className={cx(
                        "h-8 flex items-center gap-1 font-semibold",
                        sortConfig.key === column.id && "text-foreground"
                      )}
                    >
                      {column.header}
                      {getSortIcon(column.id)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Helper functions for sorting
function getNestedValue(obj: any, path: string) {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
}

function compareValues(a: any, b: any): number {
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Handle strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  // Convert to strings for comparison if types don't match
  return String(a).localeCompare(String(b));
}
