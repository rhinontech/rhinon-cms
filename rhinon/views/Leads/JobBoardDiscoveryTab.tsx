"use client";

import * as React from "react";
import { Loader2, Plus, Briefcase, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function JobBoardDiscoveryTab() {
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [syncedIds, setSyncedIds] = React.useState<Set<string>>(new Set());
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  const fetchLeads = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await fetch("/api/discovery/job-boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pageNumber }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResults(data.leads || []);
      setPage(pageNumber);
      if (data.leads?.length > 0) {
        toast.success(`Fetched ${data.leads.length} leads from Job Boards!`);
      } else {
        toast.info("No leads found for this page.");
      }
    } catch (error: any) {
      console.error("Action failed:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (person: any) => {
    const personId = person.id;
    if (syncedIds.has(personId)) return;
    
    setSyncingId(personId);
    setResults(prev => prev.map(p => p.id === personId ? { ...p, email: "Fetching..." } : p));
    toast.success(`Validating email permutations...`);
    
    try {
      // 1. One-step validation & sync API
      const syncRes = await fetch("/api/leads/sync-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ person, domain: person.organization_website })
      });
      
      const syncData = await syncRes.json();

      if (syncRes.ok && syncData.lead) {
          setResults(prev => prev.map(p => p.id === personId ? { ...p, email: syncData.lead.email } : p));
          setSyncedIds(prev => new Set([...prev, personId]));
          toast.success(`Found valid email! Synced ${person.name} successfully.`);
      } else {
          setResults(prev => prev.map(p => p.id === personId ? { ...p, email: "Not Found" } : p));
          toast.error("No valid email could be verified. Lead discarded.");
      }
    } catch (error) {
      toast.error("Sync API encountered an error.");
      setResults(prev => prev.map(p => p.id === personId ? { ...p, email: "" } : p));
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 rounded-2xl bg-secondary/30 border border-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="text-emerald-500" />
            Live Job Board Enrichment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Scrapes 10 companies actively hiring developers and enriches their CEO's contact info.</p>
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
            className="h-11 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-glow-sm px-6"
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
        {results.map((person) => {
          const personId = person.id;
          const isSynced = syncedIds.has(personId);

          return (
            <Card key={personId} className={cn("bg-card border-border hover:border-emerald-500/30 transition-all duration-300 group overflow-hidden", isSynced && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-base text-foreground leading-tight group-hover:text-emerald-400 transition-colors truncate">
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
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 truncate mt-1">
                      {person.title || "Target Prospect"}
                      {person.postedAt && (
                        <span className="text-[9px] text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-md lowercase font-extrabold tracking-wide border border-emerald-500/20 whitespace-nowrap">
                          {person.postedAt}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 border-emerald-500/20 text-[9px] font-black uppercase max-w-[80px] text-center", isSynced ? "bg-green-500/10 text-green-400" : "bg-emerald-500/10 text-emerald-400")}>
                    {isSynced ? "Synced" : person.source || "Job Board"}
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
                  
                  {person.matchReason && (
                    <div className="text-xs p-3 rounded-xl border border-border bg-secondary/30 text-muted-foreground italic leading-relaxed line-clamp-3">
                      "{person.matchReason}"
                    </div>
                  )}

                  <div className={cn("text-xs p-2 rounded border flex items-center gap-2", 
                    person.email && person.email !== "Not Found" && person.email !== "Validation Failed" && person.email !== "Fetching..." 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : person.email === "Fetching..." ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-secondary border-border"
                  )}>
                     <strong>Email:</strong> 
                     {person.email === "Fetching..." ? (
                       <span className="flex items-center gap-1"><Loader2 className="animate-spin h-3 w-3" /> Fetching...</span>
                     ) : person.email ? (
                       person.email
                     ) : (
                       <span className="text-muted-foreground italic">Pending Sync</span>
                     )}
                  </div>
                </div>

                <Button
                  onClick={() => handleSync(person)}
                  disabled={syncingId === personId || isSynced}
                  className={cn("w-full bg-secondary border border-border group-hover:border-emerald-500/50 transition-all", isSynced ? "text-green-400" : "text-primary hover:bg-emerald-500/10 hover:text-emerald-400")}
                >
                  {syncingId === personId ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : isSynced ? (
                    <Database className="mr-2" size={16} />
                  ) : (
                    <Plus className="mr-2" size={16} />
                  )}
                  {isSynced ? "Synced" : "Sync to Rhinon DB"}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {!loading && results.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-border bg-secondary/10">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-medium text-foreground">Ready to hunt for jobs?</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Click Fetch Leads to scrape tech job boards and build targeted prospects automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
