"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Lead } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Status badge color — color accents work in both light + dark
const statusColor: Record<string, string> = {
  New:          "bg-blue-500/10  text-blue-600  dark:text-blue-400  border-blue-500/25",
  Emailed:      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  Replied:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Interested:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Bounced:      "bg-rose-500/10  text-rose-600  dark:text-rose-400  border-rose-500/25",
  Unsubscribed: "bg-rose-500/10  text-rose-600  dark:text-rose-400  border-rose-500/25",
};

export const columns: ColumnDef<Lead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">{lead.name}</span>
          <span className="text-xs text-muted-foreground">{lead.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => (
      <span className="text-foreground">{row.getValue("company")}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const color = statusColor[status] ?? "bg-secondary text-muted-foreground border-border";
      return (
        <Badge variant="outline" className={`font-medium text-xs ${color}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "addedAt",
    header: "Added",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {format(new Date(row.getValue("addedAt")), "MMM d, yyyy")}
      </span>
    ),
  },
];
