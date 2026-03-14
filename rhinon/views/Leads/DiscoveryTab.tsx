"use client";

import * as React from "react";
import { Search, Loader2, Sparkles, Plus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApolloPerson } from "@/lib/connectors/apollo";
import { Campaign } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DiscoveryTab() {
  const [results, setResults] = React.useState<ApolloPerson[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<"search" | "match">("match");

  // Match state
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");

  // Search state
  const [title, setTitle] = React.useState("Founder");
  const [industry, setIndustry] = React.useState("");

  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("");
  const [syncedIds, setSyncedIds] = React.useState<Set<string>>(new Set());
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = React.useState(false);

  React.useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch("/api/campaigns");
        const data = await res.json();
        setCampaigns(data.filter((c: any) => c.stage !== "Completed"));
        if (data.length > 0) setSelectedCampaignId(data[0]._id || data[0].id);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      }
    };
    fetchCampaigns();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const payload = mode === "match"
        ? { type: "match", first_name: firstName, last_name: lastName, email, organization_name: company }
        : { type: "search", title, industry };

      const res = await fetch("/api/discovery/search", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // If it's a single object from match, wrap in array
      const people = Array.isArray(data) ? data : [data].filter(Boolean);
      setResults(people);
    } catch (error: any) {
      console.error("Action failed:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (person: ApolloPerson) => {
    const personId = person.id || person.email || `${person.first_name}-${person.last_name}`;
    if (syncedIds.has(personId)) return;
    
    setSyncingId(personId);
    try {
      const res = await fetch("/api/discovery/sync", {
        method: "POST",
        body: JSON.stringify({ person, campaignId: selectedCampaignId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSyncedIds(prev => new Set([...prev, personId]));
      toast.success(`Synced ${person.name || person.first_name} successfully!`);
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleBulkSync = async () => {
    if (results.length === 0) return;
    setBulkSyncing(true);
    let successCount = 0;
    
    // Sync one by one to avoid overwhelming or handle error individually
    for (const person of results) {
      const personId = person.id || person.email || `${person.first_name}-${person.last_name}`;
      if (syncedIds.has(personId)) continue;
      
      try {
        const res = await fetch("/api/discovery/sync", {
          method: "POST",
          body: JSON.stringify({ person, campaignId: selectedCampaignId }),
        });
        const data = await res.json();
        if (!data.error) {
          setSyncedIds(prev => new Set([...prev, personId]));
          successCount++;
        }
      } catch (err) {
        console.error("Bulk sync error for person:", personId, err);
      }
    }
    
    setBulkSyncing(false);
    toast.success(`Successfully bulk synced ${successCount} leads!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 p-6 rounded-2xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-2 bg-secondary border border-border p-1 rounded-xl w-fit">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("match")}
            className={cn("px-4 h-8 text-[10px] font-bold uppercase tracking-wider", mode === "match" ? "bg-card text-cyan-400 shadow-sm border border-border" : "text-muted-foreground")}
          >
            Precision Match
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("search")}
            className={cn("px-4 h-8 text-[10px] font-bold uppercase tracking-wider", mode === "search" ? "bg-card text-cyan-400 shadow-sm border border-border" : "text-muted-foreground")}
          >
            Bulk Search
          </Button>
        </div>

        {mode === "match" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="bg-background border-border h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="bg-background border-border h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="bg-background border-border h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company</label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="bg-background border-border h-10"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Target Job Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Founder, CEO"
                className="bg-background border-border h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Industry</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS"
                className="bg-background border-border h-11"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleSearch}
          disabled={loading || (mode === "match" && (!firstName || !lastName))}
          className="w-full h-11 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-xl shadow-glow-sm"
        >
          {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : mode === "match" ? <Rocket size={18} className="mr-2" /> : <Search size={18} className="mr-2" />}
          {mode === "match" ? "Match & Enrich Profile" : "Find Leads"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Rocket size={18} className="text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">Target Campaign</p>
            <p className="text-xs text-muted-foreground">Newly synced leads will be added to this campaign automatically.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={selectedCampaignId} onValueChange={(val) => setSelectedCampaignId(val || "")}>
              <SelectTrigger className="w-full md:w-[240px] bg-background border-border h-10">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {campaigns.map((c) => (
                  <SelectItem key={(c as any)._id || c.id} value={(c as any)._id || c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleBulkSync}
              disabled={bulkSyncing || loading}
              variant="outline"
              className="h-10 border-violet-500/30 hover:bg-violet-500/10 text-violet-400 font-bold px-6 shrink-0"
            >
              {bulkSyncing ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Plus className="mr-2" size={16} />}
              Bulk Sync All
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((person, idx) => {
          const personId = person.id || person.email || `${person.first_name}-${person.last_name}-${idx}`;
          const personName = person.name || (person.first_name ? `${person.first_name} ${person.last_name || person.last_name_obfuscated || ""}`.trim() : "Unnamed Lead");
          const companyName = person.organization?.name || person.organization_name || "Company Confidential";
          const isSynced = syncedIds.has(personId);

          return (
            <Card key={personId} className={cn("bg-card border-border hover:border-cyan-500/30 transition-all duration-300 group overflow-hidden", isSynced && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base text-foreground leading-tight group-hover:text-cyan-400 transition-colors truncate">
                      {personName}
                    </h3>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">
                      {person.title || "Target Prospect"}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 border-violet-500/20 text-[9px] font-black uppercase", isSynced ? "bg-green-500/10 text-green-400" : "bg-violet-500/10 text-violet-400")}>
                    {isSynced ? "Synced" : "Sourced"}
                  </Badge>
                </div>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                      {(companyName || "O").charAt(0)}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs font-bold text-foreground truncate">
                        {companyName}
                      </p>
                      {(person.organization_website || person.organization?.website_url) && (
                        <p className="text-[10px] text-muted-foreground truncate font-medium">
                          {(person.organization_website || person.organization?.website_url || "").replace(/^https?:\/\//, "")}
                        </p>
                      )}
                    </div>
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
                    <Rocket className="mr-2" size={16} />
                  ) : (
                    <Plus className="mr-2" size={16} />
                  )}
                  {isSynced ? "Already in CRM" : "Sync to Rhinon"}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {!loading && results.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-border bg-secondary/10">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Rocket size={32} />
            </div>
            <h3 className="text-lg font-medium text-foreground">Ready to match leads?</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Enter a name and optional email/company to fetch a full verified profile via the Apollo Match API.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
