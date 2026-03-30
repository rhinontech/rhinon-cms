"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { columns } from "./columns";
import { LeadDrawer } from "./LeadDrawer";
import { DiscoveryTab } from "./DiscoveryTab";
import { CsvDiscoveryTab } from "./CsvDiscoveryTab";
import { JobBoardDiscoveryTab } from "./JobBoardDiscoveryTab";
import { Lead } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function LeadsTable() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        setLeads(data);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const table = useReactTable({
    data: leads,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-glow-sm shrink-0">
          <Users size={28} className="text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Qualified prospects and engagement history.</p>
        </div>
      </header>

      <Tabs defaultValue="database" className="w-full flex flex-col gap-4 border-none shadow-none bg-transparent">
        <TabsList className="bg-secondary/50 border border-border p-1 h-auto min-h-12 rounded-xl mb-6 flex-wrap justify-start">
          <TabsTrigger
            value="database"
            className="rounded-lg px-6 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium transition-all"
          >
            Leads Database
          </TabsTrigger>
          <TabsTrigger
            value="discovery"
            className="rounded-lg px-6 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium transition-all"
          >
            Lead Discovery (Apollo.io)
          </TabsTrigger>
          <TabsTrigger
            value="csv-discovery"
            className="rounded-lg px-6 py-2.5 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 font-medium transition-all"
          >
            Lead Discovery (CSV file)
          </TabsTrigger>
          <TabsTrigger
            value="job-board-discovery"
            className="rounded-lg px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-medium transition-all"
          >
            Leads from Job Boards
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="database" className="space-y-4 outline-none border-none p-0 mt-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative max-w-xl w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <Input
                    placeholder="Search leads..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground h-10 w-full"
                  />
                </div>
                <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl h-10 overflow-x-auto custom-scrollbar shrink-0">
                  {["All", "LinkedIn", "Apollo", "Web"].map((source) => {
                    const fullSource = source === "LinkedIn" ? "LinkedIn Lead Gen" : source === "Web" ? "Website" : source;
                    const isActive = (table.getColumn("source")?.getFilterValue() as string) === (source === "All" ? undefined : fullSource);
                    return (
                      <Button
                        key={source}
                        variant="ghost"
                        size="sm"
                        onClick={() => table.getColumn("source")?.setFilterValue(source === "All" ? undefined : fullSource)}
                        className={cn(
                          "px-3 h-8 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                          isActive 
                            ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {source}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-border bg-card text-foreground self-end lg:self-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize text-muted-foreground"
                        checked={col.getIsVisible()}
                        onCheckedChange={(val) => col.toggleVisibility(!!val)}
                      >
                        {col.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="rounded-xl border border-border overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="border-border bg-secondary/60 hover:bg-secondary/60">
                      {hg.headers.map((header) => (
                        <TableHead key={header.id} className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider h-11">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-border hover:bg-secondary/40 cursor-pointer transition-colors"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                          handleRowClick(row.original as Lead);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3 text-foreground">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                        No leads found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <p className="flex-1 text-xs text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="border-border bg-card text-foreground hover:bg-secondary"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="border-border bg-card text-foreground hover:bg-secondary"
              >
                Next
              </Button>
            </div>

            <LeadDrawer lead={selectedLead} isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
          </TabsContent>

          <TabsContent value="discovery" className="outline-none border-none p-0 mt-0">
            <DiscoveryTab />
          </TabsContent>

          <TabsContent value="csv-discovery" className="outline-none border-none p-0 mt-0">
            <CsvDiscoveryTab />
          </TabsContent>

          <TabsContent value="job-board-discovery" className="outline-none border-none p-0 mt-0">
            <JobBoardDiscoveryTab />
          </TabsContent>

        </div>

      </Tabs>
    </div>
  );
}

