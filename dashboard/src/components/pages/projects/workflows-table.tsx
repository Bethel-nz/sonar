import * as React from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~ui/table';
import { Input } from '~ui/input';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '~ui/dropdown-menu';
import { Button } from '~ui/button';
import { Badge } from '~ui/badge';
// import { Link } from '@tanstack/react-router';
import type { Workflow } from '~/types';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { WorkflowCellAction } from './workflow-cell-action';
// import { ArrowUpDown } from 'lucide-react';
import { Checkbox } from '~ui/checkbox';
import { useState } from 'react';
import { TrendingUp, TrendingDown, TrendingUpDown } from 'lucide-react';
import { WorkflowHoverCard } from './workflow-hover-card';

const columns: ColumnDef<Workflow>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => (
			<div className="flex items-center">
				<WorkflowHoverCard workflow={row.original} />
			</div>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const status = row.getValue('status') as 'active' | 'inactive';
			return (
				<Badge variant={status === 'active' ? 'active' : 'inactive'}>
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'eventsToday',
		header: 'Events Today',
		cell: ({ row }) => (
			<div className="text-center font-medium">
				{row.getValue('eventsToday')}
			</div>
		),
	},
	{
		accessorKey: 'totalEvents',
		header: 'Total Events',
		cell: ({ row }) => (
			<div className="text-center font-medium">
				{row.getValue('totalEvents')}
			</div>
		),
	},
	{
		accessorKey: 'lastEventAt',
		header: 'Last Event',
		cell: ({ row }) => {
			const date = row.getValue('lastEventAt') as string | null;
			return (
				<div className="text-muted-foreground">
					{date ? new Date(date).toLocaleString() : 'Never'}
				</div>
			);
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Created',
		cell: ({ row }) => {
			const date = row.getValue('createdAt') as string;
			return (
				<div className="text-muted-foreground">
					{new Date(date).toLocaleDateString()}
				</div>
			);
		},
	},
	{
		accessorKey: 'averageEventsPerDay',
		header: 'Avg Events/Day',
		cell: ({ row }) => {
			const totalEvents = row.getValue('totalEvents') as number;
			const createdAt = new Date(row.getValue('createdAt') as string);
			const days = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
			const average = (totalEvents / days).toFixed(1);
			return (
				<div className="text-center font-medium">
					{average}
				</div>
			);
		},
	},
	{
		accessorKey: 'trend',
		header: 'Trend',
		cell: ({ row }) => {
			const eventsToday = row.getValue('eventsToday') as number;
			const average = row.getValue('averageEventsPerDay') as number;
			const trend = eventsToday > average ? 'up' : eventsToday < average ? 'down' : 'stable';
			return (
				<div className="flex justify-center">
					{trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
					{trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
					{trend === 'stable' && <TrendingUpDown className="w-4 h-4 text-yellow-500" />}
				</div>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <WorkflowCellAction data={row.original} />,
	},
];

interface WorkflowsTableProps {
	data: Workflow[];
	isLoading?: boolean;
}

export function WorkflowsTable({ data, isLoading }: WorkflowsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'lastEventAt', desc: true }
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	if (isLoading) {
		return (
			<div className="w-full">
				<div className="flex items-center justify-center h-24">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Input
					placeholder="Filter workflows..."
					value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
					onChange={(event) =>
						table.getColumn('name')?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				<div className="flex items-center space-x-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								Columns
								<ChevronDownIcon className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => {
								return (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && 'selected'}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No workflows found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{' '}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
} 