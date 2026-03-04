"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaletteIcon } from "lucide-react";

export function ThemeColorToggle() {
    const [themeColor, setThemeColor] = useState("default");

    useEffect(() => {
        const stored = localStorage.getItem("theme-color");
        if (stored) {
            setThemeColor(stored);
            applyTheme(stored);
        }
    }, []);

    const applyTheme = useCallback((color: string) => {
        if (color !== "default") {
            document.documentElement.setAttribute('data-theme', color);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    const handleSelect = (color: string) => {
        setThemeColor(color);
        localStorage.setItem("theme-color", color);
        applyTheme(color);
    };

    const themes = [
        { name: "Default (Blue)", value: "default", colorClass: "bg-blue-600" },
        { name: "Zinc", value: "zinc", colorClass: "bg-zinc-600" },
        { name: "Green", value: "green", colorClass: "bg-green-600" },
        { name: "Rose", value: "rose", colorClass: "bg-rose-600" },
        { name: "Orange", value: "orange", colorClass: "bg-orange-600" },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-8 h-8 bg-background">
                    <PaletteIcon className="w-[1.2rem] h-[1.2rem]" />
                    <span className="sr-only">Toggle theme color</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {themes.map((theme) => (
                    <DropdownMenuItem
                        key={theme.value}
                        onClick={() => handleSelect(theme.value)}
                        className={`flex items-center gap-2 cursor-pointer ${themeColor === theme.value ? "bg-accent" : ""}`}
                    >
                        <div className={`w-4 h-4 rounded-full ${theme.colorClass}`} />
                        {theme.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
