import {
  BarlowCondensed_900Black,
} from "@expo-google-fonts/barlow-condensed";
import {
  InstrumentSans_400Regular,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import { Geist_400Regular, Geist_600SemiBold, Geist_700Bold } from "@expo-google-fonts/geist";
import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { Epilogue_800ExtraBold } from "@expo-google-fonts/epilogue";
import { WorkSans_400Regular, WorkSans_600SemiBold, WorkSans_700Bold } from "@expo-google-fonts/work-sans";
import { SpaceMono_400Regular } from "@expo-google-fonts/space-mono";

import type { ThemeId } from "./tokens";

export type FontSet = { display: string; sans: string; sansBold: string; sansHeavy: string; mono: string; monoMed: string };

/** Every font file the app can render, loaded once at boot so a theme switch never waits on the network. */
export const FONT_FILES = {
  BarlowCondensed_900Black, InstrumentSans_400Regular, InstrumentSans_600SemiBold, InstrumentSans_700Bold,
  DMMono_400Regular, DMMono_500Medium, Geist_400Regular, Geist_600SemiBold, Geist_700Bold,
  GeistMono_400Regular, GeistMono_500Medium, SpaceGrotesk_700Bold, Inter_400Regular, Inter_600SemiBold,
  Inter_700Bold, JetBrainsMono_400Regular, JetBrainsMono_500Medium, Epilogue_800ExtraBold,
  WorkSans_400Regular, WorkSans_600SemiBold, WorkSans_700Bold, SpaceMono_400Regular,
};

export const FONTS: Record<ThemeId, FontSet> = {
  admin: { display: "Geist_600SemiBold", sans: "Geist_400Regular", sansBold: "Geist_600SemiBold", sansHeavy: "Geist_700Bold", mono: "GeistMono_400Regular", monoMed: "GeistMono_500Medium" },
  blocks: { display: "BarlowCondensed_900Black", sans: "InstrumentSans_400Regular", sansBold: "InstrumentSans_600SemiBold", sansHeavy: "InstrumentSans_700Bold", mono: "DMMono_400Regular", monoMed: "DMMono_500Medium" },
  midnight: { display: "SpaceGrotesk_700Bold", sans: "Inter_400Regular", sansBold: "Inter_600SemiBold", sansHeavy: "Inter_700Bold", mono: "JetBrainsMono_400Regular", monoMed: "JetBrainsMono_500Medium" },
  brutal: { display: "Epilogue_800ExtraBold", sans: "WorkSans_400Regular", sansBold: "WorkSans_600SemiBold", sansHeavy: "WorkSans_700Bold", mono: "SpaceMono_400Regular", monoMed: "SpaceMono_400Regular" },
};
