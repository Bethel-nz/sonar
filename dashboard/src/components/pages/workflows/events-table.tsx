import * as React from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
} from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~ui/table';
import { Badge } from '~ui/badge';
import { Event } from '~/types';
import { EventCellAction } from './event-cell-action';
import { useState } from 'react';

const columns: ColumnDef<Event>[] = [
	{
		accessorKey: 'name',
		header: 'Event Name',
	},
	{
		accessorKey: 'count',
		header: 'Triggers',
		cell: ({ row }) => (
			<div className="text-center font-medium">{row.getValue('count')}</div>
		),
	},
	{
		accessorKey: 'services',
		header: 'Services',
		cell: ({ row }) => {
			const services = row.getValue('services') as string[];
			return (
				<div className="flex gap-1 flex-wrap">
					{services.map((service) => (
						<Badge key={service} variant="secondary">
							{service}
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		accessorKey: 'config.severity',
		header: 'Severity',
		cell: ({ row }) => {
			const severity = row.getValue('config.severity') as string;
			return (
				<Badge
					variant={
						severity === 'critical'
							? 'destructive'
							: severity === 'error'
								? 'destructive'
								: severity === 'warn'
									? 'secondary'
									: 'default'
					}
				>
					{severity}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Last Triggered',
		cell: ({ row }) => {
			const date = row.getValue('createdAt') as Date;
			return date ? new Date(date).toLocaleString() : 'Never';
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <EventCellAction data={row.original} />,
	},
];

interface EventsTableProps {
	data: Event[];
	isLoading?: boolean;
}

export function EventsTable({ data, isLoading }: EventsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'createdAt', desc: true }
	]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
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
		<div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{flexRender(
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
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center"
							>
								No events found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
} 