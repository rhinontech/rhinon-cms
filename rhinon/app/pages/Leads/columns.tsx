"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Lead } from "@/app/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
        <div className="flex flex-col">
          <span className="font-medium text-slate-200">{lead.name}</span>
          <span className="text-xs text-slate-500">{lead.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <span className="text-slate-400">{row.getValue("email")}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      let colorClass = "bg-slate-800 text-slate-300";
      
      if (status === "New") {
        colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      } else if (status === "Emailed") {
        colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      } else if (status === "Replied" || status === "Interested") {
        colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      } else if (status === "Bounced" || status === "Unsubscribed") {
        colorClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
      }

      return (
        <Badge variant={variant} className={`font-normal ${colorClass}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "addedAt",
    header: "Added",
    cell: ({ row }) => {
      return (
        <span className="text-slate-400 text-xs">
          {format(new Date(row.getValue("addedAt")), "MMM d, yyyy")}
        </span>
      );
    },
  },
];
