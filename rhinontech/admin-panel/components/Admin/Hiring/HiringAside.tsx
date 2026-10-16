"use client";

import { TbX, TbLayoutSidebarRightFilled } from "react-icons/tb";

/** Fixed-width right pane, same look as Team → Directory's member panel (full-screen on mobile). */
export function HiringAside({ title, onClose, actions, children }: {
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <aside className="fixed inset-0 z-50 flex flex-col bg-card overflow-hidden lg:static lg:z-auto lg:h-full lg:w-[460px] xl:w-[520px] lg:shrink-0 lg:rounded-xl">
      <div className="sticky top-0 flex min-h-16 items-center justify-between gap-2 px-4 sm:px-5 border-b bg-card z-10 shrink-0">
        <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px truncate">
          {title}
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {actions}
          <button onClick={onClose} title="Close" className="cursor-pointer text-foreground/70 hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
            <TbX size={18} className="lg:hidden" />
            <TbLayoutSidebarRightFilled size={18} className="hidden lg:block" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5">{children}</div>
    </aside>
  );
}
