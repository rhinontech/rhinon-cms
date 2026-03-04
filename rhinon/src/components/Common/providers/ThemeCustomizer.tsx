"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Settings, Check, Monitor, Moon, Sun, Minus, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const baseColors = [
    { name: "Default", value: "default", colorClass: "bg-blue-600" },
    { name: "Zinc", value: "zinc", colorClass: "bg-zinc-600" },
    { name: "Rose", value: "rose", colorClass: "bg-rose-600" },
    { name: "Orange", value: "orange", colorClass: "bg-orange-600" },
    { name: "Green", value: "green", colorClass: "bg-green-600" },
];

const fonts = [
    { name: "System (Geist)", value: "default" },
    { name: "Inter", value: "inter" },
    { name: "Roboto", value: "roboto" },
    { name: "Outfit", value: "outfit" },
    { name: "Poppins", value: "poppins" },
];

const radii = [
    { name: "0", value: "0" },
    { name: "0.3", value: "0.3" },
    { name: "0.5", value: "0.5" },
    { name: "0.75", value: "0.75" },
    { name: "1.0", value: "1.0" },
];

const presets = [
    { name: "Lyra / Tabler / JetBrains Mono", value: "lyra", color: "zinc", font: "default", radius: "0.5" },
    { name: "Vega / Lucide / Inter", value: "vega", color: "default", font: "inter", radius: "0.3" },
    { name: "Nova / Hugeicons / Geist", value: "nova", color: "rose", font: "default", radius: "0.75" },
    { name: "Maia / Hugeicons / Poppins", value: "maia", color: "green", font: "poppins", radius: "1.0" },
    { name: "Mira / Hugeicons / Roboto", value: "mira", color: "orange", font: "roboto", radius: "0" },
];

export function ThemeCustomizer() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const [themeColor, setThemeColor] = useState("default");
    const [themeFont, setThemeFont] = useState("default");
    const [themeRadius, setThemeRadius] = useState("0.625rem");
    const [preset, setPreset] = useState("lyra");

    useEffect(() => {
        setMounted(true);
        const storedColor = localStorage.getItem("theme-color");
        if (storedColor) setThemeColor(storedColor);
        const storedFont = localStorage.getItem("theme-font");
        if (storedFont) setThemeFont(storedFont);
        const storedRadius = localStorage.getItem("theme-radius");
        if (storedRadius) setThemeRadius(storedRadius);
    }, []);

    const applyColor = useCallback((color: string) => {
        setThemeColor(color);
        localStorage.setItem("theme-color", color);
        if (color !== "default") {
            document.documentElement.setAttribute('data-theme', color);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    const applyFont = useCallback((font: string) => {
        setThemeFont(font);
        localStorage.setItem("theme-font", font);
        if (font !== "default") {
            document.documentElement.setAttribute('data-font', font);
        } else {
            document.documentElement.removeAttribute('data-font');
        }
    }, []);

    const applyRadius = useCallback((radius: string) => {
        setThemeRadius(radius);
        localStorage.setItem("theme-radius", radius);
        if (radius !== "0.625rem") {
            document.documentElement.setAttribute('data-radius', radius);
        } else {
            document.documentElement.removeAttribute('data-radius');
        }
    }, []);

    const applyPreset = useCallback((presetValue: string) => {
        setPreset(presetValue);
        const selectedPreset = presets.find(p => p.value === presetValue);
        if (selectedPreset) {
            applyColor(selectedPreset.color);
            applyFont(selectedPreset.font);
            applyRadius(selectedPreset.radius);
        }
    }, [applyColor, applyFont, applyRadius]);

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 bg-background">
                <Settings className="w-[1.2rem] h-[1.2rem]" />
            </Button>
        );
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-8 h-8 bg-background">
                    <Settings className="w-[1.2rem] h-[1.2rem]" />
                    <span className="sr-only">Toggle theme customizer</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto z-[9999]">
                <SheetHeader className="mb-6">
                    <SheetTitle>Theme Customizer</SheetTitle>
                    <SheetDescription>
                        Customize the look and feel of your application.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col space-y-6 p-4">
                    {/* Base Color Section */}
                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Base Color</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {baseColors.map((color) => (
                                <Button
                                    key={color.value}
                                    variant="outline"
                                    className={cn(
                                        "justify-start",
                                        themeColor === color.value && "border-2 border-primary"
                                    )}
                                    onClick={() => applyColor(color.value)}
                                >
                                    <span
                                        className={cn(
                                            "mr-2 flex h-4 w-4 shrink-0 -translate-x-1 items-center justify-center rounded-full",
                                            color.colorClass
                                        )}
                                    >
                                        {themeColor === color.value && <Check className="h-3 w-3 text-white" />}
                                    </span>
                                    <span className="text-xs">{color.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Theme</Label>
                        <div className="flex space-x-2">
                            <Button
                                variant={theme === "light" ? "default" : "outline"}
                                className={cn("flex-1", theme === "light" && "border-2 border-primary bg-background text-foreground hover:bg-muted")}
                                onClick={() => setTheme("light")}
                            >
                                <Sun className="mr-2 h-4 w-4" />
                                Light
                            </Button>
                            <Button
                                variant={theme === "dark" ? "default" : "outline"}
                                className={cn("flex-1", theme === "dark" && "border-2 border-primary bg-background text-foreground hover:bg-muted")}
                                onClick={() => setTheme("dark")}
                            >
                                <Moon className="mr-2 h-4 w-4" />
                                Dark
                            </Button>
                            <Button
                                variant={theme === "system" ? "default" : "outline"}
                                className={cn("flex-1", theme === "system" && "border-2 border-primary bg-background text-foreground hover:bg-muted")}
                                onClick={() => setTheme("system")}
                            >
                                <Monitor className="mr-2 h-4 w-4" />
                                System
                            </Button>
                        </div>
                    </div>

                    {/* Font Section */}
                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Font</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {fonts.map((font) => (
                                <Button
                                    key={font.value}
                                    variant="outline"
                                    className={cn(
                                        "justify-start",
                                        themeFont === font.value && "border-2 border-primary"
                                    )}
                                    onClick={() => applyFont(font.value)}
                                    style={{ fontFamily: font.value === "default" ? "var(--font-geist-sans)" : `var(--font-${font.value})` }}
                                >
                                    <span className="text-sm">Aa</span>
                                    <span className="ml-2 text-xs truncate flex-1 text-left">{font.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Placeholder/Mock Sections from UI Screenshot */}
                    <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2">Preset</Label>
                        <Select value={preset} onValueChange={applyPreset}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a preset" />
                            </SelectTrigger>
                            <SelectContent>
                                {presets.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2">Component Library</Label>
                        <Button variant="outline" className="justify-start opacity-70 pointer-events-none">
                            <div className="h-4 w-4 rounded-full bg-black dark:bg-white mr-2" />
                            Radix UI
                        </Button>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2">Icon Library</Label>
                        <Button variant="outline" className="justify-start opacity-70 pointer-events-none">
                            HugeIcons
                        </Button>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2">Radius</Label>
                        <div className="grid grid-cols-5 gap-2">
                            {radii.map((radius) => (
                                <Button
                                    key={radius.value}
                                    variant="outline"
                                    className={cn(
                                        "px-2",
                                        themeRadius === radius.value && "border-2 border-primary"
                                    )}
                                    onClick={() => applyRadius(radius.value)}
                                >
                                    {radius.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2">Menu Color</Label>
                        <Button variant="outline" className="justify-start opacity-70 pointer-events-none">
                            Default
                        </Button>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2">Menu Accent</Label>
                        <Button variant="outline" className="justify-start opacity-70 pointer-events-none">
                            Subtle
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet >
    );
}
