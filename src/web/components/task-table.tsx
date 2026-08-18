import { type ColumnDef, flexRender, tableFeatures, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Task } from "../../task";
import { EditTaskDialog } from "./edit-task-dialog";

const features = tableFeatures({});

export function TaskTable({ tasks, onUpdated }: { tasks: Task[]; onUpdated: () => void }) {
  const columns = useMemo<ColumnDef<typeof features, Task>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => `#${row.original.id}`,
      },
      {
        accessorKey: "title",
        header: "タイトル",
      },
      {
        accessorKey: "status",
        header: "ステータス",
      },
      {
        accessorKey: "parent",
        header: "親タスク",
        cell: ({ row }) => (row.original.parent === null ? "-" : `#${row.original.parent}`),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <EditTaskDialog task={row.original} onUpdated={onUpdated} />,
      },
    ],
    [onUpdated],
  );

  const table = useTable({
    features,
    columns,
    data: tasks,
  });

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">タスクなし</p>;
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
