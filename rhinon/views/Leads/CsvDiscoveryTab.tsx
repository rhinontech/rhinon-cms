"use client";

import * as React from "react";
import { Loader2, Plus, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CsvDiscoveryTab() {
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [syncedIds, setSyncedIds] = React.useState<Set<string>>(new Set());
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  const fetchLeads = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await fetch("/api/testing/csv-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pageNumber }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResults(data.leads || []);
      setPage(pageNumber);
      toast.success(`Fetched 10 leads from CSV!`);
    } catch (error: any) {
      console.error("Action failed:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (person: any) => {
    // For now, don't store in database, just mark as synced as requested by user
    const personId = person.id;
    if (syncedIds.has(personId)) return;
    
    setSyncingId(personId);
    
    // Simulate network request
    setTimeout(() => {
        setSyncedIds(prev => new Set([...prev, personId]));
        toast.success(`Mock Synced ${person.name || person.first_name} successfully!`);
        setSyncingId(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 rounded-2xl bg-secondary/30 border border-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-cyan-500" />
            Local CSV Enrichment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Read from public/Logistic 1.csv, enrich via Apollo/Gemini.</p>
        </div>
        
        <div className="flex gap-2">
            <Button
              onClick={() => fetchLeads(Math.max(1, page - 1))}
              disabled={loading || page <= 1}
              variant="outline"
            >
              Previous Page
            </Button>
            <Button
            onClick={() => fetchLeads(page)}
            disabled={loading}
            className="h-11 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-xl shadow-glow-sm px-6"
            >
            {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Database size={18} className="mr-2" />}
            Fetch 10 Leads
            </Button>
            <Button
              onClick={() => fetchLeads(page + 1)}
              disabled={loading}
              variant="outline"
            >
              Next Page
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((person, idx) => {
          const personId = person.id;
          const isSynced = syncedIds.has(personId);

          return (
            <Card key={personId} className={cn("bg-card border-border hover:border-cyan-500/30 transition-all duration-300 group overflow-hidden", isSynced && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-base text-foreground leading-tight group-hover:text-cyan-400 transition-colors truncate">
                        {person.name || person.first_name}
                      </h3>
                      {person.matchScore && (
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider", 
                          person.matchScore === "High" ? "border-green-500/50 text-green-400 bg-green-500/10" :
                          person.matchScore === "Medium" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" :
                          "border-red-500/50 text-red-400 bg-red-500/10"
                        )}>
                          {person.matchScore} Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                      {person.title || "Target Prospect"}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 border-violet-500/20 text-[9px] font-black uppercase", isSynced ? "bg-green-500/10 text-green-400" : "bg-violet-500/10 text-violet-400")}>
                    {isSynced ? "Synced" : person.source || "Sourced"}
                  </Badge>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase shrink-0">
                      {(person.organization_name || "O").charAt(0)}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs font-bold text-foreground truncate">
                        {person.organization_name}
                      </p>
                      {person.organization_website && (
                        <p className="text-[10px] text-muted-foreground truncate font-medium">
                          {person.organization_website.replace(/^https?:\/\//, "")}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  
                  {/* Highlight AI Match Reason */}
                  {person.matchReason && (
                    <div className="text-xs p-3 rounded-xl border border-border bg-secondary/30 text-muted-foreground italic leading-relaxed">
                      " {person.matchReason} "
                    </div>
                  )}

                  {/* Highlight enriched email */}
                  <div className={cn("text-xs p-2 rounded border", person.source !== "CSV" && person.email ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-secondary border-border")}>
                     <strong>Email:</strong> {person.email || <span className="text-muted-foreground italic">Not found</span>}
                  </div>
                </div>

                <Button
                  onClick={() => handleSync(person)}
                  disabled={syncingId === personId || isSynced}
                  className={cn("w-full bg-secondary border border-border group-hover:border-cyan-500/50 transition-all", isSynced ? "text-green-400" : "text-primary hover:bg-cyan-500/10 hover:text-cyan-400")}
                >
                  {syncingId === personId ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : isSynced ? (
                    <Database className="mr-2" size={16} />
                  ) : (
                    <Plus className="mr-2" size={16} />
                  )}
                  {isSynced ? "Mock Synced" : "Sync to Rhinon (Mock)"}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {!loading && results.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-border bg-secondary/10">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-foreground">Ready to enrich from CSV?</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Click Fetch Leads to read exactly 10 leads from your local CSV and find missing emails.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
