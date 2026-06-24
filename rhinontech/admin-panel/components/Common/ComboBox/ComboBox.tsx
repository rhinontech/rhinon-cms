"use client";

import * as React from "react";
import { Asterisk, Braces, Calculator, Check, ChevronsUp, ChevronsUpDown, Home, Option } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const frameworks = [
  {
    icons: <Home/>,
    value: "next.js",
    label: "Next.js",
  },
  {
    icons: <Braces/>,
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    icons: <Option/>,
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    icons: <Calculator/>,
    value: "remix",
    label: "Remix",
  },
  {
    icons: <Asterisk/>,
    value: "astro",
    label: "Astro",
  },
];

export function Combobox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {value}
          <ChevronsUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {framework.icons}
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
