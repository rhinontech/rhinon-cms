import React from "react";
import { useSideNav } from "@/context/SideNavContext";
import {
  TbLayoutSidebarFilled,
  TbLayoutSidebarRightFilled,
} from "react-icons/tb";

const Settings = () => {
  const { isExpanded, toggleSideNav } = useSideNav();
  return (
    <div
      className={`flex flex-col bg-white rounded-xl w-full h-full overflow-hidden`}
    >
      {/* Fixed Header */}
      <div className="sticky top-0 bg-white z-10 flex items-center gap-4 h-16 px-5 border-b">
        <div className="cursor-pointer" onClick={toggleSideNav}>
          {isExpanded ? (
            <TbLayoutSidebarFilled size={20} />
          ) : (
            <TbLayoutSidebarRightFilled size={20} />
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight">Home</h1>
      </div>
      
      <div className="flex-1 overflow-auto px-5 py-4">
        <p className="h-[300px]">This is Settings home page</p>
      </div>
    </div>
  );
};

export default Settings;
