"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg bg-background dark:bg-background-dark">
      <div className="flex flex-1 flex-col w-full">
        <ScrollArea className="flex-1 h-0 p-4 h-full">
          <h3>Hello Admin, welcome to Dashboard</h3>
        </ScrollArea>
      </div>
    </div>
  );
}
