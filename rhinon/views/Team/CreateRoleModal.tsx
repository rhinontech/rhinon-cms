"use client";

import { useState } from "react";
import { ShieldAlert, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { dummyPermissions } from "@/lib/dummy-data";

export function CreateRoleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState("");

  const handleCreate = () => {
    setIsOpen(false);
    setRoleName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10">
          Create Custom Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Custom Role</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define a new role and configure its specific system permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role Name</label>
            <Input
              placeholder="e.g. Sales Onboarding Specialist"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-foreground">Permissions Checklist</label>
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1 border border-amber-500/20">
                <ShieldAlert size={12} /> Root access disabled
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {dummyPermissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Switch id={perm.id} className="mt-0.5" />
                  <div className="grid gap-1 leading-none cursor-pointer">
                    <label htmlFor={perm.id} className="text-sm font-semibold text-foreground cursor-pointer">
                      {perm.name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </label>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!roleName.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
          >
            Save Role <Check size={15} className="ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
