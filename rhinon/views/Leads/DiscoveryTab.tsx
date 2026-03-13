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

export function DiscoveryTab() {
  const [title, setTitle] = React.useState("Founder");
  const [industry, setIndustry] = React.useState("");
  const [results, setResults] = React.useState<ApolloPerson[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>("");
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

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
    try {
      const res = await fetch("/api/discovery/search", {
        method: "POST",
        body: JSON.stringify({ title, industry }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (error: any) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (person: ApolloPerson) => {
    setSyncingId(person.email);
    try {
      const res = await fetch("/api/discovery/sync", {
        method: "POST",
        body: JSON.stringify({ person, campaignId: selectedCampaignId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update results UI to show synced status
      setResults(prev => prev.filter(p => p.email !== person.email));

      toast.success(`Synced ${person.name} successfully! AI enrichment has started in the background.`);
    } catch (error: any) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl bg-secondary/30 border border-border justify-center">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Target Job Title</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Founder, CEO, CTO"
              className="pl-10 bg-background border-border h-11"
            />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Industry / Keywords</label>
          <div className="relative">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. SaaS, FinTech, AI"
              className="pl-10 bg-background border-border h-11"
            />
          </div>
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="md:mt-4 h-11 px-8 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-xl shadow-glow-sm"
        >
          {loading ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
          Find High-Intent Leads
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Rocket size={18} className="text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">Target Campaign</p>
            <p className="text-xs text-muted-foreground">Newly synced leads will be added to this campaign automatically.</p>
          </div>
          <Select value={selectedCampaignId} onValueChange={(val) => setSelectedCampaignId(val || "")}>
            <SelectTrigger className="w-[240px] bg-background border-border h-10">
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
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((person) => (
          <Card key={person.email} className="bg-card border-border hover:border-cyan-500/30 transition-all duration-300 group overflow-hidden">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground leading-tight group-hover:text-cyan-400 transition-colors">
                    {person.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{person.title}</p>
                </div>
                <Badge variant="outline" className="bg-violet-500/5 text-violet-400 border-violet-500/20">
                  Apollo.io
                </Badge>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  {person.organization_name}
                </div>
                {person.organization_website && (
                  <div className="text-xs text-muted-foreground truncate ml-3.5">
                    {person.organization_website}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleSync(person)}
                disabled={syncingId === person.email}
                className="w-full bg-secondary hover:bg-cyan-500/10 hover:text-cyan-400 border border-border group-hover:border-cyan-500/50 transition-all"
              >
                {syncingId === person.email ? (
                  <Loader2 className="mr-2 animate-spin" size={16} />
                ) : (
                  <Plus className="mr-2" size={16} />
                )}
                Sync to Rhinon
              </Button>
            </CardContent>
          </Card>
        ))}

        {!loading && results.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-2xl border-2 border-dashed border-border bg-secondary/10">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-foreground">Ready to discover leads?</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Use the filters above to search Apollo's database of 210M+ contacts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
