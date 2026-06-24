"use client";
import React from "react";
import Chatbotpreview from "@/components/Admin/Common/Chatbotpreview/Chatbotpreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UICollapsible } from "@/components/Common/UICollapsible/UICollapsible";
import SvgIcons from "@/constants/admin/svgIcons";
import { FaHouse } from "react-icons/fa6";
import { Combobox } from "@/components/Common/ComboBox/ComboBox";

const Web = () => {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 overflow-auto w-[55%] border-r p-5">
        <Tabs defaultValue="account" className="flex w-full">
          <TabsList className="w-full">
            <TabsTrigger value="account">Content</TabsTrigger>
            <TabsTrigger value="password">Styles</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <UICollapsible title="Space" className="border-gray-200">
              hey
            </UICollapsible>
          </TabsContent>
          <TabsContent value="password">Change your password here.</TabsContent>
        </Tabs>
      </div>
      <div className="flex flex-col w-[45%] rounded-b-xl">
        <div>
          <Combobox/>
          {/* <FaHouse /> */}
        </div>
        <Chatbotpreview />
      </div>
    </div>
  );
};

export default Web;
