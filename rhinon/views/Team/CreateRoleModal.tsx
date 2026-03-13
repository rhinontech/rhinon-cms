"use client";

import { useState } from "react";
import { ShieldAlert, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
        <Button variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10">
          Create Custom Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription className="text-slate-400">
            Define a new role and configure its specific system permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Role Name</label>
            <Input
              placeholder="e.g. Sales Onboarding Specialist"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="bg-slate-900 border-slate-800"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-300">Permissions Checklist</label>
              <div className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1 border border-amber-500/20">
                <ShieldAlert size={12} /> Root access disabled
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {dummyPermissions.map((perm) => (
                <div key={perm.id} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                  <Switch id={perm.id} className="mt-0.5" />
                  <div className="grid gap-1.5 leading-none cursor-pointer">
                    <label
                      htmlFor={perm.id}
                      className="text-sm font-medium text-slate-200 cursor-pointer"
                    >
                      {perm.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </label>
                    <p className="text-xs text-slate-500">
                      {perm.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!roleName.trim()} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
            Save Role <Check size={16} className="ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
