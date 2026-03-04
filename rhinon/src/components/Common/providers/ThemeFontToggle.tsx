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
import { TypeIcon } from "lucide-react";

export function ThemeFontToggle() {
    const [themeFont, setThemeFont] = useState("default");

    useEffect(() => {
        const stored = localStorage.getItem("theme-font");
        if (stored) {
            setThemeFont(stored);
            applyFont(stored);
        }
    }, []);

    const applyFont = useCallback((font: string) => {
        if (font !== "default") {
            document.documentElement.setAttribute('data-font', font);
        } else {
            document.documentElement.removeAttribute('data-font');
        }
    }, []);

    const handleSelect = (font: string) => {
        setThemeFont(font);
        localStorage.setItem("theme-font", font);
        applyFont(font);
    };

    const fonts = [
        { name: "System (Geist)", value: "default", style: { fontFamily: 'var(--font-geist-sans)' } },
        { name: "Inter", value: "inter", style: { fontFamily: 'var(--font-inter)' } },
        { name: "Roboto", value: "roboto", style: { fontFamily: 'var(--font-roboto)' } },
        { name: "Outfit", value: "outfit", style: { fontFamily: 'var(--font-outfit)' } },
        { name: "Poppins", value: "poppins", style: { fontFamily: 'var(--font-poppins)' } },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-8 h-8 bg-background">
                    <TypeIcon className="w-[1.2rem] h-[1.2rem]" />
                    <span className="sr-only">Toggle theme font</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {fonts.map((font) => (
                    <DropdownMenuItem
                        key={font.value}
                        onClick={() => handleSelect(font.value)}
                        className={`flex items-center gap-2 cursor-pointer ${themeFont === font.value ? "bg-accent" : ""}`}
                        style={font.style}
                    >
                        {font.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
