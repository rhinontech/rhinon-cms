"use client";
import { useSideNav } from "@/context/SideNavContext";
import React, { useState } from "react";

const Content = () => {
  const { isExpanded, toggleSideNav } = useSideNav();
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  return (
    <div className="flex gap-2 w-full h-full">
      <main className="flex flex-col gap-6 bg-white rounded-xl w-full">
        <div className="flex justify-between items-center h-16 border-b p-6">
          <div className="flex gap-6">
            <button onClick={toggleSideNav}>
              {isExpanded ? "Close" : "Open"}
            </button>
            <p className="text-xl font-bold tracking-tight">Content</p>
          </div>
          <div className="flex gap-6">
            <button>New Content</button>
            {!isPreviewExpanded && (
              <button onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}>
                {isPreviewExpanded ? "Close" : "Open"}
              </button>
            )}
          </div>
        </div>
        This is dummy page
      </main>
      <aside
        className={`flex h-full flex-col bg-white rounded-l-xl transition-all duration-200 ease-in-out rounded-xl ${
          isPreviewExpanded ? "w-[40%]" : "w-0"
        }`}
      >
        {isPreviewExpanded && (
          <div className="flex flex-col w-full flex-1">
            <div className="flex justify-between items-center h-16 border-b p-6">
              <p className="text-xl font-bold tracking-tight">Preview</p>
              {isPreviewExpanded && (
                <button
                  onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                >
                  {isPreviewExpanded ? "Close" : "Open"}
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Content;
