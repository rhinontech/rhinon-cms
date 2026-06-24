"use client";
import React, { useState } from "react";
import Chatbotpreview from "@/components/Admin/Common/Chatbotpreview/Chatbotpreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Home,
  MessageSquare,
  Ticket,
  CheckSquare,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const Conversations = () => {
  const [selectedItem, setSelectedItem] = useState<MenuItem>({
    id: "home",
    label: "Home",
    icon: <Home className="h-4 w-4" />,
  });

  const menuItems: MenuItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="h-4 w-4" />,
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "tickets",
      label: "Tickets",
      icon: <Ticket className="h-4 w-4" />,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: <CheckSquare className="h-4 w-4" />,
    },
    {
      id: "conversation",
      label: "Conversation",
      icon: <MessageCircle className="h-4 w-4" />,
    },
  ];

  const handleSelect = (id: string) => {
    const selected = menuItems.find((item) => item.id === id);
    if (selected) {
      setSelectedItem(selected);
    }
  };

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 overflow-auto w-[50%] border-r">
        <p className="h-[300px]">chatbot data</p>
        <p className="h-[300px]">chatbot data</p>
        <p className="h-[300px]">chatbot data</p>
        <p className="h-[300px]">chatbot data</p>
        <p className="h-[300px]">chatbot data</p>
      </div>
      <div className="flex flex-col w-[50%] rounded-b-xl">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white border-gray-200"
              >
                {selectedItem.icon}
                <span>{selectedItem.label}</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-1">
              {menuItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className={cn(
                    "flex items-center px-3 py-2 cursor-pointer",
                    selectedItem.id === item.id ? "bg-transparent" : ""
                  )}
                  onClick={() => handleSelect(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {selectedItem.id === item.id && (
                    <Check className="h-4 w-4 ml-auto text-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Chatbotpreview />
      </div>
    </div>
  );
};

export default Conversations;
